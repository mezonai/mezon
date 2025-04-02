/* eslint-disable @typescript-eslint/no-empty-function */
'use client';

import { LiveKitRoom } from '@livekit/components-react';
import { generateMeetTokenExternal, selectExternalToken, selectShowCamera, selectShowMicrophone, useAppDispatch, voiceActions } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useMediaPermissions } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { MyVideoConference } from '../VoiceChannel';
import { ControlButton } from './ControlButton';
import { JoinForm } from './JoinForm';
import { VideoPreview } from './VideoPreview';

export default function PreJoinCalling() {
	const [cameraOn, setCameraOn] = useState(false);
	const [micOn, setMicOn] = useState(false);
	const [username, setUsername] = useState('');
	const [audioLevel, setAudioLevel] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const dispatch = useAppDispatch();
	const { code } = useParams<{ code: string }>();

	const getExternalToken = useSelector(selectExternalToken);

	const showMicrophone = useSelector(selectShowMicrophone);
	const showCamera = useSelector(selectShowCamera);
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;

	useEffect(() => {
		return () => {
			// Clean up all resources when component unmounts
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}

			if (micStreamRef.current) {
				micStreamRef.current.getTracks().forEach((track) => track.stop());
				micStreamRef.current = null;
			}

			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}

			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		};
	}, []);

	// Toggle Camera
	const toggleCamera = useCallback(async () => {
		if (cameraOn) {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
			if (videoRef.current) {
				videoRef.current.srcObject = null;
			}

			setCameraOn(false);
			dispatch(voiceActions.setShowCamera(false));
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true });
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				setCameraOn(true);
				dispatch(voiceActions.setShowCamera(true));
				setError(null);
			} catch (err) {
				console.error('Error accessing camera:', err);
				setError('Failed to access camera. Please check your permissions and try again.');
			}
		}
	}, [cameraOn]);

	// Toggle Microphone

	const toggleMic = useCallback(async () => {
		if (micOn) {
			setMicOn(false);
			dispatch(voiceActions.setShowMicrophone(false));
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			if (micStreamRef.current) {
				micStreamRef.current.getTracks().forEach((track) => track.stop());
				micStreamRef.current = null;
			}
			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
				analyserRef.current = null;
			}
			setAudioLevel(0);
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				micStreamRef.current = stream;
				const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
				audioContextRef.current = audioContext;
				const analyser = audioContext.createAnalyser();
				analyserRef.current = analyser;
				const source = audioContext.createMediaStreamSource(stream);
				source.connect(analyser);
				analyser.fftSize = 32;
				const bufferLength = analyser.frequencyBinCount;
				const dataArray = new Uint8Array(bufferLength);
				const updateAudioLevel = () => {
					if (!analyserRef.current) return;
					analyserRef.current.getByteFrequencyData(dataArray);
					const sum = dataArray.reduce((acc, val) => acc + val, 0);
					const avg = sum / bufferLength;
					const normalizedLevel = Math.min(avg / 128, 1);
					setAudioLevel(normalizedLevel);
					if (micStreamRef.current && micStreamRef.current.active) {
						animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
					}
				};
				updateAudioLevel();
				setMicOn(true);
				dispatch(voiceActions.setShowMicrophone(true));

				setError(null);
			} catch (err) {
				console.error('Error accessing microphone:', err);
				setError('Failed to access microphone. Please check your permissions and try again.');
			}
		}
	}, [micOn]);

	const { requestCameraAccess, requestMicrophoneAccess } = useMediaPermissions();

	// Handle Join Meeting
	const joinMeeting = useCallback(async () => {
		requestCameraAccess();
		requestMicrophoneAccess();
		if (!username.trim()) {
			setError('Please enter your name before joining the meeting.');
			return;
		}

		setError(null);
		await dispatch(generateMeetTokenExternal({ token: code as string, displayName: username }));
	}, [dispatch, username, code]);

	const containerRef = useRef<HTMLDivElement | null>(null);

	const handleFullScreen = useCallback(() => {
		if (!containerRef.current) return;

		if (!document.fullscreenElement) {
			containerRef.current
				.requestFullscreen()
				.then(() => dispatch(voiceActions.setFullScreen(true)))
				.catch((err) => {
					console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
				});
		} else {
			document.exitFullscreen().then(() => dispatch(voiceActions.setFullScreen(false)));
		}
	}, [dispatch]);
	const handleLeaveRoom = useCallback(async () => {
		dispatch(voiceActions.resetExternalCall());
	}, [dispatch]);

	return (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<div className="h-screen w-screen">
			{getExternalToken ? (
				<LiveKitRoom
					ref={containerRef}
					id="livekitRoom"
					key={getExternalToken}
					audio={showMicrophone as boolean}
					video={showCamera as boolean}
					token={getExternalToken}
					serverUrl={serverUrl}
					data-lk-theme="default"
					className="h-full"
				>
					<MyVideoConference channel={undefined} onLeaveRoom={handleLeaveRoom} onFullScreen={handleFullScreen} />
				</LiveKitRoom>
			) : (
				<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
					<div className="w-full max-w-3xl px-4 py-8 flex flex-col items-center">
						{/* Header */}
						<div className="text-center mb-4">
							<p className="text-gray-300 mb-1">Choose your audio and video settings for</p>
							<h1 className="text-3xl font-bold">Meeting now</h1>
						</div>

						{/* Video Preview */}
						<div className="w-full max-w-xl bg-zinc-800 rounded-lg overflow-hidden">
							<div className="p-6 flex flex-col items-center">
								<VideoPreview cameraOn={cameraOn} stream={streamRef.current} />
								<JoinForm username={username} setUsername={setUsername} onJoin={joinMeeting} />

								{/* Error message */}
								{error && (
									<div className="w-full mb-4 p-2 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">{error}</div>
								)}

								{/* Controls */}
								<div className="w-full flex items-center justify-center gap-8">
									{/* Camera Toggle */}
									<ControlButton
										onClick={toggleCamera}
										isActive={cameraOn}
										label={cameraOn ? 'Camera on' : 'Camera off'}
										icon={cameraOn ? <Icons.VoiceCameraIcon scale={1.5} /> : <Icons.VoiceCameraDisabledIcon scale={1.5} />}
									/>

									{/* Microphone Toggle */}
									<ControlButton
										onClick={toggleMic}
										isActive={micOn}
										label={micOn ? 'Mic on' : 'Mic off'}
										audioLevel={micOn ? audioLevel : undefined}
										icon={micOn ? <Icons.VoiceMicIcon scale={1.3} /> : <Icons.VoiceMicDisabledIcon scale={1.3} />}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
