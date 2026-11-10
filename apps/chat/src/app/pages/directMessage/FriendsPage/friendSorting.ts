import type { ChannelMetaEntity, DirectEntity, FriendsEntity } from '@mezon/store';
import type { ApiChannelMessageHeader } from 'mezon-js';
import { ChannelType } from 'mezon-js';

export type FriendSortOrder = 'recentActivity' | 'recentlyAdded' | 'nameAscending' | 'nameDescending';

const getMessageTime = (message?: ApiChannelMessageHeader): number => {
	const timestamp = message?.timestamp_seconds;
	// Opening an empty DM also sets a timestamp, but does not create a message.
	if (!message?.id || message.id === '0' || !timestamp || !Number.isFinite(timestamp) || timestamp < 0) return 0;
	return timestamp;
};

export const getFriendMessageTimes = (
	directMessages: readonly DirectEntity[],
	currentUserId: string,
	dmMetadata: Readonly<Record<string, Pick<ChannelMetaEntity, 'last_sent_message'> | undefined>>
): Map<string, number> => {
	const messageTimes = new Map<string, number>();
	for (const direct of directMessages) {
		if (direct.type !== ChannelType.CHANNEL_TYPE_DM) continue;
		const metadataMessage = dmMetadata[direct.channel_id || direct.id]?.last_sent_message;
		const metadataTime = getMessageTime(metadataMessage);
		const directTime = getMessageTime(direct.last_sent_message);
		// DM headers can use local receipt time. Prefer server time for the same message,
		// while allowing either source to contain a newer message after a refresh.
		const timestamp = metadataTime && metadataMessage?.id === direct.last_sent_message?.id ? metadataTime : Math.max(metadataTime, directTime);
		if (!timestamp) continue;
		for (const userId of direct.user_ids ?? []) {
			if (userId !== currentUserId) {
				messageTimes.set(userId, Math.max(messageTimes.get(userId) ?? 0, timestamp));
			}
		}
	}
	return messageTimes;
};

const getFriendshipTime = (friend: FriendsEntity): number => {
	// The friends API exposes the relationship timestamp as update_time.
	const timestamp = Date.parse(friend.update_time ?? '');
	return Number.isFinite(timestamp) ? timestamp : 0;
};

const compareNames = (first: FriendsEntity, second: FriendsEntity): number => {
	const firstName = first.user?.display_name || first.user?.username || '';
	const secondName = second.user?.display_name || second.user?.username || '';
	return firstName.localeCompare(secondName);
};

export const sortFriends = (
	friends: readonly FriendsEntity[],
	sortOrder: FriendSortOrder,
	messageTimes: ReadonlyMap<string, number>,
	tab: string
): FriendsEntity[] => {
	return [...friends].sort((first, second) => {
		if (tab === 'pending') return (second.state ?? 0) - (first.state ?? 0);
		if (tab !== 'all' && tab !== 'online') return compareNames(first, second);
		if (sortOrder === 'nameAscending') return compareNames(first, second);
		if (sortOrder === 'nameDescending') return compareNames(second, first);
		if (sortOrder === 'recentActivity') {
			const firstMessageTime = messageTimes.get(first.user?.id || first.id) ?? 0;
			const secondMessageTime = messageTimes.get(second.user?.id || second.id) ?? 0;
			if (firstMessageTime !== secondMessageTime) return secondMessageTime - firstMessageTime;
		}
		return getFriendshipTime(second) - getFriendshipTime(first) || compareNames(first, second);
	});
};
