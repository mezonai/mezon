import { EmojiSuggestionProvider, useAuth } from '@mezon/core';
import {
	appActions,
	generateMeetToken,
	getStore,
	selectCurrentChannelClanId,
	selectCurrentChannelId,
	selectCurrentChannelLabel,
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

import type { SfuJoinRole } from '@mezon/components';
import { useLastCallback } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ReactNode, RefObject } from 'react';
import React, { Suspense, lazy, memo, useCallback, useRef, useState, type ErrorInfo } from 'react';
import { useSelector } from 'react-redux';
import ChatStream from '../chatStream';

const MezonSfuVoiceRoom = lazy(() =>
	import(/* webpackChunkName: "ui-components" */ '@mezon/components').then((module) => ({ default: module.MezonSfuVoiceRoom }))
);
const SfuPreJoinVoiceChannel = lazy(() =>
	import(/* webpackChunkName: "ui-components" */ '@mezon/components').then((module) => ({ default: module.SfuPreJoinVoiceChannel }))
);

interface VoicePreJoinWrapperProps {
	loading: boolean;
	handleJoinRoom: (role: SfuJoinRole) => void;
}

const VoicePreJoinWrapper = memo(({ loading, handleJoinRoom }: VoicePreJoinWrapperProps) => {
	const channelLabel = useSelector(selectCurrentChannelLabel);
	const channelId = useSelector(selectCurrentChannelId);
	const channelClanId = useSelector(selectCurrentChannelClanId);
	const voiceInfo = useSelector(selectVoiceInfo);
	const isJoined = useSelector(selectVoiceJoined);

	const isCurrentChannel = isJoined && voiceInfo?.channelId === channelId;

	return (
		<SfuPreJoinVoiceChannel
			channel_label={channelLabel}
			channel_id={channelId as string}
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
	children: ReactNode;
}

interface VoiceConferenceContentProps {
	token: string;
	joinRole: SfuJoinRole;
	serverUrl: string;
	voiceInfo: ReturnType<typeof selectVoiceInfo>;
	handleLeaveRoom: (self?: boolean) => Promise<void>;
	handleFullScreen: () => void;
	isShowChatVoice: boolean;
	isVoiceFullScreen: boolean;
	handleToggleChat: () => void;
}

const VoiceConferenceContent = memo(
	({
		token,
		joinRole,
		serverUrl,
		voiceInfo,
		handleLeaveRoom,
		handleFullScreen,
		isShowChatVoice,
		isVoiceFullScreen,
		handleToggleChat
	}: VoiceConferenceContentProps) => {
		return (
			<div className="flex-1 relative flex overflow-hidden">
				<MezonSfuVoiceRoom
					token={token}
					joinRole={joinRole}
					roomId={voiceInfo?.channelId as string}
					serverUrl={serverUrl}
					channelLabel={voiceInfo?.channelLabel || ''}
					isChatOpen={isShowChatVoice}
					isFullScreen={isVoiceFullScreen}
					onLeaveRoom={() => void handleLeaveRoom()}
					onFullScreen={handleFullScreen}
					onToggleChat={handleToggleChat}
				/>
				<EmojiSuggestionProvider>
					{isShowChatVoice && (
						<div className=" w-[500px] border-l border-border dark:border-bgTertiary z-40 bg-bgPrimary flex-shrink-0">
							<ChatStream topicChannelId={voiceInfo?.channelId} />
						</div>
					)}
				</EmojiSuggestionProvider>
			</div>
		);
	}
);

const VoiceConferenceContainer = memo(({ containerRef, token, isOpenPopOut, children }: VoiceConferenceContainerProps) => {
	const voiceInfo = useSelector(selectVoiceInfo);
	const isJoined = useSelector(selectVoiceJoined);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const isShow = isJoined && voiceInfo?.channelId === currentChannelId;

	return (
		<div
			ref={containerRef}
			id="mezonSfuRoom"
			key={token}
			className={`${!isShow || isOpenPopOut ? '!hidden' : ''} flex flex-1 min-w-0 w-full h-full`}
		>
			{children}
		</div>
	);
});

const MezonSfuChannelVoiceInner = () => {
	const token = useSelector(selectTokenJoinVoice);
	const voiceInfo = useSelector(selectVoiceInfo);
	const [loading, setLoading] = useState<boolean>(false);
	const [joinRole, setJoinRole] = useState<SfuJoinRole>('speaker');
	const dispatch = useAppDispatch();
	const serverUrl = process.env.NX_CHAT_APP_SFU_WS_URL;
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const isShowChatVoice = useSelector(selectIsShowChatVoice);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isChannelMezonVoice = currentChannelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	const containerRef = useRef<HTMLDivElement>(null);
	const { userProfile } = useAuth();

	const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
	const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
	const isOnMenu = useSelector(selectStatusMenu);

	const isDisconnectingRef = useRef(false);

	const handleJoinRoom = useLastCallback(async (role: SfuJoinRole) => {
		setJoinRole(role);
		if (token) {
			dispatch(voiceActions.setJoined(false));
			dispatch(voiceActions.setToken(''));
		}
		dispatch(voiceActions.setOpenPopOut(false));
		dispatch(voiceActions.setShowScreen(false));
		dispatch(voiceActions.setStreamScreen(null));
		dispatch(voiceActions.setShowMicrophone(false));
		if (role === 'audience') dispatch(voiceActions.setShowCamera(false));

		const storeState = getStore().getState();
		const currentClanId = selectCurrentClanId(storeState);
		const currentClanName = selectCurrentClanName(storeState);
		const currentChannelId = selectCurrentChannelId(storeState);
		const currentChannelLabel = selectCurrentChannelLabel(storeState);
		const currentChannelPrivate = selectCurrentChannelPrivate(storeState);

		if (!currentClanId) return;
		setLoading(true);

		try {
			const result = await dispatch(
				generateMeetToken({
					channelId: currentChannelId as string,
					roomName: ''
				})
			).unwrap();

			if (result) {
				dispatch(voiceActions.setJoined(true));
				dispatch(voiceActions.setToken(result));
				dispatch(
					voiceActions.setVoiceInfo({
						clanId: currentClanId as string,
						clanName: currentClanName as string,
						channelId: currentChannelId as string,
						channelLabel: currentChannelLabel as string,
						channelPrivate: currentChannelPrivate as number,
						joinRole: role
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

	const handleLeaveRoom = useLastCallback(async (_self?: boolean) => {
		if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;

		if (isDisconnectingRef.current) return;
		isDisconnectingRef.current = true;

		dispatch(voiceActions.resetVoiceControl());
		if (userProfile?.user?.id) {
			dispatch(voiceActions.removeFromClanInvoice({ id: userProfile.user.id, clanId: voiceInfo.clanId }));
		}

		isDisconnectingRef.current = false;
	});

	const handleFullScreen = useCallback(() => {
		dispatch(voiceActions.setFullScreen(!isVoiceFullScreen));
	}, [dispatch, isVoiceFullScreen]);
	const handleToggleChat = useCallback(() => {
		dispatch(appActions.setIsShowChatVoice(!isShowChatVoice));
	}, [dispatch, isShowChatVoice]);

	return (
		<Suspense fallback={<div>loading ...</div>}>
			<div
				className={`${isOpenPopOut ? 'pointer-events-none' : ''} ${!isChannelMezonVoice || isShowSettingFooter?.status ? 'hidden' : ''} ${isVoiceFullScreen ? 'fixed inset-0 z-[100]' : `absolute bottom-0 right-0 ${isOnMenu ? 'max-sbm:z-1 z-30' : 'z-30'}`} ${!isOnMenu && !isVoiceFullScreen ? ' max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]' : ''}`}
				style={!isVoiceFullScreen ? { width: 'calc(100% - 72px - 272px)', height: '100%' } : { width: '100vw', height: '100vh' }}
			>
				{token === '' || !serverUrl || voiceInfo?.clanId === '0' ? (
					isChannelMezonVoice && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />
				) : (
					<>
						{isChannelMezonVoice && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />}
						<VoiceConferenceContainer containerRef={containerRef} token={token} isOpenPopOut={isOpenPopOut}>
							<VoiceConferenceContent
								token={token}
								joinRole={joinRole}
								serverUrl={serverUrl}
								voiceInfo={voiceInfo}
								handleLeaveRoom={handleLeaveRoom}
								handleFullScreen={handleFullScreen}
								isShowChatVoice={isShowChatVoice}
								isVoiceFullScreen={!!isVoiceFullScreen}
								handleToggleChat={handleToggleChat}
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
				<div
					className="absolute bottom-0 right-0 z-30 flex items-center justify-center h-full max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]"
					style={{ width: 'calc(100% - 72px - 272px)' }}
				>
					<div className="text-center text-textSecondary">
						<p className="text-lg font-semibold">Voice channel encountered an error.</p>
						<button
							className="mt-2 px-4 py-2 bg-bgSecondary rounded hover:bg-bgTertiary text-sm"
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

const MezonSfuChannelVoice = memo(() => (
	<VoiceErrorBoundary>
		<MezonSfuChannelVoiceInner />
	</VoiceErrorBoundary>
));

export default MezonSfuChannelVoice;
