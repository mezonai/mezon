'use client';

import { createExternalMezonMeet, useAppDispatch } from '@mezon/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PreJoinCalling() {
	const [cameraOn, setCameraOn] = useState(false);
	const [micOn, setMicOn] = useState(false);
	const [username, setusername] = useState('');
	const [audioLevel, setAudioLevel] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const dispatch = useAppDispatch();
	const { meetingId } = useParams<{ meetingId: string }>();

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
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true });
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				setCameraOn(true);
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
				setError(null);
			} catch (err) {
				console.error('Error accessing microphone:', err);
				setError('Failed to access microphone. Please check your permissions and try again.');
			}
		}
	}, [micOn]);

	// Handle Join Meeting
	const joinMeeting = useCallback(async () => {
		await dispatch(createExternalMezonMeet());
	}, [dispatch]);

	return (
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
						<div className="w-full aspect-video bg-zinc-900 rounded-lg mb-6 relative overflow-hidden">
							<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
							{!cameraOn && (
								<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
									<div className="w-24 h-24 bg-zinc-700 rounded-full flex items-center justify-center">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 text-white">
											<circle cx="12" cy="8" r="5" />
											<path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" />
										</svg>
									</div>
								</div>
							)}
						</div>

						{/* Name Input and Join Button */}
						<div className="w-full flex gap-2 mb-6">
							<input
								type="text"
								placeholder="Enter name"
								value={username}
								onChange={(e) => setusername(e.target.value)}
								className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
							/>
							<button onClick={joinMeeting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-medium">
								Join now
							</button>
						</div>

						{/* Error message */}
						{error && <div className="w-full mb-4 p-2 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">{error}</div>}

						{/* Controls */}
						<div className="w-full flex items-center justify-center gap-8">
							{/* Camera Toggle */}
							<button onClick={toggleCamera} className="flex flex-col items-center gap-2">
								<div
									className={`w-12 h-12 rounded-full flex items-center justify-center ${cameraOn ? 'bg-indigo-600' : 'bg-zinc-700'}`}
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										className={`w-6 h-6 ${cameraOn ? 'text-white' : 'text-gray-300'}`}
									>
										<path
											d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
										{!cameraOn && <line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round" strokeLinejoin="round" />}
									</svg>
								</div>
								<span className="text-sm text-gray-300">{cameraOn ? 'Camera on' : 'Camera off'}</span>
							</button>

							{/* Microphone Toggle */}
							<button onClick={toggleMic} className="flex flex-col items-center gap-2 relative">
								{/* Audio level indicator - positioned behind the button */}
								{micOn && (
									<div className="absolute inset-0 flex items-center justify-center -top-5">
										<div className="w-[56px] h-[56px]">
											<svg viewBox="0 0 100 100" className="w-full h-full">
												<circle
													cx="50"
													cy="50"
													r="46"
													fill="none"
													stroke="rgba(79, 70, 229, 0.5)"
													strokeWidth="10"
													strokeDasharray={`${audioLevel * 290} 290`}
													strokeDashoffset="0"
													transform="rotate(-90 50 50)"
												/>
											</svg>
										</div>
									</div>
								)}

								{/* Mic button */}
								<div
									className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${micOn ? 'bg-indigo-600' : 'bg-zinc-700'}`}
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										className={`w-6 h-6 ${micOn ? 'text-white' : 'text-gray-300'}`}
									>
										<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M19 10v2a7 7 0 01-14 0v-2" strokeLinecap="round" strokeLinejoin="round" />
										<line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" />
										<line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" strokeLinejoin="round" />
										{!micOn && <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />}
									</svg>
								</div>

								<span className="text-sm text-gray-300">{micOn ? 'Mic on' : 'Mic off'}</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
