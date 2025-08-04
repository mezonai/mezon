import { toChannelPage, useChatSending, useCustomNavigate, useGifsStickersEmoji, useMenu, usePathMatch } from '@mezon/core';
import {
	DMCallActions,
	DirectEntity,
	RootState,
	appActions,
	audioCallActions,
	canvasAPIActions,
	channelsActions,
	getStore,
	getStoreAsync,
	groupCallActions,
	pinMessageActions,
	searchMessagesActions,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentDM,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectIsInCall,
	selectIsPinModalVisible,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectIsShowMemberList,
	selectIsShowMemberListDM,
	selectIsShowPinBadgeByChannelId,
	selectIsThreadModalVisible,
	selectIsUseProfileDM,
	selectNotifiSettingsEntitiesById,
	selectSession,
	selectStatusMenu,
	threadsActions,
	toastActions,
	topicsActions,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMessageSendPayload, IMessageTypeCallLog, SubPanelName, ValidateSpecialCharacters, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, NotificationType } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateMessageGroup from '../DmList/CreateMessageGroup';
import { NotificationTooltip } from '../NotificationList';
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
			className={`draggable-area max-sbm:z-20 flex h-heightTopBar min-w-0 w-full items-center justify-between  flex-shrink   ${closeMenu && 'fixed top-0 w-screen'} ${closeMenu && statusMenu ? 'left-[100vw]' : 'left-0'}`}
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
	}, [setStatusMenu]);
	const closeMenu = useCallback(() => {
		const isMobile = window.innerWidth < 640;
		if (isMobile) {
			setStatusMenu(false);
		}
	}, [setStatusMenu]);
	const navigate = useCustomNavigate();
	const dispatch = useAppDispatch();
	const handleNavigateToParent = () => {
		if (!channelParent?.id || !channelParent?.clan_id) {
			return;
		}
		navigate(toChannelPage(channelParent.id, channelParent.clan_id));
		closeMenu();
	};
	const currentDmGroup = useSelector(selectCurrentDM);
	const channelDmGroupLabel = useMemo(() => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			return currentDmGroup?.channel_label || currentDmGroup?.usernames?.join(',');
		}
		return currentDmGroup?.channel_label;
	}, [currentDmGroup?.channel_label, currentDmGroup?.type, currentDmGroup?.usernames]);

	const [isEditing, setIsEditing] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const [editValue, setEditValue] = useState(channelDmGroupLabel || '');

	useEffect(() => {
		if (isEditing) setEditValue(channelDmGroupLabel || '');
	}, [isEditing, channelDmGroupLabel]);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;
		setEditValue(value);
		const regex = ValidateSpecialCharacters();
		if (regex.test(value)) {
			setEditError(null);
		} else {
			setEditError('Please enter a valid channel name (max 64 characters, only words, numbers, _ or -).');
		}
	};

	const handleChangeGroupName = useCallback(
		async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				const value = editValue.trim();
				const regex = ValidateSpecialCharacters();
				if (!regex.test(value)) {
					setEditError('Please enter a valid channel name (max 64 characters, only words, numbers, _ or -).');
					return;
				}
				setEditError(null);
				dispatch(
					channelsActions.updateChannel({
						channel_id: currentDmGroup.channel_id as string,
						category_id: '',
						app_id: '',
						channel_label: (e.target as HTMLTextAreaElement).value
					})
				);
				setIsEditing(false);
			}
			if (e.key === 'Escape') {
				setIsEditing(false);
				setEditError(null);
			}
		},
		[currentDmGroup, dispatch, editValue]
	);

	const handleRestoreName = useCallback(
		(e: React.FocusEvent<HTMLTextAreaElement, Element>) => {
			setEditValue(channelDmGroupLabel as string);
			setIsEditing(false);
			setEditError(null);
		},
		[channelDmGroupLabel]
	);

	const handleStartEditing = useCallback(() => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			setIsEditing(true);
		}
	}, [currentDmGroup?.type]);

	const handleCloseCanvas = () => {
		dispatch(appActions.setIsShowCanvas(false));
		closeMenu();
	};
	return (
		<>
			<div className="flex relative flex-1 min-w-0 items-center gap-2  text-theme-primary">
				{editError && <span className="absolute  text-xs top-[52px] text-colorDanger mb-1 break-words w-full">{editError}</span>}
				<div className="flex sbm:hidden pl-3 px-2 text-theme-primary" onClick={openMenu} role="button">
					<Icons.OpenMenu />
				</div>
				{channel ? (
					isMemberPath || isChannelPath ? (
						<p className="text-base font-semibold truncate max-sbm:max-w-[180px]">{isChannelPath ? 'Channels' : 'Members'}</p>
					) : (
						<>
							{channelParent && (
								<div className="flex gap-1 items-center truncate max-sbm:hidden" onClick={handleNavigateToParent}>
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
								onClick={handleCloseCanvas}
							/>
						</>
					)
				) : (
					<div className="flex items-center gap-3 flex-1 overflow-hidden">
						<DmTopbarAvatar
							isGroup={currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP}
							avatar={currentDmGroup?.channel_avatar?.[0]}
							avatarName={currentDmGroup?.channel_label?.at(0)}
						/>

						{isEditing ? (
							<div className=" relative flex flex-col flex-1 min-w-0">
								<textarea
									key={`${channelDmGroupLabel}_${currentDmGroup?.channel_id as string}`}
									rows={1}
									className={`none-draggable-area cursor-text font-medium bg-transparent flex-1 outline-none resize-none w-full leading-10 truncate one-line text-theme-primary `}
									value={editValue}
									onChange={handleInputChange}
									onKeyDown={handleChangeGroupName}
									onBlur={handleRestoreName}
									maxLength={64}
									style={{ minHeight: 40, maxWidth: 250, minWidth: 0, overflow: 'hidden' }}
								></textarea>
							</div>
						) : (
							<div
								key={`${channelDmGroupLabel}_${currentDmGroup?.channel_id as string}_display`}
								className={`overflow-hidden whitespace-nowrap text-ellipsis none-draggable-area ${currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP ? 'cursor-text' : 'pointer-events-none cursor-default'} font-medium bg-transparent outline-none leading-10 text-theme-primary max-w-[250px] min-w-0`}
								onClick={handleStartEditing}
								title={channelDmGroupLabel}
							>
								{channelDmGroupLabel}
							</div>
						)}
					</div>
				)}
			</div>
			<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
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
				{!isMemberPath && <SearchMessageChannel mode={channel ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_DM} />}
			</div>
		</>
	);
});

const ChannelTopbarLabel = memo(
	({ type, label, isPrivate, onClick }: { type: ChannelType; label: string; isPrivate: boolean; onClick?: () => void }) => {
		const { setStatusMenu } = useMenu();

		const handleClick = () => {
			const isMobile = window.innerWidth < 640;
			if (isMobile) {
				setStatusMenu(false);
			}
			onClick?.();
		};

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
			<div className="none-draggable-area flex items-center text-lg gap-3 min-w-0" onClick={onClick}>
				<div className="w-4 flex-shrink-0">{renderIcon()}</div>
				<p className="flex-1 min-w-0 text-base font-semibold leading-5 truncate text-theme-message">{label}</p>
			</div>
		);
	}
);

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
		const dispatch = useAppDispatch();
		const isShowChatStream = useSelector(selectIsShowChatStream);
		const { setStatusMenu } = useMenu();

		if (isPagePath) {
			return null;
		}

		const closeMenuOnMobile = () => {
			const isMobile = window.innerWidth < 640;
			if (isMobile) {
				setStatusMenu(false);
			}
		};

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
			closeMenuOnMobile();
		};

		const fetchCanvasChannel = async () => {
			const store = await getStoreAsync();
			const currentChannel = selectCurrentChannel(store.getState());
			dispatch(canvasAPIActions.getChannelCanvasList({ channel_id: currentChannel?.channel_id || '', clan_id: currentChannel?.clan_id || '' }));
			closeMenuOnMobile();
		};
		return (
			<div className={`items-center h-full flex`}>
				{!isStream ? (
					<div className="items-center gap-2 flex">
						<div className="relative items-center gap-4 hidden sbm:flex sbm:flex-row-reverse">
							<FileButton />
							<MuteButton />
							<InboxButton />
							<PinButton mode={ChannelStreamMode.STREAM_MODE_CHANNEL} styleCss={'text-theme-primary text-theme-primary-hover'} />
							<div onClick={setTurnOffThreadMessage}>
								<ChannelListButton />
							</div>
							{!isApp && <ThreadButton />}
							<CanvasButton onClick={fetchCanvasChannel} />
						</div>
						<div className="sbm:hidden mr-5" onClick={closeMenuOnMobile}>
							<ChannelListButton />
						</div>
					</div>
				) : (
					<>{isShowChatStream && <ChatButton closeMenuOnMobile={closeMenuOnMobile} />}</>
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
				<img className="w-8 h-8 rounded-full object-cover " src={createImgproxyUrl(avatar)} alt="" />
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
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const userProfile = useSelector(selectSession);
	const { setStatusMenu } = useMenu();
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode: mode });
	const isInCall = useSelector(selectIsInCall);
	const isGroupCallActive = useSelector((state: RootState) => state.groupCall?.isGroupCallActive || false);
	const voiceInfo = useSelector((state: RootState) => state.voice?.voiceInfo || null);
	const closeMenuOnMobile = useCallback(() => {
		const isMobile = window.innerWidth < 640;
		if (isMobile) {
			setStatusMenu(false);
		}
	}, [setStatusMenu]);
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

	const handleStartCall = (isVideoCall = false) => {
		closeMenuOnMobile();
		if (currentDmGroup.type === ChannelType.CHANNEL_TYPE_GROUP) {
			if (isGroupCallActive && (voiceInfo as any)?.channelId === currentDmGroup.channel_id) {
				dispatch(voiceActions.setOpenPopOut(false));
				dispatch(DMCallActions.setIsShowMeetDM(isVideoCall));
				dispatch(voiceActions.setShowCamera(isVideoCall));

				dispatch(audioCallActions.setIsRingTone(false));
				dispatch(audioCallActions.setIsBusyTone(false));
				dispatch(audioCallActions.setIsEndTone(false));
				dispatch(audioCallActions.setIsDialTone(false));
				return;
			}

			if (!isInCall && !isGroupCallActive) {
				if (!currentDmGroup.channel_id) {
					dispatch(toastActions.addToast({ message: 'Group channel ID is missing', type: 'error', autoClose: 3000 }));
					return;
				}

				handleSend(
					{
						t: `Started ${isVideoCall ? 'video' : 'voice'} call`,
						callLog: {
							isVideo: isVideoCall,
							callLogType: IMessageTypeCallLog.STARTCALL,
							showCallBack: false
						}
					},
					[],
					[],
					[]
				);

				dispatch(
					groupCallActions.showPreCallInterface({
						groupId: currentDmGroup.channel_id,
						isVideo: isVideoCall
					})
				);

				dispatch(
					groupCallActions.setIncomingCallData({
						groupId: currentDmGroup.channel_id,
						groupName: currentDmGroup.channel_label || currentDmGroup.usernames?.join(',') || 'Group Call',
						groupAvatar: currentDmGroup.channel_avatar?.[0],
						meetingCode: currentDmGroup.meeting_code,
						clanId: currentDmGroup.clan_id,
						participants: [...(currentDmGroup?.user_id || []), userProfile?.user_id?.toString() as string],
						callerInfo: {
							id: userProfile?.user_id || '',
							name: userProfile?.username || '',
							avatar: ''
						}
					})
				);

				dispatch(audioCallActions.setGroupCallId(currentDmGroup.channel_id));
				dispatch(audioCallActions.setIsBusyTone(false));
			} else {
				const isSameGroup = (voiceInfo as any)?.channelId === currentDmGroup.channel_id;

				if (isSameGroup) {
					dispatch(voiceActions.setOpenPopOut(false));
					dispatch(DMCallActions.setIsShowMeetDM(isVideoCall));
					dispatch(voiceActions.setShowCamera(isVideoCall));

					dispatch(audioCallActions.setIsRingTone(false));
					dispatch(audioCallActions.setIsBusyTone(false));
					dispatch(audioCallActions.setIsEndTone(false));
					dispatch(audioCallActions.setIsDialTone(false));

					dispatch(
						groupCallActions.showPreCallInterface({
							groupId: currentDmGroup.channel_id || '',
							isVideo: isVideoCall
						})
					);
				} else {
					dispatch(
						toastActions.addToast({
							message: 'You are on another call',
							type: 'warning',
							autoClose: 3000
						})
					);
				}
			}
			return;
		}

		if (!isInCall) {
			if (!currentDmGroup.channel_id) {
				dispatch(toastActions.addToast({ message: 'Direct message channel ID is missing', type: 'error', autoClose: 3000 }));
				return;
			}

			handleSend(
				{
					t: `Started ${isVideoCall ? 'video' : 'voice'} call`,
					callLog: {
						isVideo: isVideoCall,
						callLogType: IMessageTypeCallLog.STARTCALL,
						showCallBack: false
					}
				},
				[],
				[],
				[]
			);
			dispatch(audioCallActions.startDmCall({ groupId: currentDmGroup.channel_id, isVideo: isVideoCall }));
			dispatch(audioCallActions.setGroupCallId(currentDmGroup.channel_id));

			if (currentDmGroup?.user_id?.[0]) {
				dispatch(audioCallActions.setUserCallId(currentDmGroup.user_id[0]));
			}

			dispatch(audioCallActions.setIsBusyTone(false));
		} else {
			dispatch(toastActions.addToast({ message: 'You are on another call', type: 'warning', autoClose: 3000 }));
		}
	};

	const isGroupCallDisabled = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && !currentDmGroup?.meeting_code;

	const setIsUseProfileDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsUseProfileDM(status));
			closeMenuOnMobile();
		},
		[dispatch, closeMenuOnMobile]
	);

	const setIsShowMemberListDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsShowMemberListDM(status));
			closeMenuOnMobile();
		},
		[dispatch, closeMenuOnMobile]
	);

	return (
		<div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
			<div className=" items-center gap-2 flex">
				<div className="justify-start items-center gap-[15px] flex">
					<button
						title="Start voice call"
						onClick={() => handleStartCall()}
						disabled={isGroupCallDisabled}
						className={`text-theme-primary-hover ${isGroupCallDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
					>
						<Icons.IconPhoneDM defaultSize="size-5" />
					</button>
					<button
						title="Start Video Call"
						onClick={() => handleStartCall(true)}
						disabled={isGroupCallDisabled}
						className={`text-theme-primary-hover ${isGroupCallDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
					>
						<Icons.IconMeetDM defaultSize="size-5" />
					</button>
					<PinButton mode={mode} styleCss="text-theme-primary-hover" />

					<AddMemberToGroupDm currentDmGroup={currentDmGroup} />
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
						<button title="Show Member List" onClick={() => setIsShowMemberListDM(!isShowMemberListDM)}>
							<span>
								<Icons.MemberList defaultSize="size-5" />
							</span>
						</button>
					)}
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
						<button title="Show User Profile" onClick={() => setIsUseProfileDM(!isUseProfileDM)}>
							<span>
								<Icons.IconUserProfileDM defaultSize="size-5" />
							</span>
						</button>
					)}
				</div>
			</div>
			{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
				<button title="Show Member List" onClick={() => setIsShowMemberListDM(!isShowMemberListDM)} className="sbm:hidden">
					<span>
						<Icons.MemberList defaultSize="size-5" />
					</span>
				</button>
			)}
			{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
				<button title="Show User Profile" onClick={() => setIsUseProfileDM(!isUseProfileDM)} className="sbm:hidden">
					<span>
						<Icons.IconUserProfileDM defaultSize="size-5" />
					</span>
				</button>
			)}
		</div>
	);
});

function FileButton() {
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
			<button
				title="Files"
				className="focus-visible:outline-none text-theme-primary text-theme-primary-hover"
				onClick={handleShowFile}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.FileIcon defaultSize="size-5" />
			</button>
			{isShowFile && <FileModal onClose={handleClose} rootRef={fileRef} />}
		</div>
	);
}

function CanvasButton({ onClick }: { onClick?: () => void }) {
	const [isShowCanvas, setIsShowCanvas] = useState<boolean>(false);
	const canvasRef = useRef<HTMLDivElement | null>(null);

	const handleShowCanvas = async () => {
		setIsShowCanvas(!isShowCanvas);
		onClick?.();
	};

	const handleClose = useCallback(() => {
		setIsShowCanvas(false);
	}, []);

	return (
		<div className="relative leading-5 h-5" ref={canvasRef}>
			<button
				content="Canvas"
				className="focus-visible:outline-none text-theme-primary text-theme-primary-hover"
				onClick={handleShowCanvas}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.CanvasIcon defaultSize="size-5" />
			</button>
			{isShowCanvas && <CanvasModal onClose={handleClose} rootRef={canvasRef} />}
		</div>
	);
}

function ThreadButton() {
	const isShowThread = useSelector(selectIsThreadModalVisible);

	const threadRef = useRef<HTMLDivElement | null>(null);

	const dispatch = useDispatch();

	const handleToggleThreads = () => {
		dispatch(threadsActions.toggleThreadModal());
	};

	return (
		<div className="relative leading-5 h-5" ref={threadRef}>
			<button
				title="Threads"
				className="focus-visible:outline-none text-theme-primary text-theme-primary-hover"
				onClick={handleToggleThreads}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.ThreadIcon defaultSize="size-5" />
			</button>
			{isShowThread && <ThreadModal onClose={handleToggleThreads} rootRef={threadRef} />}
		</div>
	);
}

function MuteButton() {
	const [isMuteBell, setIsMuteBell] = useState<boolean>(false);
	const currentChannel = useSelector(selectCurrentChannel);
	const getNotificationChannelSelected = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, currentChannel?.id || ''));
	const defaultNotificationCategory = useAppSelector((state) => selectDefaultNotificationCategory(state, currentChannel?.category_id as string));
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
				className="focus-visible:outline-none text-theme-primary text-theme-primary-hover"
				onClick={handleShowNotificationSetting}
				onContextMenu={(e) => e.preventDefault()}
			>
				{isMuteBell ? <Icons.MuteBell defaultSize="size-5" /> : <Icons.UnMuteBell defaultSize="size-5" />}
			</button>
			{isShowNotificationSetting && <NotificationSetting onClose={handleClose} rootRef={notiRef} />}
		</div>
	);
}

function PinButton({ styleCss, mode }: { styleCss: string; mode?: number }) {
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
		await dispatch(pinMessageActions.fetchChannelPinMessages({ channelId: currentChannelId || currentDmGroup.id, clanId: currentClanId }));
		dispatch(pinMessageActions.togglePinModal());
		if (isShowPinBadge) {
			dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: currentClanId, channelId: currentChannelId, isShow: false }));
		}
	};

	return (
		<div className="relative leading-5 h-5" ref={pinRef}>
			<button
				title="Pinned Messages"
				className={`${styleCss} focus-visible:outline-none relative text-theme-primary text-theme-primary-hover`}
				onClick={handleTogglePinMessage}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.PinRight defaultSize="size-5" />
				{isShowPinBadge && (
					<div
						className="absolute border-theme-primary
		 w-[8px] h-[8px] rounded-full bg-colorDanger outline outline-1 outline-transparent
		  font-bold text-[11px] flex items-center justify-center -bottom-[0.05rem] -right-[0.075rem]"
					></div>
				)}
			</button>
			{isShowPinMessage && <PinnedMessages mode={mode} rootRef={pinRef} onClose={handleTogglePinMessage} />}
		</div>
	);
}

export function InboxButton({ isVoiceChannel }: { isVoiceChannel?: boolean }) {
	return <NotificationTooltip />;
}

export function RedDot() {
	return (
		<div
			className="absolute border-theme-primary
		 w-[8px] h-[8px] rounded-full bg-colorDanger outline outline-1 outline-transparent
		  font-bold text-[11px] flex items-center justify-center -bottom-[0.05rem] -right-[0.075rem]"
		></div>
	);
}

function ChannelListButton() {
	const dispatch = useDispatch();
	const isActive = useSelector(selectIsShowMemberList);
	const { setStatusMenu } = useMenu();

	const handleClick = () => {
		const store = getStore();
		const state = store.getState();
		const currentChannelId = selectCurrentChannelId(state);
		dispatch(appActions.setIsShowMemberList(!isActive));
		dispatch(searchMessagesActions.setIsSearchMessage({ channelId: currentChannelId as string, isSearchMessage: false }));

		const isMobile = window.innerWidth < 640;
		if (isMobile) {
			setStatusMenu(false);
		}
	};
	return (
		<div className="relative leading-5 h-5">
			<button title="Members" onClick={handleClick} className="text-theme-primary text-theme-primary-hover">
				<Icons.MemberList defaultSize="size-5" />
			</button>
		</div>
	);
}

function ChatButton({ closeMenuOnMobile }: { closeMenuOnMobile?: () => void }) {
	const dispatch = useDispatch();
	const handleClick = () => {
		dispatch(appActions.setIsShowChatStream(true));
		closeMenuOnMobile?.();
	};
	return (
		<div className="relative leading-5 h-5">
			<button title="Show Chat" onClick={handleClick} className="text-theme-primary text-theme-primary-hover">
				<Icons.Chat defaultSize="size-5" />
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
		<div onClick={handleOpenAddToGroupModal} ref={rootRef} className="none-draggable-area cursor-pointer">
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
				<Icons.IconAddFriendDM defaultSize="size-5" />
			</span>
		</div>
	);
});

export default ChannelTopbar;
