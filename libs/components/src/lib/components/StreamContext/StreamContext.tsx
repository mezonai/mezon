/* eslint-disable no-console */
import { useAppDispatch, videoStreamActions } from '@mezon/store';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface WebRTCContextType {
	isSupported: boolean;
	isConnected: boolean;
	connectionState: RTCIceConnectionState;
	connect: () => Promise<void>;
	disconnect: () => void;
	sendMessage: (message: Record<string, unknown>) => void;
	errors: string[];
	messages: string[];
	handleChannelClick: (clanId: string, channelId: string, userId: string, streamId: string) => void;
	streamVideoRef: React.RefObject<HTMLVideoElement>;
	isStream: boolean;
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
	const [errors, setErrors] = useState<string[]>([]);
	const [messages, setMessages] = useState<string[]>([]);
	const streamVideoRef = useRef<HTMLVideoElement>(null);
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const [isStream, setIsStream] = useState(false);

	const debug = useCallback((...args: string[]) => {
		addMessage(args.join(' '));
	}, []);

	const addError = useCallback((...msgs: string[]) => {
		setErrors((prev) => [...prev, ...msgs]);
	}, []);

	const addMessage = useCallback((message: string) => {
		const timestamp = new Date().toISOString();
		setMessages((prev) => [`${timestamp} ${message}`, ...prev]);
	}, []);

	useEffect(() => {
		const checkSupport = () => {
			const supported = !!(
				navigator.mediaDevices?.getUserMedia ||
				(navigator as any).webkitGetUserMedia ||
				(navigator as any).mozGetUserMedia ||
				(navigator as any).msGetUserMedia ||
				window.RTCPeerConnection
			);
			setIsSupported(supported);

			if (!supported) {
				addError('WebRTC is not supported in your browser');
			}
		};
		checkSupport();
	}, [addError]);

	// WebSocket handling
	const wsSend = useCallback(
		(message: Record<string, unknown>) => {
			const jsonStr = JSON.stringify(message);
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(jsonStr);
			} else {
				debug('ws: send not ready, skipping...', jsonStr);
			}
		},
		[wsRef.current, debug]
	);

	// RTCPeerConnection handling
	const initPeerConnection = useCallback(() => {
		const peerConnection = new RTCPeerConnection({
			iceServers: [
				{
					urls: 'stun:stun.l.google.com:19302'
				}
			]
		});

		peerConnection.oniceconnectionstatechange = () => {
			debug('ICE state:', peerConnection.iceConnectionState);
			setConnectionState(peerConnection.iceConnectionState);
			setIsConnected(peerConnection.iceConnectionState === 'connected');
			// Handle spinner visibility based on connection state
			const states = ['new', 'checking', 'failed', 'disconnected', 'closed', 'completed', 'connected'];
			if (states.includes(peerConnection.iceConnectionState)) {
				// You might want to handle spinner visibility through a state
				debug(`ICE connection state changed to: ${peerConnection.iceConnectionState}`);
			}
		};

		peerConnection.onicecandidate = (event) => {
			if (event.candidate && event.candidate.candidate !== '') {
				const message = {
					Key: 'ice_candidate',
					Value: event.candidate
				};
				wsSend(message);
			}
		};

		peerConnection.ontrack = (event) => {
			const remoteStream = event.streams[0];
			if (streamVideoRef.current) {
				streamVideoRef.current.srcObject = remoteStream;
				streamVideoRef.current.autoplay = true;
				streamVideoRef.current.controls = true;
			}
			remoteStream.getVideoTracks().forEach((track) => {
				track.onmute = () => {
					dispatch(videoStreamActions.setIsRemoteVideoStream(false));
				};

				track.onunmute = () => {
					dispatch(videoStreamActions.setIsRemoteVideoStream(true));
				};
			});

			remoteStream.getAudioTracks().forEach((track) => {
				track.onmute = () => {
					dispatch(videoStreamActions.setIsRemoteAudioStream(false));
				};
				track.onunmute = () => {
					dispatch(videoStreamActions.setIsRemoteAudioStream(true));
				};
			});
		};

		peerConnection.addTransceiver('audio');

		pcRef.current = peerConnection;
		return peerConnection;
	}, [wsSend, debug]);

	const startSession = useCallback(
		(sd: string) => {
			if (pcRef.current) {
				try {
					pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sd }));
				} catch (e) {
					alert(e);
				}
			}
		},
		[pcRef.current]
	);

	const connect = useCallback(async () => {
		if (!isSupported) {
			throw new Error('WebRTC is not supported');
		}

		const peerConnection = pcRef.current || initPeerConnection();

		try {
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);

			wsSend({
				Key: 'offer',
				Value: offer
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error during connection';
			addError(errorMessage);
			throw error;
		}
	}, [pcRef.current, wsSend, isSupported, initPeerConnection, addError]);

	const disconnect = useCallback(() => {
		wsRef.current?.close();
		pcRef.current?.close();
		pcRef.current = null;
		wsRef.current = null;
		setIsConnected(false);
		setConnectionState('closed');
		debug('WebRTC connection closed');
	}, [debug]);

	const handleChannelClick = useCallback((clanId: string, channelId: string, userId: string, streamId: string) => {
		const wsUrl = process.env.NX_CHAT_APP_STREAM_WS_URL;
		const websocket = new WebSocket(`${wsUrl}/ws`);
		try {
			const peerConnection = initPeerConnection();
			websocket.onopen = () => {
				debug('ws: connection open');
				const f = () => {
					peerConnection
						?.createOffer()
						.then((d) => {
							peerConnection?.setLocalDescription(d);
							websocket.send(
								JSON.stringify({
									Key: 'session_subscriber',
									ClanId: clanId,
									ChannelId: channelId,
									UserId: userId,
									Value: d
								})
							);
							websocket.send(
								JSON.stringify({
									Key: 'get_channels'
								})
							);
						})
						.catch((e) => {
							console.log(e, 'error');
						});
				};
				websocket.readyState === WebSocket.OPEN ? f() : websocket.addEventListener('open', f);
			};

			websocket.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if ('Key' in data) {
					switch (data.Key) {
						case 'channels':
							if (data.Value.includes(streamId)) {
								websocket.send(
									JSON.stringify({
										Key: 'connect_subscriber',
										ClanId: clanId,
										ChannelId: channelId,
										UserId: userId,
										Value: { ChannelId: streamId }
									})
								);
								setIsStream(true);
							} else {
								setIsStream(false);
							}
							break;
						case 'session_received':
							break;
						case 'error':
							break;
						case 'sd_answer':
							startSession(data.Value);
							break;
						case 'ice_candidate':
							pcRef.current?.addIceCandidate(data.Value);
							break;
						default:
							console.log('Unhandled message:', data);
					}
				}
			};

			websocket.onerror = (error) => {
				addError('WebSocket error:', error.toString());
			};

			wsRef.current = websocket;
		} catch (error) {
			console.log(error, 'error');
		}
	}, []);

	const value = {
		isSupported,
		isConnected,
		connectionState,
		connect,
		disconnect,
		sendMessage: wsSend,
		errors,
		messages,
		handleChannelClick,
		streamVideoRef,
		isStream
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
