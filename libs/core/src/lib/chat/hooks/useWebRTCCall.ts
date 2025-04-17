import {
	audioCallActions,
	DMCallActions,
	selectAudioBusyTone,
	selectIsShowMeetDM,
	selectIsShowShareScreen,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { IMessageTypeCallLog, requestMediaPermission } from '@mezon/utils';
import isElectron from 'is-electron';
import { safeJSONParse, WebrtcSignalingType } from 'mezon-js';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const STUN_SERVERS = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{
		urls: process.env.NX_WEBRTC_ICESERVERS_URL as string,
		username: process.env.NX_WEBRTC_ICESERVERS_USERNAME,
		credential: process.env.NX_WEBRTC_ICESERVERS_CREDENTIAL
	}
];

const RTCConfig = {
	iceServers: STUN_SERVERS,
	iceCandidatePoolSize: 10
};

interface CallState {
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	localScreenStream: MediaStream | null;
	remoteScreenStream: MediaStream | null;
	storedIceCandidates?: RTCIceCandidate[] | null;
}
interface ControlState {
	cameraEnabled: boolean;
	micEnabled: boolean;
}

// Todo: move to utils
const compress = async (str: string, encoding = 'gzip' as CompressionFormat) => {
	const byteArray = new TextEncoder().encode(str);
	const cs = new CompressionStream(encoding);
	const writer = cs.writable.getWriter();
	writer.write(byteArray);
	writer.close();
	const arrayBuffer = await new Response(cs.readable).arrayBuffer();
	return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
};

// Todo: move to utils
const decompress = async (compressedStr: string, encoding = 'gzip' as CompressionFormat) => {
	const binaryString = atob(compressedStr);
	const byteArray = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		byteArray[i] = binaryString.charCodeAt(i);
	}

	const cs = new DecompressionStream(encoding);
	const writer = cs.writable.getWriter();
	writer.write(byteArray);
	writer.close();

	const arrayBuffer = await new Response(cs.readable).arrayBuffer();
	return new TextDecoder().decode(arrayBuffer);
};
interface IWebRTCCallParams {
	dmUserId: string;
	channelId: string;
	userId: string;
	callerName: string;
	callerAvatar: string;
	isInChannelCalled: boolean;
}

export function useWebRTCCall({ dmUserId, channelId, userId, callerName, callerAvatar, isInChannelCalled }: IWebRTCCallParams) {
	const getScreen = async () => {
		const screenSources = await window.electron.getScreenSources('screen');
		return screenSources[0];
	};
	const [callState, setCallState] = useState<CallState>({
		localStream: null,
		remoteStream: null,
		localScreenStream: null,
		remoteScreenStream: null,
		storedIceCandidates: null
	});
	const [controlState, setControlState] = useState<ControlState>({
		cameraEnabled: false,
		micEnabled: true
	});
	const peerConnection = useRef<RTCPeerConnection | null>(null);
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const isShowScreen = useSelector(selectIsShowShareScreen);
	const [pendingCandidates, setPendingCandidates] = useState<(RTCIceCandidate | null)[]>([]);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const mezon = useMezon();
	const dispatch = useAppDispatch();
	const timeStartConnected = useRef<Date | null>(null);
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const localScreenVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const remoteScreenVideoRef = useRef<HTMLVideoElement>(null);

	const callTimeout = useRef<NodeJS.Timeout | null>(null);
	const [audioInputDevicesList, setAudioInputDevicesList] = useState<MediaDeviceInfo[]>([]);
	const [audioOutputDevicesList, setAudioOutputDevicesList] = useState<MediaDeviceInfo[]>([]);
	const [currentInputDevice, setCurrentInputDevice] = useState<MediaDeviceInfo | null>(null);
	const [currentOutputDevice, setCurrentOutputDevice] = useState<MediaDeviceInfo | null>(null);

	useEffect(() => {
		return () => {
			if (callState.localStream) {
				callState.localStream.getTracks().forEach((track) => track.stop());
			}
			timeStartConnected.current = null;
		};
	}, [callState.localStream]);

	// Initialize peer connection with proper configuration
	const initializePeerConnection = () => {
		const pc = new RTCPeerConnection(RTCConfig);

		pc.onicecandidate = async (event) => {
			if (event.candidate) {
				setPendingCandidates((prev) => [...prev, event.candidate]);
			}
		};

		pc.ontrack = (event) => {
			const remoteStream = event.streams[0];
			remoteStream.getVideoTracks().forEach((track) => {
				if (isScreenTrack(track)) {
					if (remoteScreenVideoRef.current) {
						remoteScreenVideoRef.current.srcObject = remoteStream;
						setCallState((prev) => ({
							...prev,
							remoteScreenStream: remoteStream
						}));
					}
				} else {
					if (remoteVideoRef.current) {
						remoteVideoRef.current.srcObject = remoteStream;
						setCallState((prev) => ({
							...prev,
							remoteStream: remoteStream
						}));
					}
				}
			});

			remoteStream.getAudioTracks().forEach((track) => {
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = remoteStream;
					setCallState((prev) => ({
						...prev,
						remoteStream: remoteStream
					}));
				}
			});
		};

		pc.oniceconnectionstatechange = async () => {
			if (pc.iceConnectionState === 'connected') {
				timeStartConnected.current = new Date();
				dispatch(toastActions.addToast({ message: 'Connection connected', type: 'success', autoClose: 3000 }));
				dispatch(audioCallActions.setIsJoinedCall(true));
				dispatch(audioCallActions.setIsDialTone(false));
				await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_INIT, '', channelId, userId);
				await cancelCallFCMMobile();
				if (callTimeout.current) {
					clearTimeout(callTimeout.current);
					callTimeout.current = null;
				}
			}

			if (pc.iceConnectionState === 'disconnected') {
				dispatch(toastActions.addToast({ message: 'Connection disconnected', type: 'warning', autoClose: 3000 }));
				dispatch(audioCallActions.setIsJoinedCall(false));
				handleEndCall();
				if (callTimeout.current) {
					clearTimeout(callTimeout.current);
					callTimeout.current = null;
				}
			}
		};

		return pc;
	};

	const isScreenTrack = (track: MediaStreamTrack | null) => {
		return track?.kind === 'video' && (track?.label.toLowerCase().includes('screen') || track?.label.toLowerCase().includes('window'));
	};

	const getConstraintsLocal = async () => {
		let permissionCameraGranted = false;
		let permissionMicroGranted = false;

		const microphoneGranted = await requestMediaPermission('audio');
		const cameraGranted = await requestMediaPermission('video');
		if (cameraGranted === 'granted') {
			permissionCameraGranted = true;
		}
		if (microphoneGranted !== 'granted') {
			dispatch(
				toastActions.addToast({
					message: 'Microphone permission is required',
					type: 'warning',
					autoClose: 1000
				})
			);
			handleEndCall();
			return;
		} else {
			permissionMicroGranted = true;
			const devices = await navigator.mediaDevices.enumerateDevices();
			const outputDevices = devices.filter((device) => device.kind === 'audiooutput');
			const inputDevices = devices.filter((device) => device.kind === 'audioinput');

			setAudioInputDevicesList(inputDevices);
			setAudioOutputDevicesList(outputDevices);
			setCurrentInputDevice(inputDevices[0] || null);
			setCurrentOutputDevice(outputDevices[0] || null);
		}

		return {
			audio: permissionMicroGranted,
			video: permissionCameraGranted
		};
	};

	const startCall = async (isVideoCall: boolean, isAnswer: boolean) => {
		try {
			callTimeout?.current && clearTimeout(callTimeout.current);
			if (!isAnswer) {
				const constraints = await getConstraintsLocal();
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				const pc = initializePeerConnection();
				if (isVideoCall) {
					await mezon.socketRef.current?.forwardWebrtcSignaling(
						dmUserId,
						WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
						`{"cameraEnabled": true}`,
						channelId,
						userId
					);
					setControlState((prev) => ({
						...prev,
						cameraEnabled: true
					}));
				}

				stream?.getVideoTracks()?.forEach?.((track) => {
					track.enabled = isVideoCall;
				});
				// Add tracks to peer connection
				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});
				// Create and set local description
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);
				// Send offer through signaling server
				const compressedOffer = await compress(JSON.stringify(offer));
				await mezon.socketRef.current?.forwardWebrtcSignaling(
					dmUserId,
					WebrtcSignalingType.WEBRTC_SDP_OFFER,
					compressedOffer,
					channelId,
					userId
				);
				const bodyFCMMobile = {
					offer: compressedOffer,
					callerName,
					callerAvatar,
					callerId: userId,
					channelId
				};
				await mezon.socketRef.current?.makeCallPush(dmUserId, JSON.stringify(bodyFCMMobile), channelId, userId);
				// Start a 30-second timeout to end the call if no answer
				callTimeout.current = setTimeout(() => {
					dispatch(
						toastActions.addToast({
							message: 'The recipient did not answer the call.',
							type: 'warning',
							autoClose: 3000
						})
					);
					dispatch(
						DMCallActions.updateCallLog({
							channelId,
							content: { t: '', callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.TIMEOUTCALL } }
						})
					);
					console.error('Error starting callTimeoutcallTimeoutcallTimeout');
					handleEndCall();
				}, 30000);
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				// Update state
				setCallState({
					localStream: stream,
					remoteStream: null,
					localScreenStream: null,
					remoteScreenStream: null
				});
				peerConnection.current = pc;
			}
		} catch (error) {
			console.error('Error starting call:', error);
			handleEndCall();
		}
	};

	// Handle offer
	const handleOffer = async (signalingData: any) => {
		const constraints = await getConstraintsLocal();
		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		const pc = peerConnection?.current || initializePeerConnection();

		if (isShowMeetDM) {
			await mezon.socketRef.current?.forwardWebrtcSignaling(
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"cameraEnabled": true}`,
				channelId,
				userId
			);
			setControlState((prev) => ({
				...prev,
				cameraEnabled: true
			}));
		}
		stream?.getVideoTracks()?.forEach?.((track) => {
			track.enabled = isShowMeetDM;
		});

		stream.getTracks().forEach((track) => {
			pc.addTrack(track, stream);
		});

		const offer = new RTCSessionDescription({
			type: 'offer',
			sdp: signalingData.sdp
		});

		await pc.setRemoteDescription(offer);

		// Create and send answer
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);
		const compressedAnswer = await compress(JSON.stringify(answer));
		await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_ANSWER, compressedAnswer, channelId, userId);
		if (localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		}

		if (!peerConnection?.current) {
			peerConnection.current = pc;
		}
		// Update state
		setCallState({
			localStream: stream,
			remoteStream: null,
			localScreenStream: null,
			remoteScreenStream: null
		});
	};

	const handleAnswer = async (signalingData: any) => {
		if (!peerConnection?.current) return;

		const answer = new RTCSessionDescription({
			type: 'answer',
			sdp: signalingData.sdp
		});
		await peerConnection?.current.setRemoteDescription(answer);
		if (pendingCandidates) {
			await mezon.socketRef.current?.forwardWebrtcSignaling(
				dmUserId,
				WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
				JSON.stringify(pendingCandidates?.[pendingCandidates?.length - 1]),
				channelId,
				userId
			);
		}

		setPendingCandidates([]);
	};

	const handleICECandidate = async (data: any) => {
		if (!peerConnection?.current) return;
		try {
			if (data) {
				const candidate = new RTCIceCandidate(data);
				await peerConnection?.current?.addIceCandidate(candidate);

				if (pendingCandidates) {
					for (const candidateItem of pendingCandidates) {
						await mezon.socketRef.current?.forwardWebrtcSignaling(
							dmUserId,
							WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
							JSON.stringify(candidateItem),
							channelId,
							userId
						);
					}
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
		const dataType = signalingData.data_type;
		if ([WebrtcSignalingType.WEBRTC_SDP_QUIT, WebrtcSignalingType.WEBRTC_SDP_TIMEOUT].includes(dataType)) {
			if (!timeStartConnected?.current) {
				const callLogType =
					dataType === WebrtcSignalingType.WEBRTC_SDP_TIMEOUT ? IMessageTypeCallLog.TIMEOUTCALL : IMessageTypeCallLog.REJECTCALL;
				dispatch(
					DMCallActions.updateCallLog({
						channelId: channelId || '',
						content: {
							t: '',
							callLog: { isVideo: isShowMeetDM, callLogType }
						}
					})
				);
			}
			handleEndCall(true);
		}
		if (isInChannelCalled) {
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
						if (callTimeout.current) {
							clearTimeout(callTimeout.current);
							callTimeout.current = null;
						}

						break;
					}

					case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE: {
						const candidate = safeJSONParse(signalingData?.json_data || '{}');
						await handleICECandidate(candidate);
						break;
					}
					/// case other call
					// 	WebrtcSignalingType.WEBRTC_SDP_TIMEOUT
					case 5: {
						if (callTimeout.current) {
							clearTimeout(callTimeout.current);
							callTimeout.current = null;
						}
						break;
					}
				}
			} catch (error) {
				console.error('Error handling signaling message:', error);
			}
		}
	};

	const handleOtherCall = async (otherCallerId: string, otherChannelId: string) => {
		await mezon.socketRef.current?.forwardWebrtcSignaling(
			otherCallerId,
			WebrtcSignalingType.WEBRTC_SDP_JOINED_OTHER_CALL,
			'',
			otherChannelId,
			userId
		);
	};

	const cancelCallFCMMobile = async () => {
		const bodyFCMMobile = {
			offer: 'CANCEL_CALL'
		};
		await mezon.socketRef.current?.makeCallPush(dmUserId, JSON.stringify(bodyFCMMobile), channelId, userId);
	};

	// End call and cleanup
	const handleEndCall = async (callerEndCall = false) => {
		if (timeStartConnected?.current) {
			let timeCall = '';
			const startTime = new Date(timeStartConnected.current);
			const endTime = new Date();
			const diffMs = endTime.getTime() - startTime.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffSecs = Math.floor((diffMs % 60000) / 1000);
			timeCall = `${diffMins} mins ${diffSecs} secs`;

			dispatch(
				DMCallActions.updateCallLog({
					channelId: channelId,
					content: {
						t: timeCall,
						callLog: {
							isVideo: isShowMeetDM,
							callLogType: IMessageTypeCallLog.FINISHCALL
						}
					}
				})
			);
		} else {
			await cancelCallFCMMobile();
		}

		try {
			if (!callerEndCall) {
				await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_QUIT, '', channelId, userId);
			}
			if (callTimeout.current) {
				clearTimeout(callTimeout.current);
				callTimeout.current = null;
			}

			if (callState.localStream) {
				callState.localStream.getTracks().forEach((track) => track.stop());
			}
			if (callState.localScreenStream) {
				callState.localScreenStream.getTracks().forEach((track) => track.stop());
			}
			if (peerConnection?.current) {
				peerConnection?.current.close();
			}

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = null;
			}
			if (localScreenVideoRef.current) {
				localScreenVideoRef.current.srcObject = null;
			}
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = null;
			}

			if (remoteScreenVideoRef.current) {
				remoteScreenVideoRef.current.srcObject = null;
			}

			dispatch(DMCallActions.setIsInCall(false));
			if (!isPlayBusyTone) {
				dispatch(audioCallActions.setIsEndTone(true));
			}
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(audioCallActions.setIsRemoteAudio(true));
			dispatch(audioCallActions.setIsRemoteVideo(false));
			dispatch(DMCallActions.setIsShowMeetDM(false));
			dispatch(DMCallActions.setIsShowShareScreen(false));
			dispatch(audioCallActions.startDmCall({}));
			dispatch(audioCallActions.setUserCallId(''));
			dispatch(DMCallActions.removeAll());
			setCallState({
				localStream: null,
				remoteStream: null,
				localScreenStream: null,
				remoteScreenStream: null
			});
			setControlState({
				cameraEnabled: false,
				micEnabled: true
			});
			peerConnection.current = null;
		} catch (error) {
			console.error('Error ending call:', error);
		}
	};

	const toggleAudio = async () => {
		if (!callState.localStream) return;
		const audioTracks = callState.localStream.getAudioTracks();
		try {
			audioTracks.forEach((track) => {
				track.enabled = !track.enabled;
			});
			await mezon.socketRef.current?.forwardWebrtcSignaling(
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"micEnabled": ${!controlState.micEnabled}}`,
				channelId,
				userId
			);
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = callState.localStream;
			}
			setControlState((prev) => ({
				...prev,
				micEnabled: !prev.micEnabled
			}));
		} catch (error) {
			console.error('Error adding video track:', error);
		}
	};

	const toggleVideo = async () => {
		if (!callState.localStream) return;

		const cameraGranted = await requestMediaPermission('video');
		const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
		if (cameraGranted !== 'granted' || cameraPermission.state !== 'granted') {
			dispatch(toastActions.addToast({ message: 'Camera permission is required', type: 'warning', autoClose: 1000 }));
			return;
		}
		await mezon.socketRef.current?.forwardWebrtcSignaling(
			dmUserId,
			WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
			`{"cameraEnabled": ${!controlState.cameraEnabled}}`,
			channelId,
			userId
		);

		const videoTracks = callState.localStream.getVideoTracks();
		try {
			videoTracks.forEach((track) => {
				track.enabled = !track.enabled;
			});

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = callState.localStream;
			}
		} catch (error) {
			console.error('Error adding video track:', error);
		}

		dispatch(DMCallActions.setIsShowMeetDM(!isShowMeetDM));
		setControlState((prev) => ({
			...prev,
			cameraEnabled: !prev.cameraEnabled
		}));
	};

	const toggleScreenShare = async () => {
		if (!callState.localScreenStream) {
			let videoStream = undefined;
			if (isElectron()) {
				const screen = await getScreen();
				videoStream = await navigator.mediaDevices.getUserMedia({
					video: {
						mandatory: {
							chromeMediaSource: 'desktop',
							chromeMediaSourceId: screen.id
						}
					},
					audio: false
				} as MediaStreamConstraints);
			} else {
				videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
			}
			if (!videoStream) {
				return;
			}
			callState.localScreenStream = videoStream;
			const videoTrack = videoStream?.getVideoTracks()[0];
			const senders = peerConnection?.current?.getSenders() || [];

			const screenSender = senders.find((sender) => isScreenTrack(sender.track));

			if (screenSender) {
				await screenSender.replaceTrack(videoTrack);
			} else {
				peerConnection?.current?.addTrack(videoTrack, callState.localScreenStream);
			}

			if (localScreenVideoRef.current) {
				localScreenVideoRef.current.srcObject = callState.localScreenStream;
			}
			dispatch(DMCallActions.setIsShowShareScreen(!isShowScreen));

			return;
		}

		const videoTracks = callState.localScreenStream.getVideoTracks();
		if (videoTracks.length === 0) {
			try {
				let videoStream = undefined;
				if (isElectron()) {
					const screen = await getScreen();
					videoStream = await navigator.mediaDevices.getUserMedia({
						video: {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: screen.id
							}
						},
						audio: false
					} as MediaStreamConstraints);
				} else {
					videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
				}
				const videoTrack = videoStream?.getVideoTracks()[0];

				callState.localScreenStream.addTrack(videoTrack);
				const senders = peerConnection?.current?.getSenders() || [];

				const screenSender = senders.find((sender) => isScreenTrack(sender.track));

				if (screenSender) {
					await screenSender.replaceTrack(videoTrack);
				} else {
					peerConnection?.current?.addTrack(videoTrack, callState.localScreenStream);
				}

				if (localScreenVideoRef.current) {
					localScreenVideoRef.current.srcObject = callState.localScreenStream;
				}
			} catch (error) {
				console.error('Error adding video track:', error);
			}
		} else {
			videoTracks.forEach((track) => {
				if (track.enabled) {
					track.stop();
					if (callState.localScreenStream) {
						callState.localScreenStream.removeTrack(track);
					}

					const senders = peerConnection?.current?.getSenders() || [];
					const screenSender = senders.find((sender) => isScreenTrack(sender.track));
					if (screenSender) {
						peerConnection?.current?.removeTrack(screenSender);
					}
				} else {
					track.enabled = true;
				}
			});
		}

		dispatch(DMCallActions.setIsShowShareScreen(!isShowScreen));
	};

	const changeAudioInputDevice = async (deviceId: string) => {
		try {
			if (!peerConnection?.current) return;

			const constraints: MediaStreamConstraints = {
				audio: { deviceId: { exact: deviceId } },
				video: false
			};

			const newStream = await navigator.mediaDevices.getUserMedia(constraints);
			const newAudioTrack = newStream.getAudioTracks()[0];

			if (!newAudioTrack) {
				console.error('cannot find new audio track');
				return;
			}

			const selectedInputDevice = audioInputDevicesList.find((device) => device.deviceId === deviceId);

			if (!selectedInputDevice) return;
			setCurrentInputDevice(selectedInputDevice);

			const senders = peerConnection?.current.getSenders();

			const audioSender = senders.find((sender) => sender.track?.kind === 'audio');

			if (audioSender) {
				await audioSender.replaceTrack(newAudioTrack);
			} else {
				console.warn('cannot find audioSender');
			}
		} catch (error) {
			console.error('error when change audio input device', error);
		}
	};

	const changeAudioOutputDevice = async (deviceId: string) => {
		try {
			if (remoteVideoRef.current) {
				await remoteVideoRef.current.setSinkId(deviceId);
				const selectedOutputDevice = audioOutputDevicesList.find((device) => device.deviceId === deviceId);

				if (!selectedOutputDevice) return;
				setCurrentOutputDevice(selectedOutputDevice);
			}
		} catch (e) {
			console.error('error change audio input device', e);
		}
	};

	return {
		callState,
		timeStartConnected,
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		toggleScreenShare,
		handleSignalingMessage,
		handleOtherCall,
		localVideoRef,
		localScreenVideoRef,
		remoteScreenVideoRef,
		remoteVideoRef,
		changeAudioInputDevice,
		changeAudioOutputDevice,
		currentInputDevice,
		currentOutputDevice,
		audioInputDevicesList,
		audioOutputDevicesList
	};
}
