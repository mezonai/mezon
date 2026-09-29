import { MezonSfuVoiceRoom, SfuPreJoinVoiceChannel, type SfuJoinRole } from '@mezon/components';
import { EmojiSuggestionProvider } from '@mezon/core';
import {
	appActions,
	channelAppActions,
	generateMeetToken,
	getStore,
	selectChannelById,
	selectClanMemberByClanId,
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

import { useLastCallback } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { ReactNode, RefObject } from 'react';
import React, { Suspense, memo, useCallback, useEffect, useRef, useState, type ErrorInfo } from 'react';
import { flushSync } from 'react-dom';
import { useSelector } from 'react-redux';
import ChatStream from '../chatStream';
import { SfuReconnectModal } from './SfuReconnectModal';

type VoiceJoinTarget = NonNullable<ReturnType<typeof selectVoiceInfo>>;

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
	isOpenPopOut?: boolean;
	rejoinTarget: VoiceJoinTarget | null;
	children: ReactNode;
}

interface VoiceConferenceContentProps {
	token: string;
	joinRole: SfuJoinRole;
	serverUrl: string;
	voiceInfo: ReturnType<typeof selectVoiceInfo>;
	handleLeaveRoom: (self?: boolean) => Promise<void>;
	onReconnectRequired: () => void;
	handleFullScreen: () => void;
	isShowChatVoice: boolean;
	isVoiceFullScreen: boolean;
	handleToggleChat: () => void;
	isPrivateVoice?: boolean;
}

const VoiceConferenceContent = memo(
	({
		token,
		joinRole,
		serverUrl,
		voiceInfo,
		handleLeaveRoom,
		onReconnectRequired,
		handleFullScreen,
		isShowChatVoice,
		isVoiceFullScreen,
		handleToggleChat,
		isPrivateVoice
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
					onReconnectRequired={onReconnectRequired}
					onFullScreen={handleFullScreen}
					onToggleChat={handleToggleChat}
					isPrivateVoice={isPrivateVoice}
				/>
				<EmojiSuggestionProvider>
					{isShowChatVoice && (
						<div className="z-40 w-[500px] flex-shrink-0 border-l border-border bg-bgPrimary dark:border-bgTertiary max-md:absolute max-md:inset-0 max-md:w-full max-md:border-l-0">
							<ChatStream topicChannelId={voiceInfo?.channelId} />
						</div>
					)}
				</EmojiSuggestionProvider>
			</div>
		);
	}
);

const VoiceConferenceContainer = memo(({ containerRef, isOpenPopOut, rejoinTarget, children }: VoiceConferenceContainerProps) => {
	const voiceInfo = useSelector(selectVoiceInfo);
	const isJoined = useSelector(selectVoiceJoined);
	const currentChannelId = useSelector(selectCurrentChannelId);

	const displayedVoiceInfo = rejoinTarget ?? voiceInfo;
	const isShow = (isJoined || !!rejoinTarget) && displayedVoiceInfo?.channelId === currentChannelId;

	return (
		<div
			ref={containerRef}
			id="mezonSfuRoom"
			key={displayedVoiceInfo?.channelId}
			className={`${!isShow || isOpenPopOut ? '!hidden' : ''} relative flex flex-1 min-w-0 w-full h-full bg-bgPrimary`}
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
	const [rejoinTarget, setRejoinTarget] = useState<VoiceJoinTarget | null>(null);
	const joinRequestRef = useRef(0);
	const joiningRef = useRef(false);
	const dispatch = useAppDispatch();
	const serverUrl = process.env.NX_CHAT_APP_SFU_WS_URL;
	const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
	const isShowChatVoice = useSelector(selectIsShowChatVoice);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const isChannelMezonVoice = currentChannelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	const containerRef = useRef<HTMLDivElement>(null);

	const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
	const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
	const isOnMenu = useSelector(selectStatusMenu);

	const isDisconnectingRef = useRef(false);
	const isPrivateVoice = !!useSelector((state) => selectChannelById(state, voiceInfo?.channelId || ''))?.channel_private;

	useEffect(
		() => () => {
			joinRequestRef.current += 1;
		},
		[]
	);

	const handleJoinRoom = useLastCallback(async (role: SfuJoinRole, target?: VoiceJoinTarget) => {
		if (joiningRef.current) return;
		joiningRef.current = true;
		const request = ++joinRequestRef.current;
		if (!target) setRejoinTarget(null);
		setJoinRole(role);
		if (target) {
			// Rejoin must unmount the paused room before obtaining a fresh token.
			flushSync(() => {
				dispatch(voiceActions.resetVoiceControl());
				dispatch(channelAppActions.clearAppInteractiveData());
			});
		} else if (token) {
			dispatch(voiceActions.setJoined(false));
			dispatch(voiceActions.setToken(''));
		}
		dispatch(voiceActions.setOpenPopOut(false));
		dispatch(voiceActions.setShowScreen(false));
		dispatch(voiceActions.setStreamScreen(null));
		dispatch(voiceActions.setShowMicrophone(false));
		if (role === 'audience') dispatch(voiceActions.setShowCamera(false));

		const storeState = getStore().getState();
		const userProfile = storeState.account.userProfile;
		const currentClanId = target?.clanId ?? selectCurrentClanId(storeState);
		const currentClanName = target?.clanName ?? selectCurrentClanName(storeState);
		const currentChannelId = target?.channelId ?? selectCurrentChannelId(storeState);
		const currentChannelLabel = target?.channelLabel ?? selectCurrentChannelLabel(storeState);
		const currentChannelPrivate = target?.channelPrivate ?? selectCurrentChannelPrivate(storeState);

		if (!currentClanId || !currentChannelId) {
			joiningRef.current = false;
			return;
		}
		setLoading(true);

		try {
			const clanMember = selectClanMemberByClanId(storeState, currentClanId)?.entities[userProfile?.user?.id || ''];
			const username = clanMember?.clan_nick || clanMember?.prioritizeName || userProfile?.user?.display_name || userProfile?.user?.username;

			const avatar = clanMember?.clan_avatar || userProfile?.user?.avatar_url;

			const metadata = username || avatar ? `${username};${avatar}` : '';
			const result = await dispatch(
				generateMeetToken({
					channelId: currentChannelId as string,
					roomName: '',
					metadata
				})
			).unwrap();
			if (request !== joinRequestRef.current) return;

			if (result) {
				dispatch(voiceActions.setJoined(true));
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
				// Publish the token last so the new room mounts with its final channel and role.
				dispatch(voiceActions.setToken(result));
				setRejoinTarget(null);
			} else {
				dispatch(voiceActions.setToken(''));
			}
		} catch (err) {
			if (request !== joinRequestRef.current) return;
			console.error('Failed to generate token room:', err);
			dispatch(voiceActions.setToken(''));
		} finally {
			if (request === joinRequestRef.current) {
				joiningRef.current = false;
				setLoading(false);
			}
		}
	});

	const handleReconnectRequired = useLastCallback(() => {
		if (!voiceInfo) return;
		setRejoinTarget({ ...voiceInfo, joinRole });
		dispatch(voiceActions.setVoiceConnectionState(false));
	});
	const handleExitReconnect = useLastCallback(() => {
		joinRequestRef.current += 1;
		joiningRef.current = false;
		setLoading(false);
		setRejoinTarget(null);
		dispatch(voiceActions.resetVoiceControl());
		dispatch(channelAppActions.clearAppInteractiveData());
	});

	const handleLeaveRoom = useLastCallback(async (_self?: boolean) => {
		if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;

		if (isDisconnectingRef.current) return;
		isDisconnectingRef.current = true;
		setRejoinTarget(null);

		dispatch(voiceActions.resetVoiceControl());
		dispatch(channelAppActions.clearAppInteractiveData());

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
				{!rejoinTarget && (token === '' || !serverUrl || voiceInfo?.clanId === '0') ? (
					isChannelMezonVoice && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />
				) : (
					<>
						{isChannelMezonVoice && !rejoinTarget && <VoicePreJoinWrapper loading={loading} handleJoinRoom={handleJoinRoom} />}
						<VoiceConferenceContainer containerRef={containerRef} isOpenPopOut={isOpenPopOut} rejoinTarget={rejoinTarget}>
							{token && serverUrl ? (
								<VoiceConferenceContent
									token={token}
									joinRole={joinRole}
									serverUrl={serverUrl}
									voiceInfo={voiceInfo}
									isPrivateVoice={isPrivateVoice}
									handleLeaveRoom={handleLeaveRoom}
									onReconnectRequired={handleReconnectRequired}
									handleFullScreen={handleFullScreen}
									isShowChatVoice={isShowChatVoice}
									isVoiceFullScreen={!!isVoiceFullScreen}
									handleToggleChat={handleToggleChat}
								/>
							) : (
								<div className="flex h-full w-full flex-col p-5 text-textSecondary">
									<span className="text-sm font-medium">{rejoinTarget?.channelLabel}</span>
								</div>
							)}
							{rejoinTarget && (
								<SfuReconnectModal
									loading={loading}
									onRejoin={() => void handleJoinRoom(rejoinTarget.joinRole || 'speaker', rejoinTarget)}
									onExit={handleExitReconnect}
								/>
							)}
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
