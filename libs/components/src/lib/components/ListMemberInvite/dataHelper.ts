import type { DirectEntity, FriendsEntity } from '@mezon/store';
import type { UsersClanEntity } from '@mezon/utils';
import { ChannelType } from 'mezon-js';

// Define the return type for clarity
export interface ProcessedUser {
	id?: string;
	username?: string;
	displayName?: string;
	avatarUrl?: string;
	clanAvatar?: string;
	clanNick?: string;
	type?: ChannelType;
	dmId?: string;
}
export function processUserData(membersClan: UsersClanEntity[], dmGroupChatList: DirectEntity[], friends: FriendsEntity[]): ProcessedUser[] {
	const existingUserMap = new Map<string, UsersClanEntity>();

	membersClan.forEach((user) => {
		const userId = user?.id;
		if (!userId) return;

		existingUserMap.set(userId, user);
	});

	const usersFromDmGroupChat: ProcessedUser[] = dmGroupChatList.reduce<ProcessedUser[]>((acc, chat) => {
		if (chat.type === ChannelType.CHANNEL_TYPE_DM) {
			const userId = chat.userIds?.[0];
			if (!userId) return acc;

			const clanData = existingUserMap.get(userId);
			existingUserMap.set(userId, chat);
			acc.push({
				id: userId,
				username: chat.usernames?.[0] || '',
				displayName: clanData?.clanNick || clanData?.prioritizeName || chat.displayNames?.[0] || chat.usernames?.[0] || '',
				avatarUrl: clanData?.clanAvatar || chat.avatars?.[0] || '',
				clanAvatar: clanData?.clanAvatar || chat.avatars?.[0] || '',
				clanNick: clanData?.clanNick || clanData?.prioritizeName || chat.displayNames?.[0] || chat.usernames?.[0] || '',
				type: ChannelType.CHANNEL_TYPE_DM,
				dmId: chat.id
			});

			return acc;
		}

		if (chat.type === ChannelType.CHANNEL_TYPE_GROUP) {
			acc.push({
				id: chat.channelId || '',
				username: `${chat.usernames?.join(',') || ''}${chat.creatorName ? `, ${chat.creatorName}` : ''}`,
				displayName: chat.channelLabel || '',
				avatarUrl: 'assets/images/avatar-group.png',
				clanAvatar: 'assets/images/avatar-group.png',
				clanNick: chat.channelLabel || '',
				type: ChannelType.CHANNEL_TYPE_GROUP
			});
			return acc;
		}
		return acc;
	}, []);

	const usersFromAllClans = membersClan.reduce<ProcessedUser[]>((acc, user) => {
		const direct = existingUserMap.get(user.id);

		if (!direct) {
			acc.push({
				id: user.id || '',
				username: user.user?.username || '',
				displayName: user.user?.displayName || '',
				avatarUrl: user.user?.avatarUrl || '',
				clanAvatar: user.clanAvatar || user.user?.avatarUrl || '',
				clanNick: user.clanNick || user.user?.displayName || user.user?.username || '',
				type: ChannelType.CHANNEL_TYPE_DM
			});
		}
		return acc;
	}, []);

	const usersFromFriends: ProcessedUser[] = friends.reduce<ProcessedUser[]>((acc, friend) => {
		const user = friend.user;

		if (!user?.id) return acc;
		const direct = existingUserMap.get(user.id);
		if (!direct) {
			const data: ProcessedUser = {
				id: user.id,
				username: user.username || '',
				displayName: user.displayName || '',
				avatarUrl: user.avatarUrl || '',
				clanAvatar: user.avatarUrl || '',
				clanNick: user.displayName || user.username || '',
				type: ChannelType.CHANNEL_TYPE_DM
			};
			acc.push(data);
		}
		return acc;
	}, []);

	return [...usersFromAllClans, ...usersFromFriends, ...usersFromDmGroupChat];
}
