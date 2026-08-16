/* eslint-disable no-console */
import { useAppDispatch, videoStreamActions } from '@mezon/store';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

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
}

interface WebRTCProviderProps {
	children: React.ReactNode;
}

interface StnMessage {
	Key?: string;
	Value?: unknown;
	ClanId?: string;
	ChannelId?: string;
	UserId?: string;
	ClientId?: string;
	IsPublisher?: boolean;
	State?: number;
}

type IceCandidateInitLike = RTCIceCandidateInit | RTCIceCandidate;

const ICE_SERVERS: RTCIceServer[] = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{
		urls: process.env.NX_WEBRTC_ICESERVERS_URL as string,
		username: process.env.NX_WEBRTC_ICESERVERS_USERNAME,
		credential: process.env.NX_WEBRTC_ICESERVERS_CREDENTIAL
	}
].filter((server) => Boolean(server.urls));

const waitIceGatheringComplete = (peerConnection: RTCPeerConnection, timeoutMs = 2000): Promise<void> => {
	if (peerConnection.iceGatheringState === 'complete') {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		const onStateChange = () => {
			if (peerConnection.iceGatheringState === 'complete') {
				cleanup();
				resolve();
			}
		};
		const timeoutId = window.setTimeout(() => {
			cleanup();
			resolve();
		}, timeoutMs);

		const cleanup = () => {
			window.clearTimeout(timeoutId);
			peerConnection.removeEventListener('icegatheringstatechange', onStateChange);
		};

		peerConnection.addEventListener('icegatheringstatechange', onStateChange);
	});
};

const extractAnswerSdp = (value: unknown): string | null => {
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}
	if (value && typeof value === 'object' && 'sdp' in value) {
		const sdp = (value as { sdp?: unknown }).sdp;
		if (typeof sdp === 'string' && sdp.length > 0) {
			return sdp;
		}
	}
	return null;
};

const toIceCandidateInit = (value: unknown): RTCIceCandidateInit | null => {
	if (!value) {
		return null;
	}
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as RTCIceCandidateInit;
			return parsed?.candidate ? parsed : null;
		} catch {
			return null;
		}
	}
	if (typeof value === 'object') {
		const candidate = value as RTCIceCandidateInit;
		if (candidate.candidate) {
			return candidate;
		}
	}
	return null;
};

const WebRTCStreamContext = createContext<WebRTCContextType | null>(null);

export const WebRTCStreamProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
	const dispatch = useAppDispatch();
	const [isSupported, setIsSupported] = useState(true);
	const [isConnected, setIsConnected] = useState(false);
	const [connectionState, setConnectionState] = useState<RTCIceConnectionState>('new');
	const streamVideoRef = useRef<HTMLVideoElement>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const remoteStreamRef = useRef<MediaStream>(new MediaStream());
	const pendingLocalIceRef = useRef<IceCandidateInitLike[]>([]);
	const pendingRemoteIceRef = useRef<RTCIceCandidateInit[]>([]);
	const remoteDescReadyRef = useRef(false);
	const localTrickleReadyRef = useRef(false);
	const [isStream, setIsStream] = useState(false);
	const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);

	const resetMediaFlags = useCallback(() => {
		dispatch(videoStreamActions.setIsRemoteVideoStream(false));
		dispatch(videoStreamActions.setIsRemoteAudioStream(false));
	}, [dispatch]);

	const clearVideoElement = useCallback(() => {
		const videoElement = streamVideoRef.current;
		if (videoElement) {
			videoElement.srcObject = null;
		}
		remoteStreamRef.current.getTracks().forEach((track) => {
			remoteStreamRef.current.removeTrack(track);
			track.stop();
		});
		remoteStreamRef.current = new MediaStream();
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
			console.error(err, 'error');
			setIsPlaybackBlocked(true);
			return false;
		}
	}, []);

	const attachRemoteStream = useCallback(() => {
		const videoElement = streamVideoRef.current;
		if (!videoElement) {
			return;
		}
		if (videoElement.srcObject !== remoteStreamRef.current) {
			videoElement.srcObject = remoteStreamRef.current;
		}
		videoElement.autoplay = true;
		videoElement.playsInline = true;
		void retryPlayback();
	}, [retryPlayback]);

	const syncTrackFlags = useCallback(() => {
		const stream = remoteStreamRef.current;
		const hasLiveVideo = stream.getVideoTracks().some((track) => track.readyState === 'live' && !track.muted);
		const hasLiveAudio = stream.getAudioTracks().some((track) => track.readyState === 'live' && !track.muted);
		dispatch(videoStreamActions.setIsRemoteVideoStream(hasLiveVideo));
		dispatch(videoStreamActions.setIsRemoteAudioStream(hasLiveAudio));
	}, [dispatch]);

	const bindTrackListeners = useCallback(
		(track: MediaStreamTrack) => {
			const updateFlags = () => {
				syncTrackFlags();
			};
			track.onmute = updateFlags;
			track.onunmute = updateFlags;
			track.onended = () => {
				try {
					remoteStreamRef.current.removeTrack(track);
				} catch {
					// ignore
				}
				syncTrackFlags();
			};
			syncTrackFlags();
		},
		[syncTrackFlags]
	);

	useEffect(() => {
		const legacyNavigator = navigator as Navigator & {
			webkitGetUserMedia?: unknown;
			mozGetUserMedia?: unknown;
			msGetUserMedia?: unknown;
		};
		const supported = !!(
			navigator.mediaDevices?.getUserMedia ||
			legacyNavigator.webkitGetUserMedia ||
			legacyNavigator.mozGetUserMedia ||
			legacyNavigator.msGetUserMedia ||
			window.RTCPeerConnection
		);
		setIsSupported(supported);
	}, []);

	const wsSend = useCallback((message: Record<string, unknown>) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(message));
		}
	}, []);

	const flushLocalIce = useCallback(() => {
		localTrickleReadyRef.current = true;
		const queued = pendingLocalIceRef.current.splice(0);
		queued.forEach((candidate) => {
			wsSend({
				Key: 'ice_candidate',
				Value: candidate
			});
		});
	}, [wsSend]);

	const flushRemoteIce = useCallback(async () => {
		const peerConnection = pcRef.current;
		if (!peerConnection) {
			return;
		}
		const queued = pendingRemoteIceRef.current.splice(0);
		for (const candidate of queued) {
			try {
				await peerConnection.addIceCandidate(candidate);
			} catch (error) {
				console.error('addIceCandidate queued failed', error);
			}
		}
	}, []);

	const initPeerConnection = useCallback(() => {
		pcRef.current?.close();

		pendingLocalIceRef.current = [];
		pendingRemoteIceRef.current = [];
		remoteDescReadyRef.current = false;
		localTrickleReadyRef.current = false;
		clearVideoElement();
		resetMediaFlags();

		const peerConnection = new RTCPeerConnection({
			iceServers: ICE_SERVERS,
			bundlePolicy: 'max-bundle'
		});

		peerConnection.addTransceiver('audio', { direction: 'recvonly' });
		peerConnection.addTransceiver('video', { direction: 'recvonly' });

		peerConnection.oniceconnectionstatechange = () => {
			setConnectionState(peerConnection.iceConnectionState);
			setIsConnected(peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed');
		};

		peerConnection.onicecandidate = (event) => {
			if (!event.candidate || event.candidate.candidate === '') {
				return;
			}
			const candidateInit = event.candidate.toJSON();
			if (!localTrickleReadyRef.current) {
				pendingLocalIceRef.current.push(candidateInit);
				return;
			}
			wsSend({
				Key: 'ice_candidate',
				Value: candidateInit
			});
		};

		peerConnection.ontrack = (event) => {
			const track = event.track;
			const existing = remoteStreamRef.current.getTracks().find((t) => t.id === track.id);
			if (!existing) {
				remoteStreamRef.current.addTrack(track);
			}
			bindTrackListeners(track);
			attachRemoteStream();
			setIsStream(true);
		};

		pcRef.current = peerConnection;
		return peerConnection;
	}, [attachRemoteStream, bindTrackListeners, clearVideoElement, resetMediaFlags, wsSend]);

	const applyRemoteAnswer = useCallback(
		async (value: unknown) => {
			const peerConnection = pcRef.current;
			const sdp = extractAnswerSdp(value);
			if (!peerConnection || !sdp) {
				console.error('sd_answer missing sdp');
				return;
			}

			try {
				await peerConnection.setRemoteDescription({ type: 'answer', sdp });
				remoteDescReadyRef.current = true;
				await flushRemoteIce();
				flushLocalIce();
				setIsStream(true);
			} catch (error) {
				console.error('setRemoteDescription failed', error);
			}
		},
		[flushLocalIce, flushRemoteIce]
	);

	const connect = useCallback(async () => {
		if (!isSupported) {
			throw new Error('WebRTC is not supported');
		}

		const peerConnection = pcRef.current || initPeerConnection();

		try {
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);
			await waitIceGatheringComplete(peerConnection);
			const local = peerConnection.localDescription || offer;

			wsSend({
				Key: 'session_subscriber',
				Value: { type: local.type, sdp: local.sdp }
			});
		} catch (error) {
			console.log(error, 'error');
			throw error;
		}
	}, [wsSend, isSupported, initPeerConnection]);

	const disconnect = useCallback(() => {
		const ws = wsRef.current;
		const pc = pcRef.current;

		wsRef.current = null;
		pcRef.current = null;
		pendingLocalIceRef.current = [];
		pendingRemoteIceRef.current = [];
		remoteDescReadyRef.current = false;
		localTrickleReadyRef.current = false;

		try {
			ws?.close();
		} catch {
			// ignore
		}
		try {
			pc?.close();
		} catch {
			// ignore
		}

		clearVideoElement();
		resetMediaFlags();
		setIsConnected(false);
		setConnectionState('closed');
		setIsPlaybackBlocked(false);
		setIsStream(false);
	}, [clearVideoElement, resetMediaFlags]);

	const handleChannelClick = useCallback(
		(clanId: string, channelId: string, userId: string, streamId: string, username: string, accessToken: string) => {
			disconnect();

			const wsUrl = process.env.NX_CHAT_APP_STREAM_WS_URL;
			if (!wsUrl || !accessToken) {
				console.error('Missing stream WS url or access token');
				return;
			}

			const targetChannelId = streamId || channelId;
			const clientId = `web-${userId || username || 'anonymous'}`;
			const websocket = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(accessToken)}`);

			try {
				const peerConnection = initPeerConnection();

				const sendEnvelope = (key: string, value?: unknown) => {
					websocket.send(
						JSON.stringify({
							Key: key,
							ClanId: clanId,
							ChannelId: channelId,
							UserId: userId,
							ClientId: clientId,
							IsPublisher: false,
							State: 0,
							...(value !== undefined ? { Value: value } : {})
						})
					);
				};

				const startSubscriberSession = async () => {
					try {
						const offer = await peerConnection.createOffer();
						await peerConnection.setLocalDescription(offer);
						await waitIceGatheringComplete(peerConnection);
						const local = peerConnection.localDescription || offer;

						sendEnvelope('session_subscriber', {
							type: local.type,
							sdp: local.sdp
						});
					} catch (error) {
						console.error('failed to create subscriber offer', error);
					}
				};

				websocket.onopen = () => {
					void startSubscriberSession();
				};

				websocket.onmessage = (event) => {
					let data: StnMessage;
					try {
						data = JSON.parse(event.data) as StnMessage;
					} catch (error) {
						console.error('invalid STN message', error);
						return;
					}

					if (!data?.Key) {
						return;
					}

					switch (data.Key) {
						case 'session_received':
							sendEnvelope('connect_subscriber', { ChannelId: targetChannelId });
							break;
						case 'channels': {
							const channels = Array.isArray(data.Value) ? data.Value.map(String) : [];
							setIsStream(channels.includes(targetChannelId));
							break;
						}
						case 'sd_answer':
							void applyRemoteAnswer(data.Value);
							break;
						case 'ice_candidate': {
							const candidate = toIceCandidateInit(data.Value);
							if (!candidate) {
								break;
							}
							if (!remoteDescReadyRef.current || !pcRef.current) {
								pendingRemoteIceRef.current.push(candidate);
								break;
							}
							void pcRef.current.addIceCandidate(candidate).catch((error) => {
								console.error('addIceCandidate failed', error);
							});
							break;
						}
						case 'channel_closed':
						case 'stream_track_ended':
							setIsStream(false);
							resetMediaFlags();
							break;
						case 'error':
							console.error('STN error', data.Value);
							break;
						case 'info':
							break;
						default:
							break;
					}
				};

				websocket.onerror = (error) => {
					console.error('STN websocket error', error);
				};

				websocket.onclose = () => {
					if (wsRef.current === websocket) {
						setIsConnected(false);
						setConnectionState('closed');
					}
				};

				wsRef.current = websocket;
			} catch (error) {
				console.error(error, 'error');
				websocket.close();
			}
		},
		[applyRemoteAnswer, disconnect, initPeerConnection, resetMediaFlags]
	);

	useEffect(() => {
		return () => {
			disconnect();
		};
	}, [disconnect]);

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
		retryPlayback
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
