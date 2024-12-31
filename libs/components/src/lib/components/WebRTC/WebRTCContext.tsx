import { useAuth } from '@mezon/core';
import {
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentUserId,
	selectJoinPTTByChannelId,
	useAppSelector
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { decompress } from '../DmList/DMtopbar';

// Define the context value type
interface WebRTCContextType {
	clanId?: string | null;
	channelId?: string | null;
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	initializePeerConnection: () => void;
	startLocalStream: () => Promise<void>;
	handleStartSubscriberStream: () => Promise<void>;
	stopSession: () => Promise<void>;
	toggleMicrophone: (value: boolean) => void;
	setChannelId: (value: string) => void;
	setClanId: (value: string) => void;
}

// Create the WebRTC Context
const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

// Provider Component Props
interface WebRTCProviderProps {
	children: ReactNode;
}

// WebRTCProvider Implementation
export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
	const { userId } = useAuth();
	const mezon = useMezon();
	const pushToTalkData = useAppSelector((state) => selectJoinPTTByChannelId(state, userId));
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const channelId = useRef<string | null>(currentChannelId || null);
	const currentClanId = useSelector(selectCurrentClanId);
	const clanId = useRef<string | null>(currentClanId || null);
	const publisherPeerConnection = useRef<RTCPeerConnection | null>(null);
	const subscriberPeerConnection = useRef<RTCPeerConnection | null>(null);
	const publisherWebSocketRef = useRef<WebSocket | null>(null);
	const subscriberWebSocketRef = useRef<WebSocket | null>(null);
	
	const initSubscriberWS = useCallback(() => {
		if(subscriberWebSocketRef.current) return;
		
		subscriberWebSocketRef.current = new WebSocket("wss://stn.nccsoft.vn/ws?username=komu&token=C5pfsrXJU2jRUzL");
		
		subscriberWebSocketRef.current.onopen = () => {
			console.log('subscriber ws: connection open')
			onWSReady.forEach((f) => {
				f();
			});
		}
		
		subscriberWebSocketRef.current.onmessage = async (e) =>	{
			let wsMsg = JSON.parse(e.data);
			if( 'Key' in wsMsg ) {
				switch (wsMsg.Key) {
					case 'info':
						console.log("server info: " + wsMsg.Value);
						break;
					case 'error':
						console.error("server error:", wsMsg.Value);
						break;
					case 'sd_answer':
						startSubscriberSession(wsMsg.Value);
						break;
					case "session_received":
						break;
					case 'ice_candidate':
						subscriberPeerConnection.current?.addIceCandidate(wsMsg.Value)
						break;
					case 'channels':
						break;
					case 'channel_closed':
						console.error("channel '" + wsMsg.Value + "' closed by server")
						break;
				}
			}
		};
		
		subscriberWebSocketRef.current.onclose = function()	{
			subscriberPeerConnection.current?.close()
		};
	}, [subscriberWebSocketRef.current])
	
	const onWSReady: Function[] = [];
	
	const wsSend = useCallback((ws: WebSocket | null, value: any) => {
		if(!ws) return;
		
		return ws.send(JSON.stringify(value));
	}, [])

	const servers: RTCConfiguration = useMemo(
		() => ({
			// iceServers: [
			// 	{
			// 		urls: process.env.NX_WEBRTC_ICESERVERS_URL as string,
			// 		username: process.env.NX_WEBRTC_ICESERVERS_USERNAME,
			// 		credential: process.env.NX_WEBRTC_ICESERVERS_CREDENTIAL
			// 	}
			// ]
			iceServers: [
				{
					urls: "stun:stun.l.google.com:19302",
				},
			],
		}),
		[]
	);

	const setChannelId = (id: string) => {
		channelId.current = id;
	};

	const setClanId = (id: string) => {
		clanId.current = id;
	};
	
	const startSubscriberSession = (sd: string) => {
		try {
			subscriberPeerConnection.current?.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sd }));
		} catch (e) {
			alert(e);
		}
	}
	
	const startSession = (sd: string) => {
		try {
			publisherPeerConnection.current?.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sd }));
		} catch (e) {
			alert(e);
		}
	}

	const initializePeerConnection = useCallback(() => {
		publisherPeerConnection.current = new RTCPeerConnection(servers);
		publisherPeerConnection.current.onnegotiationneeded = async (event) => {};
		
		publisherPeerConnection.current.ontrack = (event) => {
			if (event?.streams?.[0]) {
				console.log(event?.streams?.[0])
				setRemoteStream(event.streams[0]);
			}
		};
		
		publisherPeerConnection.current.onicecandidate = async (event) => {
			if(event.candidate && event.candidate.candidate !== '') {
				wsSend(publisherWebSocketRef.current, {
						Key: 'ice_candidate',
						Value: event.candidate
					})
			}
		};
		
		publisherPeerConnection.current.oniceconnectionstatechange = (e) => {
			switch (publisherPeerConnection.current?.iceConnectionState) {
				case "new":
				case "checking":
				case "failed":
				case "disconnected":
				case "closed":
				case "completed":
				case "connected":
					break;
				default:
					break;
			}
		};
		
		publisherPeerConnection.current.ontrack = function (event) {
			console.log('webrtc: ontrack: ', event?.streams)
			if (event?.streams?.[0]) {
				console.log(event?.streams?.[0])
			}
		}
		
		return publisherPeerConnection.current;
	}, [mezon.socketRef, servers]);
	
	const initializeSubscriberPeerConnection = useCallback(() => {
		subscriberPeerConnection.current = new RTCPeerConnection(servers);
		subscriberPeerConnection.current.onnegotiationneeded = async (event) => {};
		
		subscriberPeerConnection.current.ontrack = (event) => {
			if (event?.streams?.[0]) {
				console.log(event?.streams?.[0])
				setRemoteStream(event.streams[0]);
			}
		};
		
		subscriberPeerConnection.current.onicecandidate = async (event) => {
			if(event.candidate && event.candidate.candidate !== '') {
				wsSend(
					subscriberWebSocketRef.current,
					{
						Key: 'ice_candidate',
						Value: event.candidate
					})
			}
		};
		
		subscriberPeerConnection.current.oniceconnectionstatechange = (e) => {
			switch (subscriberPeerConnection.current?.iceConnectionState) {
				case "new":
				case "checking":
				case "failed":
				case "disconnected":
				case "closed":
				case "completed":
				case "connected":
					break;
				default:
					break;
			}
		};
		
		subscriberPeerConnection.current.ontrack = function (event) {
			if (event?.streams?.[0]) {
				console.log(event?.streams?.[0])
				setRemoteStream(event.streams[0]);
			}
		}
		
		subscriberPeerConnection.current.addTransceiver('audio')
		
		
		
		return subscriberPeerConnection.current;
	}, [mezon.socketRef, servers]);
	
	const handleStartSubscriberStream = async() => {
		const connection = initializeSubscriberPeerConnection();
		
		connection.ontrack = (event) => {
			if (event?.streams?.[0]) {
				setRemoteStream(event.streams[0]);
			}
		};
		
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		stream.getAudioTracks().forEach((track) => {
			try {
				connection.addTrack(track, stream);
			} catch (e) {
				// do nothing
			}
		});
		
		let f = () => {
			subscriberPeerConnection.current?.createOffer().then(d => {
				subscriberPeerConnection.current?.setLocalDescription(d);
				let val = { Key: 'session_subscriber', ClanId: clanId.current, ChannelId: channelId.current, UserId: userId, Value: d };
				wsSend(subscriberWebSocketRef.current, val);
				
				// setTimeout(() => {
					const message = {Key: 'connect_subscriber', Value: {ChannelId: channelId.current}};
					wsSend(subscriberWebSocketRef.current, message)
				// }, 2000)
			}).catch(console.error)
		}

// create offer if WS is ready, otherwise queue
		subscriberWebSocketRef.current?.readyState == WebSocket.OPEN ? f() : onWSReady.push(f)
	}

	const startLocalStream = async () => {
		try {
			if (!mezon.socketRef.current) {
				return;
			}

			const connection = initializePeerConnection();
			
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getAudioTracks().forEach((track) => {
				try {
					connection.addTrack(track, stream);
				} catch (e) {
					// do nothing
				}
			});
			
			// TODO: send join ptt to STN
			let f = () => {
				publisherPeerConnection.current?.createOffer()
					.then((d) => {
						publisherPeerConnection.current?.setLocalDescription(d);
						let val = { Key: "session_publisher", ChannelId: channelId.current, UserId: userId, Value: d };
						wsSend(publisherWebSocketRef.current, val);
						
						// setTimeout(() => {
							const message = {
								Key: 'connect_publisher',
								Value: {
									ChannelId: channelId.current
								}
							}
							wsSend(publisherWebSocketRef.current, message);
						// }, 2000)
					})
					.catch(console.error);
			};
			// create offer if WS is ready, otherwise queue
			publisherWebSocketRef.current?.readyState == WebSocket.OPEN ? f() : onWSReady.push(f);
		} catch (error) {
			console.error('Error accessing audio devices: ', error);
		}
	};

	const stopSession = useCallback(async () => {
		// Close the peer connection
		publisherPeerConnection.current?.close();
		publisherPeerConnection.current = null;
		subscriberPeerConnection.current?.close();
		subscriberPeerConnection.current = null;
		localStream?.getTracks().forEach((track) => track.stop());
		remoteStream?.getTracks().forEach((track) => track.stop());

		// Reset state
		setLocalStream(null);
		setRemoteStream(null);
	}, [localStream, remoteStream]);

	const toggleMicrophone = useCallback(
		async (value: boolean) => {
			if (publisherPeerConnection.current && channelId.current) {
				const message = {
					Key: 'ptt_publisher',
					Value: {
						ChannelId: channelId.current,
						IsTalk: value
					}
				}
				wsSend(publisherWebSocketRef.current, message);
			}
			if (localStream) {
				localStream?.getAudioTracks().forEach((track) => {
					track.enabled = value;
				});
			}
		},
		[localStream]
	);
	
	useEffect (() => {
		if(publisherWebSocketRef.current) return;
		
		publisherWebSocketRef.current = new WebSocket("wss://stn.nccsoft.vn/ws?username=komu&token=C5pfsrXJU2jRUzL");
		
		publisherWebSocketRef.current.onopen = () => {
			onWSReady.forEach((f) => {
				f();
			});
		}
		
		publisherWebSocketRef.current.onmessage = async (e) =>	{
			let wsMsg = JSON.parse(e.data);
			if( 'Key' in wsMsg ) {
				switch (wsMsg.Key) {
					case 'info':
						console.log("server info: " + wsMsg.Value);
						break;
					case 'error':
						console.error("server error:", wsMsg.Value);
						break;
					case 'sd_answer':
						startSession(wsMsg.Value);
						break;
					case "session_received":
						break;
					case 'ice_candidate':
						publisherPeerConnection.current?.addIceCandidate(wsMsg.Value)
						break;
					case 'channel_closed':
						console.error("channel '" + wsMsg.Value + "' closed by server")
						break;
					case 'connect_publisher':
						initSubscriberWS();
						await handleStartSubscriberStream();
				}
			}
		};
		
		publisherWebSocketRef.current.onclose = function()	{
			publisherPeerConnection.current?.close()
		};
	}, []);

	useEffect(() => {
		if (!publisherPeerConnection.current) {
			return;
		}

		const lastData = pushToTalkData?.[pushToTalkData?.length - 1];
		if (!lastData) return;
		const data = lastData?.joinPttData;
		switch (data.data_type) {
			case WebrtcSignalingType.WEBRTC_SDP_OFFER:
				{
					const processData = async () => {
						if (!publisherPeerConnection.current) {
							return;
						}
						const dataDec = await decompress(data?.json_data);
						const offer = safeJSONParse(dataDec);
						await publisherPeerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
						const answer = await publisherPeerConnection.current.createAnswer();
						await publisherPeerConnection.current.setLocalDescription(new RTCSessionDescription(answer));
						// TODO: send join ptt to STN
					};
					processData().catch(console.error);
				}
				break;
			case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE:
				{
					const processData = async () => {
						const candidate = safeJSONParse(data?.json_data);
						if (publisherPeerConnection.current && candidate != null) {
							await publisherPeerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
						}
					};
					processData().catch(console.error);
				}
				break;
			default:
				break;
		}
	}, [mezon.socketRef, pushToTalkData]);

	const value: WebRTCContextType = {
		clanId: clanId.current,
		channelId: channelId.current,
		localStream,
		remoteStream,
		toggleMicrophone,
		initializePeerConnection,
		startLocalStream,
		handleStartSubscriberStream,
		stopSession,
		setChannelId,
		setClanId
	};

	return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>;
};

// Custom Hook
export const useWebRTC = (): WebRTCContextType => {
	const context = useContext(WebRTCContext);
	if (!context) {
		throw new Error('useWebRTC must be used within a WebRTCProvider');
	}
	return context;
};
