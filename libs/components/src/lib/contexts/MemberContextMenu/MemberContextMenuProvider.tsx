import { useAppNavigation, useDirect, useFriends, usePermissionChecker } from '@mezon/core';
import {
	ChannelMembersEntity,
	EStateFriend,
	channelUsersActions,
	notificationSettingActions,
	selectAllAccount,
	selectCurrentChannel,
	selectCurrentClan,
	selectFriendStatus,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EPermission } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { CSSProperties, FC, createContext, useCallback, useContext, useState } from 'react';
import { Menu, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { useSelector } from 'react-redux';
import { directMessageValueProps } from '../../components/DmList/DMListItem';
import ModalRemoveMemberClan from '../../components/MemberProfile/ModalRemoveMemberClan';
import { MemberMenuItem } from './MemberMenuItem';
import { MEMBER_CONTEXT_MENU_ID, MemberContextMenuContextType, MemberContextMenuHandlers, MemberContextMenuProps } from './types';
import { useModals } from './useModals';

const MemberContextMenuContext = createContext<MemberContextMenuContextType | undefined>(undefined);

export const MemberContextMenuProvider: FC<MemberContextMenuProps> = ({ children }) => {
	const [currentUser, setCurrentUser] = useState<ChannelMembersEntity | null>(null);
	const userProfile = useSelector(selectAllAccount);
	const currentClan = useAppSelector(selectCurrentClan);
	const currentChannel = useAppSelector(selectCurrentChannel);
	const currentChannelId = currentChannel?.id;
	const [hasClanOwnerPermission, hasAdminPermission] = usePermissionChecker([EPermission.clanOwner, EPermission.administrator]);
	const dispatch = useAppDispatch();
	const { addFriend, deleteFriend } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();

	const { openModalRemoveMember, closeRemoveMemberModal, handleRemoveMember, openUserProfile, openProfileItem, openRemoveMemberModal } = useModals({
		currentUser
	});

	const [currentHandlers, setCurrentHandlers] = useState<MemberContextMenuHandlers | null>(null);

	const { show } = useContextMenu({
		id: MEMBER_CONTEXT_MENU_ID
	});

	const showMenu = (event: React.MouseEvent) => {
		show({ event });
	};

	const isPrivateThread = currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD && currentChannel.channel_private;

	const isCreator = userProfile?.user?.id === currentChannel?.creator_id;

	const memberIsClanOwner = currentUser?.user?.id === currentClan?.creator_id;

	const isSelf = userProfile?.user?.id === currentUser?.user?.id;

	const shouldShowKickOption = !isSelf && (hasClanOwnerPermission || (hasAdminPermission && !memberIsClanOwner));

	const shouldShowRemoveFromThreadOption =
		!isSelf && isPrivateThread && (isCreator || hasClanOwnerPermission || (hasAdminPermission && !memberIsClanOwner));

	const friendStatus = useAppSelector(selectFriendStatus(currentUser?.user?.id || ''));

	const isFriend = friendStatus === EStateFriend.FRIEND;

	const shouldShowAddFriend = !isSelf && !isFriend && !!currentUser?.user?.id;
	const shouldShowRemoveFriend = !isSelf && isFriend && !!currentUser?.user?.id;

	const shouldShow = (optionName: string) => {
		if (optionName === 'kick') {
			return shouldShowKickOption;
		}

		if (optionName === 'removeFromThread') {
			return shouldShowRemoveFromThreadOption;
		}

		switch (optionName) {
			case 'profile':
				return true;
			case 'message':
				return !isSelf;
			case 'addFriend':
				return shouldShowAddFriend;
			case 'removeFriend':
				return shouldShowRemoveFriend;
			case 'markAsRead':
				return !!currentUser;
			default:
				return true;
		}
	};

	const handleDirectMessageWithUser = useCallback(
		async (userId?: string) => {
			if (!userId) return;

			const response = await createDirectMessageWithUser(userId, currentUser?.user?.display_name, currentUser?.user?.avatar_url);
			if (response?.channel_id) {
				const directDM = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
				navigate(directDM);
			}
		},
		[createDirectMessageWithUser, toDmGroupPageFromMainApp, navigate, currentUser]
	);

	const handleRemoveMemberFromThread = useCallback(
		async (userId?: string) => {
			if (!userId || !currentChannelId || !isPrivateThread) return;

			try {
				await dispatch(
					channelUsersActions.removeChannelUsers({
						channelId: currentChannelId,
						userId,
						channelType: ChannelType.CHANNEL_TYPE_THREAD,
						clanId: currentClan?.clan_id
					})
				);
			} catch (error) {
				dispatch({
					type: 'ERROR_NOTIFICATION',
					payload: {
						message: 'Failed to remove member from thread',
						error
					}
				});
			}
		},
		[dispatch, currentClan?.clan_id, currentChannelId, isPrivateThread]
	);

	const createDefaultHandlers = (user?: ChannelMembersEntity): MemberContextMenuHandlers => {
		return {
			handleEnableE2EE: () => {},
			handleViewProfile: () => {
				if (user) {
					openUserProfile(user);
				}
			},
			handleMention: () => {},
			handleDeafen: () => {},
			handleEditClanProfile: () => {},
			handleApps: () => {},
			handleRoles: () => {},
			handleRemoveMember: () => {
				if (user) {
					openRemoveMemberModal(user);
				}
			},
			handleMessage: () => {
				if (user?.user?.id) {
					handleDirectMessageWithUser(user.user.id);
				}
			},
			handleAddFriend: () => {
				if (user?.user?.username && user?.user?.id) {
					addFriend({ usernames: [user.user.username], ids: [] });
				}
			},
			handleRemoveFriend: () => {
				if (user?.user?.username && user?.user?.id) {
					deleteFriend(user.user.username, user.user.id);
				}
			},
			handleKick: () => {
				if (user) {
					openRemoveMemberModal(user);
				}
			},
			handleRemoveFromThread: () => {
				if (user?.user?.id) {
					handleRemoveMemberFromThread(user.user.id);
				}
			}
		};
	};

	const showContextMenu = useCallback(
		async (event: React.MouseEvent, user?: ChannelMembersEntity, directMessageValue?: directMessageValueProps) => {
			event.preventDefault();

			if (directMessageValue) {
				await dispatch(
					notificationSettingActions.getNotificationSetting({
						channelId: directMessageValue?.dmID || ''
					})
				);
			}

			if (user) {
				setCurrentUser(user);
			}

			const handlers = createDefaultHandlers(user);
			setCurrentHandlers(handlers);
			showMenu(event);
		},
		[currentChannelId]
	);

	const contextValue: MemberContextMenuContextType = {
		setCurrentHandlers,
		showMenu,
		openUserProfile,
		openRemoveMemberModal,
		openProfileItem,
		setCurrentUser,
		showContextMenu
	};

	const appearanceTheme = useSelector(selectTheme);

	const isLightMode = appearanceTheme === 'light';

	const className: CSSProperties = {
		'--contexify-menu-bgColor': isLightMode ? '#FFFFFF' : '#111214',
		'--contexify-activeItem-bgColor': '#4B5CD6',
		'--contexify-rightSlot-color': '#6f6e77',
		'--contexify-activeRightSlot-color': '#fff',
		'--contexify-arrow-color': '#6f6e77',
		'--contexify-activeArrow-color': '#fff',
		'--contexify-itemContent-padding': '-3px',
		'--contexify-menu-radius': '2px',
		'--contexify-activeItem-radius': '2px',
		'--contexify-menu-minWidth': '188px',
		'--contexify-separator-color': '#ADB3B9'
	} as CSSProperties;

	return (
		<MemberContextMenuContext.Provider value={contextValue}>
			{children}

			<Menu id={MEMBER_CONTEXT_MENU_ID} style={className}>
				{currentHandlers && (
					<>
						{shouldShow('profile') && <MemberMenuItem label="Profile" onClick={currentHandlers.handleViewProfile} />}

						{shouldShow('message') && <MemberMenuItem label="Message" onClick={currentHandlers.handleMessage} />}
						{shouldShow('addFriend') && <MemberMenuItem label="Add Friend" onClick={currentHandlers.handleAddFriend} />}
						{shouldShow('removeFriend') && (
							<MemberMenuItem label="Remove Friend" onClick={currentHandlers.handleRemoveFriend} isWarning={true} />
						)}

						{shouldShow('kick') && <MemberMenuItem label="Kick" onClick={currentHandlers.handleKick} isWarning={true} />}

						{shouldShow('removeFromThread') && (
							<MemberMenuItem
								label={`Remove ${currentUser?.user?.username || 'User'} from thread`}
								onClick={currentHandlers.handleRemoveFromThread}
								isWarning={true}
							/>
						)}
					</>
				)}
			</Menu>

			{openModalRemoveMember && currentUser && (
				<ModalRemoveMemberClan
					openModal={openModalRemoveMember}
					username={currentUser?.user?.username}
					onClose={closeRemoveMemberModal}
					onRemoveMember={handleRemoveMember}
				/>
			)}
		</MemberContextMenuContext.Provider>
	);
};

export const useMemberContextMenu = () => {
	const context = useContext(MemberContextMenuContext);
	if (!context) {
		throw new Error('useMemberContextMenu must be used within a MemberContextMenuProvider');
	}
	return context;
};
