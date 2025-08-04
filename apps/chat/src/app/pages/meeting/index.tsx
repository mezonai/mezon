import { LiveKitRoom } from '@livekit/components-react';
import { JoinForm, MyVideoConference, VideoPreview } from '@mezon/components';
import {
	authActions,
	generateMeetTokenExternal,
	selectAllAccount,
	selectExternalToken,
	selectGuestAccessToken,
	selectGuestUserId,
	selectJoinCallExtStatus,
	selectShowCamera,
	selectShowMicrophone,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { GUEST_NAME, IS_MOBILE } from '@mezon/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ChatStreamExternal from './ChatMeeting';

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

export default function PreJoinCalling() {
	const [cameraOn, setCameraOn] = useState(false);
	const [username, setUsername] = useState('');
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
	const getGuestUserId = useSelector(selectGuestUserId);
	const getGuestAccessToken = useSelector(selectGuestAccessToken);

	function decodeJWT(token: string) {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) throw new Error('JWT must have 3 parts');
			const payload = parts[1];
			const decoded = atob(payload);
			return JSON.parse(decoded);
		} catch (error) {
			toast.error('Invalid JWT');
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

	useEffect(() => {
		if (getGuestAccessToken && getGuestAccessToken !== '0') {
			const session = createGuestSessionData(getGuestAccessToken as string);
			dispatch(authActions.setSession(session));
			dispatch(authActions.checkSessionWithToken());
		}
	}, [getGuestAccessToken, dispatch]);

	useEffect(() => {
		if (getJoinCallExtStatus === 'error') {
			setError('Your session has expired. Please try again.');
		}
	}, [getJoinCallExtStatus]);

	const showMicrophone = useSelector(selectShowMicrophone);
	const showCamera = useSelector(selectShowCamera);
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;

	const account = useSelector(selectAllAccount);
	const getDisplayName = account?.user?.display_name || account?.user?.username;
	const getAvatar = account?.user?.avatar_url;

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

	const isUser = getDisplayName && getAvatar;
	const isGuest = getGuestAccessToken && getGuestUserId && getGuestUserId !== '0';

	// Handle Join Meeting
	const joinMeeting = useCallback(async () => {
		if (!username.trim() && !getDisplayName) {
			setError('Please enter your name before joining the meeting.');
			return;
		}

		setError(null);
		setAvatar(avatar as string);
		const fullStringNameAndAvatar = isUser
			? JSON.stringify({ extName: getDisplayName, extAvatar: getAvatar })
			: JSON.stringify({ extName: username });

		await dispatch(generateMeetTokenExternal({ token: code as string, displayName: fullStringNameAndAvatar, isGuest: !isUser as boolean }));
	}, [dispatch, username, getDisplayName, code]);

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
		<div className="h-screen w-screen flex">
			{getExternalToken ? (
				<LiveKitRoom
					ref={containerRef}
					id="livekitRoom"
					key={getExternalToken}
					audio={IS_MOBILE as boolean}
					video={showCamera as boolean}
					token={getExternalToken}
					serverUrl={serverUrl}
					data-lk-theme="default"
					className="h-full flex-1 flex"
				>
					<MyVideoConference
						isExternalCalling={true}
						channelLabel={'Private Room'}
						onLeaveRoom={handleLeaveRoom}
						onFullScreen={handleFullScreen}
					/>
					<ChatStreamExternal />
				</LiveKitRoom>
			) : (
				<div className="flex flex-col items-center justify-center min-h-screen bg-black text-white flex-1">
					<div className="w-full max-w-3xl px-4 py-8 flex flex-col items-center">
						{/* Header */}
						<div className="text-center mb-4">
							<p className="text-gray-300 mb-1">Choose your audio and video settings for</p>
							<h1 className="text-3xl font-bold">Meeting now</h1>
						</div>

						{/* Video Preview */}
						<div className="w-full max-w-xl bg-zinc-800 rounded-lg overflow-hidden">
							<div className="p-6 flex flex-col items-center">
								<VideoPreview avatarExist={getAvatar} cameraOn={cameraOn} stream={streamRef.current} />
								<JoinForm
									displayNameExisted={getDisplayName}
									loadingStatus={getJoinCallExtStatus}
									username={username}
									setUsername={setUsername}
									onJoin={joinMeeting}
								/>

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
