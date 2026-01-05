import { DirectEntity, FriendsEntity } from '@mezon/store';
import { UsersClanEntity } from '@mezon/utils';
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
}
export function processUserData(membersClan: UsersClanEntity[], dmGroupChatList: DirectEntity[], friends: FriendsEntity[]): ProcessedUser[] {
	const existingIds = new Set(membersClan.map((user) => user.id));

	const usersFromAllClans: ProcessedUser[] = membersClan.map((user) => ({
		id: user.id || '',
		username: user.user?.username || '',
		displayName: user?.user?.displayName || '',
		avatarUrl: user?.user?.avatarUrl || '',
		clanAvatar: user?.clanAvatar || user?.user?.avatarUrl || '',
		clanNick: user?.clanNick || user?.user?.displayName || user.user?.username || '',
		type: ChannelType?.CHANNEL_TYPE_DM
	}));

	const usersFromDmGroupChat: ProcessedUser[] = dmGroupChatList
		.flatMap((chat) => {
			if (chat.type === ChannelType.CHANNEL_TYPE_DM) {
				const userId = chat?.userIds?.[0];
				if (userId && !existingIds.has(userId)) {
					existingIds.add(userId);
					return [
						{
							id: userId,
							username: chat.usernames?.[0] || '',
							displayName: chat.displayNames?.[0] || chat.usernames?.[0] || '',
							avatarUrl: chat.channelAvatar?.[0] || '',
							clanAvatar: chat.channelAvatar?.[0] || '',
							clanNick: chat.displayNames?.[0] || chat.usernames?.[0] || '',
							type: ChannelType?.CHANNEL_TYPE_DM
						} as ProcessedUser
					];
				}
				return [];
			} else if (chat.type === ChannelType.CHANNEL_TYPE_GROUP) {
				return [
					{
						id: chat?.channelId || '',
						username: `${chat?.usernames?.join(',')}, ${chat.creatorName || ''}`,
						displayName: chat?.channelLabel || '',
						avatarUrl: 'assets/images/avatar-group.png',
						clanAvatar: 'assets/images/avatar-group.png',
						clanNick: chat?.channelLabel || '',
						type: ChannelType?.CHANNEL_TYPE_GROUP
					} as ProcessedUser
				];
			}
			return [];
		})
		.filter(Boolean) as ProcessedUser[];

	const usersFromFriends: ProcessedUser[] = friends
		.filter((friend) => friend?.user?.id && !existingIds.has(friend?.user?.id))
		.map((friend) => ({
			id: friend?.user?.id || '',
			username: friend?.user?.username || '',
			displayName: friend?.user?.displayName || '',
			avatarUrl: friend?.user?.avatarUrl || '',
			clanAvatar: friend?.user?.avatarUrl || '',
			clanNick: friend?.user?.displayName || friend?.user?.username || '',
			type: ChannelType?.CHANNEL_TYPE_DM
		}));

	return [...usersFromAllClans, ...usersFromFriends, ...usersFromDmGroupChat];
}
