import { mediaDevices, MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from '@livekit/react-native-webrtc';
import { useChatSending } from '@mezon/core';
import { ActionEmitEvent, sessionConstraints } from '@mezon/mobile-components';
import { audioCallActions, DMCallActions, RootState, selectAllAccount, selectDmGroupCurrent, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload } from '@mezon/utils';
import { IMessageTypeCallLog, sleep } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse, WebrtcSignalingType } from 'mezon-js';
import type { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, DeviceEventEmitter, Linking, NativeModules, Platform } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import Sound from 'react-native-sound';
import { useSelector } from 'react-redux';
import { compress, decompress } from '../utils/helpers';
import NotificationPreferences from '../utils/NotificationPreferences';
import { usePermission } from './useRequestPermission';

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
	const endCallTimeout = useRef<NodeJS.Timeout | null>(null);
	const timeStartConnected = useRef<any>(null);
	const [localMediaControl, setLocalMediaControl] = useState<MediaControl>({
		mic: false,
		camera: false,
		speaker: false
	});
	const [isConnected, setIsConnected] = useState<boolean | null>(null);
	const [candidateCache, setCandidateCache] = useState(null);
	const pendingCandidatesRef = useRef<(RTCIceCandidate | null)[]>([]);
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode });
	const userProfile = useSelector(selectAllAccount);
	const sessionUser = useSelector((state: RootState) => state.auth?.session);
	const dialToneRef = useRef<Sound | null>(null);
	const trackEventTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const hasSyncRemoteMediaRef = useRef<boolean>(false);

	const playDialToneIOS = () => {
		Sound.setCategory('Playback');
		const sound = new Sound('dialtone.mp3', Sound.MAIN_BUNDLE, (error) => {
			if (error) {
				console.error('failed to load the sound', error);
				return;
			}
			sound.play((success) => {
				if (!success) {
					console.error('Sound playback failed');
				}
			});
			sound.setNumberOfLoops(-1);
			dialToneRef.current = sound;
		});
	};

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

	useEffect(() => {
		if (isConnected && !hasSyncRemoteMediaRef?.current) {
			mezon.socketRef.current?.forwardWebrtcSignaling(
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"cameraEnabled": ${localMediaControl.camera}, "micEnabled": ${localMediaControl.mic}}`,
				channelId,
				userId
			);
			hasSyncRemoteMediaRef.current = true;
		}
	}, [channelId, dmUserId, isConnected, localMediaControl?.camera, localMediaControl?.mic, mezon?.socketRef, userId]);

	const clearUpStorageCalling = async () => {
		if (Platform.OS === 'android') {
			if (!isFromNative) {
				await NotificationPreferences.clearValue('notificationDataCalling');
			}
		} else {
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
			if (trackEventTimeoutRef.current) {
				clearTimeout(trackEventTimeoutRef.current);
			}

			trackEventTimeoutRef.current = setTimeout(() => {
				const newStream = new MediaStream();
				if (event.streams[0]) {
					event.streams[0].getTracks().forEach((track) => {
						newStream.addTrack(track);
					});

					setCallState((prev) => ({
						...prev,
						remoteStream: newStream as MediaStream
					}));
				}
				trackEventTimeoutRef.current = null;
			}, 500); // 500 ms delay to collect all tracks
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
				handleEndCall({});
			}
		});

		return pc;
	}, [callState, mezon.socketRef, dmUserId, channelId, userId]);

	const alertPermission = (type: string) => {
		Alert.alert(`${type} is not available`, `Allow Mezon access to your ${type}`, [
			{
				text: 'Cancel',
				style: 'cancel'
			},
			{
				text: 'OK',
				onPress: () => {
					try {
						if (Platform.OS === 'ios') {
							Linking.openURL('app-settings:');
						} else {
							Linking.openSettings();
						}
					} catch (error) {
						console.error('Error opening app settings:', error);
					}
				}
			}
		]);
	};

	const getConstraintsLocal = async (isVideoCall = false) => {
		let haveCameraPermission = false;
		const haveMicrophonePermission = await requestMicrophonePermission();
		if (!haveMicrophonePermission) {
			alertPermission('Microphone');
			await handleEndCall({});
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			return;
		}

		if (isVideoCall) {
			haveCameraPermission = await requestCameraPermission();
			if (!haveCameraPermission) {
				alertPermission('Camera');
			}
		}
		setLocalMediaControl((prev) => ({
			...prev,
			camera: haveCameraPermission && isVideoCall,
			mic: true
		}));
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
				const constraints = await getConstraintsLocal(isVideoCall);
				const stream = await mediaDevices.getUserMedia(constraints);
				handleSend(
					{
						t: `${userProfile?.user?.username} started a ${isVideoCall ? 'video' : 'audio'} call`,
						callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.STARTCALL }
					},
					[],
					[],
					[]
				);
				// Initialize peer connection
				const pc = initializePeerConnection();

				// Add tracks to peer connection
				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});
				dispatch(audioCallActions.setUserCallId(currentDmGroup?.user_ids?.[0]));

				endCallTimeout.current = setTimeout(() => {
					dispatch(
						DMCallActions.updateCallLog({
							channelId,
							content: { t: '', callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.TIMEOUTCALL } }
						})
					);
					handleEndCall({});
				}, 30000);

				const offer = await pc.createOffer(sessionConstraints);
				await pc.setLocalDescription(offer);
				const compressedOffer = await compress(JSON.stringify({ ...offer, callerName, callerAvatar }));
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
				setLocalMediaControl((prev) => ({
					...prev,
					camera: !!constraints?.video
				}));
				peerConnection.current = pc;
				if (isVideoCall && constraints?.video) {
					await mezon.socketRef.current?.forwardWebrtcSignaling(
						dmUserId,
						WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
						`{"cameraEnabled": ${true}}`,
						channelId,
						userId
					);
				}
			} else {
				// if is answer call, need to cancel call native on mobile
				await cancelCallFCMMobile(userId);
			}
		} catch (error) {
			console.error('Error starting call:', error);
			await handleEndCall({});
		}
	};

	const handleOffer = async (signalingData: any) => {
		const pc = peerConnection?.current || initializePeerConnection();

		if (!callState?.localStream) {
			const constraints = await getConstraintsLocal(localMediaControl.camera);
			const stream = await mediaDevices.getUserMedia(constraints);
			stream.getTracks().forEach((track) => {
				pc.addTrack(track, stream);
			});
			setCallState((prev) => ({
				...prev,
				localStream: stream
			}));
		}
		if (localMediaControl.camera || isVideoCall) {
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
		await pc.setRemoteDescription(new RTCSessionDescription(signalingData));
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);
		const compressedAnswer = await compress(JSON.stringify(answer));
		await sleep(500); // Wait for the stream to be ready
		await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_ANSWER, compressedAnswer, channelId, userId);

		if (!peerConnection?.current) {
			peerConnection.current = pc;
		}
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

	const handleICECandidate = async (candidate: any) => {
		if (!peerConnection?.current) return;
		const data = candidate || candidateCache;
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
					if (isFromNative) {
						setCandidateCache(candidate);
					} else {
						await handleICECandidate(candidate);
					}

					break;
				}
			}
		} catch (error) {
			console.error('Error handling signaling message:', error);
		}
	};

	const handleEndCall = async ({ isCallerEndCall = false }: { isCallerEndCall?: boolean }) => {
		try {
			stopDialTone();
			playEndCall();
			stopAllTracks();
			if (peerConnection?.current) {
				peerConnection?.current.close();
			}
			dispatch(audioCallActions.reset());
			dispatch(DMCallActions.removeAll());
			dispatch(DMCallActions.setIsInCall(false));
			if (!isCallerEndCall) {
				await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_QUIT, '', channelId, userId);
			}
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
						channelId,
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
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			if (isFromNative) {
				try {
					InCallManager.stop();
					NativeModules?.DeviceUtils?.killApp();
					BackHandler.exitApp();
				} catch (e) {
					console.error('log  => onKillApp', e);
					BackHandler.exitApp();
				}
				return;
			}
		} catch (error) {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			if (isFromNative) {
				try {
					InCallManager.stop();
					NativeModules?.DeviceUtils?.killApp();
					BackHandler.exitApp();
				} catch (e) {
					console.error('log  => onKillApp', e);
					BackHandler.exitApp();
				}
			}
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
			alertPermission('Microphone');
		}
	};

	const toggleVideo = async () => {
		if (!callState.localStream) return;

		const haveCameraPermission = await requestCameraPermission();
		if (!haveCameraPermission) {
			alertPermission('Camera');
			return;
		}

		const videoTracks = callState.localStream?.getVideoTracks();
		const isCameraOn = videoTracks?.length > 0;

		try {
			if (!isCameraOn) {
				const videoStream = await mediaDevices.getUserMedia({
					audio: false,
					video: true
				});
				const audioTracks = callState.localStream.getAudioTracks();
				const newVideoTrack = videoStream.getVideoTracks()[0];

				newVideoTrack.enabled = true;
				if (newVideoTrack) {
					callState.localStream.addTrack(newVideoTrack);
					peerConnection.current.addTrack(newVideoTrack, callState.localStream);
					setCallState((prev) => ({
						...prev,
						localStream: new MediaStream([...audioTracks, newVideoTrack])
					}));
				}
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
			if (peerConnection?.current && !isCameraOn) {
				const offer = await peerConnection.current.createOffer(sessionConstraints);
				await peerConnection.current.setLocalDescription(offer);
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
			if (Platform.OS === 'android') {
				const { AudioSessionModule } = NativeModules;
				AudioSessionModule.stopDialTone();
			} else {
				if (dialToneRef.current) {
					dialToneRef.current.pause();
					dialToneRef.current.stop();
					dialToneRef.current.release();
					dialToneRef.current = null;
				}
			}
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
		candidateCache,
		peerConnection,
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		toggleSpeaker,
		switchCamera,
		handleSignalingMessage,
		handleToggleIsConnected,
		playDialToneIOS,
		handleICECandidate
	};
}
