import { useAppNavigation, useIdleRender, usePathMatch } from '@mezon/core';
import {
	AppDispatch,
	RootState,
	appActions,
	channelAppActions,
	channelsActions,
	generateMeetToken,
	notificationActions,
	pinMessageActions,
	searchMessagesActions,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClan,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectEnableCall,
	selectEnableMic,
	selectGetRoomId,
	selectIsPinModalVisible,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectIsShowInbox,
	selectIsShowMemberList,
	selectIsShowPinBadgeByChannelId,
	selectIsThreadModalVisible,
	selectNotifiSettingsEntitiesById,
	selectStatusMenu,
	selectTheme,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelStatusEnum, IChannel, isMacDesktop } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, NotificationType } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useDispatch, useSelector, useStore } from 'react-redux';
import ModalInvite from '../ListMemberInvite/modalInvite';
import NotificationList from '../NotificationList';
import SearchMessageChannel from '../SearchMessageChannel';
import { ChannelLabel } from './TopBarComponents';
import CanvasModal from './TopBarComponents/Canvas/CanvasModal';
import FileModal from './TopBarComponents/FilesModal';
import NotificationSetting from './TopBarComponents/NotificationSetting';
import PinnedMessages from './TopBarComponents/PinnedMessages';
import { MicButton } from './TopBarComponents/SFUButton/MicIcon';
import { StartCallButton } from './TopBarComponents/SFUButton/StartCallButton';
import ThreadModal from './TopBarComponents/Threads/ThreadModal';
export type ChannelTopbarProps = {
	readonly channel?: Readonly<IChannel> | null;
	isChannelVoice?: boolean;
	mode?: ChannelStreamMode;
	isMemberPath?: boolean;
};

const ChannelTopbar = memo(({ channel, mode }: ChannelTopbarProps) => {
	const isChannelVoice = channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE;
	const isChannelApps = channel?.type === ChannelType.CHANNEL_TYPE_APP;
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const currentClanId = useSelector(selectCurrentClanId);
	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const { isMemberPath } = usePathMatch({ isMemberPath: memberPath });

	const shouldRender = useIdleRender();

	return (
		<div
			className={`${isMacDesktop ? 'draggable-area' : ''} max-sbm:z-20 flex h-heightTopBar p-3 min-w-0 items-center flex-shrink ${isChannelVoice ? 'bg-black' : 'dark:bg-bgPrimary bg-bgLightPrimary shadow-inner border-b-[1px] dark:border-bgTertiary border-bgLightTertiary'} ${closeMenu && 'fixed top-0 w-screen'} ${closeMenu && statusMenu ? 'left-[100vw]' : 'left-0'}`}
		>
			{shouldRender &&
				(isChannelApps ? (
					<TopBarChannelApps channel={channel} />
				) : isChannelVoice ? (
					<TopBarChannelVoice channel={channel} />
				) : (
					<TopBarChannelText channel={channel} mode={mode} isMemberPath={isMemberPath} />
				))}
		</div>
	);
});

const TopBarChannelVoice = memo(({ channel }: ChannelTopbarProps) => {
	const [openInviteChannelModal, closeInviteChannelModal] = useModal(
		() => <ModalInvite onClose={closeInviteChannelModal} open={true} channelID={channel?.id || ''} />,
		[channel?.channel_id]
	);
	return (
		<>
			<div className="justify-start items-center gap-1 flex">
				<ChannelLabel channel={channel} />
			</div>
			<div className="items-center h-full ml-auto flex">
				<div className="justify-end items-center gap-2 flex">
					<div className="">
						<div className="justify-start items-center gap-[15px] flex iconHover">
							<div className="relative" onClick={openInviteChannelModal} role="button">
								<Icons.AddMemberCall />
							</div>
							<InboxButton isVoiceChannel />
						</div>
					</div>
				</div>
			</div>
		</>
	);
});

const TopBarChannelApps = ({ channel, mode }: ChannelTopbarProps) => {
	const dispatch = useDispatch<AppDispatch>();
	const joinVoice = useSelector(selectEnableCall);
	const enableMic = useSelector(selectEnableMic);
	const roomId = useSelector(selectGetRoomId);
	const joinCall = useSelector(selectEnableCall);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		dispatch(channelAppActions.setRoomId(null));
	}, [channel, dispatch]);

	useEffect(() => {
		const fetchData = async () => {
			if (!roomId || !joinCall || !channel) {
				dispatch(channelAppActions.setRoomToken(undefined));
				return;
			}
			setLoading(true);

			try {
				const channelId = String(channel.channel_id ?? '');
				const roomName = `${channelId}-${roomId}`;

				const result = await dispatch(generateMeetToken({ channelId, roomName })).unwrap();

				dispatch(channelAppActions.setRoomToken(result || undefined));
			} catch (err) {
				console.error('Failed to join room:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [channel, dispatch, roomId, joinCall]);

	return (
		roomId && (
			<>
				<div className="justify-start items-center gap-1 flex">
					<ChannelLabel channel={channel} />
				</div>

				<div className="items-center h-full ml-auto flex">
					<div className="justify-end items-center gap-2 flex">
						<div className="hidden sbm:flex">
							<div className="relative justify-start items-center gap-[15px] flex mr-4">
								<StartCallButton
									loading={loading}
									onClick={() => dispatch(channelAppActions.setEnableCall(!joinVoice))}
									isJoinVoice={joinVoice}
								/>

								<MicButton onClick={() => dispatch(channelAppActions.setEnableVoice(!enableMic))} isTalking={enableMic} />

								{/* <VideoButoon onClick={() => dispatch(channelAppActions.setEnableVideo(!enableVideo))} isEnable={enableVideo} /> */}
							</div>
						</div>

						<div className="sbm:hidden mr-5">
							<ChannelListButton />
						</div>
					</div>
				</div>
			</>
		)
	);
};

const TopBarChannelText = memo(({ channel, isChannelVoice, mode, isMemberPath }: ChannelTopbarProps) => {
	const dispatch = useAppDispatch();
	const store = useStore();

	const setTurnOffThreadMessage = useCallback(() => {
		const isShowCreateThread = selectIsShowCreateThread(store.getState() as RootState, channel?.id as string);
		const isShowCreateTopic = selectIsShowCreateTopic(store.getState() as RootState);
		if (isShowCreateThread) {
			dispatch(threadsActions.setOpenThreadMessageState(false));
			dispatch(threadsActions.setValueThread(null));
		}
		if (isShowCreateTopic) {
			dispatch(topicsActions.setOpenTopicMessageState(false));
			dispatch(topicsActions.setCurrentTopicInitMessage(null));
		}
	}, [channel?.id, dispatch, store]);

	const appearanceTheme = useSelector(selectTheme);
	const isShowChatStream = useSelector(selectIsShowChatStream);

	const channelParent =
		useAppSelector((state) => selectChannelById(state, (channel?.parrent_id ? (channel.parrent_id as string) : '') ?? '')) || {};

	const isNotThread = channel?.parrent_id === '0';

	const isPrivateChannel = channel?.channel_private === ChannelStatusEnum.isPrivate;

	const fetchThreads = async () => {
		if (!channel?.channel_id) {
			return;
		}
		const body = {
			channelId: channel?.parrent_id !== '0' && channel?.parrent_id ? (channel?.parrent_id ?? '') : (channel?.channel_id ?? ''),
			clanId: channel?.clan_id ?? '',
			page: 1
		};
		await dispatch(threadsActions.fetchThreads(body));
	};

	return (
		<>
			<div className="justify-start items-center gap-1 flex">
				<ChannelLabel channel={channel} />
			</div>
			<div className="items-center h-full ml-auto flex">
				{channel?.type !== ChannelType.CHANNEL_TYPE_STREAMING ? (
					<div className="justify-end items-center gap-2 flex">
						{channel?.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE && (
							<div className="hidden sbm:flex">
								<div className="relative justify-start items-center gap-[15px] flex mr-4">
									{!isMemberPath && <FileButton isLightMode={appearanceTheme === 'light'} />}
									{!channelParent?.channel_label && !isMemberPath && <CanvasButton isLightMode={appearanceTheme === 'light'} />}
									<ThreadButton isLightMode={appearanceTheme === 'light'} fetchThreads={fetchThreads} />
									<MuteButton isLightMode={appearanceTheme === 'light'} />
									<PinButton mode={mode} isLightMode={appearanceTheme === 'light'} />
									<div onClick={() => setTurnOffThreadMessage()}>
										<ChannelListButton isLightMode={appearanceTheme === 'light'} />
									</div>
								</div>
								<SearchMessageChannel mode={mode} />
							</div>
						)}
						<div
							className={`gap-4 relative flex  w-[82px] h-8 justify-center items-center left-[345px] sbm:left-auto sbm:right-0 ${isChannelVoice ? 'bg-[#1E1E1E]' : 'dark:bg-bgPrimary bg-bgLightPrimary'}`}
							id="inBox"
						>
							<InboxButton isLightMode={appearanceTheme === 'light'} />
							<HelpButton isLightMode={appearanceTheme === 'light'} />
						</div>
						<div className="sbm:hidden mr-5">
							<ChannelListButton />
						</div>
					</div>
				) : (
					!isShowChatStream && !isMemberPath && <ChatButton isLightMode={appearanceTheme === 'light'} />
				)}
			</div>
		</>
	);
});

function FileButton({ isLightMode }: { isLightMode: boolean }) {
	const [isShowFile, setIsShowFile] = useState<boolean>(false);

	const fileRef = useRef<HTMLDivElement | null>(null);

	const handleShowFile = () => {
		setIsShowFile(!isShowFile);
	};

	const handleClose = useCallback(() => {
		setIsShowFile(false);
	}, []);

	return (
		<div className="relative leading-5 h-5" ref={fileRef}>
			<button title="Files" className="focus-visible:outline-none" onClick={handleShowFile} onContextMenu={(e) => e.preventDefault()}>
				<Icons.FileIcon isWhite={isShowFile} defaultSize="size-6" />
			</button>
			{isShowFile && <FileModal onClose={handleClose} rootRef={fileRef} />}
		</div>
	);
}

function CanvasButton({ isLightMode }: { isLightMode: boolean }) {
	const [isShowCanvas, setIsShowCanvas] = useState<boolean>(false);
	const canvasRef = useRef<HTMLDivElement | null>(null);

	const handleShowCanvas = () => {
		setIsShowCanvas(!isShowCanvas);
	};

	const handleClose = useCallback(() => {
		setIsShowCanvas(false);
	}, []);

	return (
		<div className="relative leading-5 h-5" ref={canvasRef}>
			<button content="Canvas" className="focus-visible:outline-none" onClick={handleShowCanvas} onContextMenu={(e) => e.preventDefault()}>
				<Icons.CanvasIcon isWhite={isShowCanvas} defaultSize="size-6" />
			</button>
			{isShowCanvas && <CanvasModal onClose={handleClose} rootRef={canvasRef} />}
		</div>
	);
}

function ThreadButton({ isLightMode, fetchThreads }: { isLightMode: boolean; fetchThreads: () => void }) {
	const isShowThread = useSelector(selectIsThreadModalVisible);

	const threadRef = useRef<HTMLDivElement | null>(null);

	const dispatch = useDispatch();

	const handleToggleThreads = () => {
		if (!isShowThread) {
			fetchThreads();
		}
		dispatch(threadsActions.toggleThreadModal());
	};

	return (
		<div className="relative leading-5 h-5" ref={threadRef}>
			<button title="Threads" className="focus-visible:outline-none" onClick={handleToggleThreads} onContextMenu={(e) => e.preventDefault()}>
				<Icons.ThreadIcon isWhite={isShowThread} defaultSize="size-6" />
			</button>
			{isShowThread && <ThreadModal onClose={handleToggleThreads} rootRef={threadRef} />}
		</div>
	);
}

function MuteButton({ isLightMode }: { isLightMode: boolean }) {
	const [isMuteBell, setIsMuteBell] = useState<boolean>(false);
	const currentChannel = useSelector(selectCurrentChannel);
	const getNotificationChannelSelected = useSelector(selectNotifiSettingsEntitiesById(currentChannel?.id || ''));
	const defaultNotificationCategory = useSelector(selectDefaultNotificationCategory);
	const defaultNotificationClan = useSelector(selectDefaultNotificationClan);

	useEffect(() => {
		const shouldMuteBell = (): boolean => {
			if (
				getNotificationChannelSelected?.active === 1 &&
				getNotificationChannelSelected?.notification_setting_type === NotificationType.NOTHING_MESSAGE
			) {
				return true;
			}

			if (getNotificationChannelSelected?.id !== '0' && getNotificationChannelSelected?.active !== 1) {
				return true;
			}

			if (getNotificationChannelSelected?.id === '0') {
				if (defaultNotificationCategory?.notification_setting_type === NotificationType.NOTHING_MESSAGE) {
					return true;
				}
				return defaultNotificationClan?.notification_setting_type === NotificationType.NOTHING_MESSAGE;
			}

			return false;
		};
		setIsMuteBell(shouldMuteBell());
	}, [getNotificationChannelSelected, defaultNotificationCategory, defaultNotificationClan]);

	const [isShowNotificationSetting, setIsShowNotificationSetting] = useState<boolean>(false);
	const notiRef = useRef<HTMLDivElement | null>(null);

	const handleShowNotificationSetting = () => {
		setIsShowNotificationSetting(!isShowNotificationSetting);
	};

	const handleClose = useCallback(() => {
		setIsShowNotificationSetting(false);
	}, []);

	return (
		<div className="relative leading-5 h-5" ref={notiRef}>
			<button
				title="Notification Settings"
				className="focus-visible:outline-none"
				onClick={handleShowNotificationSetting}
				onContextMenu={(e) => e.preventDefault()}
			>
				{isMuteBell ? (
					<Icons.MuteBell isWhite={isShowNotificationSetting} />
				) : (
					<Icons.UnMuteBell isWhite={isShowNotificationSetting} defaultSize="size-6" />
				)}
			</button>
			{isShowNotificationSetting && <NotificationSetting onClose={handleClose} rootRef={notiRef} />}
		</div>
	);
}

function PinButton({ isLightMode, mode }: { isLightMode: boolean; mode?: number }) {
	const dispatch = useAppDispatch();
	const isShowPinMessage = useSelector(selectIsPinModalVisible);
	const pinRef = useRef<HTMLDivElement | null>(null);
	const currentChannelId = useSelector(selectCurrentChannelId) ?? '';
	const currentClanId = useSelector(selectCurrentClanId) as string;
	const isShowPinBadge = useSelector(selectIsShowPinBadgeByChannelId(currentChannelId));
	const handleTogglePinMessage = async () => {
		await dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannelId }));
		dispatch(pinMessageActions.togglePinModal());
		if (isShowPinBadge) {
			dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: currentClanId, channelId: currentChannelId, isShow: false }));
		}
	};

	return (
		<div className="relative leading-5 h-5" ref={pinRef}>
			<button
				title="Pinned Messages"
				className="focus-visible:outline-none relative"
				onClick={handleTogglePinMessage}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.PinRight isWhite={isShowPinMessage} />
				{isShowPinBadge && (
					<div className="bg-red-500 size-2 absolute rounded-full bottom-0 right-0 border-[3px] dark:border-bgPrimary border-bgLightPrimary box-content" />
				)}
			</button>
			{isShowPinMessage && <PinnedMessages mode={mode} rootRef={pinRef} onClose={handleTogglePinMessage} />}
		</div>
	);
}

export function InboxButton({ isLightMode, isVoiceChannel }: { isLightMode?: boolean; isVoiceChannel?: boolean }) {
	const dispatch = useAppDispatch();
	const isShowInbox = useSelector(selectIsShowInbox);
	const inboxRef = useRef<HTMLDivElement | null>(null);
	const currentClan = useSelector(selectCurrentClan);

	const handleShowInbox = () => {
		dispatch(notificationActions.setIsShowInbox(!isShowInbox));
	};

	useEffect(() => {
		if (isShowInbox) {
			dispatch(notificationActions.fetchListNotification({ clanId: currentClan?.clan_id ?? '' }));
			dispatch(topicsActions.fetchTopics({ clanId: currentClan?.clan_id as string }));
		}
	}, [isShowInbox]);

	return (
		<div className="relative leading-5 h-5" ref={inboxRef}>
			<button title="Inbox" className="focus-visible:outline-none" onClick={handleShowInbox} onContextMenu={(e) => e.preventDefault()}>
				<Icons.Inbox isWhite={isShowInbox} defaultFill={isVoiceChannel ? 'text-contentTertiary' : ''} />
				{(currentClan?.badge_count ?? 0) > 0 && <RedDot />}
			</button>
			{isShowInbox && <NotificationList rootRef={inboxRef} />}
		</div>
	);
}

function RedDot() {
	return (
		<div
			className="absolute border-[1px] dark:border-bgPrimary border-[#ffffff]
		 w-[12px] h-[12px] rounded-full bg-colorDanger
		  font-bold text-[11px] flex items-center justify-center -bottom-1.5 -right-1"
		></div>
	);
}

export function HelpButton({ isLightMode }: { isLightMode?: boolean }) {
	const { navigate } = useAppNavigation();
	return (
		<div className="relative leading-5 h-5">
			<button title="Help" onClick={() => navigate('help')}>
				<Icons.Help />
			</button>
		</div>
	);
}

function ChannelListButton({ isLightMode }: { isLightMode?: boolean }) {
	const dispatch = useDispatch();
	const isActive = useSelector(selectIsShowMemberList);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const handleClick = () => {
		dispatch(appActions.setIsShowMemberList(!isActive));
		dispatch(searchMessagesActions.setIsSearchMessage({ channelId: currentChannelId as string, isSearchMessage: false }));
	};
	return (
		<div className="relative leading-5 h-5">
			<button title="Members" onClick={handleClick}>
				<Icons.MemberList isWhite={isActive} />
			</button>
		</div>
	);
}

function ChatButton({ isLightMode }: { isLightMode?: boolean }) {
	const dispatch = useDispatch();
	const handleClick = () => {
		dispatch(appActions.setIsShowChatStream(true));
	};
	return (
		<div className="relative leading-5 h-5">
			<button title="Show Chat" onClick={handleClick}>
				<Icons.Chat defaultSize="w-6 h-6 dark:text-channelTextLabel" />
			</button>
		</div>
	);
}

export default ChannelTopbar;
