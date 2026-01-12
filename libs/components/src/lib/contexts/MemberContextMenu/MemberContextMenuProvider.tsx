import { useAppNavigation, useDirect, useFriends, usePermissionChecker } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import {
	EStateFriend,
	channelMembersActions,
	channelUsersActions,
	clansActions,
	selectAllAccount,
	selectBanMemberCurrentClanById,
	selectCurrentChannelCreatorId,
	selectCurrentChannelId,
	selectCurrentChannelType,
	selectCurrentClanCreatorId,
	selectCurrentClanId,
	selectFriendStatus,
	toastActions,
	useAppDispatch,
	useAppSelector,
	usersClanActions
} from '@mezon/store';
import { Menu as MenuDropdown } from '@mezon/ui';
import { EPermission, FOR_15_MINUTES_SEC, FOR_1_HOUR_SEC, FOR_24_HOURS_SEC, FOR_3_HOURS_SEC, FOR_8_HOURS_SEC } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import type { CSSProperties, FC } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Menu, useContextMenu } from 'react-contexify';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ModalRemoveMemberClan from '../../components/MemberProfile/ModalRemoveMemberClan';
import ItemPanel from '../../components/PanelChannel/ItemPanel';
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
	const isBan = useAppSelector((state) => selectBanMemberCurrentClanById(state, currentChannelId || '', currentUser?.id || ''));
	const dispatch = useAppDispatch();
	const { addFriend, deleteFriend } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();

	const { openUserProfile, openProfileItem, hideProfileItemModal, hideUserProfileModal } = useModals({
		currentUser
	});
	const handleRemoveMember = useCallback(async () => {
		if (!currentUser?.user?.id || !currentClanId) return;

		try {
			await dispatch(
				clansActions.removeClanUsers({
					clanId: currentClanId,
					userIds: [currentUser.user.id]
				})
			);
			dispatch(
				toastActions.addToast({
					message: 'Member removed successfully',
					type: 'success'
				})
			);
		} catch (error) {
			dispatch(
				toastActions.addToast({
					message: 'Failed to remove member',
					type: 'error'
				})
			);
		}
	}, [currentUser, currentClanId, dispatch]);
	const [showRemoveMemberModal, hideRemoveMemberModal] = useModal(() => {
		if (!currentUser) return null;

		return (
			<ModalRemoveMemberClan
				username={currentUser?.user?.username}
				onClose={hideRemoveMemberModal}
				onRemoveMember={async () => {
					await handleRemoveMember();
					hideRemoveMemberModal();
				}}
			/>
		);
	}, [currentUser, handleRemoveMember]);
	const openRemoveMemberModal = useCallback(
		(user?: ChannelMembersEntity) => {
			if (user) {
				setCurrentUser(user);
			}
			if (hideProfileItemModal) {
				hideProfileItemModal();
			}
			if (hideUserProfileModal) {
				hideUserProfileModal();
			}
			showRemoveMemberModal();
		},
		[hideProfileItemModal, hideUserProfileModal, setCurrentUser, showRemoveMemberModal]
	);

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
			case 'banChat':
				return hasAdminPermission && !isSelf;
			default:
				return true;
		}
	};

	const handleDirectMessageWithUser = useCallback(
		async (user?: ChannelMembersEntity) => {
			if (!user?.id) return;

			const response = await createDirectMessageWithUser(
				user?.id,
				user?.user?.displayName || user?.user?.username,
				user?.user?.username,
				user?.user?.avatarUrl
			);
			if (response?.channelId) {
				const directDM = toDmGroupPageFromMainApp(response.channelId, Number(response.type));
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

	const handleBanChatUser = useCallback(
		async (userId: string, banTime: number) => {
			if (!userId || !currentChannelId || !currentClanId) return;

			try {
				await dispatch(
					channelMembersActions.banUserChannel({
						channelId: currentChannelId,
						userIds: [userId],
						clanId: currentClanId,
						banTime: banTime !== Infinity ? banTime : undefined
					})
				);
			} catch (error) {
				dispatch({
					type: 'ERROR_NOTIFICATION',
					payload: {
						message: 'Failed to ban chat member',
						error
					}
				});
			}
		},
		[dispatch, currentClanId, currentChannelId, isThread]
	);

	const handleUnBanChatUser = useCallback(
		async (userId?: string) => {
			if (!userId || !currentChannelId || !currentClanId) return;

			try {
				await dispatch(
					channelMembersActions.unbanUserChannel({
						channelId: currentChannelId,
						userIds: [userId],
						clanId: currentClanId
					})
				);
			} catch (error) {
				dispatch({
					type: 'ERROR_NOTIFICATION',
					payload: {
						message: 'Failed to ban chat member',
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
			},
			handleBanChat: (isBan: boolean, banTime?: number) => {
				if (user?.user?.id) {
					if (isBan) {
						handleUnBanChatUser(user.user.id);
					} else if (banTime) {
						handleBanChatUser(user.user.id, banTime);
					}
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
			if (hasAdminPermission && currentChannelId && currentClanId) {
				dispatch(usersClanActions.fetchListBanUser({ clanId: currentClanId, channelId: currentChannelId }));
			}
		},
		[currentChannelId, hasAdminPermission]
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
		'--contexify-menu-radius': '8px',
		'--contexify-activeItem-radius': '2px',
		'--contexify-menu-minWidth': '188px',
		'--contexify-separator-color': '#ADB3B9',
		border: '1px solid var(--border-primary)'
	} as CSSProperties;

	const menuBan = useMemo(() => {
		if (!currentHandlers) {
			return <></>;
		}
		const menuItems = [
			<ItemPanel onClick={() => currentHandlers.handleBanChat(false, FOR_15_MINUTES_SEC)}>{t('muteFor15Minutes')}</ItemPanel>,
			<ItemPanel onClick={() => currentHandlers.handleBanChat(false, FOR_1_HOUR_SEC)}>{t('muteFor1Hour')}</ItemPanel>,
			<ItemPanel onClick={() => currentHandlers.handleBanChat(false, FOR_3_HOURS_SEC)}>{t('muteFor3Hours')}</ItemPanel>,
			<ItemPanel onClick={() => currentHandlers.handleBanChat(false, FOR_8_HOURS_SEC)}>{t('muteFor8Hours')}</ItemPanel>,
			<ItemPanel onClick={() => currentHandlers.handleBanChat(false, FOR_24_HOURS_SEC)}>{t('muteFor24Hours')}</ItemPanel>,
			<ItemPanel onClick={() => currentHandlers.handleBanChat(false, Infinity)}>{t('muteUntilTurnedBack')}</ItemPanel>
		];
		return <>{menuItems}</>;
	}, [t, currentHandlers]);
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
						{shouldShow('banChat') && !isBan && (
							<MenuDropdown
								trigger="hover"
								menu={menuBan}
								align={{
									points: ['bl', 'br']
								}}
								className="bg-theme-contexify text-theme-primary border-theme-primary ml-[3px] py-[6px] px-[8px] w-[200px]"
							>
								<div>
									<MemberMenuItem label={t('member.banChat')} isWarning={true} setWarningStatus={setWarningStatus} />
								</div>
							</MenuDropdown>
						)}

						{shouldShow('banChat') && isBan && (
							<MemberMenuItem
								label={t('member.unBanChat')}
								onClick={() => currentHandlers.handleBanChat(true)}
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
