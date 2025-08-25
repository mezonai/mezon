import { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, mediaDevices } from '@livekit/react-native-webrtc';
import { useAuth, useChatSending } from '@mezon/core';
import { sessionConstraints } from '@mezon/mobile-components';
import { DMCallActions, RootState, audioCallActions, selectDmGroupCurrent, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { IMessageSendPayload, IMessageTypeCallLog, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, NativeModules, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { deflate, inflate } from 'react-native-gzip';
import InCallManager from 'react-native-incall-manager';
import Sound from 'react-native-sound';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import NotificationPreferences from '../utils/NotificationPreferences';
import { usePermission } from './useRequestPermission';
const { AudioModule } = NativeModules;

const RTCConfig = {
	iceServers: [
		{
			urls: process.env.NX_WEBRTC_ICESERVERS_URL as string,
			username: process.env.NX_WEBRTC_ICESERVERS_USERNAME,
			credential: process.env.NX_WEBRTC_ICESERVERS_CREDENTIAL
		}
	],
	iceCandidatePoolSize: 10
};

interface CallState {
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	storedIceCandidates?: RTCIceCandidate[] | null;
}

const compress = async (str: string) => {
	return await deflate(str);
};

const decompress = async (compressedStr: string) => {
	return await inflate(compressedStr);
};

type MediaControl = {
	mic: boolean;
	camera: boolean;
	speaker?: boolean;
};

type IProps = {
	dmUserId: string;
	channelId: string;
	userId: string;
	isVideoCall: boolean;
	callerName: string;
	callerAvatar: string;
	isFromNative?: boolean;
};

export function useWebRTCCallMobile({ dmUserId, channelId, userId, isVideoCall, callerName, callerAvatar, isFromNative = false }: IProps) {
	const [callState, setCallState] = useState<CallState>({
		localStream: null,
		remoteStream: null,
		storedIceCandidates: null
	});
	const peerConnection = useRef<RTCPeerConnection | null>(null);
	const { requestMicrophonePermission, requestCameraPermission } = usePermission();
	const mezon = useMezon();
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const endCallTimeout = useRef<NodeJS.Timeout | null>(null);
	const timeStartConnected = useRef<any>(null);
	const [localMediaControl, setLocalMediaControl] = useState<MediaControl>({
		mic: false,
		camera: false,
		speaker: false
	});
	const [isConnected, setIsConnected] = useState<boolean | null>(null);
	const pendingCandidatesRef = useRef<(RTCIceCandidate | null)[]>([]);
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode: mode });
	const { userProfile } = useAuth();
	const sessionUser = useSelector((state: RootState) => state.auth?.session);

	const stopAllTracks = useCallback(() => {
		if (callState.localStream) {
			callState.localStream?.getVideoTracks().forEach((track) => {
				track.enabled = false;
			});
			callState.localStream?.getAudioTracks().forEach((track) => {
				track.enabled = false;
			});
			callState.localStream.getTracks().forEach((track) => track.stop());
		}
		if (callState.remoteStream) {
			callState.remoteStream?.getVideoTracks().forEach((track) => {
				track.enabled = false;
			});
			callState.remoteStream?.getAudioTracks().forEach((track) => {
				track.enabled = false;
			});
			callState.remoteStream.getTracks().forEach((track) => track.stop());
		}
	}, [callState.localStream, callState.remoteStream]);

	useEffect(() => {
		clearUpStorageCalling();
		return () => {
			endCallTimeout.current && clearTimeout(endCallTimeout.current);
			endCallTimeout.current = null;
			timeStartConnected.current = null;
			dispatch(DMCallActions.removeAll());
			stopDialTone();
		};
	}, []);

	const clearUpStorageCalling = async () => {
		if (Platform.OS === 'android') {
			await NotificationPreferences.clearValue('notificationDataCalling');
		} else {
			RNCallKeep.endAllCalls();
			const VoIPManager = NativeModules?.VoIPManager;
			if (VoIPManager) {
				await VoIPManager.clearStoredNotificationData();
			} else {
				console.error('VoIPManager is not available');
			}
		}
	};

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			if (sessionUser) {
				sendMessage(content, mentions, attachments, references);
			} else {
				console.error('Session is not available');
			}
		},
		[sendMessage, sessionUser]
	);

	// Initialize peer connection with proper configuration
	const initializePeerConnection = useCallback(() => {
		const pc = new RTCPeerConnection(RTCConfig);
		pc.addEventListener('icecandidate', async (event) => {
			if (event?.candidate) {
				pendingCandidatesRef.current = [...(pendingCandidatesRef?.current || []), event.candidate];
			}
		});

		pc.addEventListener('track', (event) => {
			const newStream = new MediaStream();
			event.streams[0].getTracks().forEach((track) => {
				newStream.addTrack(track);
			});
			if (event.streams[0]) {
				setCallState((prev) => ({
					...prev,
					remoteStream: newStream as MediaStream
				}));
			}
		});

		pc.addEventListener('iceconnectionstatechange', (event) => {
			if (pc.iceConnectionState === 'connected') {
				timeStartConnected.current = new Date();
				endCallTimeout?.current && clearTimeout(endCallTimeout.current);
				mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_INIT, '', channelId, userId);
				setIsConnected(true);
				stopDialTone();
				cancelCallFCMMobile();
			}
			if (pc.iceConnectionState === 'checking') {
				setIsConnected(false);
				endCallTimeout?.current && clearTimeout(endCallTimeout.current);
				stopDialTone();
			}
			if (pc.iceConnectionState === 'disconnected') {
				setIsConnected(null);
				handleEndCall({ isCancelGoBack: false });
			}
		});

		return pc;
	}, [mezon.socketRef, dmUserId, userId, dispatch]);

	const getConstraintsLocal = async (isVideoCall = false) => {
		let haveCameraPermission = false;
		const haveMicrophonePermission = await requestMicrophonePermission();
		if (!haveMicrophonePermission) {
			Toast.show({
				type: 'error',
				text1: 'Micro is not available'
			});
			if (!isFromNative) navigation.goBack();
			return;
		}

		if (isVideoCall) {
			haveCameraPermission = await requestCameraPermission();
			if (!haveCameraPermission) {
				Toast.show({
					type: 'error',
					text1: 'Camera is not available'
				});
			}
		}

		setLocalMediaControl({
			camera: haveCameraPermission && isVideoCall,
			mic: true
		});
		return {
			audio: true,
			video: haveCameraPermission && isVideoCall
		};
	};

	const setIsSpeaker = async ({ isSpeaker = false }) => {
		try {
			if (Platform.OS === 'android') {
				const { CustomAudioModule } = NativeModules;
				await CustomAudioModule.setSpeaker(isSpeaker, null);
				InCallManager.setSpeakerphoneOn(isSpeaker);
			} else {
				InCallManager.setSpeakerphoneOn(isSpeaker);
				InCallManager.setForceSpeakerphoneOn(isSpeaker);
			}
			setLocalMediaControl((prev) => ({
				...prev,
				speaker: isSpeaker
			}));
		} catch (error) {
			console.error('Failed to initialize speaker', error);
		}
	};

	const cancelCallFCMMobile = async (receiverId: string = dmUserId) => {
		const bodyFCMMobile = { offer: 'CANCEL_CALL' };
		await mezon.socketRef.current?.makeCallPush(receiverId, JSON.stringify(bodyFCMMobile), channelId, userId);
	};

	const startCall = async (isVideoCall: boolean, isAnswer = false) => {
		try {
			await setIsSpeaker({ isSpeaker: false });
			if (!isAnswer) {
				handleSend(
					{
						t: `${userProfile?.user?.username} started a ${isVideoCall ? 'video' : 'audio'} call`,
						callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.STARTCALL }
					},
					[],
					[],
					[]
				);

				const constraints = await getConstraintsLocal(isVideoCall);
				const stream = await mediaDevices.getUserMedia(constraints);
				// Initialize peer connection
				const pc = initializePeerConnection();

				// Add tracks to peer connection
				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});
				dispatch(audioCallActions.setUserCallId(currentDmGroup?.user_id?.[0]));

				endCallTimeout.current = setTimeout(() => {
					dispatch(
						DMCallActions.updateCallLog({
							channelId,
							content: { t: '', callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.TIMEOUTCALL } }
						})
					);
					handleEndCall({ isCancelGoBack: false });
				}, 30000);

				const offer = await pc.createOffer(sessionConstraints);
				await pc.setLocalDescription(offer);
				const compressedOffer = await compress(JSON.stringify(offer));
				const bodyFCMMobile = {
					offer: compressedOffer,
					callerName,
					callerAvatar,
					callerId: userId,
					channelId
				};
				await mezon.socketRef.current?.makeCallPush(dmUserId, JSON.stringify(bodyFCMMobile), channelId, userId);

				await mezon.socketRef.current?.forwardWebrtcSignaling(
					dmUserId,
					WebrtcSignalingType.WEBRTC_SDP_OFFER,
					compressedOffer,
					channelId,
					userId
				);

				setCallState({
					localStream: stream,
					remoteStream: null
				});
				peerConnection.current = pc;
			} else {
				// if is answer call, need to cancel call native on mobile
				await cancelCallFCMMobile(userId);
			}
		} catch (error) {
			console.error('Error starting call:', error);
			await handleEndCall({ isCancelGoBack: false });
		}
	};

	const handleOffer = async (signalingData: any) => {
		const constraints = await getConstraintsLocal(isVideoCall);
		const stream = await mediaDevices.getUserMedia(constraints);

		const pc = peerConnection?.current || initializePeerConnection();

		if (isVideoCall) {
			await mezon.socketRef.current?.forwardWebrtcSignaling(
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"cameraEnabled": true}`,
				channelId,
				userId
			);
			setLocalMediaControl((prev) => ({
				...prev,
				camera: true
			}));
		}
		stream.getTracks().forEach((track) => {
			pc.addTrack(track, stream);
		});

		await pc.setRemoteDescription(new RTCSessionDescription(signalingData));
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);
		const compressedAnswer = await compress(JSON.stringify(answer));
		await sleep(500); // Wait for the stream to be ready
		await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_ANSWER, compressedAnswer, channelId, userId);

		if (!peerConnection?.current) {
			peerConnection.current = pc;
		}
		setCallState((prev) => ({
			...prev,
			localStream: stream
		}));
	};

	const handleAnswer = async (signalingData: any) => {
		if (!peerConnection?.current) return;
		await peerConnection?.current.setRemoteDescription(new RTCSessionDescription(signalingData));
		if (pendingCandidatesRef?.current?.length > 0) {
			for (const candidateItem of pendingCandidatesRef.current) {
				await mezon.socketRef.current?.forwardWebrtcSignaling(
					dmUserId,
					WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
					JSON.stringify(candidateItem),
					channelId,
					userId
				);
			}
			pendingCandidatesRef.current = [];
		}
	};

	const handleICECandidate = async (data: any) => {
		if (!peerConnection?.current) return;

		try {
			if (data) {
				const candidate = new RTCIceCandidate(data);
				await peerConnection?.current?.addIceCandidate(candidate);
				if (pendingCandidatesRef?.current?.length && peerConnection?.current?.remoteDescription?.type === 'offer') {
					for (const candidateItem of pendingCandidatesRef.current) {
						await mezon.socketRef.current?.forwardWebrtcSignaling(
							dmUserId,
							WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
							JSON.stringify(candidateItem),
							channelId,
							userId
						);
					}
					pendingCandidatesRef.current = [];
				}
			} else {
				console.error('Invalid ICE candidate data:', data);
			}
		} catch (error) {
			console.error('Error adding ICE candidate:', error);
		}
	};

	// Handle incoming signaling messages
	const handleSignalingMessage = async (signalingData: any) => {
		try {
			switch (signalingData.data_type) {
				case WebrtcSignalingType.WEBRTC_SDP_OFFER: {
					const decompressedData = await decompress(signalingData.json_data);
					const offer = safeJSONParse(decompressedData || '{}');
					await handleOffer(offer);

					break;
				}

				case WebrtcSignalingType.WEBRTC_SDP_ANSWER: {
					const decompressedData = await decompress(signalingData.json_data);
					const answer = safeJSONParse(decompressedData || '{}');
					await handleAnswer(answer);

					break;
				}

				case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE: {
					const candidate = safeJSONParse(signalingData?.json_data || '{}');
					await handleICECandidate(candidate);

					break;
				}
			}
		} catch (error) {
			console.error('Error handling signaling message:', error);
		}
	};

	const handleEndCall = async ({ isCancelGoBack = false, isCallerEndCall = false }: { isCancelGoBack?: boolean; isCallerEndCall?: boolean }) => {
		try {
			stopDialTone();
			playEndCall();
			stopAllTracks();

			if (Platform.OS === 'ios') {
				RNCallKeep.endAllCalls();
			}
			if (peerConnection?.current) {
				peerConnection?.current.close();
			}
			if (!isCallerEndCall) {
				await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_QUIT, '', channelId, userId);
			}
			dispatch(DMCallActions.removeAll());
			dispatch(audioCallActions.setUserCallId(''));
			dispatch(DMCallActions.setIsInCall(false));
			if (timeStartConnected?.current) {
				let timeCall = '';
				const startTime = new Date(timeStartConnected.current);
				const endTime = new Date();
				const diffMs = endTime.getTime() - startTime.getTime();
				const diffMins = Math.floor(diffMs / 60000);
				const diffSecs = Math.floor((diffMs % 60000) / 1000);
				timeCall = `${diffMins} mins ${diffSecs} secs`;
				await dispatch(
					DMCallActions.updateCallLog({
						channelId: channelId,
						content: {
							t: timeCall,
							callLog: {
								isVideo: isVideoCall,
								callLogType: IMessageTypeCallLog.FINISHCALL
							}
						}
					})
				);
			} else {
				cancelCallFCMMobile();
			}
			setCallState({
				localStream: null,
				remoteStream: null
			});
			peerConnection.current = null;
			if (!isCancelGoBack) {
				if (isFromNative) {
					InCallManager.stop();
					BackHandler.exitApp();
					return;
				}
				navigation.goBack();
			}
		} catch (error) {
			console.error('Error ending call:', error);
		}
	};

	const toggleAudio = async () => {
		if (!callState.localStream) return;
		const haveMicrophonePermission = await requestMicrophonePermission();
		if (haveMicrophonePermission) {
			const audioTracks = callState.localStream.getAudioTracks();
			audioTracks.forEach((track) => {
				track.enabled = !track.enabled;
			});
			await mezon.socketRef.current?.forwardWebrtcSignaling(
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"micEnabled": ${!localMediaControl.mic}}`,
				channelId,
				userId
			);
			setLocalMediaControl((prev) => ({
				...prev,
				mic: !prev.mic
			}));
		} else {
			Toast.show({
				type: 'error',
				text1: 'Micro is not available'
			});
		}
	};

	const toggleVideo = async () => {
		if (!callState.localStream) return;

		const haveCameraPermission = await requestCameraPermission();
		if (!haveCameraPermission) {
			Toast.show({
				type: 'error',
				text1: 'Camera is not available'
			});
			return;
		}

		const videoTracks = callState.localStream?.getVideoTracks();
		const isCameraOn = videoTracks?.length > 0;

		try {
			if (!isCameraOn) {
				const videoStream = await mediaDevices.getUserMedia({ audio: localMediaControl.mic, video: true });
				const videoTrack = videoStream.getVideoTracks()[0];

				videoTrack.enabled = !localMediaControl?.camera;

				videoStream.getTracks()?.forEach((track) => {
					peerConnection?.current?.addTrack(track, videoStream);
				});
				callState.localStream.addTrack(videoTrack);
			} else {
				videoTracks.forEach((track) => {
					track.enabled = !track?.enabled;
				});
			}
			await mezon.socketRef.current?.forwardWebrtcSignaling(
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"cameraEnabled": ${!localMediaControl.camera}}`,
				channelId,
				userId
			);
			// Renegotiation needed when adding video track to voice call
			if (peerConnection?.current) {
				// Create new offer with video track
				const offer = await peerConnection.current.createOffer(sessionConstraints);
				await peerConnection.current.setLocalDescription(offer);

				// Send new offer to remote peer
				const compressedOffer = await compress(JSON.stringify(offer));
				await mezon.socketRef.current?.forwardWebrtcSignaling(
					dmUserId,
					WebrtcSignalingType.WEBRTC_SDP_OFFER,
					compressedOffer,
					channelId,
					userId
				);
			}
			setLocalMediaControl((prev) => ({
				...prev,
				camera: !prev.camera
			}));
		} catch (error) {
			console.error('Error toggling video:', error);
		}
	};

	const playEndCall = () => {
		Sound.setCategory('Playback');
		const sound = new Sound('endcall.mp3', Sound.MAIN_BUNDLE, (error) => {
			if (error) {
				console.error('failed to load the sound', error);
				return;
			}
			sound.play((success) => {
				if (!success) {
					console.error('Sound playback failed');
				}
			});
		});
	};

	const stopDialTone = () => {
		try {
			AudioModule.stopDialtone();
		} catch (e) {
			console.error('Failed to stop dialtone', e);
		}
	};

	const toggleSpeaker = async () => {
		try {
			await setIsSpeaker({ isSpeaker: !localMediaControl.speaker });
		} catch (error) {
			console.error('Failed to toggle speaker', error);
		}
	};

	const switchCamera = async () => {
		try {
			const videoTracks = callState.localStream?.getVideoTracks() || [];
			const audioTracks = callState.localStream?.getAudioTracks() || [];
			if (!videoTracks?.length) return;

			const currentFacing = videoTracks?.[0]?.getSettings()?.facingMode;
			const newStream = await mediaDevices.getUserMedia({
				video: { facingMode: { exact: currentFacing === 'user' ? 'environment' : 'user' } }
			});

			const newVideoTrack = newStream?.getVideoTracks()?.[0];
			if (newVideoTrack) {
				const sender = peerConnection?.current?.getSenders()?.find((s) => s?.track?.kind === 'video');
				await sender?.replaceTrack(newVideoTrack);

				videoTracks?.[0]?.stop();
				callState?.localStream?.removeTrack(videoTracks?.[0]);
				callState?.localStream?.addTrack(newVideoTrack);

				setCallState((prev) => ({
					...prev,
					localStream: new MediaStream([...audioTracks, newVideoTrack])
				}));

				return true;
			}
		} catch (error) {
			console.error('Switch camera failed:', error);
		}
	};

	const handleToggleIsConnected = (isConnected: boolean) => {
		setIsConnected(isConnected);
	};

	return {
		callState,
		localMediaControl,
		timeStartConnected,
		isConnected,
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		toggleSpeaker,
		switchCamera,
		handleSignalingMessage,
		handleToggleIsConnected
	};
}
