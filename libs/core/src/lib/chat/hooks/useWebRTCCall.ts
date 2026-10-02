import { audioCallActions, DMCallActions, selectAudioBusyTone, selectIsShowMeetDM, toastActions, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { compress, decompress, ensureMediaPermission, IMessageTypeCallLog, reportMediaAccessError, requestMediaPermission } from '@mezon/utils';
import { safeJSONParse, WebrtcSignalingType } from 'mezon-js';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

interface IWebRTCCallParams {
	dmUserId: string;
	channelId: string;
	userId: string;
	callerName: string;
	callerAvatar: string;
	isInChannelCalled: boolean;
}

const MAX_KNOWN_PEER_SESSIONS = 8;
const knownPeerSessions: { callerId: string; sessionId: string }[] = [];

export const getSdpSessionId = (sdp: unknown): string | null => {
	if (typeof sdp !== 'string') {
		return null;
	}
	const originLine = sdp.split(/\r?\n/).find((line) => line.startsWith('o='));
	return originLine?.trim().split(/\s+/)[1] || null;
};

export const readSignalSessionId = async (compressedSignal: string): Promise<string | null> => {
	try {
		const description = safeJSONParse((await decompress(compressedSignal)) || '{}');
		return getSdpSessionId(description?.sdp);
	} catch (error) {
		console.error('Error reading call session:', error);
		return null;
	}
};

export const isKnownPeerSession = (callerId: string, sessionId: string | null): boolean =>
	!!sessionId && knownPeerSessions.some((known) => known.callerId === callerId && known.sessionId === sessionId);

export const rememberPeerSession = (callerId: string, sessionId: string | null) => {
	if (!callerId || !sessionId || isKnownPeerSession(callerId, sessionId)) {
		return;
	}
	if (knownPeerSessions.length >= MAX_KNOWN_PEER_SESSIONS) {
		knownPeerSessions.shift();
	}
	knownPeerSessions.push({ callerId, sessionId });
};

const SAVED_INPUT_DEVICE_KEY = 'mezon.voice.inputDeviceId';
const SAVED_OUTPUT_DEVICE_KEY = 'mezon.voice.outputDeviceId';
const SYSTEM_DEFAULT_DEVICE_ID = 'default';
const AUDIO_DEVICE_SETTLE_MS = 400;

const readSavedDeviceId = (key: string): string => {
	try {
		return localStorage.getItem(key) || '';
	} catch {
		return '';
	}
};

const findDevice = (devices: MediaDeviceInfo[], deviceId: string | undefined): MediaDeviceInfo | null =>
	(deviceId && devices.find((device) => device.deviceId === deviceId)) || null;

const pickPreferredDevice = (devices: MediaDeviceInfo[], savedDeviceId: string): MediaDeviceInfo | null =>
	findDevice(devices, savedDeviceId) || findDevice(devices, SYSTEM_DEFAULT_DEVICE_ID) || devices[0] || null;

export function useWebRTCCall({ dmUserId, channelId, userId, callerName, callerAvatar, isInChannelCalled }: IWebRTCCallParams) {
	const { t } = useTranslation('channelVoice');
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
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const mezon = useMezon();
	const dispatch = useAppDispatch();
	const timeStartConnected = useRef<Date | null>(null);
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const pendingCandidatesRef = useRef<(RTCIceCandidate | null)[]>([]);
	const remoteIceCandidatesRef = useRef<RTCIceCandidate[]>([]);

	const callTimeout = useRef<NodeJS.Timeout | null>(null);
	const [audioInputDevicesList, setAudioInputDevicesList] = useState<MediaDeviceInfo[]>([]);
	const [audioOutputDevicesList, setAudioOutputDevicesList] = useState<MediaDeviceInfo[]>([]);
	const [currentInputDeviceId, setCurrentInputDeviceId] = useState('');
	const [currentOutputDeviceId, setCurrentOutputDeviceId] = useState('');
	const currentInputDevice = findDevice(audioInputDevicesList, currentInputDeviceId);
	const currentOutputDevice = findDevice(audioOutputDevicesList, currentOutputDeviceId);
	const outputDeviceIdRef = useRef('');
	const [isConnected, setIsConnected] = useState<boolean | null>(null);
	const hasSyncRemoteMediaRef = useRef<boolean>(false);
	const channelIdRef = useRef<string>('');
	const isMyCaller = useRef<boolean>(false);
	const callTargetRef = useRef<{ dmUserId: string; channelId: string } | null>(null);

	useEffect(() => {
		return () => {
			if (callState.localStream) {
				callState.localStream.getTracks().forEach((track) => track.stop());
			}
			if (callState.localScreenStream) {
				callState.localScreenStream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [callState.localStream, callState.localScreenStream]);

	useEffect(() => {
		return () => {
			if (callTimeout.current) {
				clearTimeout(callTimeout.current);
				callTimeout.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (isConnected && !hasSyncRemoteMediaRef?.current && mezon.sessionRef.current) {
			mezon.clientRef.current?.forwardWebrtcSignaling(
				mezon.sessionRef.current,
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"cameraEnabled": ${controlState?.cameraEnabled}, "micEnabled": ${controlState?.micEnabled}}`,
				channelId,
				userId
			);
			hasSyncRemoteMediaRef.current = true;
		}
	}, [channelId, dmUserId, isConnected, controlState?.cameraEnabled, controlState?.micEnabled, mezon?.clientRef, userId]);

	const clearCallTimeout = () => {
		if (callTimeout.current) {
			clearTimeout(callTimeout.current);
			callTimeout.current = null;
		}
	};

	const applyOutputDevice = async () => {
		const remoteMedia = remoteVideoRef.current;
		const deviceId = outputDeviceIdRef.current;
		if (!remoteMedia || !deviceId || typeof remoteMedia.setSinkId !== 'function' || remoteMedia.sinkId === deviceId) return;
		try {
			await remoteMedia.setSinkId(deviceId);
		} catch (error) {
			console.warn('cannot route call audio to the selected output device', error);
			setCurrentOutputDeviceId(remoteMedia.sinkId || SYSTEM_DEFAULT_DEVICE_ID);
		}
	};

	const initializePeerConnection = () => {
		const pc = new RTCPeerConnection(RTCConfig);
		let isMediaInterrupted = false;
		callTargetRef.current = { dmUserId, channelId };

		pc.onicecandidate = async (event) => {
			if (event.candidate) {
				if (pc.remoteDescription && mezon.sessionRef.current) {
					await mezon.clientRef.current?.forwardWebrtcSignaling(
						mezon.sessionRef.current,
						dmUserId,
						WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
						JSON.stringify(event.candidate),
						channelId,
						userId
					);
				} else {
					pendingCandidatesRef.current = [...(pendingCandidatesRef?.current || []), event.candidate];
				}
			}
		};

		pc.ontrack = (event) => {
			const remoteStream = event.streams[0];
			remoteStream.getVideoTracks().forEach((track) => {
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = remoteStream;
					setCallState((prev) => ({
						...prev,
						remoteStream
					}));
				}
			});

			remoteStream.getAudioTracks().forEach((track) => {
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = remoteStream;
					setCallState((prev) => ({
						...prev,
						remoteStream
					}));
				}
			});
			void applyOutputDevice();
		};

		pc.oniceconnectionstatechange = async () => {
			if (pc.iceConnectionState === 'connected' && mezon.sessionRef.current) {
				if (timeStartConnected.current) {
					if (isMediaInterrupted) {
						isMediaInterrupted = false;
						dispatch(toastActions.addToast({ message: t('toast.connectionConnected'), type: 'success', autoClose: 3000 }));
					}
					return;
				}
				timeStartConnected.current = new Date();
				clearCallTimeout();
				dispatch(audioCallActions.setEstablishedCall({ peerId: dmUserId, channelId }));
				dispatch(toastActions.addToast({ message: t('toast.connectionConnected'), type: 'success', autoClose: 3000 }));
				dispatch(audioCallActions.setIsJoinedCall(true));
				dispatch(audioCallActions.setIsDialTone(false));
				await mezon.clientRef.current?.forwardWebrtcSignaling(
					mezon.sessionRef.current,
					dmUserId,
					WebrtcSignalingType.WEBRTC_SDP_INIT,
					'',
					channelId,
					userId
				);
				if (isMyCaller?.current) {
					await cancelCallFCMMobile(true);
				}
				setIsConnected(true);
			}

			if (pc.iceConnectionState === 'disconnected') {
				dispatch(toastActions.addToast({ message: t('toast.connectionDisconnected'), type: 'warning', autoClose: 3000 }));
				if (timeStartConnected.current) {
					isMediaInterrupted = true;
					return;
				}
				setIsConnected(null);
				dispatch(audioCallActions.setIsJoinedCall(false));
				handleEndCall();
				clearCallTimeout();
			}
		};

		return pc;
	};

	const getConstraintsLocal = async (isVideoCall: boolean, isAnswer?: boolean): Promise<MediaStreamConstraints> => {
		let permissionCameraGranted = false;
		let audioConstraint: MediaStreamConstraints['audio'] = false;

		const microphoneGranted = await requestMediaPermission('audio');

		if (isVideoCall) {
			const cameraGranted = await requestMediaPermission('video');
			if (cameraGranted === 'granted') {
				permissionCameraGranted = true;
			}
		}

		if (microphoneGranted !== 'granted') {
			dispatch(
				toastActions.addToast({
					message: t('toast.microphonePermissionRequired'),
					type: 'warning',
					autoClose: 1000
				})
			);
			if (!isAnswer) await handleEndCall(true);
			return {
				audio: false,
				video: isVideoCall && permissionCameraGranted
			};
		} else {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const outputDevices = devices.filter((device) => device.kind === 'audiooutput');
			const inputDevices = devices.filter((device) => device.kind === 'audioinput');
			const inputDevice = pickPreferredDevice(inputDevices, readSavedDeviceId(SAVED_INPUT_DEVICE_KEY));
			const outputDevice = pickPreferredDevice(outputDevices, readSavedDeviceId(SAVED_OUTPUT_DEVICE_KEY));

			setAudioInputDevicesList(inputDevices);
			setAudioOutputDevicesList(outputDevices);
			setCurrentInputDeviceId(inputDevice?.deviceId || '');
			setCurrentOutputDeviceId(outputDevice?.deviceId || '');
			outputDeviceIdRef.current = outputDevice?.deviceId || '';
			audioConstraint = inputDevice?.deviceId ? { deviceId: { exact: inputDevice.deviceId } } : true;
		}

		return {
			audio: audioConstraint,
			video: isVideoCall && permissionCameraGranted
		};
	};

	const openLocalStream = async (constraints: MediaStreamConstraints) => {
		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia(constraints);
		} catch (error) {
			if (typeof constraints.audio !== 'object') throw error;
			console.warn('selected microphone unavailable, using the system default', error);
			stream = await navigator.mediaDevices.getUserMedia({ ...constraints, audio: true });
		}
		const usedInputDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId;
		if (usedInputDeviceId) setCurrentInputDeviceId(usedInputDeviceId);
		return stream;
	};

	const startCall = async (isVideoCall: boolean, isAnswer: boolean) => {
		if (!mezon.sessionRef.current) {
			return;
		}
		try {
			callTimeout?.current && clearTimeout(callTimeout.current);
			timeStartConnected.current = null;
			pendingCandidatesRef.current = [];
			remoteIceCandidatesRef.current = [];
			setIsConnected(null);
			hasSyncRemoteMediaRef.current = false;
			callTargetRef.current = null;
			isMyCaller.current = !isAnswer;
			if (!isAnswer) {
				const constraints = await getConstraintsLocal(isVideoCall, isAnswer);
				const stream = await openLocalStream(constraints);
				const pc = initializePeerConnection();
				if (isVideoCall) {
					await mezon.clientRef.current?.forwardWebrtcSignaling(
						mezon.sessionRef.current,
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

				stream.getTracks().forEach((track) => {
					pc.addTrack(track, stream);
				});
				const offer = await pc.createOffer({
					offerToReceiveAudio: true,
					offerToReceiveVideo: true
				});
				await pc.setLocalDescription(new RTCSessionDescription(offer));
				const compressedOffer = await compress(JSON.stringify({ ...offer, callerName, callerAvatar, isVideoCall }));
				await mezon.clientRef.current?.forwardWebrtcSignaling(
					mezon.sessionRef.current,
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
					isVideoCall,
					channelId,
					sentAt: String(Date.now())
				};
				await mezon.clientRef.current?.makeCallPush(mezon.sessionRef.current, dmUserId, JSON.stringify(bodyFCMMobile), channelId, userId);
				callTimeout.current = setTimeout(() => {
					if (timeStartConnected.current) {
						return;
					}
					dispatch(
						toastActions.addToast({
							message: t('toast.recipientDidNotAnswer'),
							type: 'warning',
							autoClose: 3000
						})
					);
					dispatch(
						DMCallActions.updateCallLog({
							channelId: channelId || '0',
							content: {
								t: `${isVideoCall ? 'Video' : 'Voice'} call timed out`,
								callLog: {
									isVideo: isVideoCall,
									callLogType: IMessageTypeCallLog.TIMEOUTCALL,
									showCallBack: true
								}
							}
						})
					);
					handleEndCall();
				}, 30000);
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				setCallState({
					localStream: stream,
					remoteStream: null,
					localScreenStream: null,
					remoteScreenStream: null
				});
				peerConnection.current = pc;
			} else {
				const constraints = await getConstraintsLocal(isVideoCall, isAnswer);
				if (constraints?.audio) {
					dispatch(DMCallActions.setIsInCall(true));
				}
			}
		} catch (error) {
			console.error('Error starting call:', error);
			handleEndCall(true);
		}
	};

	const sendPendingLocalCandidates = async () => {
		if (pendingCandidatesRef?.current?.length && mezon.sessionRef.current) {
			for (const candidateItem of pendingCandidatesRef.current) {
				await mezon.clientRef.current?.forwardWebrtcSignaling(
					mezon.sessionRef.current,
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

	const drainRemoteIceCandidates = async (pc: RTCPeerConnection) => {
		if (remoteIceCandidatesRef.current.length > 0) {
			for (const candidate of remoteIceCandidatesRef.current) {
				await pc.addIceCandidate(candidate);
			}
			remoteIceCandidatesRef.current = [];
		}
	};

	const handleOffer = async (signalingData: any) => {
		if (!mezon.sessionRef.current) {
			return;
		}
		const offer = new RTCSessionDescription({
			type: 'offer',
			sdp: signalingData.sdp
		});

		const pc = peerConnection?.current;
		const isRenegotiation = !!pc && pc.connectionState !== 'new';

		if (isRenegotiation) {
			await pc.setRemoteDescription(offer);
			await drainRemoteIceCandidates(pc);

			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			const compressedAnswer = await compress(JSON.stringify(answer));
			await mezon.clientRef.current?.forwardWebrtcSignaling(
				mezon.sessionRef.current,
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_ANSWER,
				compressedAnswer,
				channelId,
				userId
			);
			await sendPendingLocalCandidates();
		} else {
			const constraints = await getConstraintsLocal(isShowMeetDM, true);
			const stream = await openLocalStream(constraints);
			const newPc = pc || initializePeerConnection();

			if (isShowMeetDM) {
				await mezon.clientRef.current?.forwardWebrtcSignaling(
					mezon.sessionRef.current,
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

			stream.getTracks().forEach((track) => {
				newPc.addTrack(track, stream);
			});

			await newPc.setRemoteDescription(new RTCSessionDescription(offer));
			await drainRemoteIceCandidates(newPc);
			const answer = await newPc.createAnswer();
			await newPc.setLocalDescription(answer);
			const compressedAnswer = await compress(JSON.stringify(answer));
			await mezon.clientRef.current?.forwardWebrtcSignaling(
				mezon.sessionRef.current,
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_ANSWER,
				compressedAnswer,
				channelId,
				userId
			);
			await sendPendingLocalCandidates();

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}

			if (!peerConnection?.current) {
				peerConnection.current = newPc;
			}

			setCallState({
				localStream: stream,
				remoteStream: null,
				localScreenStream: null,
				remoteScreenStream: null
			});
		}
	};

	const handleAnswer = async (signalingData: any) => {
		if (!peerConnection?.current) return;

		await peerConnection?.current.setRemoteDescription(signalingData);
		await drainRemoteIceCandidates(peerConnection.current);
		await sendPendingLocalCandidates();
	};

	const handleICECandidate = async (data: any) => {
		if (!peerConnection?.current) return;
		try {
			if (data) {
				const candidate = new RTCIceCandidate(data);
				if (peerConnection?.current?.remoteDescription) {
					await peerConnection?.current?.addIceCandidate(candidate);
				} else {
					// Queue candidate if remote description is not set yet
					remoteIceCandidatesRef.current.push(candidate);
				}
			} else {
				console.error('Invalid ICE candidate data:', data);
			}
		} catch (error) {
			console.error('Error adding ICE candidate:', error);
		}
	};
	const handleSignalingMessage = async (signalingData: any) => {
		const dataType = signalingData.data_type;
		if (dataType === WebrtcSignalingType.WEBRTC_SDP_TIMEOUT && timeStartConnected.current) {
			return;
		}
		channelIdRef.current = signalingData?.channel_id || '0';
		if ([WebrtcSignalingType.WEBRTC_SDP_QUIT, WebrtcSignalingType.WEBRTC_SDP_TIMEOUT].includes(dataType)) {
			if (!timeStartConnected?.current && isMyCaller?.current) {
				const callLogType =
					dataType === WebrtcSignalingType.WEBRTC_SDP_TIMEOUT ? IMessageTypeCallLog.TIMEOUTCALL : IMessageTypeCallLog.REJECTCALL;
				dispatch(
					DMCallActions.updateCallLog({
						channelId: channelId || signalingData?.channel_id || '0',
						content: {
							t:
								callLogType === IMessageTypeCallLog.TIMEOUTCALL
									? `${isShowMeetDM ? 'Video' : 'Voice'} call timed out`
									: `Declined ${isShowMeetDM ? 'video' : 'voice'} call`,
							callLog: {
								isVideo: isShowMeetDM,
								callLogType,
								showCallBack: callLogType === IMessageTypeCallLog.TIMEOUTCALL
							}
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
						rememberPeerSession(signalingData?.caller_id, getSdpSessionId(offer?.sdp));
						await handleOffer(offer);

						break;
					}

					case WebrtcSignalingType.WEBRTC_SDP_ANSWER: {
						const decompressedData = await decompress(signalingData.json_data);
						const answer = safeJSONParse(decompressedData || '{}');
						await handleAnswer(answer);
						clearCallTimeout();
						break;
					}

					case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE: {
						const candidate = safeJSONParse(signalingData?.json_data || '{}');
						await handleICECandidate(candidate);
						break;
					}
					case WebrtcSignalingType.WEBRTC_SDP_TIMEOUT: {
						clearCallTimeout();
						break;
					}
				}
			} catch (error) {
				console.error('Error handling signaling message:', error);
			}
		}
	};

	const handleOtherCall = async (otherCallerId: string, otherChannelId: string) => {
		if (mezon.sessionRef.current) {
			await mezon.clientRef.current?.forwardWebrtcSignaling(
				mezon.sessionRef.current,
				otherCallerId,
				WebrtcSignalingType.WEBRTC_SDP_JOINED_OTHER_CALL,
				'',
				otherChannelId,
				userId
			);
		}
	};

	const cancelCallFCMMobile = async (isConnected = false, peerId = dmUserId, callChannelId = channelId) => {
		const bodyFCMMobile = { offer: 'CANCEL_CALL', isConnected, sentAt: String(Date.now()) };
		if (mezon.sessionRef.current) {
			await mezon.clientRef.current?.makeCallPush(mezon.sessionRef.current, peerId, JSON.stringify(bodyFCMMobile), callChannelId, userId);
		}
	};

	const handleEndCall = async (isCallerEndCall = false) => {
		const callPeerId = callTargetRef.current?.dmUserId || dmUserId;
		const callChannelId = callTargetRef.current?.channelId || channelId;
		try {
			if (!isCallerEndCall && mezon.sessionRef.current) {
				await mezon.clientRef.current?.forwardWebrtcSignaling(
					mezon.sessionRef.current,
					callPeerId,
					WebrtcSignalingType.WEBRTC_SDP_QUIT,
					'',
					callChannelId,
					userId
				);
			}
			clearCallTimeout();
			setIsConnected(null);
			hasSyncRemoteMediaRef.current = false;

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

			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = null;
			}

			dispatch(DMCallActions.setIsInCall(false));
			if (!isPlayBusyTone) {
				dispatch(audioCallActions.setIsEndTone(true));
			}
			dispatch(audioCallActions.reset());
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(audioCallActions.setIsRemoteAudio(true));
			dispatch(audioCallActions.setIsRemoteVideo(false));
			dispatch(DMCallActions.setIsShowMeetDM(false));
			dispatch(DMCallActions.setIsShowShareScreen(false));
			dispatch(audioCallActions.startDmCall(null));
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
			callTargetRef.current = null;
			pendingCandidatesRef.current = [];
			remoteIceCandidatesRef.current = [];
			const wasMyCaller = isMyCaller.current;
			isMyCaller.current = false;
			if (timeStartConnected?.current && wasMyCaller) {
				let timeCall = '';
				const startTime = new Date(timeStartConnected.current);
				const endTime = new Date();
				const diffMs = endTime.getTime() - startTime.getTime();
				const diffMins = Math.floor(diffMs / 60000);
				const diffSecs = Math.floor((diffMs % 60000) / 1000);
				timeCall = `${diffMins} mins ${diffSecs} secs`;

				dispatch(
					DMCallActions.updateCallLog({
						channelId: callChannelId || channelIdRef?.current || '0',
						content: {
							t: `Call duration: ${timeCall}`,
							callLog: {
								isVideo: isShowMeetDM,
								callLogType: IMessageTypeCallLog.FINISHCALL,
								showCallBack: true
							}
						}
					})
				);
			} else if (wasMyCaller) {
				await cancelCallFCMMobile(false, callPeerId, callChannelId);
			}
			timeStartConnected.current = null;
		} catch (error) {
			console.error('Error ending call:', error);
		}
	};

	const toggleAudio = async () => {
		if (!callState.localStream || !mezon.sessionRef.current) return;
		const audioTracks = callState.localStream.getAudioTracks();
		try {
			audioTracks.forEach((track) => {
				track.enabled = !track.enabled;
			});
			await mezon.clientRef.current?.forwardWebrtcSignaling(
				mezon.sessionRef.current,
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

		const newCameraState = !controlState.cameraEnabled;
		if (newCameraState && !(await ensureMediaPermission('camera', () => toggleVideoRef.current()))) return;

		const videoTracks = callState.localStream.getVideoTracks();

		if (videoTracks.length === 0 && newCameraState) {
			try {
				const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
				const videoTrack = videoStream.getVideoTracks()[0];

				callState.localStream.addTrack(videoTrack);

				const senders = peerConnection?.current?.getSenders() || [];
				const videoSender = senders.find((sender) => sender.track?.kind === 'video');

				if (!videoSender) {
					peerConnection?.current?.addTrack(videoTrack, callState.localStream);
				}

				if (peerConnection?.current && mezon.sessionRef.current) {
					const offer = await peerConnection.current.createOffer();
					await peerConnection.current.setLocalDescription(offer);

					const compressedOffer = await compress(JSON.stringify(offer));
					await mezon.clientRef.current?.forwardWebrtcSignaling(
						mezon.sessionRef.current,
						dmUserId,
						WebrtcSignalingType.WEBRTC_SDP_OFFER,
						compressedOffer,
						channelId,
						userId
					);
				}
			} catch (error) {
				reportMediaAccessError('camera', error);
				console.error('Error adding video track:', error);
				return;
			}
		} else {
			videoTracks.forEach((track) => {
				track.enabled = newCameraState;
			});
		}

		if (mezon.sessionRef.current) {
			await mezon.clientRef.current?.forwardWebrtcSignaling(
				mezon.sessionRef.current,
				dmUserId,
				WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
				`{"cameraEnabled": ${newCameraState}}`,
				channelId,
				userId
			);
		}

		if (localVideoRef.current) {
			localVideoRef.current.srcObject = callState.localStream;
		}

		dispatch(DMCallActions.setIsShowMeetDM(newCameraState));
		setControlState((prev) => ({
			...prev,
			cameraEnabled: newCameraState
		}));
	};

	const toggleVideoRef = useRef(toggleVideo);
	toggleVideoRef.current = toggleVideo;

	const changeAudioInputDevice = async (deviceId: string) => {
		const localStream = callState.localStream;
		const audioSender = peerConnection?.current?.getSenders().find((sender) => sender.track?.kind === 'audio');
		if (!localStream || !audioSender) {
			console.warn('cannot find audioSender');
			return;
		}
		let newAudioTrack: MediaStreamTrack | undefined;
		try {
			const newStream = await navigator.mediaDevices.getUserMedia({
				audio: { deviceId: { exact: deviceId } },
				video: false
			});
			newAudioTrack = newStream.getAudioTracks()[0];

			if (!newAudioTrack) {
				console.error('cannot find new audio track');
				return;
			}

			newAudioTrack.enabled = localStream.getAudioTracks().every((track) => track.enabled);
			await audioSender.replaceTrack(newAudioTrack);
			if (audioSender.track !== newAudioTrack) {
				newAudioTrack.stop();
				return;
			}

			localStream.getAudioTracks().forEach((track) => {
				localStream.removeTrack(track);
				track.stop();
			});
			localStream.addTrack(newAudioTrack);
			setCurrentInputDeviceId(newAudioTrack.getSettings().deviceId || deviceId);
		} catch (error) {
			if (newAudioTrack && audioSender.track !== newAudioTrack) newAudioTrack.stop();
			console.error('error when change audio input device', error);
		}
	};

	const changeAudioOutputDevice = async (deviceId: string) => {
		try {
			if (remoteVideoRef.current) {
				await remoteVideoRef.current.setSinkId(deviceId);
				outputDeviceIdRef.current = deviceId;
				setCurrentOutputDeviceId(deviceId);
			}
		} catch (e) {
			console.error('error change audio output device', e);
		}
	};

	const handleAudioDeviceChange = async () => {
		const localStream = callState.localStream;
		if (!localStream || !peerConnection?.current) return;

		const devices = await navigator.mediaDevices.enumerateDevices();
		const inputDevices = devices.filter((device) => device.kind === 'audioinput');
		const outputDevices = devices.filter((device) => device.kind === 'audiooutput');
		const inputTrack = localStream.getAudioTracks()[0];
		const inputDeviceId = inputTrack?.getSettings().deviceId;
		const inputLost = inputTrack?.readyState === 'ended' || !findDevice(inputDevices, inputDeviceId);
		const defaultInputMoved =
			inputDeviceId === SYSTEM_DEFAULT_DEVICE_ID &&
			findDevice(audioInputDevicesList, SYSTEM_DEFAULT_DEVICE_ID)?.groupId !== findDevice(inputDevices, SYSTEM_DEFAULT_DEVICE_ID)?.groupId;

		setAudioInputDevicesList(inputDevices);
		setAudioOutputDevicesList(outputDevices);

		if (inputTrack && (inputLost || defaultInputMoved)) {
			const nextInput = inputLost
				? pickPreferredDevice(inputDevices, readSavedDeviceId(SAVED_INPUT_DEVICE_KEY))
				: findDevice(inputDevices, SYSTEM_DEFAULT_DEVICE_ID);
			if (nextInput?.deviceId) await changeAudioInputDevice(nextInput.deviceId);
		}

		if (!findDevice(outputDevices, outputDeviceIdRef.current)) {
			const nextOutput = pickPreferredDevice(outputDevices, readSavedDeviceId(SAVED_OUTPUT_DEVICE_KEY));
			if (nextOutput?.deviceId) await changeAudioOutputDevice(nextOutput.deviceId);
		}
	};

	const handleAudioDeviceChangeRef = useRef(handleAudioDeviceChange);
	handleAudioDeviceChangeRef.current = handleAudioDeviceChange;

	useEffect(() => {
		let settleTimer: ReturnType<typeof setTimeout> | null = null;
		const onDeviceChange = () => {
			if (settleTimer) clearTimeout(settleTimer);
			settleTimer = setTimeout(() => {
				settleTimer = null;
				handleAudioDeviceChangeRef.current().catch((error) => console.error('error refreshing call audio devices', error));
			}, AUDIO_DEVICE_SETTLE_MS);
		};
		navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);
		return () => {
			if (settleTimer) clearTimeout(settleTimer);
			navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);
		};
	}, []);

	return {
		callState,
		peerConnection,
		timeStartConnected,
		isMyCaller,
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		handleSignalingMessage,
		handleOtherCall,
		localVideoRef,
		remoteVideoRef,
		changeAudioInputDevice,
		changeAudioOutputDevice,
		currentInputDevice,
		currentOutputDevice,
		audioInputDevicesList,
		audioOutputDevicesList
	};
}
