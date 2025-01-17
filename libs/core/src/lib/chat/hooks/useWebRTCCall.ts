import { audioCallActions, DMCallActions, selectAudioBusyTone, selectIsShowMeetDM, toastActions, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { IMessageTypeCallLog, requestMediaPermission } from '@mezon/utils';
import { safeJSONParse, WebrtcSignalingType } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const STUN_SERVERS = [
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
	peerConnection: RTCPeerConnection | null;
	storedIceCandidates?: RTCIceCandidate[] | null;
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

export function useWebRTCCall(dmUserId: string, channelId: string, userId: string, callerName: string, callerAvatar: string) {
	const [callState, setCallState] = useState<CallState>({
		localStream: null,
		remoteStream: null,
		peerConnection: null,
		storedIceCandidates: null
	});
	const [isAnswerCall, setIsAnswerCall] = useState<boolean>(false);
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const isPlayBusyTone = useSelector(selectAudioBusyTone);
	const mezon = useMezon();
	const dispatch = useAppDispatch();
	const timeStartConnected = useRef<Date | null>(null);
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const callTimeout = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		return () => {
			if (callState.localStream) {
				setIsAnswerCall(false);
				callState.localStream.getTracks().forEach((track) => track.stop());
			}
			timeStartConnected.current = null;
		};
	}, [callState.localStream]);

	// Initialize peer connection with proper configuration
	const initializePeerConnection = useCallback(() => {
		const pc = new RTCPeerConnection(RTCConfig);

		pc.onicecandidate = async (event) => {
			if (event.candidate && pc?.signalingState !== 'have-local-offer') {
				try {
					await mezon.socketRef.current?.forwardWebrtcSignaling(
						dmUserId,
						WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
						JSON.stringify(event.candidate),
						channelId,
						userId
					);
				} catch (error) {
					console.error('Error sending ICE candidate:', error);
				}
			}
		};

		pc.ontrack = (event) => {
			const remoteStream = event.streams[0];
			setCallState((prev) => ({
				...prev,
				remoteStream
			}));

			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = remoteStream;
			}

			remoteStream.getVideoTracks().forEach((track) => {
				track.onmute = () => {
					dispatch(audioCallActions.setIsRemoteVideo(false));
				};

				track.onunmute = () => {
					dispatch(audioCallActions.setIsRemoteVideo(true));
				};
			});

			remoteStream.getAudioTracks().forEach((track) => {
				track.onmute = () => {
					dispatch(audioCallActions.setIsRemoteAudio(false));
				};
				track.onunmute = () => {
					dispatch(audioCallActions.setIsRemoteAudio(true));
				};
			});
		};

		pc.oniceconnectionstatechange = () => {
			if (pc.iceConnectionState === 'connected') {
				timeStartConnected.current = new Date();
				dispatch(toastActions.addToast({ message: 'Connection connected', type: 'success', autoClose: 3000 }));
				dispatch(audioCallActions.setIsJoinedCall(true));
				dispatch(audioCallActions.setIsDialTone(false));
				mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, 0, '', channelId, userId);
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

		// no need to handle negotiationneeded event
		// pc.onnegotiationneeded = async () => {
		// 	try {
		// 		const offer = await pc.createOffer();
		// 		await pc.setLocalDescription(offer);
		//
		// 		const compressedOffer = await compress(JSON.stringify(offer));
		// 		await mezon.socketRef.current?.forwardWebrtcSignaling(
		// 			dmUserId,
		// 			WebrtcSignalingType.WEBRTC_SDP_OFFER,
		// 			compressedOffer,
		// 			channelId,
		// 			userId
		// 		);
		// 	} catch (error) {
		// 		console.error('Error during negotiation:', error);
		// 	}
		// };

		return pc;
	}, [mezon.socketRef, dmUserId, channelId, userId]);

	// Start a call
	const startCall = async (isVideoCall: boolean, isAnswer: boolean) => {
		try {
			setIsAnswerCall(isAnswer);
			let permissionCameraGranted = false;
			let permissionMicroGranted = false;

			const microphoneGranted = await requestMediaPermission('audio');
			if (microphoneGranted !== 'granted') {
				dispatch(
					toastActions.addToast({
						message: 'Microphone permission is required',
						type: 'warning',
						autoClose: 1000
					})
				);
			} else {
				permissionMicroGranted = true;
			}
			if (isVideoCall) {
				const cameraGranted = await requestMediaPermission('video');
				if (cameraGranted !== 'granted') {
					dispatch(toastActions.addToast({ message: 'Camera permission is required', type: 'warning', autoClose: 1000 }));
				} else {
					permissionCameraGranted = true;
				}
			}
			dispatch(DMCallActions.setIsShowMeetDM(isVideoCall));
			dispatch(DMCallActions.setIsMuteMicrophone(false));
			const constraints = {
				audio: permissionMicroGranted,
				video: isVideoCall && permissionCameraGranted
			};

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			const pc = initializePeerConnection();

			// Add tracks to peer connection
			stream.getTracks().forEach((track) => {
				pc.addTrack(track, stream);
			});
			if (!isAnswer) {
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
			}
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
				handleEndCall();
			}, 30000);

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}
			// Update state
			setCallState({
				localStream: stream,
				remoteStream: null,
				peerConnection: pc
			});
		} catch (error) {
			console.error('Error starting call:', error);
			handleEndCall();
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
					if (isAnswerCall) {
						await updatePeerConnectionOffer();
					}
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
					if (callState.peerConnection.signalingState !== 'have-local-offer') {
						console.warn('PeerConnection is not in the correct state to set remote answer');
						return;
					}
					await callState.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

					if (callTimeout.current) {
						clearTimeout(callTimeout.current);
						callTimeout.current = null;
					}

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
						if (callState.peerConnection?.remoteDescription?.type) {
							await callState.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
						} else {
							console.warn('Remote description not set yet, storing candidate');
							if (!callState.storedIceCandidates) {
								callState.storedIceCandidates = [];
							}
							callState.storedIceCandidates.push(new RTCIceCandidate(candidate));
						}
					}
					break;
				}
				/// case other call
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
	};

	const handleOtherCall = async (otherCallerId: string, otherChannelId: string) => {
		await mezon.socketRef.current?.forwardWebrtcSignaling(otherCallerId, 5, '', otherChannelId, userId);
	};

	const updatePeerConnectionOffer = async () => {
		try {
			const offer = await callState.peerConnection?.createOffer();
			await callState.peerConnection?.setLocalDescription(offer);

			const compressedOffer = await compress(JSON.stringify(offer));
			await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_OFFER, compressedOffer, channelId, userId);
		} catch (error) {
			console.error('Error creating and forwarding offer:', error);
		}
	};

	// End call and cleanup
	const handleEndCall = async () => {
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
			const bodyFCMMobile = {
				offer: 'CANCEL_CALL'
			};
			await mezon.socketRef.current?.makeCallPush(dmUserId, JSON.stringify(bodyFCMMobile), channelId, userId);
		}

		try {
			if (callTimeout.current) {
				clearTimeout(callTimeout.current);
				callTimeout.current = null;
			}

			if (callState.localStream) {
				callState.localStream.getTracks().forEach((track) => track.stop());
			}

			if (callState.peerConnection) {
				callState.peerConnection.close();
			}

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = null;
			}
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = null;
			}

			await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, 4, '', channelId, userId);
			dispatch(DMCallActions.setIsInCall(false));
			if (!isPlayBusyTone) {
				dispatch(audioCallActions.setIsEndTone(true));
			}
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(audioCallActions.setIsRemoteAudio(false));
			dispatch(audioCallActions.setIsRemoteVideo(false));
			dispatch(DMCallActions.setIsShowMeetDM(false));
			dispatch(audioCallActions.startDmCall({}));
			dispatch(audioCallActions.setUserCallId(''));
			dispatch(DMCallActions.removeAll());
			setCallState({
				localStream: null,
				remoteStream: null,
				peerConnection: null
			});
		} catch (error) {
			console.error('Error ending call:', error);
		}
	};

	// Toggle audio/video
	const toggleAudio = async () => {
		if (!callState.localStream) return;
		const audioTracks = callState.localStream.getAudioTracks();

		if (audioTracks.length === 0) {
			try {
				const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
				const audioTrack = audioStream.getAudioTracks()[0];

				callState.localStream.addTrack(audioTrack);

				const senders = callState.peerConnection?.getSenders() || [];
				const audioSender = senders.find((sender) => sender.track?.kind === 'audio');

				if (audioSender) {
					await audioSender.replaceTrack(audioTrack);
				} else {
					callState.peerConnection?.addTrack(audioTrack, callState.localStream);
				}
			} catch (error) {
				console.error('Error adding audio track:', error);
			}
		} else {
			audioTracks.forEach((track) => {
				if (track.enabled) {
					track.stop();
					if (callState.localStream) {
						callState.localStream.removeTrack(track);
					}

					const senders = callState.peerConnection?.getSenders() || [];
					const audioSender = senders.find((sender) => sender.track === track);
					if (audioSender) {
						callState.peerConnection?.removeTrack(audioSender);
					}
				} else {
					track.enabled = true;
				}
			});
		}
	};

	const toggleVideo = async () => {
		if (!callState.localStream) return;
		let permissionCameraGranted = false;

		const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
		if (cameraPermission.state === 'granted') {
			permissionCameraGranted = true;
		}

		if (!isShowMeetDM && !permissionCameraGranted) {
			dispatch(toastActions.addToast({ message: 'Camera is not available', type: 'warning', autoClose: 1000 }));
			return;
		}

		const videoTracks = callState.localStream.getVideoTracks();
		if (videoTracks.length === 0) {
			try {
				const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
				const videoTrack = videoStream.getVideoTracks()[0];

				callState.localStream.addTrack(videoTrack);
				const senders = callState.peerConnection?.getSenders() || [];
				const videoSender = senders.find((sender) => sender.track?.kind === 'video');
				if (videoSender) {
					await videoSender.replaceTrack(videoTrack);
				} else {
					callState.peerConnection?.addTrack(videoTrack, callState.localStream);
				}

				if (localVideoRef.current) {
					localVideoRef.current.srcObject = callState.localStream;
				}
			} catch (error) {
				console.error('Error adding video track:', error);
			}
		} else {
			videoTracks.forEach((track) => {
				if (track.enabled) {
					track.stop();
					if (callState.localStream) {
						callState.localStream.removeTrack(track);
					}

					const senders = callState.peerConnection?.getSenders() || [];
					const videoSender = senders.find((sender) => sender.track === track);
					if (videoSender) {
						callState.peerConnection?.removeTrack(videoSender);
					}
				} else {
					track.enabled = true;
				}
			});
		}

		dispatch(DMCallActions.setIsShowMeetDM(!isShowMeetDM));
	};

	return {
		callState,
		timeStartConnected,
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		handleSignalingMessage,
		handleOtherCall,
		localVideoRef,
		remoteVideoRef
	};
}
