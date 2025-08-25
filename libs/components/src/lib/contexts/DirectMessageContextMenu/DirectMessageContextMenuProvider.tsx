import { useAppParams } from '@mezon/core';
import {
	ChannelMembersEntity,
	EStateFriend,
	RootState,
	selectAllAccount,
	selectFriendById,
	selectHasKeyE2ee,
	selectNotifiSettingsEntitiesById,
	useAppSelector
} from '@mezon/store';
import { EMuteState, FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { FC, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Menu, Submenu, useContextMenu } from 'react-contexify';
import { useSelector } from 'react-redux';
import ItemPanelMember from '../../components/PanelMember/ItemPanelMember';
import { MemberMenuItem } from '../MemberContextMenu';
import {
	DIRECT_MESSAGE_CONTEXT_MENU_ID,
	DMCT_GROUP_CHAT_ID,
	DirectMessageContextMenuContextType,
	DirectMessageContextMenuHandlers,
	DirectMessageContextMenuProps
} from './types';
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
	const [currentUser, setCurrentUser] = useState<ChannelMembersEntity | any>(null);
	const [currentHandlers, setCurrentHandlers] = useState<DirectMessageContextMenuHandlers | null>(null);

	const userProfile = useSelector(selectAllAccount);
	const hasKeyE2ee = useAppSelector(selectHasKeyE2ee);
	const { directId } = useAppParams();
	const { show } = useContextMenu({ id: contextMenuId });

	const getChannelId = currentUser?.channelId || currentUser?.channel_id;
	const getChannelType = currentUser?.type;
	const getChannelE2ee = currentUser?.e2ee;
	const isDmGroup = getChannelType === ChannelType.CHANNEL_TYPE_GROUP;
	const isDm = getChannelType === ChannelType.CHANNEL_TYPE_DM;
	const channelId = getChannelId;

	const isLastOne = (currentUser?.user_id?.length || 0) <= 1;
	const [warningStatus, setWarningStatus] = useState<string>('var(--bg-item-hover)');

	const { openUserProfile } = useProfileModal({ currentUser });

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
		unBlockFriend
	});

	const { showContextMenu, openProfileItem } = useContextMenuHandlers({
		setCurrentUser,
		setCurrentHandlers,
		showMenu,
		createDefaultHandlers,
		getNotificationSetting,
		openUserProfile
	});

	const isSelf = userProfile?.user?.id === currentUser?.id || currentUser?.user_id?.includes(userProfile?.user?.id);
	const isMuted = notificationSettings?.active !== EMuteState.UN_MUTE;
	const hasMuteTime = notificationSettings?.time_mute ? new Date(notificationSettings.time_mute) > new Date() : false;
	const isOwnerClanOrGroup = userProfile?.user?.id && dataMemberCreate?.createId && userProfile?.user?.id === dataMemberCreate.createId;
	const infoFriend = useAppSelector((state: RootState) => selectFriendById(state, currentUser?.user_id?.[0] || ''));
	const didIBlockUser = useMemo(() => {
		return (
			infoFriend?.state === EStateFriend.BLOCK &&
			infoFriend?.source_id === userProfile?.user?.id &&
			infoFriend?.user?.id === currentUser?.user_id?.[0]
		);
	}, [currentUser?.user_id, infoFriend, userProfile?.user?.id]);

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

	return (
		<DirectMessageContextMenuContext.Provider value={contextValue}>
			{children}

			<Menu id={contextMenuId} style={menuStyles} className="z-50 rounded-lg border-theme-primary" animation={false}>
				{currentHandlers && (
					<>
						{isDm && <MemberMenuItem label="Profile" onClick={currentHandlers.handleViewProfile} setWarningStatus={setWarningStatus} />}

						{channelId && (
							<MemberMenuItem label="Mark as Read" onClick={currentHandlers.handleMarkAsRead} setWarningStatus={setWarningStatus} />
						)}

						{!isSelf && !isDm && !isDmGroup && (
							<MemberMenuItem label="Message" onClick={currentHandlers.handleMessage} setWarningStatus={setWarningStatus} />
						)}

						{!isSelf && !isDmGroup && infoFriend?.state !== EStateFriend.BLOCK && (
							<>
								{infoFriend?.state !== EStateFriend.FRIEND &&
									infoFriend?.state !== EStateFriend.MY_PENDING &&
									infoFriend?.state !== EStateFriend.OTHER_PENDING && (
										<MemberMenuItem
											label="Add Friend"
											onClick={currentHandlers.handleAddFriend}
											setWarningStatus={setWarningStatus}
										/>
									)}

								{infoFriend?.state === EStateFriend.FRIEND && (
									<MemberMenuItem
										label="Remove Friend"
										onClick={currentHandlers.handleRemoveFriend}
										isWarning={true}
										setWarningStatus={setWarningStatus}
									/>
								)}
							</>
						)}

						{!isSelf && !isDmGroup && (infoFriend?.state === EStateFriend.FRIEND || didIBlockUser) && (
							<MemberMenuItem
								label={didIBlockUser ? 'Unblock' : 'Block'}
								onClick={didIBlockUser ? currentHandlers.handleUnblockFriend : currentHandlers.handleBlockFriend}
								isWarning={!didIBlockUser}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{/* {channelId && (
							<MemberMenuItem
								label={getChannelE2ee ? 'Disable E2EE' : 'Enable E2EE'}
								onClick={currentHandlers.handleEnableE2EE}
								rightElement={
									getChannelE2ee ? (
										<span className="ml-2 text-xs" role="img" aria-label="Secure, encrypted">
											🔒
										</span>
									) : (
										<span className="ml-2 text-xs" role="img" aria-label="Not encrypted">
											🔓
										</span>
									)
								}
								setWarningStatus={setWarningStatus}
							/>
						)} */}

						{contextMenuId !== DMCT_GROUP_CHAT_ID &&
							channelId &&
							(isMuted || hasMuteTime ? (
								<MemberMenuItem
									label={nameChildren}
									onClick={currentHandlers.handleUnmute}
									rightElement={mutedUntilText ? <span className="ml-2 text-xs">{mutedUntilText}</span> : undefined}
									setWarningStatus={setWarningStatus}
								/>
							) : (
								<Submenu
									label={
										<span
											className="flex truncate justify-between items-center w-full font-sans text-sm font-medium text-theme-primary text-theme-primary-hover p-1 "
											style={{ fontFamily: `'gg sans', 'Noto Sans', sans-serif`, padding: 8 }}
										>
											{nameChildren}
										</span>
									}
								>
									<MemberMenuItem
										label="For 15 Minutes"
										onClick={() => currentHandlers.handleMute(FOR_15_MINUTES)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label="For 1 Hour"
										onClick={() => currentHandlers.handleMute(FOR_1_HOUR)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label="For 3 Hour"
										onClick={() => currentHandlers.handleMute(FOR_3_HOURS)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label="For 8 Hour"
										onClick={() => currentHandlers.handleMute(FOR_8_HOURS)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label="For 24 Hour"
										onClick={() => currentHandlers.handleMute(FOR_24_HOURS)}
										setWarningStatus={setWarningStatus}
									/>
									<MemberMenuItem
										label="Until I turn it back on"
										onClick={() => currentHandlers.handleMute()}
										setWarningStatus={setWarningStatus}
									/>
								</Submenu>
							))}

						{contextMenuId === DMCT_GROUP_CHAT_ID && !isSelf && isOwnerClanOrGroup && (
							<ItemPanelMember children="Remove From Group" onClick={currentHandlers.handleRemoveFromGroup} danger />
						)}

						{contextMenuId !== DMCT_GROUP_CHAT_ID && isDmGroup && (
							<ItemPanelMember children={'Leave Group'} danger onClick={currentHandlers.handleLeaveGroup} />
						)}
					</>
				)}
			</Menu>
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

