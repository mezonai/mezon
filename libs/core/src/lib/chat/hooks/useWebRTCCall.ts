import { audioCallActions, DMCallActions, selectIsShowMeetDM, toastActions, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { WebrtcSignalingType } from 'mezon-js';
import { useCallback, useRef, useState } from 'react';
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

export function useWebRTCCall(dmUserId: string, channelId: string, userId: string) {
	const [callState, setCallState] = useState<CallState>({
		localStream: null,
		remoteStream: null,
		peerConnection: null,
		storedIceCandidates: null
	});
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const mezon = useMezon();
	const dispatch = useAppDispatch();

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);

	// Initialize peer connection with proper configuration
	const initializePeerConnection = useCallback(() => {
		const pc = new RTCPeerConnection(RTCConfig);

		pc.onicecandidate = async (event) => {
			if (event.candidate) {
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
				dispatch(toastActions.addToast({ message: 'Connection connected', type: 'success', autoClose: 3000 }));
			}
			if (pc.iceConnectionState === 'disconnected') {
				dispatch(toastActions.addToast({ message: 'Connection disconnected', type: 'warning', autoClose: 3000 }));
				handleEndCall();
			}
		};

		pc.onnegotiationneeded = async () => {
			try {
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);

				const compressedOffer = await compress(JSON.stringify(offer));
				await mezon.socketRef.current?.forwardWebrtcSignaling(
					dmUserId,
					WebrtcSignalingType.WEBRTC_SDP_OFFER,
					compressedOffer,
					channelId,
					userId
				);
			} catch (error) {
				console.error('Error during negotiation:', error);
			}
		};

		return pc;
	}, [mezon.socketRef, dmUserId, channelId, userId]);

	// Start a call
	const startCall = async (isVideoCall: boolean) => {
		try {
			let permissionCameraGranted = false;
			let permissionMicroGranted = false;
			// Check camera permission
			const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
			if (cameraPermission.state === 'granted') {
				permissionCameraGranted = true;
			} else if (isVideoCall) {
				dispatch(toastActions.addToast({ message: 'Camera is not available', type: 'warning', autoClose: 1000 }));
			} else {
				/* empty */
			}

			// Check microphone permission
			const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
			if (microphonePermission.state === 'granted') {
				permissionMicroGranted = true;
			} else {
				dispatch(toastActions.addToast({ message: 'Micro is not available', type: 'warning', autoClose: 1000 }));
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
			// Create and set local description
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			// Update state
			setCallState({
				localStream: stream,
				remoteStream: null,
				peerConnection: pc
			});
			// Send offer through signaling server
			const compressedOffer = await compress(JSON.stringify(offer));
			await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_OFFER, compressedOffer, channelId, userId);

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}
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
					const offer = JSON.parse(decompressedData || '{}');

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
					const answer = JSON.parse(decompressedData || '{}');
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
					const candidate = JSON.parse(signalingData?.json_data || '{}');
					if (candidate) {
						if (callState.peerConnection?.remoteDescription?.type) {
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

	// End call and cleanup
	const handleEndCall = async () => {
		try {
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
			dispatch(audioCallActions.setIsEndTone(true));
			dispatch(audioCallActions.setIsRingTone(false));
			dispatch(audioCallActions.setIsRemoteAudio(false));
			dispatch(audioCallActions.setIsRemoteVideo(false));
			dispatch(DMCallActions.setIsShowMeetDM(false));
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
		startCall,
		handleEndCall,
		toggleAudio,
		toggleVideo,
		handleSignalingMessage,
		localVideoRef,
		remoteVideoRef
	};
}
