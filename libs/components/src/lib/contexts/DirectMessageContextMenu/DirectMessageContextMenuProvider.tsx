import { useAppNavigation, useAppParams } from '@mezon/core';
import type { ChannelMembersEntity, RootState } from '@mezon/store';
import {
	EStateFriend,
	directActions,
	selectAllAccount,
	selectFriendById,
	selectHasKeyE2ee,
	selectNotifiSettingsEntitiesById,
	selectUpdateDmGroupError,
	selectUpdateDmGroupLoading,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EMuteState, FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { FC } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Menu, Submenu, useContextMenu } from 'react-contexify';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import LeaveGroupModal from '../../components/LeaveGroupModal';
import ModalEditGroup from '../../components/ModalEditGroup';
import ItemPanelMember from '../../components/PanelMember/ItemPanelMember';
import { useEditGroupModal } from '../../hooks/useEditGroupModal';
import { MemberMenuItem } from '../MemberContextMenu';
import { useModals } from '../MemberContextMenu/useModals';
import type { DirectMessageContextMenuContextType, DirectMessageContextMenuHandlers, DirectMessageContextMenuProps } from './types';
import { DIRECT_MESSAGE_CONTEXT_MENU_ID, DMCT_GROUP_CHAT_ID } from './types';
import { useContextMenuHandlers } from './useContextMenu';
import { useDefaultHandlers } from './useDefaultHandlers';
import { useMenuHandlers } from './useMenuHandlers';
import { useMenuStyles } from './useMenuStyles';
import { useNotificationSettings } from './useNotificationSettings';
import { useProfileModal } from './useProfileModal';

const DirectMessageContextMenuContext = createContext<DirectMessageContextMenuContextType | undefined>(undefined);

export const DirectMessageContextMenuProvider: FC<DirectMessageContextMenuProps> = ({
	children,
	contextMenuId = DIRECT_MESSAGE_CONTEXT_MENU_ID,
	dataMemberCreate
}) => {
	const { t } = useTranslation('directMessage');
	const [currentUser, setCurrentUser] = useState<ChannelMembersEntity | any>(null);
	const [currentHandlers, setCurrentHandlers] = useState<DirectMessageContextMenuHandlers | null>(null);
	const [isLeaveGroupModalOpen, setIsLeaveGroupModalOpen] = useState(false);
	const dispatch = useAppDispatch();

	const userProfile = useSelector(selectAllAccount);
	const hasKeyE2ee = useAppSelector(selectHasKeyE2ee);
	const { directId } = useAppParams();
	const { navigate } = useAppNavigation();
	const { show } = useContextMenu({ id: contextMenuId });

	const getChannelId = currentUser?.channelId || currentUser?.channel_id;
	const getChannelType = currentUser?.type;
	const isDmGroup = getChannelType === ChannelType.CHANNEL_TYPE_GROUP;
	const isDm = getChannelType === ChannelType.CHANNEL_TYPE_DM;
	const channelId = getChannelId;

	const isLastOne = (currentUser?.user_id?.length || 0) <= 1;
	const [warningStatus, setWarningStatus] = useState<string>('var(--bg-item-hover)');

	const { openUserProfile } = useProfileModal({ currentUser });
	const { openProfileItem } = useModals({
		currentUser
	});
	const updateDmGroupLoading = useAppSelector((state) => selectUpdateDmGroupLoading(currentUser?.channel_id || '')(state));
	const updateDmGroupError = useAppSelector((state) => selectUpdateDmGroupError(currentUser?.channel_id || '')(state));

	const editGroupModal = useEditGroupModal({
		channelId: currentUser?.channelId || currentUser?.channel_id,
		currentGroupName: currentUser?.channel_label || 'Group',
		currentAvatar: currentUser?.channel_avatar || ''
	});

	const openLeaveGroupModal = useCallback(() => {
		setIsLeaveGroupModalOpen(true);
	}, []);

	const closeLeaveGroupModal = useCallback(() => {
		setIsLeaveGroupModalOpen(false);
	}, []);

	useEffect(() => {
		if (currentUser?.channel_id) {
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
		}
	}, [currentUser?.channel_id, dispatch]);
	const showMenu = useCallback(
		(event: React.MouseEvent) => {
			show({ event });
		},
		[show]
	);

	const { menuStyles } = useMenuStyles(warningStatus);

	const {
		handleDirectMessageWithUser,
		handleMarkAsRead,
		handleRemoveMemberFromGroup,
		handleLeaveDmGroup,
		handleEnableE2ee,
		addFriend,
		deleteFriend,
		blockFriend,
		unBlockFriend
	} = useMenuHandlers({
		userProfile,
		hasKeyE2ee,
		directId: directId as string,
		openUserProfile,
		isLastOne
	});

	const notificationSettings = useAppSelector((state) => selectNotifiSettingsEntitiesById(state, channelId || ''));

	const { mutedUntilText, nameChildren, muteOrUnMuteChannel, handleScheduleMute, getNotificationSetting } = useNotificationSettings({
		channelId,
		notificationSettings,
		getChannelId
	});

	const { createDefaultHandlers } = useDefaultHandlers({
		openUserProfile,
		handleDirectMessageWithUser,
		addFriend,
		deleteFriend,
		handleMarkAsRead,
		handleScheduleMute,
		muteOrUnMuteChannel,
		handleEnableE2ee,
		handleRemoveMemberFromGroup,
		handleLeaveDmGroup,
		blockFriend,
		unBlockFriend,
		openEditGroupModal: editGroupModal.openEditModal,
		openLeaveGroupModal
	});

	const { showContextMenu } = useContextMenuHandlers({
		setCurrentUser,
		setCurrentHandlers,
		showMenu,
		createDefaultHandlers,
		getNotificationSetting,
		openUserProfile
	});

	const isSelf = userProfile?.user?.id === currentUser?.id || currentUser?.user_ids?.includes(userProfile?.user?.id);

	const isDefaultSetting = !notificationSettings?.id || notificationSettings?.id === '0';
	const isMuted = !isDefaultSetting && notificationSettings?.active === EMuteState.MUTED;
	const hasMuteTime = !isDefaultSetting && notificationSettings?.time_mute ? new Date(notificationSettings.time_mute) > new Date() : false;
	const shouldShowUnmute = isMuted || hasMuteTime;

	const shouldShowMuteSubmenu = !isMuted && !hasMuteTime;

	const isOwnerClanOrGroup = userProfile?.user?.id && dataMemberCreate?.createId && userProfile?.user?.id === dataMemberCreate.createId;
	const infoFriend = useAppSelector((state: RootState) => selectFriendById(state, currentUser?.user_ids?.[0] || currentUser?.id || ''));
	const didIBlockUser = useMemo(() => {
		return infoFriend?.state === EStateFriend.BLOCK && infoFriend?.source_id === userProfile?.user?.id;
	}, [currentUser?.user_ids, infoFriend, userProfile?.user?.id]);

	const contextValue: DirectMessageContextMenuContextType = {
		setCurrentHandlers,
		showMenu,
		setCurrentUser,
		showContextMenu,
		openUserProfile,
		openProfileItem,
		contextMenuId,
		mutedUntilText
	};

	const shouldShowMenu = currentHandlers && !isSelf;

	return (
		<DirectMessageContextMenuContext.Provider value={contextValue}>
			{children}

			<Menu
				id={contextMenuId}
				style={menuStyles}
				className={`z-50 rounded-lg border-theme-primary ${!shouldShowMenu && '!opacity-0'}`}
				animation={false}
			>
				{currentHandlers && !isSelf && (
					<>
						{isDm && (
							<MemberMenuItem
								label={t('contextMenu.profile')}
								onClick={currentHandlers.handleViewProfile}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{channelId && (
							<MemberMenuItem
								label={t('contextMenu.markAsRead')}
								onClick={currentHandlers.handleMarkAsRead}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{!isDm && !isDmGroup && (
							<MemberMenuItem
								label={t('contextMenu.message')}
								onClick={currentHandlers.handleMessage}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{!isDmGroup && infoFriend?.state !== EStateFriend.BLOCK && (
							<>
								{infoFriend?.state !== EStateFriend.FRIEND &&
									infoFriend?.state !== EStateFriend.MY_PENDING &&
									infoFriend?.state !== EStateFriend.OTHER_PENDING && (
										<MemberMenuItem
											label={t('contextMenu.addFriend')}
											onClick={currentHandlers.handleAddFriend}
											setWarningStatus={setWarningStatus}
										/>
									)}

								{infoFriend?.state === EStateFriend.FRIEND && (
									<MemberMenuItem
										label={t('contextMenu.removeFriend')}
										onClick={currentHandlers.handleRemoveFriend}
										isWarning={true}
										setWarningStatus={setWarningStatus}
									/>
								)}
							</>
						)}

						{!isDmGroup && (infoFriend?.state === EStateFriend.FRIEND || didIBlockUser) && (
							<MemberMenuItem
								label={didIBlockUser ? t('contextMenu.unblock') : t('contextMenu.block')}
								onClick={didIBlockUser ? currentHandlers.handleUnblockFriend : currentHandlers.handleBlockFriend}
								isWarning={!didIBlockUser}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{contextMenuId !== DMCT_GROUP_CHAT_ID &&
							channelId &&
							(shouldShowUnmute ? (
								<MemberMenuItem
									label={nameChildren}
									onClick={currentHandlers.handleUnmute}
									rightElement={mutedUntilText ? <span className="ml-2 text-xs">{mutedUntilText}</span> : undefined}
									setWarningStatus={setWarningStatus}
								/>
							) : shouldShowMuteSubmenu ? (
								<Submenu
									label={
										<span className="flex truncate justify-between items-center w-full font-sans text-sm font-medium text-theme-primary text-theme-primary-hover p-1.5">
											{nameChildren}
										</span>
									}
								>
									<MemberMenuItem
										label={t('contextMenu.for15Minutes')}
										onClick={() => currentHandlers.handleMute(FOR_15_MINUTES)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label={t('contextMenu.for1Hour')}
										onClick={() => currentHandlers.handleMute(FOR_1_HOUR)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label={t('contextMenu.for3Hours')}
										onClick={() => currentHandlers.handleMute(FOR_3_HOURS)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label={t('contextMenu.for8Hours')}
										onClick={() => currentHandlers.handleMute(FOR_8_HOURS)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label={t('contextMenu.for24Hours')}
										onClick={() => currentHandlers.handleMute(FOR_24_HOURS)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label={t('contextMenu.untilTurnBackOn')}
										onClick={() => currentHandlers.handleMute()}
										setWarningStatus={setWarningStatus}
									/>
								</Submenu>
							) : null)}
						{contextMenuId !== DMCT_GROUP_CHAT_ID && isDmGroup && (
							<ItemPanelMember children={t('contextMenu.editGroup')} onClick={currentHandlers.handleEditGroup} />
						)}
						{contextMenuId === DMCT_GROUP_CHAT_ID && isOwnerClanOrGroup && (
							<ItemPanelMember children={t('contextMenu.removeFromGroup')} onClick={currentHandlers.handleRemoveFromGroup} danger />
						)}

						{contextMenuId !== DMCT_GROUP_CHAT_ID && isDmGroup && (
							<ItemPanelMember children={t('contextMenu.leaveGroup')} danger onClick={currentHandlers.handleLeaveGroup} />
						)}
					</>
				)}
			</Menu>

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

			{isLeaveGroupModalOpen && currentUser && (
				<LeaveGroupModal
					onClose={closeLeaveGroupModal}
					groupWillBeLeave={currentUser}
					navigateToFriends={() => {
						dispatch(directActions.setDmGroupCurrentId(''));
						navigate('/chat/direct/friends');
					}}
				/>
			)}
		</DirectMessageContextMenuContext.Provider>
	);
};

export const useDirectMessageContextMenu = () => {
	const context = useContext(DirectMessageContextMenuContext);
	if (!context) {
		throw new Error('useDirectMessageContextMenu must be used within a DirectMessageContextMenuProvider');
	}
	return context;
};

export * from './types';
