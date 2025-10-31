import { useAppNavigation, useDirect, useFriends, usePermissionChecker } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import {
	EStateFriend,
	channelUsersActions,
	selectAllAccount,
	selectCurrentChannelCreatorId,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectCurrentClanCreatorId,
	selectCurrentClanId,
	selectFriendStatus,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EPermission } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { CSSProperties, FC } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { Menu, useContextMenu } from 'react-contexify';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ModalRemoveMemberClan from '../../components/MemberProfile/ModalRemoveMemberClan';
import { MemberMenuItem } from './MemberMenuItem';
import type { MemberContextMenuContextType, MemberContextMenuHandlers, MemberContextMenuProps } from './types';
import { MEMBER_CONTEXT_MENU_ID } from './types';
import { useModals } from './useModals';

const MemberContextMenuContext = createContext<MemberContextMenuContextType | undefined>(undefined);

export const MemberContextMenuProvider: FC<MemberContextMenuProps> = ({ children }) => {
	const { t } = useTranslation('contextMenu');
	const [currentUser, setCurrentUser] = useState<ChannelMembersEntity | null>(null);
	const userProfile = useSelector(selectAllAccount);
	const currentClanCreatorId = useAppSelector(selectCurrentClanCreatorId);
	const currentClanId = useAppSelector(selectCurrentClanId);

	const currentChannelId = useAppSelector(selectCurrentChannelId);
	const currentChannelType = useAppSelector(selectCurrentChannelType);
	const currentChannelCreatorId = useAppSelector(selectCurrentChannelCreatorId);

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

	const showMenu = useCallback(
		(event: React.MouseEvent) => {
			show({ event });
		},
		[show]
	);

	const isThread = currentChannelType === ChannelType.CHANNEL_TYPE_THREAD;

	const isCreator = userProfile?.user?.id === currentChannelCreatorId;

	const memberIsClanOwner = currentUser?.user?.id === currentClanCreatorId;

	const isSelf = userProfile?.user?.id === currentUser?.user?.id;

	const shouldShowKickOption = !isSelf && (hasClanOwnerPermission || (hasAdminPermission && !memberIsClanOwner));

	const shouldShowRemoveFromThreadOption =
		!isSelf && isThread && (isCreator || hasClanOwnerPermission || (hasAdminPermission && !memberIsClanOwner));

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
		async (user?: ChannelMembersEntity) => {
			if (!user?.id) return;

			const response = await createDirectMessageWithUser(
				user?.id,
				user?.user?.display_name || user?.user?.username,
				user?.user?.username,
				user?.user?.avatar_url
			);
			if (response?.channel_id) {
				const directDM = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
				navigate(directDM);
			}
		},
		[createDirectMessageWithUser, toDmGroupPageFromMainApp, navigate, currentUser]
	);

	const handleRemoveMemberFromThread = useCallback(
		async (userId?: string) => {
			if (!userId || !currentChannelId) return;

			try {
				await dispatch(
					channelUsersActions.removeChannelUsers({
						channelId: currentChannelId,
						userId,
						channelType: ChannelType.CHANNEL_TYPE_THREAD,
						clanId: currentClanId as string
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
		[dispatch, currentClanId, currentChannelId, isThread]
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
					handleDirectMessageWithUser(user);
				}
			},
			handleAddFriend: () => {
				if (user?.user?.username && user?.user?.id) {
					addFriend({ ids: [user.user.id] });
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
		async (event: React.MouseEvent, channelId: string, user?: ChannelMembersEntity) => {
			event.preventDefault();

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
	const [warningStatus, setWarningStatus] = useState<string>('var(--bg-item-hover)');

	const className: CSSProperties = {
		'--contexify-menu-bgColor': 'var(--bg-theme-contexify)',
		'--contexify-item-color': 'var(--text-theme-primary)',
		'--contexify-activeItem-color': 'var(--text-secondary)',
		'--contexify-activeItem-bgColor': warningStatus || 'var(--bg-item-hover)',
		'--contexify-rightSlot-color': 'var(--text-secondary)',
		'--contexify-activeRightSlot-color': 'var(--text-secondary)',
		'--contexify-arrow-color': 'var(--text-theme-primary)',
		'--contexify-activeArrow-color': 'var(--text-secondary)',
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
						{shouldShow('profile') && (
							<MemberMenuItem
								label={t('member.profile')}
								onClick={currentHandlers.handleViewProfile}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{shouldShow('message') && (
							<MemberMenuItem label={t('member.message')} onClick={currentHandlers.handleMessage} setWarningStatus={setWarningStatus} />
						)}
						{shouldShow('addFriend') && (
							<MemberMenuItem
								label={t('member.addFriend')}
								onClick={currentHandlers.handleAddFriend}
								setWarningStatus={setWarningStatus}
							/>
						)}
						{shouldShow('removeFriend') && (
							<MemberMenuItem
								label={t('member.removeFriend')}
								onClick={currentHandlers.handleRemoveFriend}
								isWarning={true}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{!!shouldShow('kick') && (
							<MemberMenuItem
								label={t('member.kick')}
								onClick={currentHandlers.handleKick}
								isWarning={true}
								setWarningStatus={setWarningStatus}
							/>
						)}

						{!!shouldShow('removeFromThread') && (
							<MemberMenuItem
								label={t('member.removeFromThread', { username: currentUser?.user?.username || 'User' })}
								onClick={currentHandlers.handleRemoveFromThread}
								isWarning={true}
								setWarningStatus={setWarningStatus}
							/>
						)}
					</>
				)}
			</Menu>

			{openModalRemoveMember && currentUser && (
				<ModalRemoveMemberClan username={currentUser?.user?.username} onClose={closeRemoveMemberModal} onRemoveMember={handleRemoveMember} />
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
