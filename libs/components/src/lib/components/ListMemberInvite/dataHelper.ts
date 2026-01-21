import type { DirectEntity, FriendsEntity } from '@mezon/store';
import type { UsersClanEntity } from '@mezon/utils';
import { ChannelType } from 'mezon-js';

// Define the return type for clarity
export interface ProcessedUser {
	id?: string;
	username?: string;
	display_name?: string;
	avatar_url?: string;
	clan_avatar?: string;
	clan_nick?: string;
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
			const userId = chat.user_ids?.[0];
			if (!userId) return acc;

			const clanData = existingUserMap.get(userId);
			existingUserMap.set(userId, chat);
			acc.push({
				id: userId,
				username: chat.usernames?.[0] || '',
				display_name: clanData?.clan_nick || clanData?.prioritizeName || chat.display_names?.[0] || chat.usernames?.[0] || '',
				avatar_url: clanData?.clan_avatar || chat.avatars?.[0] || '',
				clan_avatar: clanData?.clan_avatar || chat.avatars?.[0] || '',
				clan_nick: clanData?.clan_nick || clanData?.prioritizeName || chat.display_names?.[0] || chat.usernames?.[0] || '',
				type: ChannelType.CHANNEL_TYPE_DM,
				dmId: chat.id
			});

			return acc;
		}

		if (chat.type === ChannelType.CHANNEL_TYPE_GROUP) {
			acc.push({
				id: chat.channel_id || '0',
				username: `${chat.usernames?.join(',') || ''}${chat.creator_name ? `, ${chat.creator_name}` : ''}`,
				display_name: chat.channel_label || '',
				avatar_url: 'assets/images/avatar-group.png',
				clan_avatar: 'assets/images/avatar-group.png',
				clan_nick: chat.channel_label || '',
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
				display_name: user.user?.display_name || '',
				avatar_url: user.user?.avatar_url || '',
				clan_avatar: user.clan_avatar || user.user?.avatar_url || '',
				clan_nick: user.clan_nick || user.user?.display_name || user.user?.username || '',
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
				display_name: user.display_name || '',
				avatar_url: user.avatar_url || '',
				clan_avatar: user.avatar_url || '',
				clan_nick: user.display_name || user.username || '',
				type: ChannelType.CHANNEL_TYPE_DM
			};
			acc.push(data);
		}
		return acc;
	}, []);

	return [...usersFromAllClans, ...usersFromFriends, ...usersFromDmGroupChat];
}
