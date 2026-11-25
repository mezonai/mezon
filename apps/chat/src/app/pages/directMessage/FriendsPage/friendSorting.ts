import type { ChannelMetaEntity, DirectEntity, FriendsEntity } from '@mezon/store';
import { ChannelType } from 'mezon-js';

export type FriendSortOrder = 'recent' | 'name';

export type FriendListRow = { type: 'header'; key: 'recent' | 'others' } | { type: 'friend'; friend: FriendsEntity };

export interface BuildFriendRowsOptions {
	friends: FriendsEntity[];
	sortOrder: FriendSortOrder;
	dmTimes: Map<string, number>;
	nowSeconds: number;
	withRecentLayer: boolean;
}

export const RECENT_FRIENDS_LIMIT = 10;
export const RECENT_INTERACTION_WINDOW_SECONDS = 7 * 24 * 60 * 60;

const toValidTimestamp = (value?: number): number => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);

export const getFriendInteractionTimes = (
	directs: DirectEntity[],
	dmMeta: Record<string, ChannelMetaEntity | undefined> | undefined,
	currentUserId?: string
): Map<string, number> => {
	const times = new Map<string, number>();

	for (const direct of directs) {
		if (!direct || direct.type !== ChannelType.CHANNEL_TYPE_DM) {
			continue;
		}
		const metaTime = toValidTimestamp(dmMeta?.[direct.id]?.lastSentTimestamp);
		const lastSentMessageId = direct.last_sent_message?.id;
		const hasRealLastSentMessage = Boolean(lastSentMessageId && lastSentMessageId !== '0');
		const fallbackTime = hasRealLastSentMessage ? toValidTimestamp(direct.last_sent_message?.timestamp_seconds) : 0;
		const timestamp = metaTime || fallbackTime;
		if (!timestamp) {
			continue;
		}
		for (const userId of direct.user_ids ?? []) {
			if (!userId || userId === currentUserId) {
				continue;
			}
			if (timestamp > (times.get(userId) ?? 0)) {
				times.set(userId, timestamp);
			}
		}
	}

	return times;
};

export const getFriendInteractionTime = (friend: FriendsEntity, dmTimes: Map<string, number>): number => {
	const peerId = friend.user?.id || friend.id;
	const dmTime = toValidTimestamp(peerId ? dmTimes.get(peerId) : undefined);
	const parsedMs = friend.update_time ? Date.parse(friend.update_time) : Number.NaN;
	const friendTime = Number.isFinite(parsedMs) && parsedMs > 0 ? parsedMs / 1000 : 0;
	return Math.max(dmTime, friendTime);
};

export const compareFriendNames = (a: FriendsEntity, b: FriendsEntity): number => {
	const nameA = a.user?.display_name || a.user?.username || '';
	const nameB = b.user?.display_name || b.user?.username || '';
	return nameA.localeCompare(nameB);
};

export const buildFriendRows = ({ friends, sortOrder, dmTimes, nowSeconds, withRecentLayer }: BuildFriendRowsOptions): FriendListRow[] => {
	const entries = friends.map((friend) => ({
		friend,
		interactionTime: getFriendInteractionTime(friend, dmTimes)
	}));

	const compareByRecent = (a: (typeof entries)[number], b: (typeof entries)[number]): number => {
		if (b.interactionTime !== a.interactionTime) {
			return b.interactionTime - a.interactionTime;
		}
		return compareFriendNames(a.friend, b.friend);
	};

	const compareByName = (a: (typeof entries)[number], b: (typeof entries)[number]): number => compareFriendNames(a.friend, b.friend);

	const comparator = sortOrder === 'recent' ? compareByRecent : compareByName;

	if (!withRecentLayer) {
		return entries.sort(comparator).map(({ friend }): FriendListRow => ({ type: 'friend', friend }));
	}

	const cutoff = nowSeconds - RECENT_INTERACTION_WINDOW_SECONDS;
	const recentEntries = entries
		.filter((entry) => entry.interactionTime > 0 && entry.interactionTime >= cutoff)
		.sort(compareByRecent)
		.slice(0, RECENT_FRIENDS_LIMIT);

	if (recentEntries.length === 0) {
		return entries.sort(comparator).map(({ friend }): FriendListRow => ({ type: 'friend', friend }));
	}

	const recentSet = new Set(recentEntries);
	const otherEntries = entries.filter((entry) => !recentSet.has(entry)).sort(comparator);

	const rows: FriendListRow[] = [
		{ type: 'header', key: 'recent' },
		...recentEntries.map(({ friend }): FriendListRow => ({ type: 'friend', friend }))
	];

	if (otherEntries.length > 0) {
		rows.push({ type: 'header', key: 'others' });
		for (const { friend } of otherEntries) {
			rows.push({ type: 'friend', friend });
		}
	}

	return rows;
};
