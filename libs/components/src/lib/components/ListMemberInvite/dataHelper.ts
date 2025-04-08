import { DirectEntity, FriendsEntity } from '@mezon/store';
import { UsersClanEntity } from '@mezon/utils';
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
}
export function processUserData(membersClan: UsersClanEntity[], dmGroupChatList: DirectEntity[], friends: FriendsEntity[]): ProcessedUser[] {
	const existingIds = new Set(membersClan.map((user) => user.id));

	const usersFromAllClans: ProcessedUser[] = membersClan.map((user) => ({
		id: user.id || '',
		username: user.user?.username || '',
		display_name: user?.user?.display_name || '',
		avatar_url: user?.user?.avatar_url || '',
		clan_avatar: user?.clan_avatar || user?.user?.avatar_url || '',
		clan_nick: user?.clan_nick || user?.user?.display_name || user.user?.username || '',
		type: ChannelType?.CHANNEL_TYPE_DM
	}));

	const usersFromDmGroupChat: ProcessedUser[] = dmGroupChatList
		.flatMap((chat) => {
			if (chat.type === ChannelType.CHANNEL_TYPE_DM) {
				const userId = chat?.user_id?.[0];
				if (userId && !existingIds.has(userId)) {
					existingIds.add(userId);
					return [
						{
							id: userId,
							username: chat.usernames?.[0] || '',
							display_name: chat.display_names?.[0] || chat.usernames?.[0] || '',
							avatar_url: chat.channel_avatar?.[0] || '',
							clan_avatar: chat.channel_avatar?.[0] || '',
							clan_nick: chat.display_names?.[0] || chat.usernames?.[0] || '',
							type: ChannelType?.CHANNEL_TYPE_DM
						} as ProcessedUser
					];
				}
				return [];
			} else if (chat.type === ChannelType.CHANNEL_TYPE_GROUP) {
				return [
					{
						id: chat?.channel_id || '',
						username: `${chat?.usernames?.join(',')}, ${chat.creator_name || ''}`,
						display_name: chat?.channel_label || '',
						avatar_url: 'assets/images/avatar-group.png',
						clan_avatar: 'assets/images/avatar-group.png',
						clan_nick: chat?.channel_label || '',
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
			display_name: friend?.user?.display_name || '',
			avatar_url: friend?.user?.avatar_url || '',
			clan_avatar: friend?.user?.avatar_url || '',
			clan_nick: friend?.user?.display_name || friend?.user?.username || '',
			type: ChannelType?.CHANNEL_TYPE_DM
		}));

	return [...usersFromAllClans, ...usersFromFriends, ...usersFromDmGroupChat];
}
