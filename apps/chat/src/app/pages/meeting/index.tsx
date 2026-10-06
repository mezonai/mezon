import {
	BackgroundSelector,
	JoinForm,
	MediaPipeBackgroundProcessor,
	MezonSfuVoiceRoom,
	VideoPreview,
	VisualEffectsIcon,
	type BackgroundMode,
	type SfuJoinRole
} from '@mezon/components';
import {
	authActions,
	generateMeetTokenExternal,
	selectAllAccount,
	selectExternalToken,
	selectGuestAccessToken,
	selectJoinCallExtStatus,
	selectVoiceFullScreen,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { GUEST_NAME } from '@mezon/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

// Permissions popup component
const PermissionsPopup = React.memo(({ onClose }: { onClose: () => void }) => {
	return (
		<div
			className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
			role="dialog"
			aria-labelledby="permissions-popup-title"
			aria-describedby="permissions-popup-description"
		>
			<div className="bg-zinc-800 p-6 rounded-lg max-w-md w-full">
				<h3 id="permissions-popup-title" className="text-xl font-bold mb-3">
					Camera and Microphone Access Required
				</h3>
				<p id="permissions-popup-description" className="text-gray-300 mb-4">
					Please enable access to your camera and/or microphone to use the meeting features.
				</p>
				<ol className="list-decimal list-inside mb-4 text-gray-300 space-y-2">
					<li>Click the camera/lock icon in your browser's address bar</li>
					<li>Select "Allow" for camera and microphone permissions</li>
					<li>Refresh the page after enabling permissions</li>
				</ol>
				<div className="flex gap-3">
					<button
						onClick={onClose}
						className="w-1/2 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md font-medium transition-colors"
						aria-label="Continue without enabling permissions"
					>
						Continue Anyway
					</button>
					<button
						onClick={() => window.location.reload()}
						className="w-1/2 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
						aria-label="Refresh the page"
					>
						Refresh Page
					</button>
				</div>
			</div>
		</div>
	);
});

// Floating In-Meeting Virtual Background menu
const InMeetingBackgroundMenu = React.memo(
	({ selectedMode, onSelectMode }: { selectedMode: BackgroundMode | null; onSelectMode: (mode: BackgroundMode | null) => void }) => {
		const [isOpen, setIsOpen] = useState(false);
		const menuRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			const handleClickOutside = (e: MouseEvent) => {
				if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
					setIsOpen(false);
				}
			};
			if (isOpen) {
				document.addEventListener('mousedown', handleClickOutside);
			}
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, [isOpen]);

		return (
			<div className="relative" ref={menuRef}>
				<button
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur transition-all"
					title="Backgrounds"
				>
					<VisualEffectsIcon className="w-4 h-4 text-white" />
					<span>Backgrounds</span>
				</button>
				{isOpen && (
					<div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-3 bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-2xl backdrop-blur-md z-50">
						<BackgroundSelector selectedMode={selectedMode} onSelectMode={onSelectMode} />
					</div>
				)}
			</div>
		);
	}
);

const sanitizeUsername = (val: string) =>
	val
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.slice(0, 12);

export default function PreJoinCalling() {
	const { t } = useTranslation('common');
	const account = useSelector(selectAllAccount);
	const getDisplayName = account?.user?.display_name || account?.user?.username;
	const getAvatar = account?.user?.avatar_url;

	const [cameraOn, setCameraOn] = useState(false);
	const [selectedBg, setSelectedBg] = useState<BackgroundMode | null>(null);
	const selectedBgRef = useRef<BackgroundMode | null>(null);
	const [showBgSelector, setShowBgSelector] = useState(false);
	const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
	const [processorCanvas, setProcessorCanvas] = useState<HTMLCanvasElement | null>(null);
	const [customVideoTrack, setCustomVideoTrack] = useState<MediaStreamTrack | null>(null);

	const [username, setUsername] = useState(() => sanitizeUsername(getDisplayName || ''));
	const [joinRole, setJoinRole] = useState<SfuJoinRole>('speaker');
	const [avatar, setAvatar] = useState('');
	const [error, setError] = useState<string | null>(null);

	// State for permissions
	const [permissionsState, setPermissionsState] = useState({
		camera: false,
		microphone: false,
		showPopup: false
	});

	const rawStreamRef = useRef<MediaStream | null>(null);
	const processorRef = useRef<MediaPipeBackgroundProcessor | null>(null);

	const dispatch = useAppDispatch();
	const { code } = useParams<{ code: string }>();

	const getExternalToken = useSelector(selectExternalToken);
	const getJoinCallExtStatus = useSelector(selectJoinCallExtStatus);
	const getGuestAccessToken = useSelector(selectGuestAccessToken);
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);

	useEffect(() => {
		function decodeJWT(token: string) {
			try {
				const parts = token.split('.');
				if (parts.length !== 3) throw new Error('JWT must have 3 parts');
				const payload = parts[1];
				const decoded = atob(payload);
				return JSON.parse(decoded);
			} catch (err) {
				toast.error(t('invalidJWT'));
				return {};
			}
		}

		function createGuestSessionData(token: string) {
			const payload = decodeJWT(token);
			const now = Math.floor(Date.now() / 1000);
			return {
				created: false,
				token,
				created_at: now,
				expires_at: payload.exp,
				refresh_expires_at: undefined,
				username: payload.usn || payload.usr || payload.sub || GUEST_NAME,
				user_id: payload.uid?.toString(),
				vars: payload.vrs || {},
				is_remember: false
			};
		}

		if (getGuestAccessToken && getGuestAccessToken !== '0') {
			const session = createGuestSessionData(getGuestAccessToken as string);
			dispatch(authActions.setSession(session));
			dispatch(authActions.checkSessionWithToken());
		}
	}, [getGuestAccessToken, dispatch, t]);

	useEffect(() => {
		if (getJoinCallExtStatus === 'error') {
			setError('Your session has expired. Please try again.');
		}
	}, [getJoinCallExtStatus]);

	const serverUrl = process.env.NX_CHAT_APP_SFU_WS_URL || process.env.NX_CHAT_APP_MEET_WS_URL || '';

	const closePermissionsPopup = useCallback(() => {
		setPermissionsState((prev) => ({
			...prev,
			showPopup: false
		}));
	}, []);

	// Clean up all resources when component unmounts
	useEffect(() => {
		return () => {
			if (rawStreamRef.current) {
				rawStreamRef.current.getTracks().forEach((track) => track.stop());
				rawStreamRef.current = null;
			}

			if (processorRef.current) {
				processorRef.current.destroy();
				processorRef.current = null;
			}
		};
	}, []);

	// Auto initialize camera stream for preview on mount
	useEffect(() => {
		let active = true;

		const initCamera = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						width: { ideal: 1280 },
						height: { ideal: 720 },
						facingMode: 'user'
					},
					audio: false
				});

				if (!active) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}

				rawStreamRef.current = stream;

				if (!processorRef.current) {
					processorRef.current = new MediaPipeBackgroundProcessor();
				}

				const outStream = await processorRef.current.start(stream, selectedBgRef.current);
				if (!active) {
					outStream.getTracks().forEach((track) => track.stop());
					return;
				}

				setProcessedStream(outStream);
				setProcessorCanvas(processorRef.current.getCanvas());
				setCustomVideoTrack(processorRef.current.getVideoTrack());
				setCameraOn(true);
				setPermissionsState((prev) => ({ ...prev, camera: true }));
			} catch (err) {
				console.warn('Camera preview not available:', err);
			}
		};

		initCamera();

		return () => {
			active = false;
		};
	}, []);

	// Handle background selection
	const handleSelectBg = useCallback((mode: BackgroundMode | null) => {
		setSelectedBg(mode);
		selectedBgRef.current = mode;
		if (processorRef.current) {
			processorRef.current.setMode(mode);
		}
	}, []);

	const isUser = !!(getDisplayName && getAvatar);

	// Handle Join Meeting
	const joinMeeting = useCallback(
		async (role: SfuJoinRole = 'speaker') => {
			const trimmed = username.trim();
			if (!trimmed) {
				setError('Please enter your name before joining the meeting.');
				return;
			}

			if (!/^[a-z0-9]{1,12}$/.test(trimmed)) {
				setError('Username must be 1 to 12 characters, containing only 0-9 and a-z.');
				return;
			}

			setError(null);
			setAvatar(avatar as string);
			setJoinRole(role);

			if (cameraOn) {
				dispatch(voiceActions.setShowCamera(true));
			}

			const metadata = trimmed || avatar || getAvatar ? `${trimmed};${avatar || getAvatar || ''}` : '';
			await dispatch(
				generateMeetTokenExternal({
					token: code as string,
					username: trimmed,
					metadata,
					isGuest: !isUser as boolean
				})
			);
		},
		[dispatch, username, isUser, code, avatar, getAvatar, cameraOn]
	);

	const handleRefreshToken = useCallback(async () => {
		try {
			const refreshMetadata = username || avatar || getAvatar ? `${username};${avatar || getAvatar || ''}` : '';
			const res = await dispatch(
				generateMeetTokenExternal({
					token: code as string,
					username,
					metadata: refreshMetadata,
					isGuest: !isUser
				})
			).unwrap();
			return res?.token;
		} catch (err) {
			console.error('Error refreshing external meet token:', err);
			return undefined;
		}
	}, [dispatch, code, username, avatar, getAvatar, isUser]);

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

	const toggleChat = useCallback(() => {
		dispatch(voiceActions.setToggleChatBox());
	}, [dispatch]);

	return (
		<div className="h-screen w-screen flex bg-black">
			{getExternalToken ? (
				<div ref={containerRef} className="h-full flex-1 flex relative">
					<MezonSfuVoiceRoom
						token={getExternalToken}
						joinRole={joinRole}
						roomId={code as string}
						serverUrl={serverUrl}
						channelLabel={'Meeting Room'}
						isChatOpen={false}
						isFullScreen={!!isVoiceFullScreen}
						isExternalCalling={true}
						onRefreshToken={handleRefreshToken}
						onLeaveRoom={handleLeaveRoom}
						onFullScreen={handleFullScreen}
						onToggleChat={toggleChat}
						username={username}
						customVideoTrack={
							cameraOn
								? customVideoTrack && customVideoTrack.readyState === 'live'
									? customVideoTrack
									: processorRef.current?.getVideoTrack()
								: null
						}
					/>
					{cameraOn && (
						<div className="absolute top-4 right-4 z-40">
							<InMeetingBackgroundMenu selectedMode={selectedBg} onSelectMode={handleSelectBg} />
						</div>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white flex-1 p-4 overflow-y-auto">
					<div className="w-full max-w-xl flex flex-col items-center">
						{/* Header */}
						<div className="text-center mb-6">
							<p className="text-gray-400 text-sm mb-1">Choose your audio and video settings for</p>
							<h1 className="text-2xl font-bold">Meeting now</h1>
						</div>

						{/* Video Preview Card */}
						<div className="w-full bg-zinc-800/90 border border-zinc-700/60 rounded-xl p-5 shadow-2xl backdrop-blur flex flex-col items-center">
							<VideoPreview
								avatarExist={getAvatar}
								cameraOn={cameraOn}
								stream={processedStream}
								canvas={processorCanvas}
								onEffectClick={() => setShowBgSelector((prev) => !prev)}
								isEffectActive={showBgSelector || !!selectedBg}
							/>

							{/* 5 Selectable Backgrounds - Toggled from camera view button */}
							{showBgSelector && (
								<div className="w-full mb-3 p-3 bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-xl transition-all relative">
									<div className="flex justify-end mb-1">
										<button
											type="button"
											onClick={() => setShowBgSelector(false)}
											className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
											title="Close"
										>
											✕
										</button>
									</div>
									<BackgroundSelector selectedMode={selectedBg} onSelectMode={handleSelectBg} disabled={!cameraOn} />
								</div>
							)}

							{/* Join Form */}
							<div className="w-full mt-2">
								<JoinForm loadingStatus={getJoinCallExtStatus} username={username} setUsername={setUsername} onJoin={joinMeeting} />
							</div>

							{/* Error message */}
							{error && (
								<div className="w-full mt-3 p-2 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm text-center">
									{error}
								</div>
							)}
						</div>
					</div>

					{permissionsState.showPopup && !getExternalToken && <PermissionsPopup onClose={closePermissionsPopup} />}
				</div>
			)}
		</div>
	);
}
