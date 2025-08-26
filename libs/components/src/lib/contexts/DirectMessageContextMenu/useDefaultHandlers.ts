import { EMuteState } from '@mezon/utils';
import { useCallback } from 'react';
import { DirectMessageContextMenuHandlers } from './types';

interface UseDefaultHandlersParams {
	openUserProfile: () => void;
	handleDirectMessageWithUser: (user?: any) => Promise<void>;
	addFriend: (params: { usernames: string[]; ids: string[] }) => void;
	deleteFriend: (username: string, userId: string) => void;
	handleMarkAsRead: (channelId: string) => void;
	handleScheduleMute: (channelId: string, channelType: number, duration: number) => void;
	muteOrUnMuteChannel: (channelId: string, active: number) => void;
	handleEnableE2ee: (directId?: string, e2ee?: number) => Promise<void>;
	handleRemoveMemberFromGroup: (userId: string, channelId: string) => Promise<void>;
	handleLeaveDmGroup: (channelId: string, isLastOne: boolean) => Promise<void>;
	blockFriend: (username: string, userId: string) => Promise<boolean>;
	unBlockFriend: (username: string, userId: string) => Promise<boolean>;
	openEditGroupModal?: () => void;
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
	openEditGroupModal
}: UseDefaultHandlersParams) {
	const createDefaultHandlers = useCallback(
		(user?: any): DirectMessageContextMenuHandlers => {
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

					addFriend({ usernames: [user.usernames[0]], ids: [user.user_id[0]] });
				},
				handleRemoveFriend: () => {
					if (!user) return;
					deleteFriend(user.usernames[0], user.user_id[0]);
				},
				handleMarkAsRead: () => {
					const channelId = (user as any)?.channelId || (user as any)?.channel_id;
					if (channelId) {
						handleMarkAsRead(channelId);
					}
				},
				handleMute: (duration = Infinity) => {
					const channelId = user?.channelId || user?.channel_id;
					handleScheduleMute(channelId, user?.type, duration);
				},
				handleUnmute: () => {
					const channelId = user?.channelId || user?.channel_id;
					muteOrUnMuteChannel(channelId, EMuteState.UN_MUTE);
				},
				handleEnableE2EE: () => {
					const channelId = user?.channelId || user?.channel_id;
					const e2ee = user?.e2ee;
					if (channelId) {
						handleEnableE2ee(channelId, e2ee);
					}
				},
				handleRemoveFromGroup: () => {
					const userId = user?.id;
					const channelId = user?.channelId || user.channel_id;
					if (userId && channelId) {
						handleRemoveMemberFromGroup(userId, channelId);
					}
				},
				handleLeaveGroup: () => {
					const channelId = user?.channelId || user.channel_id;
					const isLastOne = (user?.user_id?.length || 0) < 1;
					handleLeaveDmGroup(channelId, isLastOne);
				},
				handleBlockFriend: async () => {
					await blockFriend(user?.usernames?.[0], user?.user_id?.[0]);
				},
				handleUnblockFriend: async () => {
					await unBlockFriend(user?.usernames?.[0], user?.user_id?.[0]);
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
			handleLeaveDmGroup,
			blockFriend,
			unBlockFriend,
			openEditGroupModal
		]
	);

	return { createDefaultHandlers };
}
