import type { ChannelMetaEntity, DirectEntity, FriendsEntity } from '@mezon/store';
import { ChannelType } from 'mezon-js';
import {
	RECENT_FRIENDS_LIMIT,
	RECENT_INTERACTION_WINDOW_SECONDS,
	buildFriendRows,
	getFriendInteractionTime,
	getFriendInteractionTimes
} from './friendSorting';

jest.mock('mezon-js-protobuf', () => ({}));

const makeFriend = (id: string, overrides: Partial<FriendsEntity> = {}): FriendsEntity => ({
	id,
	state: 0,
	source_id: 'me',
	user: {
		id,
		username: `user_${id}`,
		display_name: `User ${id}`
	},
	...overrides
});

const makeDirect = (id: string, overrides: Partial<DirectEntity> = {}): DirectEntity => ({
	id,
	channel_id: id,
	type: ChannelType.CHANNEL_TYPE_DM,
	user_ids: ['me', 'u1'],
	...overrides
});

const makeMeta = (id: string, lastSentTimestamp: number): ChannelMetaEntity => ({
	id,
	lastSeenTimestamp: 0,
	lastSentTimestamp,
	clanId: '0',
	isMute: false,
	senderId: 'u1'
});

describe('getFriendInteractionTimes', () => {
	it('takes the max timestamp per peer across 1-1 DMs and prefers dmMeta over last_sent_message', () => {
		const directs = [
			makeDirect('dm-1', { user_ids: ['me', 'u1'], last_sent_message: { timestamp_seconds: 100 } }),
			makeDirect('dm-2', { user_ids: ['me', 'u1'], last_sent_message: { timestamp_seconds: 500 } }),
			makeDirect('dm-3', { user_ids: ['u2'], last_sent_message: { timestamp_seconds: 250 } }),
			makeDirect('grp-1', {
				type: ChannelType.CHANNEL_TYPE_GROUP,
				user_ids: ['me', 'u1', 'u3'],
				last_sent_message: { timestamp_seconds: 9999 }
			})
		];
		const dmMeta = {
			'dm-1': makeMeta('dm-1', 800),
			'dm-2': makeMeta('dm-2', 200),
			'grp-1': makeMeta('grp-1', 9999)
		};

		const result = getFriendInteractionTimes(directs, dmMeta, 'me');

		expect(result.get('u1')).toBe(800);
		expect(result.get('u2')).toBe(250);
		expect(result.has('me')).toBe(false);
		expect(result.has('u3')).toBe(false);
	});

	it('falls back to last_sent_message when meta is missing or invalid and ignores NaN, Infinity, or <= 0 timestamps', () => {
		const directs = [
			makeDirect('dm-nan', { user_ids: ['u1'], last_sent_message: { timestamp_seconds: 300 } }),
			makeDirect('dm-zero', { user_ids: ['u2'], last_sent_message: { timestamp_seconds: 0 } }),
			makeDirect('dm-neg', { user_ids: ['u3'], last_sent_message: { timestamp_seconds: -5 } }),
			makeDirect('dm-inf', { user_ids: ['u4'], last_sent_message: { timestamp_seconds: Number.POSITIVE_INFINITY } })
		];
		const dmMeta = {
			'dm-nan': makeMeta('dm-nan', Number.NaN),
			'dm-zero': makeMeta('dm-zero', 0),
			'dm-neg': makeMeta('dm-neg', -10),
			'dm-inf': makeMeta('dm-inf', Number.POSITIVE_INFINITY)
		};

		const result = getFriendInteractionTimes(directs, dmMeta, 'me');

		expect(result.get('u1')).toBe(300);
		expect(result.has('u2')).toBe(false);
		expect(result.has('u3')).toBe(false);
		expect(result.has('u4')).toBe(false);
	});
});

describe('getFriendInteractionTime', () => {
	it('treats friendship update_time as an interaction and keeps the max with DM time', () => {
		const dmTimes = new Map<string, number>([
			['u1', 1000],
			['u2', 3000]
		]);
		const f1 = makeFriend('u1', { update_time: new Date(2000 * 1000).toISOString() });
		const f2 = makeFriend('u2', { update_time: new Date(1500 * 1000).toISOString() });
		const f3 = makeFriend('u3', { update_time: 'not-a-date' });
		const f4 = { id: 'u4', state: 0, update_time: new Date(500 * 1000).toISOString() } as FriendsEntity;

		expect(getFriendInteractionTime(f1, dmTimes)).toBe(2000);
		expect(getFriendInteractionTime(f2, dmTimes)).toBe(3000);
		expect(getFriendInteractionTime(f3, dmTimes)).toBe(0);
		expect(getFriendInteractionTime(f4, dmTimes)).toBe(500);
	});
});

describe('buildFriendRows', () => {
	const nowSeconds = 2_000_000;

	it('builds a recent layer within 7 days capped at 10 newest first and sorts others by chosen order', () => {
		const friends: FriendsEntity[] = [];
		const dmTimes = new Map<string, number>();

		for (let i = 1; i <= 12; i += 1) {
			const id = `recent_${i}`;
			friends.push(
				makeFriend(id, {
					user: { id, username: id, display_name: `Z_${String(i).padStart(2, '0')}` }
				})
			);
			dmTimes.set(id, nowSeconds - (13 - i) * 60);
		}

		const staleFriend = makeFriend('stale', {
			user: { id: 'stale', username: 'stale', display_name: 'Bravo' }
		});
		dmTimes.set('stale', nowSeconds - RECENT_INTERACTION_WINDOW_SECONDS - 1);

		const noHistoryFriend = makeFriend('none', {
			user: { id: 'none', username: 'none', display_name: 'Alpha' }
		});

		friends.push(staleFriend, noHistoryFriend);
		const originalIds = friends.map((f) => f.id);

		const recentOrderRows = buildFriendRows({
			friends,
			sortOrder: 'recent',
			dmTimes,
			nowSeconds,
			withRecentLayer: true
		});

		expect(friends.map((f) => f.id)).toEqual(originalIds);
		expect(recentOrderRows[0]).toEqual({ type: 'header', key: 'recent' });
		const recentFriendRows = recentOrderRows.slice(1, 1 + RECENT_FRIENDS_LIMIT);
		expect(recentFriendRows).toHaveLength(RECENT_FRIENDS_LIMIT);
		expect(recentFriendRows.map((row) => (row.type === 'friend' ? row.friend.id : row.key))).toEqual([
			'recent_12',
			'recent_11',
			'recent_10',
			'recent_9',
			'recent_8',
			'recent_7',
			'recent_6',
			'recent_5',
			'recent_4',
			'recent_3'
		]);

		expect(recentOrderRows[11]).toEqual({ type: 'header', key: 'others' });
		expect(recentOrderRows.slice(12).map((row) => (row.type === 'friend' ? row.friend.id : row.key))).toEqual([
			'recent_2',
			'recent_1',
			'stale',
			'none'
		]);

		const nameOrderRows = buildFriendRows({
			friends,
			sortOrder: 'name',
			dmTimes,
			nowSeconds,
			withRecentLayer: true
		});

		expect(nameOrderRows[0]).toEqual({ type: 'header', key: 'recent' });
		expect(nameOrderRows.slice(1, 11).map((row) => (row.type === 'friend' ? row.friend.id : row.key))).toEqual([
			'recent_12',
			'recent_11',
			'recent_10',
			'recent_9',
			'recent_8',
			'recent_7',
			'recent_6',
			'recent_5',
			'recent_4',
			'recent_3'
		]);
		expect(nameOrderRows[11]).toEqual({ type: 'header', key: 'others' });
		expect(nameOrderRows.slice(12).map((row) => (row.type === 'friend' ? row.friend.id : row.key))).toEqual([
			'none',
			'stale',
			'recent_1',
			'recent_2'
		]);
	});

	it('includes exact 7-day cutoff boundary in recent and breaks ties by name in others', () => {
		const exactCutoff = makeFriend('exact', { user: { id: 'exact', username: 'exact', display_name: 'Zulu' } });
		const justOutside = makeFriend('outside', { user: { id: 'outside', username: 'outside', display_name: 'Yankee' } });
		const zeroB = makeFriend('zero_b', { user: { id: 'zero_b', username: 'zero_b', display_name: 'Bravo' } });
		const zeroA = makeFriend('zero_a', { user: { id: 'zero_a', username: 'zero_a', display_name: 'Alpha' } });

		const dmTimes = new Map<string, number>([
			['exact', nowSeconds - RECENT_INTERACTION_WINDOW_SECONDS],
			['outside', nowSeconds - RECENT_INTERACTION_WINDOW_SECONDS - 1]
		]);

		const rows = buildFriendRows({
			friends: [zeroB, justOutside, exactCutoff, zeroA],
			sortOrder: 'recent',
			dmTimes,
			nowSeconds,
			withRecentLayer: true
		});

		expect(rows).toEqual([
			{ type: 'header', key: 'recent' },
			{ type: 'friend', friend: exactCutoff },
			{ type: 'header', key: 'others' },
			{ type: 'friend', friend: justOutside },
			{ type: 'friend', friend: zeroA },
			{ type: 'friend', friend: zeroB }
		]);
	});

	it('omits headers when recent layer is empty and omits others header when all friends are in recent layer', () => {
		const f1 = makeFriend('u1', { user: { id: 'u1', username: 'u1', display_name: 'Charlie' } });
		const f2 = makeFriend('u2', { user: { id: 'u2', username: 'u2', display_name: 'Alice' } });
		const staleTimes = new Map<string, number>([
			['u1', nowSeconds - RECENT_INTERACTION_WINDOW_SECONDS - 10],
			['u2', nowSeconds - RECENT_INTERACTION_WINDOW_SECONDS - 5]
		]);

		const noRecentRows = buildFriendRows({
			friends: [f1, f2],
			sortOrder: 'recent',
			dmTimes: staleTimes,
			nowSeconds,
			withRecentLayer: true
		});

		expect(noRecentRows).toEqual([
			{ type: 'friend', friend: f2 },
			{ type: 'friend', friend: f1 }
		]);

		const allRecentTimes = new Map<string, number>([
			['u1', nowSeconds - 10],
			['u2', nowSeconds - 20]
		]);

		const onlyRecentRows = buildFriendRows({
			friends: [f1, f2],
			sortOrder: 'name',
			dmTimes: allRecentTimes,
			nowSeconds,
			withRecentLayer: true
		});

		expect(onlyRecentRows).toEqual([
			{ type: 'header', key: 'recent' },
			{ type: 'friend', friend: f1 },
			{ type: 'friend', friend: f2 }
		]);
	});

	it('returns flat friend rows in the chosen sort order when withRecentLayer is false', () => {
		const f1 = makeFriend('u1', { user: { id: 'u1', username: 'u1', display_name: 'Charlie' } });
		const f2 = makeFriend('u2', { user: { id: 'u2', username: 'u2', display_name: 'Alice' } });
		const dmTimes = new Map<string, number>([
			['u1', nowSeconds - 10],
			['u2', nowSeconds - 50]
		]);

		expect(
			buildFriendRows({
				friends: [f2, f1],
				sortOrder: 'recent',
				dmTimes,
				nowSeconds,
				withRecentLayer: false
			})
		).toEqual([
			{ type: 'friend', friend: f1 },
			{ type: 'friend', friend: f2 }
		]);

		expect(
			buildFriendRows({
				friends: [f1, f2],
				sortOrder: 'name',
				dmTimes,
				nowSeconds,
				withRecentLayer: false
			})
		).toEqual([
			{ type: 'friend', friend: f2 },
			{ type: 'friend', friend: f1 }
		]);
	});
});
