import { useAuth } from '@mezon/core';
import { selectCurrentChannelId, selectCurrentClanId, selectJoinSFUByChannelId, useAppSelector } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { compress, decompress } from '../DmList/DMtopbar';

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
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const channelId = useRef<string | null>(currentChannelId || null);
	const currentClanId = useSelector(selectCurrentClanId);
	const clanId = useRef<string | null>(currentClanId || null);
	const peerConnection = useRef<RTCPeerConnection | null>(null);

	const sfuData = useAppSelector((state) => selectJoinSFUByChannelId(state, userId));

	const servers: RTCConfiguration = useMemo(
		() => ({
			iceServers: [
				{
					urls: process.env.NX_WEBRTC_ICESERVERS_URL as string,
					username: process.env.NX_WEBRTC_ICESERVERS_USERNAME,
					credential: process.env.NX_WEBRTC_ICESERVERS_CREDENTIAL
				}
			]
		}),
		[]
	);

	const setChannelId = (id: string) => {
		channelId.current = id;
	};

	const setClanId = (id: string) => {
		clanId.current = id;
	};

	const initializePeerConnection = useCallback(() => {
		peerConnection.current = new RTCPeerConnection(servers);
		peerConnection.current.onnegotiationneeded = async (event) => {};

		peerConnection.current.ontrack = (event) => {
			if (event?.streams?.[0]) {
				setRemoteStream(event.streams[0]);
			}
		};

		peerConnection.current.onicecandidate = async (event) => {
			if (event && event.candidate && mezon.socketRef.current?.isOpen() === true) {
				await mezon.socketRef.current?.forwardSFUSignaling(
					userId || '',
					WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
					clanId.current || '',
					channelId.current || '',
					JSON.stringify(event.candidate)
				);
			}
		};
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
			await mezon.socketRef.current?.forwardSFUSignaling(
				'userId',
				WebrtcSignalingType.WEBRTC_SDP_INIT,
				clanId.current || '',
				channelId.current || '',
				''
			);
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

		const lastData = sfuData?.[sfuData?.length - 1];
		if (!lastData) return;
		const data = lastData?.joinSFUData;
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
						const answerEnc = await compress(JSON.stringify(answer));
						await mezon.socketRef.current?.forwardSFUSignaling(
							'userId',
							WebrtcSignalingType.WEBRTC_SDP_ANSWER,
							clanId.current || '',
							channelId.current || '',
							answerEnc
						);
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
	}, [mezon.socketRef, sfuData]);

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
