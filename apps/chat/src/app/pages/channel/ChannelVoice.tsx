import { loadUserChoices, saveUserChoices } from '@livekit/components-core';
import { RoomContext } from '@livekit/components-react';
import '@livekit/components-styles';

import { EmojiSuggestionProvider, useAuth } from '@mezon/core';
import {
	appActions,
	generateMeetToken,
	getStore,
	handleParticipantVoiceState,
	selectCurrentChannelClanId,
	selectCurrentChannelId,
	selectCurrentChannelLabel,
	selectCurrentChannelMeetingCode,
	selectCurrentChannelPrivate,
	selectCurrentChannelType,
	selectCurrentClanId,
	selectCurrentClanName,
	selectIsShowChatVoice,
	selectIsShowSettingFooter,
	selectStatusMenu,
	selectTokenJoinVoice,
	selectVoiceFullScreen,
	selectVoiceInfo,
	selectVoiceJoined,
	selectVoiceOpenPopOut,
	useAppDispatch,
	voiceActions
} from '@mezon/store';

import { MyVideoConference, PreJoinVoiceChannel } from '@mezon/components';
import { ParticipantMeetState, isLinuxDesktop, isWindowsDesktop, useLastCallback } from '@mezon/utils';
import type { RoomConnectOptions } from 'livekit-client';
import { Room } from 'livekit-client';
import { ChannelType } from 'mezon-js';
import type { ReactNode, RefObject } from 'react';
import React, { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo } from 'react';
import { useSelector } from 'react-redux';
import ChatStream from '../chatStream';
import { useLowCPUOptimizer } from './hooks/useLowCPUOptimizer';

interface VoicePreJoinWrapperProps {
	loading: boolean;
	handleJoinRoom: () => void;
}

const VoicePreJoinWrapper = memo(({ loading, handleJoinRoom }: VoicePreJoinWrapperProps) => {
	const channelLabel = useSelector(selectCurrentChannelLabel);
	const channelId = useSelector(selectCurrentChannelId);
	const channelMeetingCode = useSelector(selectCurrentChannelMeetingCode);
	const channelClanId = useSelector(selectCurrentChannelClanId);
	const voiceInfo = useSelector(selectVoiceInfo);
	const isJoined = useSelector(selectVoiceJoined);

	const isCurrentChannel = isJoined && voiceInfo?.channelId === channelId;

	return (
		<PreJoinVoiceChannel
			channel_label={channelLabel}
			channel_id={channelId as string}
			roomName={channelMeetingCode}
			loading={loading}
			handleJoinRoom={handleJoinRoom}
			clan_id={channelClanId}
			isCurrentChannel={isCurrentChannel}
		/>
	);
});

interface VoiceConferenceContainerProps {
	containerRef: RefObject<HTMLDivElement>;
	token: string;
	isOpenPopOut?: boolean;
	isVoiceFullScreen?: boolean;
	children: ReactNode;
}

interface VoiceConferenceContentProps {
	room: Room;
	token: string;
	serverUrl: string;
	voiceInfo: ReturnType<typeof selectVoiceInfo>;
	handleLeaveRoom: (self?: boolean) => Promise<void>;
	handleFullScreen: () => void;
	handleJoinRoom: () => void;
	isShowChatVoice: boolean;
	toggleChat: () => void;
}

const VoiceConferenceContent = memo(
	({
		room,
		token,
		serverUrl,
		voiceInfo,
		handleLeaveRoom,
		handleFullScreen,
		handleJoinRoom,
		isShowChatVoice,
		toggleChat
	}: VoiceConferenceContentProps) => {
		return (
			<RoomContext.Provider value={room}>
				<div className="flex-1 relative flex overflow-hidden">
					<MyVideoConference
						token={token}
						url={serverUrl}
						channelLabel={voiceInfo?.channelLabel as string}
						onLeaveRoom={handleLeaveRoom}
						onFullScreen={handleFullScreen}
						onJoinRoom={handleJoinRoom}
						isShowChatVoice={isShowChatVoice}
						onToggleChat={toggleChat}
					/>
					<EmojiSuggestionProvider>
						{isShowChatVoice && (
							<div className=" w-[500px] border-l border-border dark:border-bgTertiary z-40 bg-bgPrimary flex-shrink-0">
								<ChatStream topicChannelId={voiceInfo?.channelId} />
							</div>
						)}
					</EmojiSuggestionProvider>
				</div>
			</RoomContext.Provider>
		);
	}
);

const VoiceConferenceContainer = memo(({ containerRef, token, isOpenPopOut, isVoiceFullScreen, children }: VoiceConferenceContainerProps) => {
	const voiceInfo = useSelector(selectVoiceInfo);
	const isJoined = useSelector(selectVoiceJoined);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const isShow = isJoined && voiceInfo?.channelId === currentChannelId;

	return (
		<div
			ref={containerRef}
			id="livekitRoom11"
			key={token}
			className={`${!isShow || isOpenPopOut ? '!hidden' : ''} lk-room-container flex ${isVoiceFullScreen ? 'w-full h-full' : ''}`}
			data-lk-theme="default"
		>
			{children}
		</div>
	);
});

const ChannelVoiceInner = () => {
	const token = useSelector(selectTokenJoinVoice);
	const voiceInfo = useSelector(selectVoiceInfo);
	const [loading, setLoading] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const isShowChatVoice = useSelector(selectIsShowChatVoice);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isChannelMezonVoice = currentChannelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	const containerRef = useRef<HTMLDivElement>(null);
	const { userProfile } = useAuth();

	const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
	const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
	const isOnMenu = useSelector(selectStatusMenu);

	const room = useMemo(() => new Room({ dynacast: true, adaptiveStream: true }), []);
	const isDisconnectingRef = useRef(false);

	const connectOptions = useMemo(
		(): RoomConnectOptions => ({
			autoSubscribe: true
		}),
		[]
	);

	const handleError = useCallback((error: Error) => {
		console.error('Room error:', error);
	}, []);

	useEffect(() => {
		if (!token || !serverUrl) return;
		room.connect(serverUrl, token).catch((error) => {
			handleError(error);
		});
	}, [token, serverUrl, room, connectOptions, handleError]);

	const lowPowerMode = useLowCPUOptimizer(room);

	useEffect(() => {
		if (lowPowerMode) {
			console.warn('Low power mode enabled');
		}
	}, [lowPowerMode]);

	const participantMeetState = useCallback(
		async (state: ParticipantMeetState, clanId?: string, channelId?: string, self?: boolean): Promise<void> => {
			if (!clanId || !channelId || !userProfile?.user?.id) return;

			await dispatch(
				handleParticipantVoiceState({
					clan_id: clanId,
					channel_id: channelId,
					display_name: userProfile?.user?.display_name ?? '',
					state,
					room_name: self && state === ParticipantMeetState.LEAVE ? 'leave' : voiceInfo?.roomId || ''
				})
			);
		},
		[dispatch, userProfile, voiceInfo?.roomId]
	);

	const handleJoinRoom = useLastCallback(async () => {
		try {
			await room.disconnect();
		} catch (error) {
			console.error('Failed to disconnect previous LiveKit room before joining:', error);
		}

		const currentUserChoices = loadUserChoices();
		saveUserChoices({
			...currentUserChoices,
			audioEnabled: false,
			videoEnabled: false
		});

		dispatch(voiceActions.setOpenPopOut(false));
		dispatch(voiceActions.setShowScreen(false));
		dispatch(voiceActions.setStreamScreen(null));
		dispatch(voiceActions.setNoiseSuppressionEnabled(false));
		dispatch(voiceActions.setShowMicrophone(false));

		const storeState = getStore().getState();
		const currentClanId = selectCurrentClanId(storeState);
		const currentClanName = selectCurrentClanName(storeState);
		const currentChannelId = selectCurrentChannelId(storeState);
		const currentChannelClanId = selectCurrentChannelClanId(storeState);
		const currentChannelLabel = selectCurrentChannelLabel(storeState);
		const currentChannelMeetingCode = selectCurrentChannelMeetingCode(storeState);
		const currentChannelPrivate = selectCurrentChannelPrivate(storeState);

		if (!currentClanId || !currentChannelMeetingCode) return;
		setLoading(true);

		try {
			const result = await dispatch(
				generateMeetToken({
					channelId: currentChannelId as string,
					roomName: currentChannelMeetingCode
				})
			).unwrap();

			if (result) {
				await participantMeetState(ParticipantMeetState.JOIN, currentChannelClanId as string, currentChannelId as string);
				dispatch(voiceActions.setJoined(true));
				dispatch(voiceActions.setToken(result));
				dispatch(
					voiceActions.setVoiceInfo({
						clanId: currentClanId as string,
						clanName: currentClanName as string,
						channelId: currentChannelId as string,
						channelLabel: currentChannelLabel as string,
						channelPrivate: currentChannelPrivate as number
					})
				);
			} else {
				dispatch(voiceActions.setToken(''));
			}
		} catch (err) {
			console.error('Failed to generate token room:', err);
			dispatch(voiceActions.setToken(''));
		} finally {
			setLoading(false);
		}
	});

	const handleLeaveRoom = useLastCallback(async (self?: boolean) => {
		if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;

		if (isDisconnectingRef.current) return;
		isDisconnectingRef.current = true;

		try {
			await room.disconnect();
		} catch (error) {
			console.error('Failed to disconnect LiveKit room:', error);
		}

		dispatch(voiceActions.resetVoiceControl());
		if (userProfile?.user?.id) {
			dispatch(voiceActions.removeFromClanInvoice({ id: userProfile.user.id, clanId: voiceInfo.clanId }));
		}

		isDisconnectingRef.current = false;

		await participantMeetState(ParticipantMeetState.LEAVE, voiceInfo.clanId, voiceInfo.channelId, self);
	});

	const handleFullScreen = useCallback(() => {
		dispatch(voiceActions.setFullScreen(!isVoiceFullScreen));
	}, [isVoiceFullScreen]);

	const toggleChat = useCallback(() => {
		dispatch(appActions.setIsShowChatVoice(!isShowChatVoice));
	}, [isShowChatVoice, dispatch]);

	useEffect(() => {
		return () => {
			room.disconnect().catch((error) => {
				console.error('Error disconnecting LiveKit room on unmount:', error);
			});
		};
	}, [room]);

	return (
		<Suspense fallback={<div>loading ...</div>}>
			<div
				className={`${isOpenPopOut ? 'pointer-events-none' : ''} ${!isChannelMezonVoice || isShowSettingFooter?.status ? 'hidden' : ''} ${isVoiceFullScreen ? 'fixed inset-0 z-[100]' : `absolute ${isWindowsDesktop || isLinuxDesktop ? 'bottom-[21px]' : 'bottom-0'} right-0 ${isOnMenu ? 'max-sbm:z-1 z-30' : 'z-30'}`} ${!isOnMenu && !isVoiceFullScreen ? ' max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]' : ''}`}
				style={
					!isVoiceFullScreen
						? { width: 'calc(100% - 72px - 272px)', height: isWindowsDesktop || isLinuxDesktop ? 'calc(100% - 21px)' : '100%' }
						: { width: '100vw', height: '100vh' }
				}
			>
				{token === '' || !serverUrl || voiceInfo?.clanId === '0' ? (
					isChannelMezonVoice && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />
				) : (
					<>
						{isChannelMezonVoice && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />}

						<VoiceConferenceContainer
							containerRef={containerRef}
							token={token}
							isOpenPopOut={isOpenPopOut}
							isVoiceFullScreen={isVoiceFullScreen}
						>
							<VoiceConferenceContent
								room={room}
								token={token}
								serverUrl={serverUrl}
								voiceInfo={voiceInfo}
								handleLeaveRoom={handleLeaveRoom}
								handleFullScreen={handleFullScreen}
								handleJoinRoom={handleJoinRoom}
								isShowChatVoice={isShowChatVoice}
								toggleChat={toggleChat}
							/>
						</VoiceConferenceContainer>
					</>
				)}
			</div>
		</Suspense>
	);
};

interface VoiceErrorBoundaryState {
	hasError: boolean;
}

class VoiceErrorBoundary extends React.Component<{ children: ReactNode }, VoiceErrorBoundaryState> {
	state: VoiceErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): VoiceErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('VoiceErrorBoundary caught error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex items-center justify-center h-full text-textSecondary">
					<div className="text-center">
						<p>Voice channel encountered an error.</p>
						<button
							className="mt-2 px-4 py-2 bg-bgSecondary rounded hover:bg-bgTertiary"
							onClick={() => this.setState({ hasError: false })}
						>
							Retry
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

const ChannelVoice = memo(() => (
	<VoiceErrorBoundary>
		<ChannelVoiceInner />
	</VoiceErrorBoundary>
));

export default ChannelVoice;
