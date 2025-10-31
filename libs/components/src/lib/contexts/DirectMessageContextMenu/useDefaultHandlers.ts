import { EMuteState } from '@mezon/utils';
import { useCallback } from 'react';
import type { DirectMessageContextMenuHandlers } from './types';

interface UseDefaultHandlersParams {
	openUserProfile: () => void;
	handleDirectMessageWithUser: (user?: any) => Promise<void>;
	addFriend: (params: { usernames?: string[]; ids?: string[] }) => void;
	deleteFriend: (username: string, userId: string) => void;
	handleMarkAsRead: (channelId: string) => void;
	handleScheduleMute: (channelId: string, channelType: number, duration: number) => void;
	muteOrUnMuteChannel: (channelId: string, active: number, channelType?: number) => void;
	handleEnableE2ee: (directId?: string, e2ee?: number) => Promise<void>;
	handleRemoveMemberFromGroup: (userId: string, channelId: string) => Promise<void>;
	handleLeaveDmGroup: (channelId: string, isLastOne: boolean) => Promise<void>;
	blockFriend: (username: string, userId: string) => Promise<boolean>;
	unBlockFriend: (username: string, userId: string) => Promise<boolean>;
	openEditGroupModal?: () => void;
	openLeaveGroupModal?: () => void;
}

export function useDefaultHandlers({
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
	openEditGroupModal,
	openLeaveGroupModal
}: UseDefaultHandlersParams) {
	const createDefaultHandlers = useCallback(
		(channelId: string, user?: any): DirectMessageContextMenuHandlers => {
			return {
				handleViewProfile: () => {
					if (user) {
						openUserProfile();
					}
				},
				handleMessage: () => {
					if (user) {
						handleDirectMessageWithUser(user);
					}
				},
				handleAddFriend: () => {
					if (!user) return;

					const usernames = user?.usernames || (user?.user ? [user.user.username] : []);
					const ids = user?.user_ids || (user?.user ? [user.user.id] : []);
					if (usernames.length === 0 || ids.length === 0) return;

					addFriend(ids.length > 0 ? { ids } : { usernames });
				},
				handleRemoveFriend: () => {
					if (!user) return;

					const usernames = user?.usernames || (user?.user ? [user.user.username] : []);
					const ids = user?.user_ids || (user?.user ? [user.user.id] : []);
					if (usernames.length === 0 || ids.length === 0) return;

					deleteFriend(usernames[0], ids[0]);
				},
				handleMarkAsRead: () => {
					if (channelId) {
						handleMarkAsRead(channelId);
					}
				},
				handleMute: (duration = Infinity) => {
					handleScheduleMute(channelId, user?.type, duration);
				},
				handleUnmute: () => {
					muteOrUnMuteChannel(channelId, EMuteState.UN_MUTE, user?.type);
				},
				handleEnableE2EE: () => {
					const e2ee = user?.e2ee;
					if (channelId) {
						handleEnableE2ee(channelId, e2ee);
					}
				},
				handleRemoveFromGroup: () => {
					const userId = user?.id;
					if (userId && channelId) {
						handleRemoveMemberFromGroup(userId, channelId);
					}
				},
				handleLeaveGroup: () => {
					if (openLeaveGroupModal) {
						openLeaveGroupModal();
					}
				},
				handleBlockFriend: async () => {
					const usernames = user?.usernames || (user?.user ? [user.user.username] : []);
					const ids = user?.user_ids || (user?.user ? [user.user.id] : []);
					if (usernames.length === 0 || ids.length === 0) return;
					await blockFriend(usernames[0], ids[0]);
				},
				handleUnblockFriend: async () => {
					await unBlockFriend(user?.usernames?.[0], user?.user_ids?.[0]);
				},
				handleEditGroup: () => {
					if (openEditGroupModal) {
						openEditGroupModal();
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
			handleRemoveMemberFromGroup,
			blockFriend,
			unBlockFriend,
			openEditGroupModal,
			openLeaveGroupModal
		]
	);

	return { createDefaultHandlers };
}
