import { useAuth } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentClanId, selectJoinPTTByChannelId, useAppSelector } from '@mezon/store';
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
	const peerConnection = useRef<RTCPeerConnection | null>(null);
	
	const ws: WebSocket = new WebSocket("wss://stn.nccsoft.vn/ws?username=komu&token=C5pfsrXJU2jRUzL");
	const onWSReady: Function[] = [];
	
	const getChannelsId = setInterval(function() {
		console.log("get_channels");
		let val = {Key: 'get_channels'}
		ws.send(JSON.stringify(val));
	}, 1000);
	
	ws.onopen = () => {
		console.log('ws: connection open')
		onWSReady.forEach((f) => {
			f();
		});
	}
	
	ws.onmessage = function (e)	{
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
				case "session_received": // wait for the message that session_subscriber was received
					break;
				case 'ice_candidate':
					peerConnection.current?.addIceCandidate(wsMsg.Value)
					break;
				case 'channels':
					console.log('onmessage channel: ', wsMsg.Value);
					if(wsMsg.Value.length > 0) {
						clearInterval(getChannelsId);
					}
					
					break;
				case 'channel_closed':
					console.error("channel '" + wsMsg.Value + "' closed by server")
					break;
			}
		}
	};
	
	ws.onclose = function()	{
		console.log("websocket connection closed");
		peerConnection.current?.close()
		clearInterval(getChannelsId)
	};

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
	
	const startSession = (sd: string) => {
		try {
			console.log("webrtc: set remote description");
			peerConnection.current?.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sd }));
		} catch (e) {
			alert(e);
		}
	}

	const initializePeerConnection = useCallback(() => {
		peerConnection.current = new RTCPeerConnection(servers);
		peerConnection.current.onnegotiationneeded = async (event) => {};

		peerConnection.current.ontrack = (event) => {
			console.log('check stream: ', event?.streams)
			if (event?.streams?.[0]) {
				console.log(event?.streams?.[0])
				setRemoteStream(event.streams[0]);
			}
		};

		peerConnection.current.onicecandidate = async (event) => {
			// if (event && event.candidate && mezon.socketRef.current?.isOpen() === true) {
			// 	// TODO: send ptt oncandidate to STN
			// }
			
			if(event.candidate && event.candidate.candidate !== '') {
				ws.send(
					JSON.stringify({
						Key: 'ice_candidate',
						Value: event.candidate
					})
				)
			}
		};
		
		peerConnection.current.oniceconnectionstatechange = (e) => {
			console.log("ICE state:", peerConnection.current?.iceConnectionState);
			switch (peerConnection.current?.iceConnectionState) {
				case "new":
				case "checking":
				case "failed":
				case "disconnected":
				case "closed":
				case "completed":
				case "connected":
					break;
				default:
					console.log("webrtc: ice state unknown", e);
					break;
			}
		};
		
		peerConnection.current.ontrack = function (event) {
			// console.log("");
			console.log('webrtc: ontrack: ', event?.streams)
			if (event?.streams?.[0]) {
				console.log(event?.streams?.[0])
				setRemoteStream(event.streams[0]);
			}
		}
		
		
		
		peerConnection.current.addTransceiver('audio')
		
		let f = () => {
			console.log("webrtc: create offer")
			peerConnection.current?.createOffer().then(d => {
				console.log("webrtc: set local description")
				peerConnection.current?.setLocalDescription(d);
				let val = { Key: 'session_subscriber', ClanId: "1779484504377790464", ChannelId: "123456", UserId: "1826067167154540544", Value: d };
				ws.send(JSON.stringify(val));
				
				setTimeout(() => {
					const message = {Key: 'connect_subscriber', Value: {ChannelId: '123456'}};
					ws.send(JSON.stringify(message))
				}, 2000)
			}).catch(console.log)
		}
// create offer if WS is ready, otherwise queue
		ws.readyState == WebSocket.OPEN ? f() : onWSReady.push(f)
		
		return peerConnection.current;
	}, [mezon.socketRef, servers]);

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
		} catch (error) {
			console.error('Error accessing audio devices: ', error);
		}
	};

	const stopSession = useCallback(async () => {
		// Close the peer connection
		peerConnection.current?.close();
		peerConnection.current = null;
		localStream?.getTracks().forEach((track) => track.stop());

		// Reset state
		setLocalStream(null);
		setRemoteStream(null);
	}, [localStream]);

	const toggleMicrophone = useCallback(
		async (value: boolean) => {
			if (peerConnection.current && channelId.current) {
				if (value === true) {
					// TODO: send ptt talk to STN
				}
			}
			if (localStream) {
				localStream?.getAudioTracks().forEach((track) => {
					track.enabled = value;
				});
			}
		},
		[localStream]
	);

	useEffect(() => {
		if (!peerConnection.current) {
			return;
		}

		const lastData = pushToTalkData?.[pushToTalkData?.length - 1];
		if (!lastData) return;
		const data = lastData?.joinPttData;
		switch (data.data_type) {
			case WebrtcSignalingType.WEBRTC_SDP_OFFER:
				{
					const processData = async () => {
						if (!peerConnection.current) {
							return;
						}
						const dataDec = await decompress(data?.json_data);
						const offer = safeJSONParse(dataDec);
						await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
						const answer = await peerConnection.current.createAnswer();
						await peerConnection.current.setLocalDescription(new RTCSessionDescription(answer));
						// TODO: send join ptt to STN
					};
					processData().catch(console.error);
				}
				break;
			case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE:
				{
					const processData = async () => {
						const candidate = safeJSONParse(data?.json_data);
						if (peerConnection.current && candidate != null) {
							await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
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
