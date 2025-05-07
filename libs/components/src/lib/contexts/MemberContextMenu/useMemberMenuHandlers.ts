import { ChannelMembersEntity, notificationSettingActions, useAppDispatch } from '@mezon/store';
import { MemberProfileType } from '@mezon/utils';
import { directMessageValueProps } from '../../components/DmList/DMListItem';
import { useMemberContextMenu } from './MemberContextMenuProvider';
import { ExtendedMemberProfileType, MemberContextMenuHandlers, MemberContextMenuOptions, MemberMenuHandlersOptions } from './types';

export const useMemberMenuHandlers = (
	user?: ChannelMembersEntity,
	directMessageValue?: directMessageValueProps,
	options?: MemberMenuHandlersOptions
) => {
	const dispatch = useAppDispatch();
	const memberContextMenu = useMemberContextMenu();

	const handlers: MemberContextMenuHandlers = {
		handleMarkAsRead: () => {},
		handleEnableE2EE: () => {},
		handleViewProfile: () => {
			if (options?.openUserProfile) {
				options.openUserProfile();
			} else if (user) {
				memberContextMenu.openUserProfile(user);
			}
		},
		handleMention: () => {},
		handleDeafen: () => {},
		handleEditClanProfile: () => {},
		handleApps: () => {},
		handleRoles: () => {},
		handleRemoveMember: () => {
			if (options?.onRemoveMember) {
				options.onRemoveMember();
			} else if (user) {
				memberContextMenu.openRemoveMemberModal(user);
			}
		},
		handleMessage: () => {
			if (options?.onMessage) {
				options.onMessage();
			}
		},
		handleAddFriend: () => {
			if (options?.onAddFriend) {
				options.onAddFriend();
			}
		},
		handleRemoveFriend: () => {
			if (options?.onRemoveFriend) {
				options.onRemoveFriend();
			}
		},
		handleKick: () => {
			if (options?.onKick) {
				options.onKick();
			} else if (options?.onRemoveMember) {
				options.onRemoveMember();
			} else if (user) {
				memberContextMenu.openRemoveMemberModal(user);
			}
		}
	};

	const calculateMenuOptions = (): MemberContextMenuOptions => {
		const isMemberChannel = options?.positionType === MemberProfileType.MEMBER_LIST;
		const isPannelMember = options?.positionType === ExtendedMemberProfileType.PANNEL_MEMBER;

		const showRemoveOption = (isMemberChannel || (options?.dataMemberCreate && options?.isDM)) && (!!options?.onRemoveMember || !!user);
		const showMessageOption = isMemberChannel || !!options?.onMessage;
		const showAddFriendOption = isMemberChannel && !options?.isFriend && !!options?.onAddFriend;
		const showRemoveFriendOption = isMemberChannel && options?.isFriend && !!options?.onRemoveFriend;
		const showKickOption = isMemberChannel && !!(options?.onKick || options?.onRemoveMember);

		return {
			showRemoveOption,
			showMessageOption,
			showAddFriendOption,
			showRemoveFriendOption,
			showKickOption,
			hideSpecificOptions: []
		};
	};

	const showContextMenu = async (event: React.MouseEvent) => {
		event.preventDefault();

		if (directMessageValue) {
			await dispatch(
				notificationSettingActions.getNotificationSetting({
					channelId: directMessageValue?.dmID || ''
				})
			);
		}

		memberContextMenu.setCurrentHandlers(handlers);
		memberContextMenu.setCurrentOptions(calculateMenuOptions());

		memberContextMenu.showMenu(event);
	};

	return { showContextMenu };
};
