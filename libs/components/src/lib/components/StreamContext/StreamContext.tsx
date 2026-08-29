/* eslint-disable no-console */
import { useAppDispatch, videoStreamActions } from '@mezon/store';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
	STN_ABR_COOLDOWN_MS,
	STN_CHANNELS_POLL_MS,
	STN_CHANNELS_WAIT_MS,
	STN_DEFAULT_RENDITION,
	STN_PING_INTERVAL_MS,
	STN_PRESENCE_CONNECTED,
	STN_PRESENCE_DISCONNECTED,
	STN_QOE_DROP_THRESHOLD,
	STN_QOE_WINDOW_MS,
	STN_VOD_PLAYOUT_DELAY_MS,
	applyPlayoutDelayHint,
	buildStnEnvelope,
	findListedChannel,
	iceCandidateFromValue,
	infoHasVideo,
	infoIsVod,
	infoRendition,
	infoRenditions,
	normalizeRendition,
	parseChannelList,
	parseInfoValue,
	pickStnCredentials,
	preferVideoCodecs,
	resolvePlayoutDelayMs,
	sdpFromAnswer,
	shouldOfferVideo,
	stepDownRendition,
	stnClientId,
	stnWebSocketUrl,
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
	handleChannelClick: (
		clanId: string,
		channelId: string,
		userId: string,
		streamId: string,
		username: string,
		accessToken: string,
		jwtToken?: string
	) => void;
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
	const qoeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const channelsWaiterRef = useRef<((list: StnChannelEntry[] | null) => void) | null>(null);
	const channelsWaitSeqRef = useRef(0);
	const connGenRef = useRef(0);
	const presenceSentRef = useRef(false);
	const isVodRef = useRef<boolean | null>(null);
	const playoutDelayMsRef = useRef(STN_VOD_PLAYOUT_DELAY_MS);
	const abrCooldownUntilRef = useRef(0);
	const qoeDroppedRef = useRef(0);
	const qoeDroppedAtRef = useRef(0);
	const renditionsRef = useRef<string[]>([]);

	const setHasVideoState = useCallback(
		(next: boolean) => {
			hasVideoRef.current = next;
			wantVideoRef.current = next;
			setHasVideo(next);
			if (!next) {
				dispatch(videoStreamActions.setIsRemoteVideoStream(false));
				renditionsRef.current = [];
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
		const stream = videoElement.srcObject;
		const hasAudio = stream instanceof MediaStream && stream.getAudioTracks().some((track) => track.readyState === 'live');
		if (!hasVideoRef.current && !hasAudio) {
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

	const stopQoe = useCallback(() => {
		if (qoeTimerRef.current) {
			clearInterval(qoeTimerRef.current);
			qoeTimerRef.current = null;
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
		stopQoe();
		remoteDescReadyRef.current = false;
		localTrickleReadyRef.current = false;
		pendingRemoteIceRef.current = [];
		pendingLocalIceRef.current = [];
		channelsWaiterRef.current = null;
		channelsWaitSeqRef.current += 1;
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
	}, [clearVideoElement, stopHeartbeat, stopQoe]);

	const setRendition = useCallback(
		(id: string) => {
			const identity = joinRef.current;
			const token = normalizeRendition(id);
			if (!identity || wsRef.current?.readyState !== WebSocket.OPEN) {
				return;
			}
			abrCooldownUntilRef.current = Date.now() + STN_ABR_COOLDOWN_MS;
			markRendition(token);
			wsSend(buildStnEnvelope('set_rendition', identity, { Rendition: token }));
		},
		[markRendition, wsSend]
	);

	const startQoe = useCallback(() => {
		stopQoe();
		qoeDroppedRef.current = 0;
		qoeDroppedAtRef.current = 0;
		qoeTimerRef.current = setInterval(() => {
			const peer = pcRef.current;
			if (!peer || !autoAbrRef.current || !hasVideoRef.current) {
				return;
			}
			void peer.getStats().then((report) => {
				let framesDropped = 0;
				report.forEach((stat) => {
					if (stat.type === 'inbound-rtp' && (stat.kind === 'video' || (stat as { mediaType?: string }).mediaType === 'video')) {
						framesDropped += (stat as RTCInboundRtpStreamStats).framesDropped || 0;
					}
				});
				const now = Date.now();
				if (now < abrCooldownUntilRef.current) {
					qoeDroppedRef.current = framesDropped;
					return;
				}
				if (!qoeDroppedAtRef.current) {
					qoeDroppedRef.current = framesDropped;
					qoeDroppedAtRef.current = now;
					return;
				}
				const delta = framesDropped - qoeDroppedRef.current;
				const windowMs = now - qoeDroppedAtRef.current;
				qoeDroppedRef.current = framesDropped;
				if (windowMs < STN_QOE_WINDOW_MS) {
					return;
				}
				qoeDroppedAtRef.current = now;
				if (delta < STN_QOE_DROP_THRESHOLD) {
					return;
				}
				const next = stepDownRendition(currentRenditionRef.current, renditionsRef.current);
				if (!next) {
					return;
				}
				setRendition(next);
			});
		}, 1000);
	}, [setRendition, stopQoe]);

	const initPeerConnection = useCallback(
		(offerVideo: boolean) => {
			const peerConnection = new RTCPeerConnection({
				iceServers: [],
				bundlePolicy: 'max-bundle'
			});

			peerConnection.oniceconnectionstatechange = () => {
				setConnectionState(peerConnection.iceConnectionState);
				const connected = peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed';
				setIsConnected(connected);
				if (connected) {
					startQoe();
				}
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
					applyPlayoutDelayHint(peerConnection, playoutDelayMsRef.current, hasVideoRef.current);
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
				const videoTransceiver = peerConnection.addTransceiver('video', { direction: 'recvonly' });
				preferVideoCodecs(videoTransceiver, true);
			}

			pcRef.current = peerConnection;
			return peerConnection;
		},
		[dispatch, retryPlayback, sendLocalIce, startQoe]
	);

	const waitForChannels = useCallback((ms: number) => {
		return new Promise<StnChannelEntry[] | null>((resolve) => {
			const seq = channelsWaitSeqRef.current + 1;
			channelsWaitSeqRef.current = seq;
			const timer = setTimeout(() => {
				if (channelsWaitSeqRef.current !== seq) {
					return;
				}
				channelsWaiterRef.current = null;
				resolve(null);
			}, ms);
			channelsWaiterRef.current = (list) => {
				if (channelsWaitSeqRef.current !== seq) {
					return;
				}
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
		renditionsRef.current = [];
		setRenditions([]);
		isVodRef.current = null;
		playoutDelayMsRef.current = STN_VOD_PLAYOUT_DELAY_MS;
		abrCooldownUntilRef.current = 0;
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
					const vod = infoIsVod(info);
					if (vod != null) {
						isVodRef.current = vod;
					}
					const hv = infoHasVideo(info);
					if (hv === false) {
						setHasVideoState(false);
					} else if (hv === true) {
						setHasVideoState(true);
					}
					const delayMs = resolvePlayoutDelayMs(info, isVodRef.current);
					if (delayMs != null) {
						playoutDelayMsRef.current = delayMs;
						if (hasVideoRef.current) {
							applyPlayoutDelayHint(pcRef.current, delayMs, true);
						}
					}
					const cur = infoRendition(info);
					if (cur && hasVideoRef.current) {
						markRendition(cur);
					}
					if (hasVideoRef.current) {
						const list = infoRenditions(info);
						renditionsRef.current = list;
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
					const delayMs = resolvePlayoutDelayMs(info, isVodRef.current);
					if (delayMs != null) {
						playoutDelayMsRef.current = delayMs;
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
				case 'stream_publisher_ended':
				case 'stream_track_ended':
					setIsStream(false);
					dispatch(videoStreamActions.setIsRemoteVideoStream(false));
					break;
				case 'session_state_changed':
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
		(clanId: string, channelId: string, userId: string, streamId: string, _username: string, accessToken: string, jwtToken?: string) => {
			if (!isSupported) {
				console.error('WebRTC is not supported');
				return;
			}
			const wsUrl = process.env.NX_CHAT_APP_STREAM_WS_URL;
			const { primary, fallback } = pickStnCredentials(accessToken, jwtToken);
			if (!wsUrl || !primary) {
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
			isVodRef.current = null;
			playoutDelayMsRef.current = STN_VOD_PLAYOUT_DELAY_MS;
			abrCooldownUntilRef.current = 0;
			renditionsRef.current = [];
			setHasVideo(true);
			markRendition(STN_DEFAULT_RENDITION);
			remoteDescReadyRef.current = false;
			localTrickleReadyRef.current = false;
			pendingRemoteIceRef.current = [];
			pendingLocalIceRef.current = [];
			presenceSentRef.current = false;

			const runSubscriber = async (socket: WebSocket) => {
				if (gen !== connGenRef.current || socket.readyState !== WebSocket.OPEN) {
					return;
				}
				startHeartbeat();
				let hit: StnChannelEntry | null = null;
				while (gen === connGenRef.current && socket.readyState === WebSocket.OPEN) {
					const pending = waitForChannels(STN_CHANNELS_WAIT_MS);
					wsSend(buildStnEnvelope('get_channels', identity, {}, { ChannelId: streamId }));
					const listed = await pending;
					if (gen !== connGenRef.current || socket.readyState !== WebSocket.OPEN) {
						return;
					}
					hit = findListedChannel(listed, streamId);
					if (hit) {
						break;
					}
					await new Promise((resolve) => setTimeout(resolve, STN_CHANNELS_POLL_MS));
				}
				if (!hit || gen !== connGenRef.current || socket.readyState !== WebSocket.OPEN) {
					return;
				}
				const offerVideo = shouldOfferVideo([hit], streamId);
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
					if (gen !== connGenRef.current || socket.readyState !== WebSocket.OPEN) {
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

			const bindSocket = (socket: WebSocket, jwtFallback?: string) => {
				let opened = false;
				socket.onopen = () => {
					opened = true;
					void runSubscriber(socket);
				};
				socket.onmessage = (event) => {
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
				socket.onerror = (error) => {
					console.error(error, 'STN websocket');
				};
				socket.onclose = () => {
					if (gen !== connGenRef.current) {
						return;
					}
					if (!opened && jwtFallback) {
						console.warn('STN SID handshake failed, retrying with JWT');
						const next = new WebSocket(stnWebSocketUrl(wsUrl, jwtFallback));
						wsRef.current = next;
						bindSocket(next);
						return;
					}
					stopHeartbeat();
					cleanupPeer();
					wsRef.current = null;
					presenceSentRef.current = false;
					setIsStream(false);
				};
			};

			const websocket = new WebSocket(stnWebSocketUrl(wsUrl, primary));
			wsRef.current = websocket;
			bindSocket(websocket, fallback);
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
