import { toChannelPage, useChatSending, useCustomNavigate, useGifsStickersEmoji, useMemberStatus, useMenu, usePathMatch } from '@mezon/core';
import type { DirectEntity, RootState } from '@mezon/store';
import {
	DMCallActions,
	EStateFriend,
	appActions,
	audioCallActions,
	canvasAPIActions,
	channelsActions,
	directActions,
	galleryActions,
	getStore,
	getStoreAsync,
	groupCallActions,
	pinMessageActions,
	searchMessagesActions,
	selectAllAccount,
	selectChannelById,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentDM,
	selectDefaultNotificationCategory,
	selectDefaultNotificationClan,
	selectFriendById,
	selectGalleryAttachmentsByChannel,
	selectIsInCall,
	selectIsPinModalVisible,
	selectIsShowChatStream,
	selectIsShowCreateThread,
	selectIsShowCreateTopic,
	selectIsShowMemberList,
	selectIsShowMemberListDM,
	selectIsShowPinBadgeByChannelId,
	selectIsShowPinBadgeByDmId,
	selectIsThreadModalVisible,
	selectIsUseProfileDM,
	selectNotifiSettingsEntitiesById,
	selectOpenVoiceCall,
	selectSession,
	selectStatusMenu,
	selectUpdateDmGroupError,
	selectUpdateDmGroupLoading,
	threadsActions,
	toastActions,
	topicsActions,
	useAppDispatch,
	useAppSelector,
	voiceActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IMessageSendPayload } from '@mezon/utils';
import { IMessageTypeCallLog, SubPanelName, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, NotificationType } from 'mezon-js';
import type { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useEditGroupModal } from '../../hooks/useEditGroupModal';
import CreateMessageGroup from '../DmList/CreateMessageGroup';
import { UserStatusIconDM } from '../MemberProfile';
import ModalEditGroup from '../ModalEditGroup';
import { NotificationTooltip } from '../NotificationList';
import SearchMessageChannel from '../SearchMessageChannel';
import { GalleryModal } from './GalleryModal';
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
	const { t } = useTranslation('channelTopbar');
	const channel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const memberPath = `/chat/clans/${currentClanId}/member-safety`;
	const channelPath = `/chat/clans/${currentClanId}/channel-setting`;
	const guidePath = `/chat/clans/${currentClanId}/guide`;
	const { isMemberPath, isChannelPath, isGuidePath } = usePathMatch({
		isMemberPath: memberPath,
		isChannelPath: channelPath,
		isGuidePath: guidePath
	});
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
	const userProfile = useSelector(selectAllAccount);
	const channelDmGroupLabel = useMemo(() => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			return currentDmGroup?.channel_label || currentDmGroup?.usernames?.join(',');
		}
		return currentDmGroup?.channel_label;
	}, [currentDmGroup?.channel_label, currentDmGroup?.type, currentDmGroup?.usernames]);
	const dmUserAvatar = useMemo(() => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			return currentDmGroup?.channel_avatar || 'assets/images/avatar-group.png';
		}

		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && currentDmGroup?.user_ids) {
			return currentDmGroup.avatars?.[0];
		}
	}, [currentDmGroup, userProfile?.user?.id]);

	const updateDmGroupLoading = useAppSelector((state) => selectUpdateDmGroupLoading(currentDmGroup?.channel_id || '')(state));
	const updateDmGroupError = useAppSelector((state) => selectUpdateDmGroupError(currentDmGroup?.channel_id || '')(state));

	const editGroupModal = useEditGroupModal({
		channelId: currentDmGroup?.channel_id,
		currentGroupName: channelDmGroupLabel || '',
		currentAvatar: currentDmGroup?.channel_avatar || ''
	});

	const handleOpenEditModal = useCallback(() => {
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
			editGroupModal.openEditModal();
		}
	}, [currentDmGroup?.type, editGroupModal]);

	const handleCloseCanvas = () => {
		dispatch(appActions.setIsShowCanvas(false));
		closeMenu();
	};

	const pagePathTitle = useMemo(() => {
		if (isChannelPath) {
			return t('pageTitle.channels');
		}
		if (isMemberPath) {
			return t('pageTitle.members');
		}
		if (isGuidePath) {
			return t('pageTitle.guideClan');
		}
		return '';
	}, [isChannelPath, isGuidePath, isMemberPath, t]);
	const userStatus = useMemberStatus(currentDmGroup?.user_ids?.[0] || '');

	return (
		<>
			<div className="flex relative flex-1 min-w-0 items-center gap-2  text-theme-primary">
				<div className="flex sbm:hidden pl-3 px-2 text-theme-primary" onClick={openMenu} role="button">
					<Icons.OpenMenu />
				</div>

				{pagePathTitle ? (
					<p className="text-base font-semibold truncate max-sbm:max-w-[180px]">{pagePathTitle}</p>
				) : (
					<>
						{!!channel && (
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
						)}
					</>
				)}

				{currentClanId === '0' && (
					<div
						className="flex items-center gap-3 flex-1 overflow-hidden relative"
						data-e2e={generateE2eId(`chat.direct_message.header.left_container`)}
					>
						<DmTopbarAvatar
							isGroup={currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP}
							avatar={dmUserAvatar}
							avatarName={currentDmGroup?.channel_label?.at(0)}
						/>
						{currentDmGroup?.type !== ChannelType.CHANNEL_TYPE_GROUP && (
							<div className="absolute top-6 left-5 w-3 h-3">
								<UserStatusIconDM status={userStatus?.status} />
							</div>
						)}
						<div
							key={`${channelDmGroupLabel}_${currentDmGroup?.channel_id as string}_display`}
							className={`flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis none-draggable-area group ${
								currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP
									? 'cursor-pointer hover:text-theme-primary-active transition-colors bg-item-theme-hover rounded-lg px-2'
									: 'pointer-events-none cursor-default'
							} font-medium bg-transparent outline-none leading-10 text-theme-primary max-w-[250px] min-w-0`}
							onClick={handleOpenEditModal}
							title={currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP ? t('tooltips.clickToEdit') : channelDmGroupLabel}
							data-e2e={generateE2eId(`chat.direct_message.chat_item.namegroup`)}
						>
							<span className="truncate">{channelDmGroupLabel}</span>
							{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
								<svg
									className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
									viewBox="0 0 16 16"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M8.29289 3.70711L1 11V15H5L12.2929 7.70711L8.29289 3.70711Z" />
									<path d="M9.70711 2.29289L13.7071 6.29289L15.1716 4.82843C15.702 4.29799 16 3.57857 16 2.82843C16 1.26633 14.7337 0 13.1716 0C12.4214 0 11.702 0.297995 11.1716 0.828428L9.70711 2.29289Z" />
								</svg>
							)}
						</div>
					</div>
				)}
			</div>
			<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
				{!pagePathTitle && (
					<>
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
					</>
				)}

				{!isMemberPath && !isChannelPath && (
					<SearchMessageChannel mode={channel ? ChannelStreamMode.STREAM_MODE_CHANNEL : ChannelStreamMode.STREAM_MODE_DM} />
				)}
			</div>

			{editGroupModal.isEditModalOpen && (
				<ModalEditGroup
					isOpen={editGroupModal.isEditModalOpen}
					onClose={editGroupModal.closeEditModal}
					onSave={editGroupModal.handleSave}
					onImageUpload={editGroupModal.handleImageUpload}
					groupName={editGroupModal.groupName}
					onGroupNameChange={editGroupModal.setGroupName}
					imagePreview={editGroupModal.imagePreview}
					isLoading={updateDmGroupLoading}
					error={updateDmGroupError}
				/>
			)}
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
							<div className="relative leading-5 h-5 border-left-theme-primary pl-4">
								<InboxButton />
							</div>
							<FileButton />
							<GalleryButton />
							<MuteButton />
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
		if (avatar) {
			return (
				<div className="flex items-center justify-center">
					<img className="w-8 h-8 flex-shrink-0 rounded-full object-cover" src={avatar} alt="" />
				</div>
			);
		}
		return (
			<div className="flex items-center justify-center">
				<img className="w-8 h-8 flex-shrink-0 rounded-full object-cover" src="assets/images/avatar-group.png" alt="" />
			</div>
		);
	}
	return (
		<div className="flex items-center justify-center ">
			{avatar ? (
				<img
					className="w-8 h-8 flex-shrink-0 rounded-full object-cover "
					src={createImgproxyUrl(avatar)}
					alt=""
					data-e2e={generateE2eId(`avatar.image`)}
				/>
			) : (
				<div className="w-8 h-8 flex-shrink-0 rounded-full uppercase flex items-center justify-center font-semibold dark:bg-bgAvatarLight dark:text-bgAvatarDark text-bgAvatarLight">
					{avatarName}
				</div>
			)}
		</div>
	);
};

const DmTopbarTools = memo(() => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectCurrentDM);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const selectOpenVoice = useSelector(selectOpenVoiceCall);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const userProfile = useSelector(selectSession);
	const { setStatusMenu } = useMenu();
	const mode = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	const { sendMessage } = useChatSending({ channelOrDirect: currentDmGroup, mode });
	const isInCall = useSelector(selectIsInCall);
	const isGroupCallActive = useSelector((state: RootState) => state.groupCall?.isGroupCallActive || false);
	const voiceInfo = useSelector((state: RootState) => state.voice?.voiceInfo || null);
	const infoFriend = useAppSelector((state: RootState) => selectFriendById(state, currentDmGroup?.user_ids?.[0] || ''));

	const isBlockUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK;
	}, [currentDmGroup?.user_ids?.[0], infoFriend]);

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
		if (currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP) {
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
					dispatch(toastActions.addToast({ message: t('toastMessages.groupChannelIdMissing'), type: 'error', autoClose: 3000 }));
					return;
				}

				handleSend(
					{
						t: isVideoCall ? t('callMessages.startedVideoCall') : t('callMessages.startedVoiceCall'),
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
						participants: [...(currentDmGroup?.user_ids || []), userProfile?.user_id?.toString() as string],
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
							message: t('toastMessages.youAreOnAnotherCall'),
							type: 'warning',
							autoClose: 3000
						})
					);
				}
			}
			return;
		}
		if (!isInCall) {
			startCallDM(isVideoCall, currentDmGroup?.id, currentDmGroup?.user_ids?.[0]);
		} else {
			dispatch(toastActions.addToast({ message: t('toastMessages.youAreOnAnotherCall'), type: 'warning', autoClose: 3000 }));
		}
	};

	const startCallDM = (isVideoCall = false, channelId?: string, userId?: string) => {
		if (!channelId) {
			dispatch(toastActions.addToast({ message: t('toastMessages.dmChannelIdMissing'), type: 'error', autoClose: 3000 }));
			return;
		}

		handleSend(
			{
				t: isVideoCall ? t('callMessages.startedVideoCall') : t('callMessages.startedVoiceCall'),
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
		dispatch(audioCallActions.startDmCall({ groupId: channelId, isVideo: isVideoCall }));
		dispatch(audioCallActions.setGroupCallId(channelId));

		if (userId) {
			dispatch(audioCallActions.setUserCallId(userId));
		}

		dispatch(audioCallActions.setIsBusyTone(false));
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

	useEffect(() => {
		if (selectOpenVoice?.open && currentDmGroup?.id === selectOpenVoice?.channelId) {
			startCallDM(selectOpenVoice?.hasVideo, selectOpenVoice?.channelId, selectOpenVoice?.userId);
			dispatch(audioCallActions.setCloseVoiceCall());
		}
	}, [selectOpenVoice, currentDmGroup, sendMessage]);

	return (
		<div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
			<div className=" items-center gap-2 flex">
				<div className="justify-start items-center gap-[15px] flex ">
					{!isBlockUser && (
						<>
							<button
								title={t('tooltips.startVoiceCall')}
								onClick={() => handleStartCall()}
								disabled={isGroupCallDisabled}
								className={`text-theme-primary-hover ${isGroupCallDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								<Icons.IconPhoneDM defaultSize="size-5" />
							</button>
							<button
								title={t('tooltips.startVideoCall')}
								onClick={() => handleStartCall(true)}
								disabled={isGroupCallDisabled}
								className={`text-theme-primary-hover ${isGroupCallDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								<Icons.IconMeetDM defaultSize="size-5" />
							</button>
						</>
					)}
					<PinButton mode={mode} styleCss="text-theme-primary-hover" />

					<AddMemberToGroupDm currentDmGroup={currentDmGroup} />
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
						<button
							title={t('tooltips.showMemberList')}
							onClick={() => setIsShowMemberListDM(!isShowMemberListDM)}
							data-e2e={generateE2eId(`chat.direct_message.member_list.button`)}
							className={`text-theme-primary-hover ${isShowMemberListDM ? 'text-theme-primary-active' : ''}`}
						>
							<span>
								<Icons.MemberList defaultSize="size-5" />
							</span>
						</button>
					)}
					{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
						<button
							title={t('tooltips.showUserProfile')}
							onClick={() => setIsUseProfileDM(!isUseProfileDM)}
							data-e2e={generateE2eId(`chat.direct_message.header.right_container.user_profile`)}
							className={`text-theme-primary-hover ${isUseProfileDM ? 'text-theme-primary-active' : ''}`}
						>
							<span>
								<Icons.IconUserProfileDM defaultSize="size-5" />
							</span>
						</button>
					)}
				</div>
			</div>
			{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
				<button title={t('tooltips.showMemberList')} onClick={() => setIsShowMemberListDM(!isShowMemberListDM)} className="sbm:hidden">
					<span>
						<Icons.MemberList defaultSize="size-5" />
					</span>
				</button>
			)}
			{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
				<button title={t('tooltips.showUserProfile')} onClick={() => setIsUseProfileDM(!isUseProfileDM)} className="sbm:hidden">
					<span>
						<Icons.IconUserProfileDM defaultSize="size-5" />
					</span>
				</button>
			)}
		</div>
	);
});

function FileButton() {
	const { t } = useTranslation('channelTopbar');
	const [isShowFile, setIsShowFile] = useState<boolean>(false);

	const fileRef = useRef<HTMLDivElement | null>(null);

	const handleShowFile = () => {
		setIsShowFile(!isShowFile);
	};

	const handleClose = useCallback(() => {
		setIsShowFile(false);
	}, []);

	return (
		<div className="relative leading-5 h-5" ref={fileRef} data-e2e={generateE2eId('chat.channel_message.header.button.file')}>
			<button
				title={t('tooltips.files')}
				className={`focus-visible:outline-none text-theme-primary text-theme-primary-hover ${isShowFile ? 'text-theme-primary-active' : ''}`}
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
	const { t } = useTranslation('channelTopbar');
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
		<div className="relative leading-5 h-5" ref={canvasRef} data-e2e={generateE2eId('chat.channel_message.header.button.canvas')}>
			<button
				title={t('tooltips.canvas')}
				className={`focus-visible:outline-none text-theme-primary text-theme-primary-hover ${isShowCanvas ? 'text-theme-primary-active' : ''}`}
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
	const { t } = useTranslation('channelTopbar');
	const isShowThread = useSelector(selectIsThreadModalVisible);

	const threadRef = useRef<HTMLDivElement | null>(null);

	const dispatch = useDispatch();

	const handleToggleThreads = () => {
		dispatch(threadsActions.toggleThreadModal());
	};

	return (
		<div className="relative leading-5 h-5" ref={threadRef} data-e2e={generateE2eId('chat.channel_message.header.button.thread')}>
			<button
				title={t('tooltips.threads')}
				className={`focus-visible:outline-none text-theme-primary text-theme-primary-hover ${isShowThread ? 'text-theme-primary-active' : ''}`}
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
	const { t } = useTranslation('channelTopbar');
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
		<div className="relative leading-5 h-5" ref={notiRef} data-e2e={generateE2eId('chat.channel_message.header.button.mute')}>
			<button
				title={t('tooltips.notificationSettings')}
				className={`focus-visible:outline-none text-theme-primary text-theme-primary-hover ${isShowNotificationSetting ? 'text-theme-primary-active' : ''}`}
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
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const isShowPinMessage = useSelector(selectIsPinModalVisible);
	const currentChannelId = useSelector(selectCurrentChannelId) ?? '';
	const currentDM = useSelector(selectCurrentDM) ?? '';
	const isShowPinBadge = useAppSelector(selectIsShowPinBadgeByChannelId(currentChannelId));
	const isShowPinDMBadge = useAppSelector((state) => selectIsShowPinBadgeByDmId(state, currentDM?.id || ''));
	const isShowPinBadgeFinal = currentChannelId ? isShowPinBadge : isShowPinDMBadge;

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

		if (currentChannelId && isShowPinBadge) {
			dispatch(channelsActions.setShowPinBadgeOfChannel({ clanId: currentClanId, channelId: currentChannelId, isShow: false }));
		}

		if (!currentChannelId && currentDmGroup?.id && isShowPinDMBadge) {
			dispatch(directActions.setShowPinBadgeOfDM({ dmId: currentDmGroup.id, isShow: false }));
		}
	};

	return (
		<div className="relative leading-5 h-5" ref={pinRef} data-e2e={generateE2eId('chat.channel_message.header.button.pin')}>
			<button
				title={t('tooltips.pinnedMessages')}
				className={`${styleCss} focus-visible:outline-none relative text-theme-primary text-theme-primary-hover ${isShowPinMessage ? 'text-theme-primary-active' : ''}`}
				onClick={handleTogglePinMessage}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.PinRight defaultSize="size-5" />
				{isShowPinBadgeFinal && (
					<div
						className="absolute border-theme-primary
		 w-[8px] h-[8px] rounded-full bg-colorDanger outline outline-1 outline-transparent
		  font-bold text-[11px] flex items-center justify-center -bottom-[0.05rem] -right-[0.075rem]"
						data-e2e={generateE2eId('chat.channel_message.header.button.pin.pin_badge')}
					></div>
				)}
			</button>
			{isShowPinMessage && <PinnedMessages mode={mode} rootRef={pinRef} onClose={handleTogglePinMessage} />}
		</div>
	);
}

export function InboxButton({ isVoiceChannel }: { isVoiceChannel?: boolean }) {
	return (
		<div
			className="focus-visible:outline-none text-theme-primary text-theme-primary-hover"
			data-e2e={generateE2eId('chat.channel_message.header.button.inbox')}
		>
			<NotificationTooltip />
		</div>
	);
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
	const { t } = useTranslation('channelTopbar');
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
			<button
				title={t('tooltips.members')}
				onClick={handleClick}
				className={`text-theme-primary text-theme-primary-hover ${isActive ? 'text-theme-primary-active' : ''}`}
				data-e2e={generateE2eId('chat.channel_message.header.button.member')}
			>
				<Icons.MemberList defaultSize="size-5" />
			</button>
		</div>
	);
}

function ChatButton({ closeMenuOnMobile }: { closeMenuOnMobile?: () => void }) {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useDispatch();
	const handleClick = () => {
		dispatch(appActions.setIsShowChatStream(true));
		closeMenuOnMobile?.();
	};
	return (
		<div className="relative leading-5 h-5" data-e2e={generateE2eId('chat.channel_message.header.button.chat')}>
			<button title={t('tooltips.showChat')} onClick={handleClick} className="text-theme-primary text-theme-primary-hover">
				<Icons.Chat defaultSize="size-5" />
			</button>
		</div>
	);
}

const AddMemberToGroupDm = memo(({ currentDmGroup }: { currentDmGroup: DirectEntity }) => {
	const { t } = useTranslation('channelTopbar');
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
			<span
				className={`text-theme-primary-hover ${openAddToGroup ? 'text-theme-primary-active' : ''}`}
				title={t('tooltips.addFriendsToDM')}
				data-e2e={generateE2eId(`chat.direct_message.button.add_user`)}
			>
				<Icons.IconAddFriendDM defaultSize="size-5" />
			</span>
		</div>
	);
});

function GalleryButton() {
	const { t } = useTranslation('channelTopbar');
	const [isShowGallery, setIsShowGallery] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId) ?? '';
	const currentClanId = useSelector(selectCurrentClanId) ?? '';
	const attachments = useAppSelector((state) => selectGalleryAttachmentsByChannel(state, currentChannelId));

	const galleryRef = useRef<HTMLDivElement | null>(null);

	const handleShowGallery = async () => {
		if (!isShowGallery && (!attachments || attachments.length === 0)) {
			await dispatch(
				galleryActions.fetchGalleryAttachments({
					clanId: currentClanId,
					channelId: currentChannelId,
					limit: 50,
					direction: 'initial'
				})
			);
		}
		setIsShowGallery(!isShowGallery);
	};

	const handleClose = useCallback(() => {
		setIsShowGallery(false);
	}, []);

	return (
		<div className="relative leading-5 h-5" ref={galleryRef}>
			<button
				title={t('tooltips.gallery')}
				className={`focus-visible:outline-none text-theme-primary text-theme-primary-hover ${isShowGallery ? 'text-theme-primary-active' : ''}`}
				onClick={handleShowGallery}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.ImageThumbnail defaultSize="size-5" />
			</button>
			{isShowGallery && <GalleryModal onClose={handleClose} rootRef={galleryRef} />}
		</div>
	);
}

export default ChannelTopbar;
