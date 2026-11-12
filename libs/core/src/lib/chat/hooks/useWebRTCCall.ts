import { audioCallActions, DMCallActions, selectAudioBusyTone, selectIsShowMeetDM, toastActions, useAppDispatch } from '@mezon/store';
import { allowedApiUrl, resolveSessionApiCredential, socketState, useMezon } from '@mezon/transport';
import {
	compress,
	decompress,
	ensureMediaPermission,
	getPreferredInputDeviceId,
	getPreferredOutputDeviceId,
	IMessageTypeCallLog,
	reportMediaAccessError,
	requestMediaPermission
} from '@mezon/utils';
import { safeJSONParse, WebrtcSignalingType, type ApiSession, type Client } from 'mezon-js';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { forwardCallSetup } from '../utils/forwardCallSetup';

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

const CALL_SOCKET_TIMEOUT_MS = 10000;
const CALL_CONNECT_TIMEOUT_MS = 30000;
const SOCKET_NOT_OPEN = 'Socket connection has not been established yet.';

const isSocketNotOpen = (error: unknown) => (error instanceof Error ? error.message : error) === SOCKET_NOT_OPEN;

const isSignalingAckTimeout = (error: unknown) => {
	const message = error instanceof Error ? error.message : error;
	return message === 'Request timed out.' || message === 'The socket timed out while waiting for a response.';
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

const SYSTEM_DEFAULT_DEVICE_ID = 'default';
const AUDIO_DEVICE_SETTLE_MS = 400;

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
	const localStreamRef = useRef<MediaStream | null>(null);
	const callSetupRef = useRef<AbortController | null>(null);
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const mezon = useMezon();
	const dispatch = useAppDispatch();
	const timeStartConnected = useRef<Date | null>(null);
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
	const remoteIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
	const localIceReadyRef = useRef(false);
	const remoteAnswerReceivedRef = useRef(false);

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
			callSetupRef.current?.abort();
			const pc = peerConnection.current;
			peerConnection.current = null;
			pc?.close();
			localStreamRef.current?.getTracks().forEach((track) => track.stop());
			if (callTimeout.current) {
				clearTimeout(callTimeout.current);
				callTimeout.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (isConnected && !hasSyncRemoteMediaRef?.current && mezon.sessionRef.current) {
			void mezon.clientRef.current
				?.forwardWebrtcSignaling(
					mezon.sessionRef.current,
					dmUserId,
					WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
					`{"cameraEnabled": ${controlState?.cameraEnabled}, "micEnabled": ${controlState?.micEnabled}}`,
					channelId,
					userId
				)
				.catch((error) => console.warn('Call media status send failed:', error));
			hasSyncRemoteMediaRef.current = true;
		}
	}, [channelId, dmUserId, isConnected, controlState?.cameraEnabled, controlState?.micEnabled, mezon?.clientRef, userId]);

	const clearCallTimeout = () => {
		if (callTimeout.current) {
			clearTimeout(callTimeout.current);
			callTimeout.current = null;
		}
	};

	const sendCallSetup = async (
		setup: AbortSignal,
		send: (client: Client, session: ApiSession) => Promise<unknown>,
		{ shouldSend = () => true, sendOverHttp }: { shouldSend?: () => boolean; sendOverHttp?: (session: ApiSession) => Promise<boolean> } = {}
	): Promise<boolean> => {
		const deadline = performance.now() + CALL_SOCKET_TIMEOUT_MS;
		let connectionGeneration = 0;
		let attemptedGeneration = -1;
		let attemptedClient: Client | null = null;
		let attemptedHttp = false;
		const unsubscribe = socketState.subscribe((status) => {
			if (status === 'connected') connectionGeneration += 1;
		});
		const activeSession = () => {
			const session = mezon.sessionRef.current;
			const sessionUserId = (session as (ApiSession & { user_id?: string }) | null)?.user_id;
			return setup.aborted || !shouldSend() || (sessionUserId && sessionUserId !== userId) ? null : session;
		};
		const tryHttp = async () => {
			const session = activeSession();
			if (!sendOverHttp || attemptedHttp || !session) return false;
			attemptedHttp = true;
			return sendOverHttp(session);
		};
		const attempt = async (): Promise<boolean> => {
			for (let session = activeSession(); session; session = activeSession()) {
				const client = mezon.clientRef.current;
				const remaining = deadline - performance.now();
				if (remaining <= 0) throw new Error('Call setup timed out waiting for the signaling socket');
				if (!client?.isOpen()) {
					attemptedClient = null;
					if (sendOverHttp && !attemptedHttp && (await tryHttp())) return false;
				} else if (client !== attemptedClient || connectionGeneration !== attemptedGeneration) {
					attemptedClient = client;
					attemptedGeneration = connectionGeneration;
					await send(client, session);
					return true;
				}
				await new Promise((resolve) => setTimeout(resolve, Math.min(100, remaining)));
			}
			throw new DOMException('Call setup ended', 'AbortError');
		};

		try {
			try {
				return await attempt();
			} catch (error) {
				// The SDK rejects with this message before assigning a correlation ID.
				// Its public isOpen() may still report the old connection until close is processed.
				if (!isSocketNotOpen(error)) throw error;
			}
			if (await tryHttp()) return false;
			return await attempt();
		} finally {
			unsubscribe();
		}
	};

	const sendInitialDescription = (setup: AbortSignal, type: WebrtcSignalingType, description: string, isVideoCall: boolean) => {
		let cameraStatusAttempted = false;
		const sendOverSocket = (client: Client, session: ApiSession) => {
			if (isVideoCall && !cameraStatusAttempted) {
				cameraStatusAttempted = true;
				void client
					.forwardWebrtcSignaling(
						session,
						dmUserId,
						WebrtcSignalingType.WEBRTC_SDP_STATUS_REMOTE_MEDIA,
						'{"cameraEnabled": true}',
						channelId,
						userId
					)
					.catch((error) => console.warn('Call media status send failed:', error));
			}
			return client.forwardWebrtcSignaling(session, dmUserId, type, description, channelId, userId);
		};
		return sendCallSetup(setup, sendOverSocket, {
			sendOverHttp: async (session) => {
				const apiUrl = allowedApiUrl(session);
				const credential = resolveSessionApiCredential(session);
				if (!apiUrl || !credential) return false;
				return forwardCallSetup(apiUrl, credential, setup, {
					receiverId: dmUserId,
					dataType: type,
					jsonData: description,
					channelId,
					callerId: userId
				});
			}
		});
	};

	const startOutgoingCallTimeout = (setup: AbortSignal, isVideoCall: boolean) => {
		clearCallTimeout();
		callTimeout.current = setTimeout(() => {
			if (setup.aborted || timeStartConnected.current) return;
			dispatch(
				toastActions.addToast({
					message: t(remoteAnswerReceivedRef.current ? 'common:errorBoundary.connectionFailed' : 'toast.recipientDidNotAnswer'),
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
			void handleEndCall();
		}, CALL_CONNECT_TIMEOUT_MS);
	};

	const registerLocalStream = (stream: MediaStream) => {
		localStreamRef.current = stream;
		if (localVideoRef.current) localVideoRef.current.srcObject = stream;
		setCallState((prev) => ({ ...prev, localStream: stream }));
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
		peerConnection.current = pc;
		callTargetRef.current = { dmUserId, channelId };

		pc.onicecandidate = ({ candidate }) => {
			if (!candidate || peerConnection.current !== pc) return;
			if (pc.remoteDescription && localIceReadyRef.current) {
				void sendLocalIceCandidate(candidate);
			} else {
				pendingCandidatesRef.current.push(candidate);
			}
		};

		pc.ontrack = (event) => {
			if (peerConnection.current !== pc) return;
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
			if (peerConnection.current !== pc) return;
			if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
				if (timeStartConnected.current) {
					return;
				}
				timeStartConnected.current = new Date();
				clearCallTimeout();
				dispatch(audioCallActions.setEstablishedCall({ peerId: dmUserId, channelId }));
				dispatch(audioCallActions.setIsJoinedCall(true));
				dispatch(audioCallActions.setIsDialTone(false));
				setIsConnected(true);
				const session = mezon.sessionRef.current;
				if (session) {
					const init = mezon.clientRef.current?.forwardWebrtcSignaling(
						session,
						dmUserId,
						WebrtcSignalingType.WEBRTC_SDP_INIT,
						'',
						channelId,
						userId
					);
					await Promise.allSettled([init, isMyCaller.current ? cancelCallFCMMobile(true) : undefined]);
				}
			}

			if (pc.iceConnectionState === 'failed' && !timeStartConnected.current) {
				void handleEndCall();
			}
		};

		return pc;
	};

	const getConstraintsLocal = async (isVideoCall: boolean): Promise<MediaStreamConstraints> => {
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
			return {
				audio: false,
				video: isVideoCall && permissionCameraGranted
			};
		} else {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const outputDevices = devices.filter((device) => device.kind === 'audiooutput');
			const inputDevices = devices.filter((device) => device.kind === 'audioinput');
			const inputDevice = pickPreferredDevice(inputDevices, getPreferredInputDeviceId());
			const outputDevice = pickPreferredDevice(outputDevices, getPreferredOutputDeviceId());

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
		callSetupRef.current?.abort();
		const setup = new AbortController();
		callSetupRef.current = setup;
		try {
			clearCallTimeout();
			timeStartConnected.current = null;
			pendingCandidatesRef.current = [];
			remoteIceCandidatesRef.current = [];
			localIceReadyRef.current = false;
			remoteAnswerReceivedRef.current = false;
			setIsConnected(null);
			hasSyncRemoteMediaRef.current = false;
			callTargetRef.current = null;
			isMyCaller.current = !isAnswer;
			if (!isAnswer) {
				const constraints = await getConstraintsLocal(isVideoCall);
				if (setup.signal.aborted) return;
				if (!constraints.audio) {
					void handleEndCall(true);
					return;
				}
				const stream = await openLocalStream(constraints);
				if (setup.signal.aborted) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}
				registerLocalStream(stream);
				const pc = initializePeerConnection();
				if (isVideoCall) {
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
				const sentOverSocket = await sendInitialDescription(setup.signal, WebrtcSignalingType.WEBRTC_SDP_OFFER, compressedOffer, isVideoCall);
				if (sentOverSocket) {
					await sendCallSetup(
						setup.signal,
						(client, session) =>
							client.makeCallPush(
								session,
								dmUserId,
								JSON.stringify({
									offer: compressedOffer,
									callerName,
									callerAvatar,
									callerId: userId,
									isVideoCall,
									channelId,
									sentAt: String(Date.now())
								}),
								channelId,
								userId
							),
						{ shouldSend: () => !timeStartConnected.current }
					).catch((error) => {
						if (!setup.signal.aborted && !timeStartConnected.current) console.warn('Call offer push failed:', error);
					});
				}
				if (!setup.signal.aborted && !remoteAnswerReceivedRef.current && !timeStartConnected.current) {
					startOutgoingCallTimeout(setup.signal, isVideoCall);
				}
			} else {
				const constraints = await getConstraintsLocal(isVideoCall);
				if (constraints.audio && !setup.signal.aborted) {
					dispatch(DMCallActions.setIsInCall(true));
				}
			}
		} catch (error) {
			if (!setup.signal.aborted && !timeStartConnected.current) {
				console.error('Error starting call:', error);
				void handleEndCall(true);
			}
		}
	};

	const sendLocalIceCandidate = async (candidate: RTCIceCandidate) => {
		const session = mezon.sessionRef.current;
		if (!session) return;
		try {
			await mezon.clientRef.current?.forwardWebrtcSignaling(
				session,
				dmUserId,
				WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
				JSON.stringify(candidate),
				channelId,
				userId
			);
		} catch (error) {
			console.warn('Call ICE candidate send failed:', error);
		}
	};

	const sendPendingLocalCandidates = async (pc: RTCPeerConnection) => {
		if (peerConnection.current !== pc) return;
		localIceReadyRef.current = true;
		const candidates = pendingCandidatesRef.current;
		pendingCandidatesRef.current = [];
		for (const candidate of candidates) {
			if (peerConnection.current !== pc) return;
			await sendLocalIceCandidate(candidate);
		}
	};

	const drainRemoteIceCandidates = async (pc: RTCPeerConnection) => {
		if (peerConnection.current !== pc) return;
		const candidates = remoteIceCandidatesRef.current;
		remoteIceCandidatesRef.current = [];
		for (const candidate of candidates) {
			if (peerConnection.current !== pc) return;
			await pc.addIceCandidate(candidate);
		}
	};

	const handleOffer = async (signalingData: any, setup: AbortSignal) => {
		if (!mezon.sessionRef.current) {
			return;
		}
		const offer = new RTCSessionDescription({
			type: 'offer',
			sdp: signalingData.sdp
		});

		const pc = peerConnection.current;
		if (pc && !isMyCaller.current && !localIceReadyRef.current) return;
		const isRenegotiation = !!pc && (pc.remoteDescription || pc.connectionState !== 'new');

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
			await sendPendingLocalCandidates(pc);
		} else {
			clearCallTimeout();
			callTimeout.current = setTimeout(() => {
				if (!setup.aborted && !timeStartConnected.current) void handleEndCall();
			}, CALL_CONNECT_TIMEOUT_MS);
			try {
				const newPc = pc || initializePeerConnection();
				const constraints = await getConstraintsLocal(isShowMeetDM);
				if (setup.aborted) return;
				const stream = await openLocalStream(constraints);
				if (setup.aborted) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}
				registerLocalStream(stream);
				if (isShowMeetDM) {
					setControlState((prev) => ({
						...prev,
						cameraEnabled: true
					}));
				}
				stream.getTracks().forEach((track) => newPc.addTrack(track, stream));

				await newPc.setRemoteDescription(offer);
				await drainRemoteIceCandidates(newPc);
				const answer = await newPc.createAnswer();
				await newPc.setLocalDescription(answer);
				const compressedAnswer = await compress(JSON.stringify(answer));
				await sendInitialDescription(setup, WebrtcSignalingType.WEBRTC_SDP_ANSWER, compressedAnswer, isShowMeetDM).catch((error) => {
					// The server may have forwarded the answer before its ACK timed out.
					if (!isSignalingAckTimeout(error)) throw error;
					if (!setup.aborted) console.warn('Call answer ACK timed out:', error);
				});
				await sendPendingLocalCandidates(newPc);
			} catch (error) {
				if (!setup.aborted) {
					console.error('Error answering call:', error);
					if (timeStartConnected.current && peerConnection.current) {
						await sendPendingLocalCandidates(peerConnection.current);
					} else {
						void handleEndCall();
					}
				}
			}
		}
	};

	const handleAnswer = async (signalingData: any, setup: AbortSignal) => {
		const pc = peerConnection.current;
		if (!pc) return;

		if (!remoteAnswerReceivedRef.current) {
			remoteAnswerReceivedRef.current = true;
			if (isMyCaller.current && !timeStartConnected.current) startOutgoingCallTimeout(setup, isShowMeetDM);
		}
		await pc.setRemoteDescription(signalingData);
		await drainRemoteIceCandidates(pc);
		await sendPendingLocalCandidates(pc);
	};

	const handleICECandidate = async (data: any) => {
		const pc = peerConnection.current;
		if (!pc && !callSetupRef.current) return;
		try {
			if (data) {
				const candidate = new RTCIceCandidate(data);
				if (pc?.remoteDescription) {
					await pc.addIceCandidate(candidate);
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
			const setup = callSetupRef.current?.signal;
			if (!setup) return;
			try {
				switch (signalingData.data_type) {
					case WebrtcSignalingType.WEBRTC_SDP_OFFER: {
						const decompressedData = await decompress(signalingData.json_data);
						if (setup.aborted) return;
						const offer = safeJSONParse(decompressedData || '{}');
						rememberPeerSession(signalingData?.caller_id, getSdpSessionId(offer?.sdp));
						await handleOffer(offer, setup);

						break;
					}

					case WebrtcSignalingType.WEBRTC_SDP_ANSWER: {
						const decompressedData = await decompress(signalingData.json_data);
						if (setup.aborted) return;
						const answer = safeJSONParse(decompressedData || '{}');
						await handleAnswer(answer, setup);
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

	const cancelCallFCMMobile = async (
		isConnected = false,
		peerId = dmUserId,
		callChannelId = channelId,
		callSessionId = getSdpSessionId(peerConnection.current?.localDescription?.sdp)
	) => {
		const bodyFCMMobile = {
			offer: 'CANCEL_CALL',
			isConnected,
			callerId: userId,
			channelId: callChannelId,
			callSessionId,
			sentAt: String(Date.now())
		};
		if (mezon.sessionRef.current) {
			await mezon.clientRef.current?.makeCallPush(mezon.sessionRef.current, peerId, JSON.stringify(bodyFCMMobile), callChannelId, userId);
		}
	};

	const handleEndCall = async (isCallerEndCall = false) => {
		callSetupRef.current?.abort();
		callSetupRef.current = null;
		const callPeerId = callTargetRef.current?.dmUserId || dmUserId;
		const callChannelId = callTargetRef.current?.channelId || channelId;
		const pc = peerConnection.current;
		const callSessionId = getSdpSessionId(pc?.localDescription?.sdp);
		const wasMyCaller = isMyCaller.current;
		const session = mezon.sessionRef.current;
		const client = mezon.clientRef.current;
		try {
			clearCallTimeout();
			setIsConnected(null);
			hasSyncRemoteMediaRef.current = false;

			localStreamRef.current?.getTracks().forEach((track) => track.stop());
			localStreamRef.current = null;
			if (callState.localScreenStream) {
				callState.localScreenStream.getTracks().forEach((track) => track.stop());
			}
			peerConnection.current = null;
			pc?.close();

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
			callTargetRef.current = null;
			pendingCandidatesRef.current = [];
			remoteIceCandidatesRef.current = [];
			localIceReadyRef.current = false;
			remoteAnswerReceivedRef.current = false;
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
			}
			timeStartConnected.current = null;
			const quit =
				!isCallerEndCall && session
					? client?.forwardWebrtcSignaling(session, callPeerId, WebrtcSignalingType.WEBRTC_SDP_QUIT, '', callChannelId, userId)
					: undefined;
			if (wasMyCaller) {
				const relay = async () => {
					if (!session) return;
					await client?.forwardWebrtcSignaling(
						session,
						callPeerId,
						50,
						JSON.stringify({ callSessionId, sentAt: String(Date.now()) }),
						callChannelId,
						userId
					);
				};
				await Promise.allSettled([quit, relay(), cancelCallFCMMobile(false, callPeerId, callChannelId, callSessionId)]);
			} else {
				await quit;
			}
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
				? pickPreferredDevice(inputDevices, getPreferredInputDeviceId())
				: findDevice(inputDevices, SYSTEM_DEFAULT_DEVICE_ID);
			if (nextInput?.deviceId) await changeAudioInputDevice(nextInput.deviceId);
		}

		if (!findDevice(outputDevices, outputDeviceIdRef.current)) {
			const nextOutput = pickPreferredDevice(outputDevices, getPreferredOutputDeviceId());
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
