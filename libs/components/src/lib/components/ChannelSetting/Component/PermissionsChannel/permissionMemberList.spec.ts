import { describe, expect, it } from '@jest/globals';
import {
	PERMISSION_LIST_PAGE_SIZE,
	channelUserProfiles,
	clampPage,
	countLabel,
	matchesNeedle,
	pageCount,
	pageSlice,
	permissionMemberRow,
	searchNeedle
} from './permissionMemberList';

const ids = (count: number) => Array.from({ length: count }, (_, index) => `${index + 1}`);

describe('permission list paging', () => {
	it('counts an empty list as one page', () => {
		expect(pageCount(0)).toBe(1);
		expect(pageSlice([], 3)).toEqual([]);
	});

	it('adds a page only once the previous one is full', () => {
		expect(pageCount(1)).toBe(1);
		expect(pageCount(PERMISSION_LIST_PAGE_SIZE)).toBe(1);
		expect(pageCount(PERMISSION_LIST_PAGE_SIZE + 1)).toBe(2);
		expect(pageCount(11, 10)).toBe(2);
	});

	it('shows every member on exactly one page', () => {
		const all = ids(PERMISSION_LIST_PAGE_SIZE * 2 + 7);
		const walked = Array.from({ length: pageCount(all.length) }, (_, page) => pageSlice(all, page)).flat();
		expect(walked).toEqual(all);
	});

	it('falls back to the last page when the list shrinks under it', () => {
		const all = ids(PERMISSION_LIST_PAGE_SIZE + 1);
		expect(pageSlice(all, 99)).toEqual(all.slice(PERMISSION_LIST_PAGE_SIZE));
		expect(clampPage(99, 3)).toBe(0);
		expect(clampPage(-1, 30)).toBe(0);
	});

	it('shows the match count only while a search narrows the list', () => {
		expect(countLabel(990, 990)).toBe('990');
		expect(countLabel(1, 990)).toBe('1/990');
	});
});

describe('permission list search', () => {
	it('ignores case, padding and the members-only @', () => {
		expect(searchNeedle('  @Wumpus ')).toBe('wumpus');
		expect(matchesNeedle('ump', ['', 'Wumpus'])).toBe(true);
		expect(matchesNeedle('zzz', ['Wumpus', undefined])).toBe(false);
		expect(matchesNeedle('', [])).toBe(true);
	});
});

describe('permission member rows', () => {
	it('keeps the identity the channel listing ships per user', () => {
		const profiles = channelUserProfiles({
			user_ids: ['1', '2', '3'],
			usernames: ['one', 'two', 'three'],
			display_names: ['One', 'Two'],
			avatars: ['a1']
		});
		expect(profiles['1']).toEqual({ username: 'one', displayName: 'One', avatar: 'a1' });
		expect(profiles['3']).toEqual({ username: 'three', displayName: '', avatar: '' });
	});

	it('prefers the clan roster, nickname and clan avatar included', () => {
		const row = permissionMemberRow(
			'9',
			{ clan_nick: 'Nick', clan_avatar: 'clan.png', user: { username: 'wumpus', display_name: 'Wumpus', avatar_url: 'user.png' } },
			{ username: 'stale', displayName: 'Stale', avatar: 'stale.png' }
		);
		expect(row).toMatchObject({ name: 'Nick', username: 'wumpus', avatar: 'clan.png' });
		expect(matchesNeedle('wump', row.keywords)).toBe(true);
	});

	it('names a member the roster does not carry from the channel listing', () => {
		const row = permissionMemberRow('9', undefined, { username: 'wumpus', displayName: 'Wumpus', avatar: 'a.png' });
		expect(row).toEqual({ id: '9', name: 'Wumpus', username: 'wumpus', avatar: 'a.png', keywords: ['Wumpus', 'wumpus'] });
	});

	it('falls back to the username, then the id, so no row is ever blank', () => {
		expect(permissionMemberRow('9', null, { username: 'wumpus', displayName: '', avatar: '' }).name).toBe('wumpus');
		expect(permissionMemberRow('9').name).toBe('9');
		expect(permissionMemberRow('9').keywords).toEqual([]);
	});
});
