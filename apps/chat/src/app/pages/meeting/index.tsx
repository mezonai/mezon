import { JoinForm, MezonSfuVoiceRoom, VideoPreview, type SfuJoinRole } from '@mezon/components';
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
	const [cameraOn] = useState(false);
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
	const streamRef = useRef<MediaStream | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const dispatch = useAppDispatch();
	const { code } = useParams<{ code: string }>();

	const getExternalToken = useSelector(selectExternalToken);
	const getJoinCallExtStatus = useSelector(selectJoinCallExtStatus);
	const getGuestAccessToken = useSelector(selectGuestAccessToken);
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);

	useEffect(() => {
		if (getDisplayName && !username) {
			setUsername(sanitizeUsername(getDisplayName));
		}
	}, [getDisplayName, username]);

	useEffect(() => {
		function decodeJWT(token: string) {
			try {
				const parts = token.split('.');
				if (parts.length !== 3) throw new Error('JWT must have 3 parts');
				const payload = parts[1];
				const decoded = atob(payload);
				return JSON.parse(decoded);
			} catch (error) {
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

			await dispatch(
				generateMeetTokenExternal({
					token: code as string,
					username: trimmed,
					metadata: '',
					isGuest: !isUser as boolean
				})
			);
		},
		[dispatch, username, isUser, code, avatar]
	);

	const handleRefreshToken = useCallback(async () => {
		try {
			const res = await dispatch(
				generateMeetTokenExternal({
					token: code as string,
					username,
					metadata: '',
					isGuest: !isUser
				})
			).unwrap();
			return res?.token;
		} catch (err) {
			console.error('Error refreshing external meet token:', err);
			return undefined;
		}
	}, [dispatch, code, username, isUser]);

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
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<div className="h-screen w-screen flex">
			{getExternalToken ? (
				<div ref={containerRef} className="h-full flex-1 flex">
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
					/>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white flex-1">
					<div className="w-full max-w-3xl px-4 py-8 flex flex-col items-center">
						{/* Header */}
						<div className="text-center mb-4">
							<p className="text-gray-300 mb-1">Choose your audio and video settings for</p>
							<h1 className="text-3xl font-bold">Meeting now</h1>
						</div>

						{/* Video Preview */}
						<div className="w-full max-w-xl bg-zinc-800 rounded-lg">
							<div className="p-6 flex flex-col items-center">
								<VideoPreview avatarExist={getAvatar} cameraOn={cameraOn} stream={streamRef.current} />
								<JoinForm loadingStatus={getJoinCallExtStatus} username={username} setUsername={setUsername} onJoin={joinMeeting} />

								{/* Error message */}
								{error && (
									<div className="w-full mb-4 p-2 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">{error}</div>
								)}
							</div>
						</div>
					</div>

					{permissionsState.showPopup && !getExternalToken && <PermissionsPopup onClose={closePermissionsPopup} />}
				</div>
			)}
		</div>
	);
}
