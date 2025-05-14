import { toChannelPage, useChatSending, useCustomNavigate, useGifsStickersEmoji, useMenu, usePathMatch } from '@mezon/core';
import {
	DirectEntity,
	RootState,
	appActions,
	audioCallActions,
	channelsActions,
	getStore,
	getStoreAsync,
	notificationActions,
	pinMessageActions,
	searchMessagesActions,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClan,
	selectCurrentClanId,
	selectCurrentDM,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectIsInCall,
	selectIsPinModalVisible,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectIsShowInbox,
	selectIsShowMemberList,
	selectIsShowMemberListDM,
	selectIsShowPinBadgeByChannelId,
	selectIsThreadModalVisible,
	selectIsUseProfileDM,
	selectNotifiSettingsEntitiesById,
	selectSession,
	selectStatusMenu,
	selectTheme,
	threadsActions,
	toastActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMessageSendPayload, IMessageTypeCallLog, SubPanelName, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, NotificationType } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateMessageGroup from '../DmList/CreateMessageGroup';
import NotificationList from '../NotificationList';
import SearchMessageChannel from '../SearchMessageChannel';
import CanvasModal from './TopBarComponents/Canvas/CanvasModal';
import FileModal from './TopBarComponents/FilesModal';
import NotificationSetting from './TopBarComponents/NotificationSetting';
import PinnedMessages from './TopBarComponents/PinnedMessages';
import ThreadModal from './TopBarComponents/Threads/ThreadModal';

export type ChannelTopbarProps = {
	isChannelVoice?: boolean;
	mode?: ChannelStreamMode;
	isMemberPath?: boolean;
	isChannelPath?: boolean;
};

const ChannelTopbar = memo(() => {
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const { setSubPanelActive } = useGifsStickersEmoji();

	const dispatch = useDispatch();
	const onMouseDownTopbar = () => {
		setSubPanelActive(SubPanelName.NONE);
		dispatch(topicsActions.setFocusTopicBox(false));
		dispatch(threadsActions.setFocusThreadBox(false));
	};
	return (
		<div
			onMouseDown={onMouseDownTopbar}
			className={`draggable-area max-sbm:z-20 flex h-heightTopBar min-w-0 w-full items-center justify-between  flex-shrink dark:bg-bgPrimary bg-bgLightPrimary shadow-inner border-b-[1px] dark:border-bgTertiary border-bgLightTertiary ${closeMenu && 'fixed top-0 w-screen'} ${closeMenu && statusMenu ? 'left-[100vw]' : 'left-0'}`}
		>
			<TopBarChannelText />
		</div>
	);
});

const TopBarChannelText = memo(() => {
	const channel = useSelector(selectCurrentChannel);
	const memberPath = `/chat/clans/${channel?.clan_id}/member-safety`;
	const channelPath = `/chat/clans/${channel?.clan_id}/channel-setting`;
	const { isMemberPath, isChannelPath } = usePathMatch({ isMemberPath: memberPath, isChannelPath: channelPath });
	const channelParent =
		useAppSelector((state) => selectChannelById(state, (channel?.parent_id ? (channel.parent_id as string) : '') ?? '')) || null;
	const { setStatusMenu } = useMenu();
	const openMenu = useCallback(() => {
		setStatusMenu(true);
	}, []);
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();
	const handleNavigateToParent = () => {
		if (!channelParent?.id || !channelParent?.clan_id) {
			return;
		}
		navigate(toChannelPage(channelParent.id, channelParent.clan_id));
	};
	const currentDmGroup = useSelector(selectCurrentDM);
	const channelDmGroupLabel = useMemo(() => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			return currentDmGroup?.channel_label || currentDmGroup?.usernames?.join(',');
		}
		return currentDmGroup?.channel_label;
	}, [currentDmGroup?.channel_label, currentDmGroup?.type, currentDmGroup?.usernames]);

	const handleChangeGroupName = useCallback(
		async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				dispatch(
					channelsActions.updateChannel({
						channel_id: currentDmGroup.channel_id as string,
						category_id: '',
						app_id: '',
						channel_label: (e.target as HTMLTextAreaElement).value
					})
				);
			}
		},
		[currentDmGroup]
	);

	const handleRestoreName = useCallback(
		(e: React.FocusEvent<HTMLTextAreaElement, Element>) => {
			e.target.value = channelDmGroupLabel as string;
		},
		[channelDmGroupLabel]
	);
	return (
		<>
			<div className="justify-start items-center gap-1 flex flex-1">
				<div className="flex sbm:hidden pl-3 px-2" onClick={openMenu} role="button">
					<Icons.OpenMenu />
				</div>
				{channel ? (
					isMemberPath || isChannelPath ? (
						<p className="text-base font-semibold">{isChannelPath ? 'Channels' : 'Members'}</p>
					) : (
						<>
							{channelParent && (
								<div className="flex gap-1 items-center" onClick={handleNavigateToParent}>
									<ChannelTopbarLabel
										isPrivate={!!channelParent?.channel_private}
										label={channelParent?.channel_label || ''}
										type={channelParent?.type || ChannelType.CHANNEL_TYPE_CHANNEL}
									/>
									<Icons.ArrowRight />
								</div>
							)}
							<ChannelTopbarLabel
								isPrivate={!!channel?.channel_private}
								label={channel?.channel_label || ''}
								type={channel?.type || ChannelType.CHANNEL_TYPE_CHANNEL}
							/>
						</>
					)
				) : (
					<div className="flex items-center gap-3 flex-1">
						<DmTopbarAvatar
							isGroup={currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP}
							avatar={currentDmGroup?.channel_avatar?.[0]}
							avatarName={currentDmGroup?.channel_label?.at(0)}
						/>
						<textarea
							key={`${channelDmGroupLabel}_${currentDmGroup?.channel_id as string}`}
							rows={1}
							className={`${currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP ? 'cursor-text' : 'pointer-events-none cursor-default'} font-medium bg-transparent flex-1 outline-none resize-none w-full leading-10 truncate one-line text-colorTextLightMode dark:text-contentPrimary`}
							defaultValue={channelDmGroupLabel}
							onKeyDown={handleChangeGroupName}
							onBlur={handleRestoreName}
						></textarea>
					</div>
				)}
			</div>
			<div className="flex items-center gap-4">
				{channel ? (
					<ChannelTopbarTools
						isPagePath={!!isMemberPath || !!isChannelPath}
						isStream={channel?.type === ChannelType.CHANNEL_TYPE_STREAMING}
						isVoice={channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE}
						isApp={channel?.type === ChannelType.CHANNEL_TYPE_APP}
						isThread={!!(channel?.parent_id !== '0' && channel?.parent_id)}
					/>
				) : (
					<DmTopbarTools />
				)}
				<SearchMessageChannel mode={channel ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_DM} />
			</div>
		</>
	);
});

const ChannelTopbarLabel = memo(({ type, label, isPrivate }: { type: ChannelType; label: string; isPrivate: boolean }) => {
	const renderIcon = () => {
		if (!isPrivate) {
			switch (type) {
				case ChannelType.CHANNEL_TYPE_CHANNEL:
					return <Icons.Hashtag />;
				case ChannelType.CHANNEL_TYPE_THREAD:
					return <Icons.ThreadIcon />;
				case ChannelType.CHANNEL_TYPE_MEZON_VOICE:
					return <Icons.Speaker />;
				case ChannelType.CHANNEL_TYPE_GMEET_VOICE:
					return <Icons.Speaker />;
				case ChannelType.CHANNEL_TYPE_STREAMING:
					return <Icons.Stream />;
				case ChannelType.CHANNEL_TYPE_APP:
					return <Icons.AppChannelIcon />;
				default:
					return <Icons.Hashtag />;
			}
		}
		switch (type) {
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				return <Icons.HashtagLocked />;
			case ChannelType.CHANNEL_TYPE_THREAD:
				return <Icons.ThreadIconLocker />;
			case ChannelType.CHANNEL_TYPE_MEZON_VOICE:
				return <Icons.SpeakerLocked />;
			case ChannelType.CHANNEL_TYPE_GMEET_VOICE:
				return <Icons.SpeakerLocked />;
			case ChannelType.CHANNEL_TYPE_STREAMING:
				return <Icons.Stream />;
			case ChannelType.CHANNEL_TYPE_APP:
				return <Icons.AppChannelIcon />;
			default:
				return <Icons.HashtagLocked />;
		}
	};

	return (
		<div className="flex items-center text-lg gap-1 dark:text-white text-black">
			<div className="w-6">{renderIcon()}</div>
			<p className="text-base font-semibold leading-5 truncate">{label}</p>
		</div>
	);
});

const ChannelTopbarTools = memo(
	({
		isPagePath,
		isThread,
		isApp,
		isVoice,
		isStream
	}: {
		isVoice: boolean;
		isPagePath: boolean;
		isThread: boolean;
		isApp: boolean;
		isStream: boolean;
	}) => {
		const appearanceTheme = useSelector(selectTheme);
		const dispatch = useAppDispatch();
		const isShowChatStream = useSelector(selectIsShowChatStream);

		if (isPagePath) {
			return null;
		}

		const setTurnOffThreadMessage = async () => {
			const store = await getStoreAsync();
			const currentChannel = selectCurrentChannel(store.getState());
			const isShowCreateThread = selectIsShowCreateThread(store.getState() as RootState, currentChannel?.id as string);
			const isShowCreateTopic = selectIsShowCreateTopic(store.getState() as RootState);
			if (isShowCreateThread) {
				dispatch(threadsActions.setOpenThreadMessageState(false));
				dispatch(threadsActions.setValueThread(null));
			}
			if (isShowCreateTopic) {
				dispatch(topicsActions.setOpenTopicMessageState(false));
				dispatch(topicsActions.setCurrentTopicInitMessage(null));
			}
		};

		return (
			<div className={`items-center h-full flex`}>
				{!isStream ? (
					<div className="items-center gap-2 flex">
						<div className="relative items-center gap-4 hidden sbm:flex sbm:flex-row-reverse">
							<FileButton isLightMode={appearanceTheme === 'light'} />
							<MuteButton isLightMode={appearanceTheme === 'light'} />
							<InboxButton isLightMode={appearanceTheme === 'light'} />
							<PinButton mode={ChannelStreamMode.STREAM_MODE_CHANNEL} isLightMode={appearanceTheme === 'light'} />
							<div onClick={() => setTurnOffThreadMessage()}>
								<ChannelListButton isLightMode={appearanceTheme === 'light'} />
							</div>
							{!isApp && <ThreadButton isLightMode={appearanceTheme === 'light'} />}
							<CanvasButton isLightMode={appearanceTheme === 'light'} />
						</div>
						<div className="sbm:hidden mr-5">
							<ChannelListButton />
						</div>
					</div>
				) : (
					<>{isShowChatStream && <ChatButton isLightMode={appearanceTheme === 'light'} />}</>
				)}
			</div>
		);
	}
);

const DmTopbarAvatar = ({ isGroup, avatar, avatarName }: { isGroup: boolean; avatar?: string; avatarName?: string }) => {
	if (isGroup) {
		return (
			<div className="flex items-center justify-center">
				<img className="w-8 h-8 rounded-full object-cover" src="assets/images/avatar-group.png" alt="" />
			</div>
		);
	}
	return (
		<div className="flex items-center justify-center ">
			{avatar ? (
				<img className="w-8 h-8 rounded-full object-cover" src={createImgproxyUrl(avatar)} alt="" />
			) : (
				<div className="w-8 h-8 rounded-full uppercase flex items-center justify-center font-semibold dark:bg-bgAvatarDark bg-bgAvatarLight dark:text-bgAvatarLight text-bgAvatarDark">
					{avatarName}
				</div>
			)}
		</div>
	);
};

const DmTopbarTools = memo(() => {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectCurrentDM);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const appearanceTheme = useSelector(selectTheme);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode: mode });
	const isInCall = useSelector(selectIsInCall);
	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			const store = getStore();
			const state = store.getState();
			const sessionUser = selectSession(state);

			if (sessionUser) {
				sendMessage(content, mentions, attachments, references);
			} else {
				console.error('Session is not available');
			}
		},
		[sendMessage]
	);

	const setIsUseProfileDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsUseProfileDM(status));
		},
		[dispatch]
	);

	const setIsShowMemberListDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsShowMemberListDM(status));
		},
		[dispatch]
	);

	const handleStartCall = (isVideoCall = false) => {
		if (!isInCall) {
			handleSend({ t: ``, callLog: { isVideo: isVideoCall, callLogType: IMessageTypeCallLog.STARTCALL } }, [], [], []);
			dispatch(audioCallActions.startDmCall({ groupId: currentDmGroup.channel_id, isVideo: isVideoCall }));
			dispatch(audioCallActions.setGroupCallId(currentDmGroup.channel_id));
			dispatch(audioCallActions.setUserCallId(currentDmGroup?.user_id?.[0]));
			dispatch(audioCallActions.setIsBusyTone(false));
		} else {
			dispatch(toastActions.addToast({ message: 'You are on another call', type: 'warning', autoClose: 3000 }));
		}
	};

	return (
		<div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
			<div className=" items-center gap-2 flex">
				<div className="justify-start items-center gap-[15px] flex">
					<button title="Start voice call" onClick={() => handleStartCall()}>
						<Icons.IconPhoneDM className={`dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode`} />
					</button>
					<button title="Start Video Call" onClick={() => handleStartCall(true)}>
						<Icons.IconMeetDM className={`dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode`} />
					</button>
					<PinButton mode={mode} isLightMode={appearanceTheme === 'light'} />

					<AddMemberToGroupDm currentDmGroup={currentDmGroup} />
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
						<button title="Show Member List" onClick={() => setIsShowMemberListDM(!isShowMemberListDM)}>
							<span>
								<Icons.MemberList isWhite={isShowMemberListDM} />
							</span>
						</button>
					)}
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
						<button title="Show User Profile" onClick={() => setIsUseProfileDM(!isUseProfileDM)}>
							<span>
								<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
							</span>
						</button>
					)}
				</div>
			</div>
			{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
				<button title="Show Member List" onClick={() => setIsShowMemberListDM(!isShowMemberListDM)} className="sbm:hidden">
					<span>
						<Icons.MemberList isWhite={isShowMemberListDM} />
					</span>
				</button>
			)}
			{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
				<button title="Show User Profile" onClick={() => setIsUseProfileDM(!isUseProfileDM)} className="sbm:hidden">
					<span>
						<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
					</span>
				</button>
			)}
		</div>
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

function ThreadButton({ isLightMode }: { isLightMode: boolean }) {
	const isShowThread = useSelector(selectIsThreadModalVisible);

	const threadRef = useRef<HTMLDivElement | null>(null);

	const dispatch = useDispatch();

	const handleToggleThreads = () => {
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
	const currentChannelId = useSelector(selectCurrentChannelId) ?? '';
	const isShowPinBadge = useSelector(selectIsShowPinBadgeByChannelId(currentChannelId));

	const pinRef = useRef<HTMLDivElement | null>(null);

	const handleTogglePinMessage = async () => {
		const store = getStore();
		const state = store.getState();
		const currentClanId = selectCurrentClanId(state) as string;
		const currentDmGroup = selectCurrentDM(state);

		if (!currentDmGroup?.id && !currentChannelId) {
			return;
		}
		await dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannelId || currentDmGroup.id }));
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

export function RedDot() {
	return (
		<div
			className="absolute border-[1px] dark:border-bgPrimary border-[#ffffff]
		 w-[12px] h-[12px] rounded-full bg-colorDanger
		  font-bold text-[11px] flex items-center justify-center -bottom-1.5 -right-1"
		></div>
	);
}

function ChannelListButton({ isLightMode }: { isLightMode?: boolean }) {
	const dispatch = useDispatch();
	const isActive = useSelector(selectIsShowMemberList);

	const handleClick = () => {
		const store = getStore();
		const state = store.getState();
		const currentChannelId = selectCurrentChannelId(state);
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

const AddMemberToGroupDm = memo(({ currentDmGroup }: { currentDmGroup: DirectEntity }) => {
	const [openAddToGroup, setOpenAddToGroup] = useState<boolean>(false);
	const handleOpenAddToGroupModal = () => {
		setOpenAddToGroup(!openAddToGroup);
	};
	const rootRef = useRef<HTMLDivElement>(null);
	return (
		<div onClick={handleOpenAddToGroupModal} ref={rootRef} className="cursor-pointer">
			{openAddToGroup && (
				<div className="relative">
					<CreateMessageGroup
						currentDM={currentDmGroup}
						isOpen={openAddToGroup}
						onClose={handleOpenAddToGroupModal}
						classNames="right-0 left-auto"
						rootRef={rootRef}
					/>
				</div>
			)}
			<span title="Add friends to DM">
				<Icons.IconAddFriendDM />
			</span>
		</div>
	);
});

export default ChannelTopbar;
