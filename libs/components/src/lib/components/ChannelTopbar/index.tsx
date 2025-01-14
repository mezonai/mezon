import { useAppNavigation, useIdleRender, usePathMatch } from '@mezon/core';
import {
	RootState,
	appActions,
	channelsActions,
	notificationActions,
	pinMessageActions,
	searchMessagesActions,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannelId,
	selectCurrentChannelNotificatonSelected,
	selectCurrentClan,
	selectCurrentClanId,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectIsPinModalVisible,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectIsShowInbox,
	selectIsShowMemberList,
	selectIsShowPinBadgeByChannelId,
	selectIsThreadModalVisible,
	selectStatusMenu,
	selectTheme,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ChannelStatusEnum, IChannel, isMacDesktop } from '@mezon/utils';
import Tippy from '@tippy.js/react';
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
import { PushToTalkBtn } from './TopBarComponents/PushToTalkButton/PushToTalkButton';
import ThreadModal from './TopBarComponents/Threads/ThreadModal';

export type ChannelTopbarProps = {
	readonly channel?: Readonly<IChannel> | null;
	isChannelVoice?: boolean;
	mode?: ChannelStreamMode;
	isMemberPath?: boolean;
};

const ChannelTopbar = memo(({ channel, mode }: ChannelTopbarProps) => {
	const isChannelVoice = channel?.type === ChannelType.CHANNEL_TYPE_VOICE;
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const currentClanId = useSelector(selectCurrentClanId);
	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const { isMemberPath } = usePathMatch({ isMemberPath: memberPath });

	const shouldRender = useIdleRender();
	if (!shouldRender) return null;

	return (
		<div
			className={`${isMacDesktop ? 'draggable-area' : ''} max-sbm:z-20 flex h-heightTopBar p-3 min-w-0 items-center flex-shrink ${isChannelVoice ? 'bg-black' : 'dark:bg-bgPrimary bg-bgLightPrimary shadow-inner border-b-[1px] dark:border-bgTertiary border-bgLightTertiary'} ${closeMenu && 'fixed top-0 w-screen'} ${closeMenu && statusMenu ? 'left-[100vw]' : 'left-0'}`}
		>
			{isChannelVoice ? (
				<TopBarChannelVoice channel={channel} />
			) : (
				<TopBarChannelText channel={channel} mode={mode} isMemberPath={isMemberPath} />
			)}
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

const TopBarChannelText = memo(({ channel, isChannelVoice, mode, isMemberPath }: ChannelTopbarProps) => {
	const dispatch = useAppDispatch();
	const store = useStore();

	const setTurnOffThreadMessage = useCallback(() => {
		const isShowCreateThread = selectIsShowCreateThread(store.getState() as RootState, channel?.id as string);
		const isShowCreateTopic = selectIsShowCreateTopic(store.getState() as RootState, channel?.id as string);
		if (isShowCreateThread) {
			dispatch(threadsActions.setOpenThreadMessageState(false));
			dispatch(threadsActions.setValueThread(null));
		}
		if (isShowCreateTopic) {
			dispatch(topicsActions.setOpenTopicMessageState(false));
			dispatch(topicsActions.setValueTopic(null));
		}
	}, [channel?.id, dispatch, store]);

	const appearanceTheme = useSelector(selectTheme);
	const isShowChatStream = useSelector(selectIsShowChatStream);

	const channelParent =
		useAppSelector((state) => selectChannelById(state, (channel?.parrent_id ? (channel.parrent_id as string) : '') ?? '')) || {};

	const isNotThread = channel?.parrent_id === '0';

	const isPrivateChannel = channel?.channel_private === ChannelStatusEnum.isPrivate;
	return (
		<>
			<div className="justify-start items-center gap-1 flex">
				<ChannelLabel channel={channel} />
			</div>
			<div className="items-center h-full ml-auto flex">
				{channel?.type !== ChannelType.CHANNEL_TYPE_STREAMING ? (
					<div className="justify-end items-center gap-2 flex">
						<div className="hidden sbm:flex">
							<div className="relative justify-start items-center gap-[15px] flex mr-4">
								{!isMemberPath && <FileButton isLightMode={appearanceTheme === 'light'} />}
								{!channelParent?.channel_label && !isMemberPath && <CanvasButton isLightMode={appearanceTheme === 'light'} />}
								{isNotThread && isPrivateChannel && <PushToTalkBtn isLightMode={appearanceTheme === 'light'} />}
								<ThreadButton isLightMode={appearanceTheme === 'light'} />
								<MuteButton isLightMode={appearanceTheme === 'light'} />
								<PinButton isLightMode={appearanceTheme === 'light'} />
								<div onClick={() => setTurnOffThreadMessage()}>
									<ChannelListButton isLightMode={appearanceTheme === 'light'} />
								</div>
							</div>
							<SearchMessageChannel mode={mode} />
						</div>
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
			<Tippy
				className={`${isShowFile && 'hidden'}  flex justify-center items-center ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}
				content="Files"
			>
				<button className="focus-visible:outline-none" onClick={handleShowFile} onContextMenu={(e) => e.preventDefault()}>
					<Icons.FileIcon isWhite={isShowFile} defaultSize="size-6" />
				</button>
			</Tippy>
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
			<Tippy
				className={`${isShowCanvas && 'hidden'}  flex justify-center items-center ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}
				content="Canvas"
			>
				<button className="focus-visible:outline-none" onClick={handleShowCanvas} onContextMenu={(e) => e.preventDefault()}>
					<Icons.CanvasIcon isWhite={isShowCanvas} defaultSize="size-6" />
				</button>
			</Tippy>
			{isShowCanvas && <CanvasModal onClose={handleClose} rootRef={canvasRef} />}
		</div>
	);
}

function ThreadButton({ isLightMode }: { isLightMode: boolean }) {
	const isShowThread = useSelector(selectIsThreadModalVisible);

	const threadRef = useRef<HTMLDivElement | null>(null);

	const dispatch = useDispatch();
	const handleToggleThreads = () => {
		dispatch(threadsActions.toggleThreadModal());
	};

	return (
		<div className="relative leading-5 h-5" ref={threadRef}>
			<Tippy
				className={`${isShowThread && 'hidden'}  flex justify-center items-center ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}
				content="Threads"
			>
				<button className="focus-visible:outline-none" onClick={handleToggleThreads} onContextMenu={(e) => e.preventDefault()}>
					<Icons.ThreadIcon isWhite={isShowThread} defaultSize="size-6" />
				</button>
			</Tippy>
			{isShowThread && <ThreadModal onClose={handleToggleThreads} rootRef={threadRef} />}
		</div>
	);
}

function MuteButton({ isLightMode }: { isLightMode: boolean }) {
	const [isMuteBell, setIsMuteBell] = useState<boolean>(false);
	const getNotificationChannelSelected = useSelector(selectCurrentChannelNotificatonSelected);
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
			<Tippy
				className={`${isShowNotificationSetting && 'hidden'} w-[164px] flex justify-center items-center ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}
				content="Notification Settings"
			>
				<button className="focus-visible:outline-none" onClick={handleShowNotificationSetting} onContextMenu={(e) => e.preventDefault()}>
					{isMuteBell ? (
						<Icons.MuteBell isWhite={isShowNotificationSetting} />
					) : (
						<Icons.UnMuteBell isWhite={isShowNotificationSetting} defaultSize="size-6" />
					)}
				</button>
			</Tippy>
			{isShowNotificationSetting && <NotificationSetting onClose={handleClose} rootRef={notiRef} />}
		</div>
	);
}

function PinButton({ isLightMode }: { isLightMode: boolean }) {
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
			<Tippy
				className={`${isShowPinMessage && 'hidden'} w-[142px]  flex justify-center items-center ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}
				content="Pinned Messages"
			>
				<button className="focus-visible:outline-none relative" onClick={handleTogglePinMessage} onContextMenu={(e) => e.preventDefault()}>
					<Icons.PinRight isWhite={isShowPinMessage} />
					{isShowPinBadge && (
						<div className="bg-red-500 size-2 absolute rounded-full bottom-0 right-0 border-[3px] dark:border-bgPrimary border-bgLightPrimary box-content" />
					)}
				</button>
			</Tippy>
			{isShowPinMessage && <PinnedMessages rootRef={pinRef} onClose={handleTogglePinMessage} />}
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
			<Tippy content={isShowInbox ? '' : 'Inbox'} className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
				<button className="focus-visible:outline-none" onClick={handleShowInbox} onContextMenu={(e) => e.preventDefault()}>
					<Icons.Inbox isWhite={isShowInbox} defaultFill={isVoiceChannel ? 'text-contentTertiary' : ''} />
					{(currentClan?.badge_count ?? 0) > 0 && <RedDot />}
				</button>
			</Tippy>
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
			<Tippy content="Help" className={`${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
				<button onClick={() => navigate('help')}>
					<Icons.Help />
				</button>
			</Tippy>
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
			<Tippy content="Members" className={`flex justify-center items-center ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`}>
				<button onClick={handleClick}>
					<Icons.MemberList isWhite={isActive} />
				</button>
			</Tippy>
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
			<Tippy className={`w-max ${isLightMode ? 'tooltipLightMode' : 'tooltip'}`} content="Show Chat">
				<button onClick={handleClick}>
					<Icons.Chat defaultSize="w-6 h-6 dark:text-channelTextLabel" />
				</button>
			</Tippy>
		</div>
	);
}

export default ChannelTopbar;
