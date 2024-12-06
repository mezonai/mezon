import { useAuth, useChatSending } from '@mezon/core';
import { ActionEmitEvent, sessionConstraints } from '@mezon/mobile-components';
import { DMCallActions, selectDmGroupCurrent, useAppDispatch } from '@mezon/store';
import { RootState, audioCallActions } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { IMessageSendPayload, IMessageTypeCallLog } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { deflate, inflate } from 'react-native-gzip';
import InCallManager from 'react-native-incall-manager';
import Sound from 'react-native-sound';
import Toast from 'react-native-toast-message';
import { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';
import { useSelector } from 'react-redux';
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
	peerConnection: RTCPeerConnection | null;
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

type IProps = { dmUserId: string; channelId: string; userId: string; isVideoCall: boolean; callerName: string; callerAvatar: string };

export function useWebRTCCallMobile({ dmUserId, channelId, userId, isVideoCall, callerName, callerAvatar }: IProps) {
	const [callState, setCallState] = useState<CallState>({
		localStream: null,
		remoteStream: null,
		peerConnection: null,
		storedIceCandidates: null
	});
	const { requestMicrophonePermission, requestCameraPermission } = usePermission();
	const mezon = useMezon();
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const endCallTimeout = useRef<NodeJS.Timeout | null>(null);
	const timeStartConnected = useRef<any>(null);
	const [localMediaControl, setLocalMediaControl] = useState<MediaControl>({
		mic: false,
		camera: !!isVideoCall,
		speaker: false
	});
	const dialToneRef = useRef<Sound | null>(null);
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
		return () => {
			endCallTimeout.current && clearTimeout(endCallTimeout.current);
			endCallTimeout.current = null;
			timeStartConnected.current = null;
			stopAllTracks();
		};
	}, [stopAllTracks]);

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
				await mezon.socketRef.current?.forwardWebrtcSignaling(
					dmUserId,
					WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
					JSON.stringify(event.candidate),
					'',
					userId
				);
			}
		});

		pc.addEventListener('track', (event) => {
			event?.streams[0]?.getVideoTracks()?.forEach((track) => {
				track.addEventListener('mute', () => {
					dispatch(audioCallActions.setIsRemoteVideo(false));
				});
				track.addEventListener('unmute', () => {
					dispatch(audioCallActions.setIsRemoteVideo(true));
				});
			});
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
				mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, 0, '', channelId, userId);
				Toast.show({
					type: 'info',
					text1: 'Connection connected'
				});
				stopDialTone();
			}
			if (pc.iceConnectionState === 'checking') {
				endCallTimeout?.current && clearTimeout(endCallTimeout.current);
				stopDialTone();
			}
			if (pc.iceConnectionState === 'disconnected') {
				Toast.show({
					type: 'error',
					text1: 'Connection disconnected'
				});
				handleEndCall({ isCancelGoBack: false });
			}
		});

		return pc;
	}, [mezon.socketRef, dmUserId, userId]);

	const startCall = async (isVideoCall: boolean, isAnswerCall = false) => {
		try {
			if (!isAnswerCall) {
				handleSend(
					{
						t: `${userProfile?.user?.username} started a ${isVideoCall ? 'video' : 'audio'} call`,
						callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.STARTCALL }
					},
					[],
					[],
					[]
				);
				endCallTimeout.current = setTimeout(() => {
					dispatch(
						DMCallActions.updateCallLog({
							channelId,
							content: { t: '', callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.TIMEOUTCALL } }
						})
					);
					handleEndCall({ isCancelGoBack: false });
				}, 60000);
			}
			InCallManager.start({ media: 'audio' });
			playDialTone();
			const haveMicrophonePermission = await requestMicrophonePermission();
			if (!haveMicrophonePermission) {
				Toast.show({
					type: 'error',
					text1: 'Micro is not available'
				});
				navigation.goBack();
				return;
			} else {
				setLocalMediaControl((prev) => ({
					...prev,
					mic: true
				}));
			}
			dispatch(audioCallActions.setUserCallId(currentDmGroup?.user_id?.[0]));
			let haveCameraPermission;
			if (isVideoCall) {
				haveCameraPermission = await requestCameraPermission();
				if (!haveCameraPermission) {
					Toast.show({
						type: 'error',
						text1: 'Camera is not available'
					});
				} else {
					setLocalMediaControl((prev) => ({
						...prev,
						camera: true
					}));
				}
			}
			const stream = await mediaDevices.getUserMedia({
				audio: true,
				video: isVideoCall && haveCameraPermission
			});
			const pc = initializePeerConnection();

			// Add tracks to peer connection
			stream.getTracks().forEach((track) => {
				pc.addTrack(track, stream);
			});
			// Create and set local description
			const offer = await pc.createOffer(sessionConstraints);
			await pc.setLocalDescription(offer);

			// Update state
			setCallState({
				localStream: stream,
				remoteStream: null,
				peerConnection: pc
			});
			// Send offer through signaling server
			const compressedOffer = await compress(JSON.stringify(offer));
			if (!isAnswerCall) {
				const bodyFCMMobile = {
					offer: compressedOffer,
					callerName,
					callerAvatar,
					callerId: userId,
					channelId
				};
				await mezon.socketRef.current?.makeCallPush(dmUserId, JSON.stringify(bodyFCMMobile), channelId, userId);
			}
			await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_OFFER, compressedOffer, channelId, userId);
		} catch (error) {
			console.error('Error starting call:', error);
			handleEndCall({ isCancelGoBack: false });
		}
	};

	// Handle incoming signaling messages
	const handleSignalingMessage = async (signalingData: any) => {
		if (!callState.peerConnection) return;

		try {
			switch (signalingData.data_type) {
				case WebrtcSignalingType.WEBRTC_SDP_OFFER: {
					const decompressedData = await decompress(signalingData.json_data);
					const offer = safeJSONParse(decompressedData || '{}');

					await callState.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
					const answer = await callState.peerConnection.createAnswer();
					await callState.peerConnection.setLocalDescription(answer);

					const compressedAnswer = await compress(JSON.stringify(answer));
					await mezon.socketRef.current?.forwardWebrtcSignaling(
						dmUserId,
						WebrtcSignalingType.WEBRTC_SDP_ANSWER,
						compressedAnswer,
						channelId,
						userId
					);

					// Add stored ICE candidates
					if (callState.storedIceCandidates) {
						for (const candidate of callState.storedIceCandidates) {
							await callState.peerConnection.addIceCandidate(candidate);
						}
						callState.storedIceCandidates = [];
					}
					break;
				}

				case WebrtcSignalingType.WEBRTC_SDP_ANSWER: {
					const decompressedData = await decompress(signalingData.json_data);
					const answer = safeJSONParse(decompressedData || '{}');
					await callState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
					// Add stored ICE candidates
					if (callState.storedIceCandidates) {
						for (const candidate of callState.storedIceCandidates) {
							await callState.peerConnection.addIceCandidate(candidate);
						}
						callState.storedIceCandidates = [];
					}
					break;
				}

				case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE: {
					const candidate = safeJSONParse(signalingData?.json_data || '{}');
					if (candidate) {
						if (callState.peerConnection.remoteDescription) {
							await callState.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
						} else {
							console.warn('Remote description not set yet, storing candidate');
							if (!callState.storedIceCandidates) {
								callState.storedIceCandidates = [];
							}
							callState.storedIceCandidates.push(new RTCIceCandidate(candidate));
							// Store the candidate to be added later
							// You can implement a mechanism to store and add candidates later
						}
					}
					break;
				}
			}
		} catch (error) {
			console.error('Error handling signaling message:', error);
		}
	};

	const handleEndCall = async ({ isCancelGoBack = false }: { isCancelGoBack?: boolean }) => {
		try {
			stopDialTone();
			playEndCall();
			stopAllTracks();

			if (callState.peerConnection) {
				callState.peerConnection.close();
			}
			await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, 4, '', channelId, userId);
			dispatch(DMCallActions.removeAll());
			dispatch(audioCallActions.setUserCallId(''));
			DeviceEventEmitter.emit(ActionEmitEvent.ON_SET_STATUS_IN_CALL, { status: false });
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
			}
			setCallState({
				localStream: null,
				remoteStream: null,
				peerConnection: null
			});
			if (!isCancelGoBack) {
				navigation.goBack();
			}
		} catch (error) {
			console.error('Error ending call:', error);
		}
	};

	const toggleAudio = async () => {
		if (callState.localStream) {
			const haveMicrophonePermission = await requestMicrophonePermission();
			// check if permission is granted, if not call request permission
			if (haveMicrophonePermission) {
				const audioTracks = callState.localStream.getAudioTracks();
				if (audioTracks.length === 0) {
					try {
						const audioStream = await mediaDevices.getUserMedia({ audio: true });
						const audioTrack = audioStream.getAudioTracks()[0];
						audioTrack.enabled = true;
						callState.localStream.addTrack(audioTrack);
						const senders = callState.peerConnection?.getSenders() || [];
						const audioSender = senders.find((sender) => sender.track?.kind === 'audio');
						if (audioSender) {
							await audioSender.replaceTrack(audioTrack);
						} else {
							callState.peerConnection?.addTrack(audioTrack, callState.localStream);
						}
					} catch (error) {
						console.error('Error adding video track:', error);
					}
				} else {
					const senders = callState.peerConnection?.getSenders() || [];
					const audioSender = senders.find((sender) => sender.track?.kind === 'audio');
					audioTracks.forEach((track) => {
						track.enabled = !track.enabled;
					});
					if (audioSender && audioTracks[0]) {
						await audioSender.replaceTrack(audioTracks[0]);
					} else if (audioTracks[0]) {
						callState.peerConnection?.addTrack(audioTracks[0], callState.localStream);
					} else {
						/* empty */
					}
				}
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
				const videoStream = await mediaDevices.getUserMedia({ video: true });
				const videoTrack = videoStream.getVideoTracks()[0];

				videoTrack.enabled = !localMediaControl?.camera;

				videoStream.getTracks()?.forEach((track) => {
					callState.peerConnection?.addTrack(track, videoStream);
				});
				callState.localStream.addTrack(videoTrack);

				await updatePeerConnectionOffer();
			} else {
				videoTracks.forEach((track) => {
					track.enabled = !track?.enabled;
				});
			}

			setLocalMediaControl((prev) => ({
				...prev,
				camera: !prev.camera
			}));
		} catch (error) {
			console.error('Error toggling video:', error);
		}
	};

	const updatePeerConnectionOffer = async () => {
		try {
			const offer = await callState.peerConnection?.createOffer(sessionConstraints);
			await callState.peerConnection?.setLocalDescription(offer);

			const compressedOffer = await compress(JSON.stringify(offer));
			await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_OFFER, compressedOffer, channelId, userId);
		} catch (error) {
			console.error('Error creating and forwarding offer:', error);
		}
	};

	const playDialTone = () => {
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
		if (dialToneRef.current) {
			dialToneRef.current.pause();
			dialToneRef.current.stop();
			dialToneRef.current.release();
			dialToneRef.current = null;
		}
	};

	const toggleSpeaker = () => {
		try {
			InCallManager.setSpeakerphoneOn(!localMediaControl.speaker);
			setLocalMediaControl((prev) => ({
				...prev,
				speaker: !prev.speaker
			}));
		} catch (error) {
			console.error('Failed to toggle speaker', error);
		}
	};

	return {
		callState,
		localMediaControl,
		timeStartConnected,
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		toggleSpeaker,
		handleSignalingMessage
	};
}
