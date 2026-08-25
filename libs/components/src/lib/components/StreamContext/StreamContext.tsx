/* eslint-disable no-console */
import { useAppDispatch, videoStreamActions } from '@mezon/store';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
	STN_CHANNELS_WAIT_MS,
	STN_DEFAULT_RENDITION,
	STN_PING_INTERVAL_MS,
	STN_PRESENCE_CONNECTED,
	STN_PRESENCE_DISCONNECTED,
	applyPlayoutDelayHint,
	buildStnEnvelope,
	iceCandidateFromValue,
	infoHasVideo,
	infoPlayoutDelayMs,
	infoRendition,
	infoRenditions,
	normalizeRendition,
	parseChannelList,
	parseInfoValue,
	sdpFromAnswer,
	shouldOfferVideo,
	stnClientId,
	waitIceGatheringComplete,
	type StnChannelEntry,
	type StnJoinIdentity,
	type StnSignalMessage
} from './StnProtocol';

interface WebRTCContextType {
	isSupported: boolean;
	isConnected: boolean;
	connectionState: RTCIceConnectionState;
	connect: () => Promise<void>;
	disconnect: () => void;
	handleChannelClick: (clanId: string, channelId: string, userId: string, streamId: string, username: string, accessToken: string) => void;
	streamVideoRef: React.RefObject<HTMLVideoElement>;
	isStream: boolean;
	isPlaybackBlocked: boolean;
	retryPlayback: () => Promise<boolean>;
	setRendition: (id: string) => void;
	currentRendition: string;
	renditions: string[];
	hasVideo: boolean;
	autoAbr: boolean;
	setAutoAbr: (enabled: boolean) => void;
}

interface WebRTCProviderProps {
	children: React.ReactNode;
}

const WebRTCStreamContext = createContext<WebRTCContextType | null>(null);

export const WebRTCStreamProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
	const dispatch = useAppDispatch();
	const [isSupported, setIsSupported] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const [connectionState, setConnectionState] = useState<RTCIceConnectionState>('new');
	const streamVideoRef = useRef<HTMLVideoElement>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const [isStream, setIsStream] = useState(false);
	const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);
	const [currentRendition, setCurrentRendition] = useState(STN_DEFAULT_RENDITION);
	const [renditions, setRenditions] = useState<string[]>([]);
	const [hasVideo, setHasVideo] = useState(true);
	const [autoAbr, setAutoAbrState] = useState(true);

	const joinRef = useRef<StnJoinIdentity | null>(null);
	const wantVideoRef = useRef(true);
	const hasVideoRef = useRef(true);
	const autoAbrRef = useRef(true);
	const currentRenditionRef = useRef(STN_DEFAULT_RENDITION);
	const remoteDescReadyRef = useRef(false);
	const localTrickleReadyRef = useRef(false);
	const pendingRemoteIceRef = useRef<RTCIceCandidateInit[]>([]);
	const pendingLocalIceRef = useRef<RTCIceCandidateInit[]>([]);
	const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const channelsWaiterRef = useRef<((list: StnChannelEntry[] | null) => void) | null>(null);
	const connGenRef = useRef(0);
	const presenceSentRef = useRef(false);

	const setHasVideoState = useCallback(
		(next: boolean) => {
			hasVideoRef.current = next;
			wantVideoRef.current = next;
			setHasVideo(next);
			if (!next) {
				dispatch(videoStreamActions.setIsRemoteVideoStream(false));
				setRenditions([]);
			}
		},
		[dispatch]
	);

	const setAutoAbr = useCallback((enabled: boolean) => {
		autoAbrRef.current = enabled;
		setAutoAbrState(enabled);
	}, []);

	const markRendition = useCallback((id: string | null | undefined) => {
		const token = normalizeRendition(id);
		currentRenditionRef.current = token;
		setCurrentRendition(token);
	}, []);

	const retryPlayback = useCallback(async () => {
		const videoElement = streamVideoRef.current;
		if (!videoElement) {
			return false;
		}
		try {
			await videoElement.play();
			setIsPlaybackBlocked(false);
			return true;
		} catch (err) {
			console.error(err, 'stream playback blocked');
			setIsPlaybackBlocked(true);
			return false;
		}
	}, []);

	useEffect(() => {
		const supported = !!(
			navigator.mediaDevices?.getUserMedia ||
			(navigator as Navigator & { webkitGetUserMedia?: unknown }).webkitGetUserMedia ||
			(navigator as Navigator & { mozGetUserMedia?: unknown }).mozGetUserMedia ||
			(navigator as Navigator & { msGetUserMedia?: unknown }).msGetUserMedia ||
			window.RTCPeerConnection
		);
		setIsSupported(supported);
	}, []);

	const stopHeartbeat = useCallback(() => {
		if (heartbeatRef.current) {
			clearInterval(heartbeatRef.current);
			heartbeatRef.current = null;
		}
	}, []);

	const wsSend = useCallback((message: StnSignalMessage | Record<string, unknown>) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(message));
		}
	}, []);

	const sendPresence = useCallback(
		(state: number) => {
			const identity = joinRef.current;
			if (!identity) {
				return;
			}
			wsSend(buildStnEnvelope('session_state_changed', identity, {}, { State: state }));
			presenceSentRef.current = state === STN_PRESENCE_CONNECTED;
		},
		[wsSend]
	);

	const sendLocalIce = useCallback(
		(init: RTCIceCandidateInit) => {
			const identity = joinRef.current;
			if (!identity) {
				return;
			}
			wsSend(buildStnEnvelope('ice_candidate', identity, init));
		},
		[wsSend]
	);

	const flushLocalIce = useCallback(() => {
		localTrickleReadyRef.current = true;
		while (pendingLocalIceRef.current.length) {
			const init = pendingLocalIceRef.current.shift();
			if (init) {
				sendLocalIce(init);
			}
		}
	}, [sendLocalIce]);

	const startHeartbeat = useCallback(() => {
		stopHeartbeat();
		const beat = () => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send('{"Key":"ping"}');
			}
		};
		beat();
		heartbeatRef.current = setInterval(beat, STN_PING_INTERVAL_MS);
	}, [stopHeartbeat]);

	const clearVideoElement = useCallback(() => {
		const video = streamVideoRef.current;
		if (video) {
			video.srcObject = null;
		}
	}, []);

	const cleanupPeer = useCallback(() => {
		stopHeartbeat();
		remoteDescReadyRef.current = false;
		localTrickleReadyRef.current = false;
		pendingRemoteIceRef.current = [];
		pendingLocalIceRef.current = [];
		channelsWaiterRef.current = null;
		if (pcRef.current) {
			try {
				pcRef.current.close();
			} catch (err) {
				console.error(err, 'close peer connection');
			}
			pcRef.current = null;
		}
		clearVideoElement();
		setIsConnected(false);
		setConnectionState('closed');
		setIsPlaybackBlocked(false);
	}, [clearVideoElement, stopHeartbeat]);

	const setRendition = useCallback(
		(id: string) => {
			const identity = joinRef.current;
			const token = normalizeRendition(id);
			if (!identity || wsRef.current?.readyState !== WebSocket.OPEN) {
				return;
			}
			markRendition(token);
			wsSend(buildStnEnvelope('set_rendition', identity, { Rendition: token }));
		},
		[markRendition, wsSend]
	);

	const initPeerConnection = useCallback(
		(offerVideo: boolean) => {
			const peerConnection = new RTCPeerConnection({
				iceServers: [],
				bundlePolicy: 'max-bundle'
			});

			peerConnection.oniceconnectionstatechange = () => {
				setConnectionState(peerConnection.iceConnectionState);
				setIsConnected(peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed');
			};

			peerConnection.onicecandidate = (event) => {
				if (!event.candidate || event.candidate.candidate === '') {
					return;
				}
				const init = event.candidate.toJSON();
				if (!localTrickleReadyRef.current) {
					pendingLocalIceRef.current.push(init);
					return;
				}
				sendLocalIce(init);
			};

			peerConnection.ontrack = (event) => {
				if (event.track.kind === 'video' && !wantVideoRef.current) {
					return;
				}
				const remoteStream = event.streams[0] || new MediaStream([event.track]);
				if (streamVideoRef.current) {
					streamVideoRef.current.srcObject = remoteStream;
					streamVideoRef.current.autoplay = true;
					streamVideoRef.current.playsInline = true;
					void retryPlayback();
				}
				if (event.track.kind === 'video') {
					applyPlayoutDelayHint(peerConnection, 2500, hasVideoRef.current);
					event.track.onmute = () => {
						dispatch(videoStreamActions.setIsRemoteVideoStream(false));
					};
					event.track.onunmute = () => {
						dispatch(videoStreamActions.setIsRemoteVideoStream(true));
					};
					if (!event.track.muted) {
						dispatch(videoStreamActions.setIsRemoteVideoStream(true));
					}
				}
				if (event.track.kind === 'audio') {
					event.track.onmute = () => {
						dispatch(videoStreamActions.setIsRemoteAudioStream(false));
					};
					event.track.onunmute = () => {
						dispatch(videoStreamActions.setIsRemoteAudioStream(true));
					};
					if (!event.track.muted) {
						dispatch(videoStreamActions.setIsRemoteAudioStream(true));
					}
				}
			};

			peerConnection.addTransceiver('audio', { direction: 'recvonly' });
			if (offerVideo) {
				peerConnection.addTransceiver('video', { direction: 'recvonly' });
			}

			pcRef.current = peerConnection;
			return peerConnection;
		},
		[dispatch, retryPlayback, sendLocalIce]
	);

	const waitForChannels = useCallback((ms: number) => {
		return new Promise<StnChannelEntry[] | null>((resolve) => {
			const timer = setTimeout(() => {
				channelsWaiterRef.current = null;
				resolve(null);
			}, ms);
			channelsWaiterRef.current = (list) => {
				clearTimeout(timer);
				channelsWaiterRef.current = null;
				resolve(list);
			};
		});
	}, []);

	const disconnect = useCallback(() => {
		connGenRef.current += 1;
		if (presenceSentRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
			sendPresence(STN_PRESENCE_DISCONNECTED);
		}
		presenceSentRef.current = false;
		stopHeartbeat();
		if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
			try {
				wsRef.current.close();
			} catch (err) {
				console.error(err, 'close stream websocket');
			}
		}
		wsRef.current = null;
		joinRef.current = null;
		cleanupPeer();
		setIsStream(false);
		setRenditions([]);
		setHasVideoState(true);
		markRendition(STN_DEFAULT_RENDITION);
		dispatch(videoStreamActions.setIsRemoteVideoStream(false));
		dispatch(videoStreamActions.setIsRemoteAudioStream(false));
	}, [cleanupPeer, dispatch, markRendition, sendPresence, setHasVideoState, stopHeartbeat]);

	const connect = useCallback(async () => {
		if (!isSupported) {
			throw new Error('WebRTC is not supported');
		}
	}, [isSupported]);

	const handleSignal = useCallback(
		async (data: StnSignalMessage, gen: number) => {
			if (gen !== connGenRef.current) {
				return;
			}
			const key = data.Key;
			const identity = joinRef.current;
			if (!key) {
				return;
			}

			switch (key) {
				case 'channels': {
					const list = parseChannelList(data.Value);
					channelsWaiterRef.current?.(list);
					break;
				}
				case 'session_received': {
					if (!identity) {
						break;
					}
					wsSend(
						buildStnEnvelope('connect_subscriber', identity, {
							ChannelId: identity.streamId,
							Rendition: currentRenditionRef.current || STN_DEFAULT_RENDITION
						})
					);
					setIsStream(true);
					if (!presenceSentRef.current) {
						sendPresence(STN_PRESENCE_CONNECTED);
					}
					break;
				}
				case 'sd_answer': {
					const sdp = sdpFromAnswer(data.Value);
					const peer = pcRef.current;
					if (!sdp || !peer) {
						console.error('sd_answer missing sdp or peer');
						break;
					}
					try {
						await peer.setRemoteDescription({ type: 'answer', sdp });
						if (gen !== connGenRef.current) {
							return;
						}
						remoteDescReadyRef.current = true;
						while (pendingRemoteIceRef.current.length) {
							const candidate = pendingRemoteIceRef.current.shift();
							if (candidate) {
								try {
									await peer.addIceCandidate(candidate);
								} catch (err) {
									console.error(err, 'addIceCandidate queued');
								}
							}
						}
						flushLocalIce();
					} catch (err) {
						console.error(err, 'setRemoteDescription');
					}
					break;
				}
				case 'ice_candidate': {
					const init = iceCandidateFromValue(data.Value);
					if (!init) {
						break;
					}
					if (!remoteDescReadyRef.current) {
						pendingRemoteIceRef.current.push(init);
						break;
					}
					try {
						await pcRef.current?.addIceCandidate(init);
					} catch (err) {
						console.error(err, 'addIceCandidate');
					}
					break;
				}
				case 'info': {
					const info = parseInfoValue(data.Value);
					const hv = infoHasVideo(info);
					if (hv === false) {
						setHasVideoState(false);
					} else if (hv === true) {
						setHasVideoState(true);
					}
					const delayMs = infoPlayoutDelayMs(info);
					if (delayMs && hasVideoRef.current) {
						applyPlayoutDelayHint(pcRef.current, delayMs, true);
					}
					const cur = infoRendition(info);
					if (cur && hasVideoRef.current) {
						markRendition(cur);
					}
					if (hasVideoRef.current) {
						const list = infoRenditions(info);
						setRenditions(list);
					}
					break;
				}
				case 'set_rendition': {
					const info = parseInfoValue(data.Value) || {};
					const id = infoRendition(info);
					if (id) {
						markRendition(id);
					}
					const delayMs = infoPlayoutDelayMs(info);
					if (delayMs) {
						applyPlayoutDelayHint(pcRef.current, delayMs, hasVideoRef.current);
					}
					break;
				}
				case 'abr_hint': {
					const info = parseInfoValue(data.Value) || {};
					const to = infoRendition(info) || (typeof info.Rendition === 'string' ? info.Rendition : null);
					if (to) {
						markRendition(to);
						if (autoAbrRef.current) {
							setRendition(to);
						}
					}
					break;
				}
				case 'channel_closed':
				case 'stream_track_ended':
					setIsStream(false);
					dispatch(videoStreamActions.setIsRemoteVideoStream(false));
					break;
				case 'error':
					console.error('STN error', data.Value);
					setIsStream(false);
					break;
				default:
					break;
			}
		},
		[dispatch, flushLocalIce, markRendition, sendPresence, setHasVideoState, setRendition, wsSend]
	);

	const handleChannelClick = useCallback(
		(clanId: string, channelId: string, userId: string, streamId: string, _username: string, accessToken: string) => {
			if (!isSupported) {
				console.error('WebRTC is not supported');
				return;
			}
			const wsUrl = process.env.NX_CHAT_APP_STREAM_WS_URL;
			if (!wsUrl || !accessToken) {
				console.error('missing STN url or session token');
				return;
			}

			disconnect();
			const gen = connGenRef.current + 1;
			connGenRef.current = gen;

			const identity: StnJoinIdentity = {
				clanId,
				channelId,
				userId,
				streamId,
				clientId: stnClientId(userId)
			};
			joinRef.current = identity;
			wantVideoRef.current = true;
			hasVideoRef.current = true;
			setHasVideo(true);
			markRendition(STN_DEFAULT_RENDITION);
			remoteDescReadyRef.current = false;
			localTrickleReadyRef.current = false;
			pendingRemoteIceRef.current = [];
			pendingLocalIceRef.current = [];
			presenceSentRef.current = false;

			const websocket = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(accessToken)}`);
			wsRef.current = websocket;

			websocket.onopen = async () => {
				if (gen !== connGenRef.current || websocket.readyState !== WebSocket.OPEN) {
					return;
				}
				startHeartbeat();
				wsSend(buildStnEnvelope('get_channels', identity, {}, { ChannelId: streamId }));
				const listed = await waitForChannels(STN_CHANNELS_WAIT_MS);
				if (gen !== connGenRef.current || websocket.readyState !== WebSocket.OPEN) {
					return;
				}
				const offerVideo = shouldOfferVideo(listed, streamId);
				wantVideoRef.current = offerVideo;
				hasVideoRef.current = offerVideo;
				setHasVideo(offerVideo);
				if (!offerVideo) {
					dispatch(videoStreamActions.setIsRemoteVideoStream(false));
				}

				try {
					const peerConnection = initPeerConnection(offerVideo);
					const offer = await peerConnection.createOffer();
					await peerConnection.setLocalDescription(offer);
					await waitIceGatheringComplete(peerConnection);
					if (gen !== connGenRef.current || websocket.readyState !== WebSocket.OPEN) {
						return;
					}
					const local = peerConnection.localDescription;
					wsSend(
						buildStnEnvelope('session_subscriber', identity, {
							type: local?.type || offer.type,
							sdp: local?.sdp || offer.sdp
						})
					);
				} catch (err) {
					console.error(err, 'STN session_subscriber');
				}
			};

			websocket.onmessage = (event) => {
				if (gen !== connGenRef.current) {
					return;
				}
				try {
					const data = JSON.parse(event.data) as StnSignalMessage;
					void handleSignal(data, gen);
				} catch (err) {
					console.error(err, 'STN message');
				}
			};

			websocket.onerror = (error) => {
				console.error(error, 'STN websocket');
			};

			websocket.onclose = () => {
				if (gen !== connGenRef.current) {
					return;
				}
				stopHeartbeat();
				cleanupPeer();
				wsRef.current = null;
				presenceSentRef.current = false;
				setIsStream(false);
			};
		},
		[
			cleanupPeer,
			disconnect,
			dispatch,
			handleSignal,
			initPeerConnection,
			isSupported,
			markRendition,
			startHeartbeat,
			stopHeartbeat,
			waitForChannels,
			wsSend
		]
	);

	useEffect(() => {
		return () => {
			disconnect();
		};
		// unmount only
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const value = {
		isSupported,
		isConnected,
		connectionState,
		connect,
		disconnect,
		handleChannelClick,
		streamVideoRef,
		isStream,
		isPlaybackBlocked,
		retryPlayback,
		setRendition,
		currentRendition,
		renditions,
		hasVideo,
		autoAbr,
		setAutoAbr
	};

	return <WebRTCStreamContext.Provider value={value}>{children}</WebRTCStreamContext.Provider>;
};

export const useWebRTCStream = () => {
	const context = useContext(WebRTCStreamContext);
	if (!context) {
		throw new Error('useWebRTC must be used within a WebRTCProvider');
	}
	return context;
};
