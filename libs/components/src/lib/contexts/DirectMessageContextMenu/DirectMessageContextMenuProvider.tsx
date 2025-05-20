import { useAppNavigation, useDirect, useFriends, useMarkAsRead } from '@mezon/core';
import {
	ChannelMembersEntity,
	EStateFriend,
	SetMuteNotificationPayload,
	SetNotificationPayload,
	channelUsersActions,
	channelsActions,
	directMetaActions,
	e2eeActions,
	notificationSettingActions,
	selectAllAccount,
	selectFriendStatus,
	selectHasKeyE2ee,
	selectNotifiSettingsEntitiesById,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { FOR_15_MINUTES, FOR_1_HOUR, FOR_24_HOURS, FOR_3_HOURS, FOR_8_HOURS } from '@mezon/utils';
import { format } from 'date-fns';
import { ChannelType } from 'mezon-js';
import { CSSProperties, FC, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Menu, Submenu, useContextMenu } from 'react-contexify';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { directMessageValueProps } from '../../components/DmList/DMListItem';
import UserProfileModalInner from '../../components/UserProfileModalInner';
import { MemberMenuItem } from '../MemberContextMenu';

export const DIRECT_MESSAGE_CONTEXT_MENU_ID = 'direct-message-context-menu';

export interface DirectMessageContextMenuProps {
	children: React.ReactNode;
	contextMenuId?: string;
}

export interface DirectMessageContextMenuHandlers {
	handleViewProfile: () => void;
	handleMessage: () => void;
	handleAddFriend: () => void;
	handleRemoveFriend: () => void;
	handleMarkAsRead: () => void;
	handleMute: (duration?: number) => void;
	handleUnmute: () => void;
	handleEnableE2EE: () => void;
	handleRemoveFromGroup: () => void;
}

export interface DirectMessageContextMenuContextType {
	setCurrentHandlers: (handlers: DirectMessageContextMenuHandlers | null) => void;
	showMenu: (event: React.MouseEvent) => void;
	setCurrentUser: (user: ChannelMembersEntity | null) => void;
	showContextMenu: (event: React.MouseEvent, user?: ChannelMembersEntity, directMessageValue?: directMessageValueProps) => void;
	openUserProfile: () => void;
	openProfileItem: (event: React.MouseEvent, user: ChannelMembersEntity) => void;
	contextMenuId: string;
	mutedUntilText: string;
}

const DirectMessageContextMenuContext = createContext<DirectMessageContextMenuContextType | undefined>(undefined);

export const DirectMessageContextMenuProvider: FC<DirectMessageContextMenuProps> = ({ children, contextMenuId = DIRECT_MESSAGE_CONTEXT_MENU_ID }) => {
	const [currentUser, setCurrentUser] = useState<ChannelMembersEntity | any>(null);
	const [currentDmValue, setCurrentDmValue] = useState<directMessageValueProps | undefined>(undefined);
	const [currentHandlers, setCurrentHandlers] = useState<DirectMessageContextMenuHandlers | null>(null);
	const [mutedUntilText, setMutedUntilText] = useState<string>('');
	const [nameChildren, setNameChildren] = useState<string>('');

	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const { addFriend, deleteFriend } = useFriends();
	const { createDirectMessageWithUser } = useDirect();
	const { toDmGroupPageFromMainApp, navigate } = useAppNavigation();
	const { handleMarkAsReadDM } = useMarkAsRead();
	const hasKeyE2ee = useAppSelector(selectHasKeyE2ee);
	// const dmGroups = useAppSelector((state) => (state?.dmGroups as any).entities);
	const dmGroups = {} as Record<string, any>;

	const { show } = useContextMenu({
		id: contextMenuId
	});

	const showMenu = (event: React.MouseEvent) => {
		show({ event });
	};

	const [openUserProfile, closeUserProfile] = useModal(() => {
		if (!currentUser) return null;

		return (
			<UserProfileModalInner
				userId={currentUser?.user?.id || currentUser?.user_id?.[0]}
				directId={(currentUser as any)?.channel_id || currentUser?.channelId}
				onClose={() => closeUserProfile()}
				isDM={true}
				user={currentUser}
				avatar={currentUser?.user?.avatar_url || currentUser?.channel_avatar?.[0]}
				name={currentUser?.user?.display_name || currentUser?.user?.username || currentUser?.display_names?.[0]}
				status={{
					status: typeof currentUser?.user?.metadata === 'object' ? currentUser?.user?.metadata?.status === 'ONLINE' : false,
					isMobile: currentUser?.user?.is_mobile
				}}
				customStatus={typeof currentUser?.user?.metadata === 'object' ? currentUser?.user?.metadata?.status : undefined}
			/>
		);
	}, [currentUser]);

	const handleDirectMessageWithUser = useCallback(
		async (user?: ChannelMembersEntity) => {
			if (!user?.user?.id) return;

			const response = await createDirectMessageWithUser(user.user.id, user.user.display_name || user.user.username, user.user.avatar_url);

			if (response?.channel_id) {
				const directDM = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
				navigate(directDM);
			}
		},
		[createDirectMessageWithUser, toDmGroupPageFromMainApp, navigate]
	);

	const handleMarkAsRead = useCallback(
		(directId: string) => {
			const timestamp = Date.now() / 1000;
			dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: directId, timestamp: timestamp }));
			handleMarkAsReadDM(directId);
		},
		[dispatch, handleMarkAsReadDM]
	);

	const handleEnableE2ee = useCallback(
		async (directId?: string, e2ee?: number) => {
			if (!hasKeyE2ee && !e2ee) {
				dispatch(e2eeActions.setDirectMesIdE2ee(directId));
				dispatch(e2eeActions.setOpenModalE2ee(true));
				return;
			}

			if (!directId) return;

			const currentDmGroup = dmGroups?.[directId];

			if (currentDmGroup) {
				await dispatch(
					channelsActions.updateChannel({
						channel_id: directId,
						channel_label: '',
						category_id: currentDmGroup.category_id,
						app_id: currentDmGroup.app_id || '',
						e2ee: !currentDmGroup.e2ee ? 1 : 0
					})
				);
			}
		},
		[hasKeyE2ee, dmGroups, dispatch]
	);

	const handleRemoveMemberFromGroup = useCallback(
		async (userId: string, channelId: string) => {
			if (!userId || !channelId) return;

			try {
				await dispatch(
					channelUsersActions.removeChannelUsers({
						channelId: channelId,
						userId: userId,
						channelType: ChannelType.CHANNEL_TYPE_GROUP
					})
				);
			} catch (error) {
				dispatch({
					type: 'ERROR_NOTIFICATION',
					payload: {
						message: 'Failed to remove member from group',
						error
					}
				});
			}
		},
		[dispatch]
	);

	const muteOrUnMuteChannel = useCallback(
		(active: number) => {
			if (!currentDmValue?.dmID) return;

			const body = {
				channel_id: currentDmValue.dmID,
				notification_type: 0,
				clan_id: '',
				active: active,
				is_current_channel: true
			};
			dispatch(notificationSettingActions.setMuteNotificationSetting(body));
		},
		[dispatch, currentDmValue]
	);

	const handleScheduleMute = useCallback(
		(duration: number) => {
			if (!currentDmValue?.dmID) return;

			if (duration !== Infinity) {
				const now = new Date();
				const unmuteTime = new Date(now.getTime() + duration);
				const unmuteTimeISO = unmuteTime.toISOString();

				const body: SetNotificationPayload = {
					channel_id: currentDmValue.dmID,
					notification_type: 0,
					clan_id: '',
					time_mute: unmuteTimeISO,
					is_current_channel: true,
					is_direct: currentDmValue.type === ChannelType.CHANNEL_TYPE_DM || currentDmValue.type === ChannelType.CHANNEL_TYPE_GROUP
				};
				dispatch(notificationSettingActions.setNotificationSetting(body));
			} else {
				const body: SetMuteNotificationPayload = {
					channel_id: currentDmValue.dmID,
					notification_type: 0,
					clan_id: '',
					active: 0,
					is_current_channel: true
				};
				dispatch(notificationSettingActions.setMuteNotificationSetting(body));
			}
		},
		[dispatch, currentDmValue]
	);

	const handleMuteChannel = useCallback(
		(channelId: string, duration = Infinity) => {
			handleScheduleMute(duration);
		},
		[handleScheduleMute]
	);

	const handleUnmuteChannel = useCallback(
		(channelId: string) => {
			muteOrUnMuteChannel(1);
		},
		[muteOrUnMuteChannel]
	);

	const createDefaultHandlers = useCallback(
		(user?: ChannelMembersEntity, dmValue?: directMessageValueProps): DirectMessageContextMenuHandlers => {
			return {
				handleViewProfile: () => {
					if (user) {
						openUserProfile();
					}
				},
				handleMessage: () => {
					if (user?.user?.id) {
						handleDirectMessageWithUser(user);
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
				handleMarkAsRead: () => {
					if (dmValue?.dmID) {
						handleMarkAsRead(dmValue.dmID);
					}
				},
				handleMute: (duration = Infinity) => {
					handleScheduleMute(duration);
				},
				handleUnmute: () => {
					muteOrUnMuteChannel(1);
				},
				handleEnableE2EE: () => {
					if (dmValue?.dmID) {
						handleEnableE2ee(dmValue.dmID, dmValue.e2ee);
					}
				},
				handleRemoveFromGroup: () => {
					if (user?.user?.id && dmValue?.dmID) {
						handleRemoveMemberFromGroup(user.user.id, dmValue.dmID);
					}
				}
			};
		},
		[
			openUserProfile,
			handleDirectMessageWithUser,
			addFriend,
			deleteFriend,
			handleMarkAsRead,
			handleScheduleMute,
			muteOrUnMuteChannel,
			handleEnableE2ee,
			handleRemoveMemberFromGroup
		]
	);

	const showContextMenu = useCallback(
		async (event: React.MouseEvent, user?: ChannelMembersEntity, directMessageValue?: directMessageValueProps) => {
			event.preventDefault();

			if (directMessageValue) {
				await dispatch(
					notificationSettingActions.getNotificationSetting({
						channelId: directMessageValue?.dmID || ''
					})
				);
				setCurrentDmValue(directMessageValue);
			}

			if (user) {
				setCurrentUser(user);
			}

			const handlers = createDefaultHandlers(user, directMessageValue);
			setCurrentHandlers(handlers);
			showMenu(event);
		},
		[dispatch, createDefaultHandlers, showMenu]
	);

	const openProfileItem = useCallback(
		(event: React.MouseEvent, user: ChannelMembersEntity) => {
			if (user) {
				setCurrentUser(user);
				openUserProfile();
			}
		},
		[setCurrentUser, openUserProfile]
	);

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

	// Determine if the logged in user is the same as current user (for self-specific options)
	const isSelf = userProfile?.user?.id === currentUser?.user?.id;

	// Determine if the current DM is a group or direct message
	const isDmGroup = currentDmValue?.type === ChannelType.CHANNEL_TYPE_GROUP;
	const isDm = currentDmValue?.type === ChannelType.CHANNEL_TYPE_DM;

	// Check if the user is a friend
	const friendStatus = useAppSelector(selectFriendStatus(currentUser?.user?.id || ''));
	const isFriend = friendStatus === EStateFriend.FRIEND;

	// Get notification settings for mute status
	const notificationSettings = useAppSelector(selectNotifiSettingsEntitiesById(currentDmValue?.dmID || ''));
	const isMuted = notificationSettings?.active === 0;

	// Handle mute until display and auto unmute functionality
	useEffect(() => {
		if (notificationSettings?.active === 1 || notificationSettings?.id === '0') {
			setNameChildren(`Mute @${currentUser?.user?.display_name || currentUser?.user?.username}`);
			setMutedUntilText('');
		} else {
			setNameChildren(`UnMute @${currentUser?.user?.display_name || currentUser?.user?.username}`);

			if (notificationSettings?.time_mute) {
				const timeMute = new Date(notificationSettings.time_mute);
				const currentTime = new Date();
				if (timeMute > currentTime) {
					const timeDifference = timeMute.getTime() - currentTime.getTime();
					const formattedDate = format(timeMute, 'dd/MM, HH:mm');
					setMutedUntilText(`Muted until ${formattedDate}`);

					setTimeout(() => {
						if (currentDmValue?.dmID) {
							const body = {
								channel_id: currentDmValue.dmID,
								notification_type: notificationSettings?.notification_setting_type || 0,
								clan_id: '',
								active: 1,
								is_current_channel: true
							};
							dispatch(notificationSettingActions.setMuteNotificationSetting(body));
						}
					}, timeDifference);
				}
			}
		}
	}, [notificationSettings, currentDmValue, dispatch, currentUser]);

	return (
		<DirectMessageContextMenuContext.Provider value={contextValue}>
			{children}

			<Menu id={contextMenuId} style={className}>
				{currentHandlers && (
					<>
						<MemberMenuItem label="Profile" onClick={currentHandlers.handleViewProfile} />

						{currentDmValue && <MemberMenuItem label="Mark as Read" onClick={currentHandlers.handleMarkAsRead} />}

						{!isSelf && !isDm && <MemberMenuItem label="Message" onClick={currentHandlers.handleMessage} />}

						{!isSelf && !isFriend && <MemberMenuItem label="Add Friend" onClick={currentHandlers.handleAddFriend} />}

						{!isSelf && isFriend && (
							<MemberMenuItem label="Remove Friend" onClick={currentHandlers.handleRemoveFriend} isWarning={true} />
						)}

						{currentDmValue && (
							<MemberMenuItem
								label={currentDmValue.e2ee ? 'Disable E2EE' : 'Enable E2EE'}
								onClick={currentHandlers.handleEnableE2EE}
								rightElement={
									currentDmValue.e2ee ? <span className="ml-2 text-xs">🔒</span> : <span className="ml-2 text-xs">🔓</span>
								}
							/>
						)}

						{currentDmValue &&
							(isMuted ? (
								<MemberMenuItem
									label={nameChildren}
									onClick={currentHandlers.handleUnmute}
									rightElement={mutedUntilText ? <span className="ml-2 text-xs">{mutedUntilText}</span> : undefined}
								/>
							) : (
								<Submenu label={nameChildren}>
									<MemberMenuItem label="For 15 Minutes" onClick={() => currentHandlers.handleMute(FOR_15_MINUTES)} />
									<MemberMenuItem label="For 1 Hour" onClick={() => currentHandlers.handleMute(FOR_1_HOUR)} />
									<MemberMenuItem label="For 3 Hours" onClick={() => currentHandlers.handleMute(FOR_3_HOURS)} />
									<MemberMenuItem label="For 8 Hours" onClick={() => currentHandlers.handleMute(FOR_8_HOURS)} />
									<MemberMenuItem label="For 24 Hours" onClick={() => currentHandlers.handleMute(FOR_24_HOURS)} />
									<MemberMenuItem label="Until I turn it back on" onClick={() => currentHandlers.handleMute()} />
								</Submenu>
							))}

						{isDmGroup && !isSelf && (
							<MemberMenuItem label="Remove from Group" onClick={currentHandlers.handleRemoveFromGroup} isWarning={true} />
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
