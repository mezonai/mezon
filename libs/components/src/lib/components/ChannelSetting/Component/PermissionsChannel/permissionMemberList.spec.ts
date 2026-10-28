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
	rankByMatch,
	searchNeedle,
	serverRowsFor
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

	it('ranks names starting with the search first, then words starting with it, then names containing it', () => {
		const rows = [
			{ id: 'contains', names: ['Magic Mike'] },
			{ id: 'server-other', names: ['Zed'] },
			{ id: 'word', names: ['Tran Gi Anh'] },
			{ id: 'prefix-username', names: ['Someone', 'giang.tran'] },
			{ id: 'prefix-accent', names: ['Giàng A Páo'] }
		];
		const ranked = rankByMatch(rows, ' Gi ', (row) => row.names).map((row) => row.id);
		expect(ranked).toEqual(['prefix-accent', 'prefix-username', 'word', 'contains', 'server-other']);
	});

	it('takes a dot or any other non-letter as the start of a word', () => {
		const rows = [
			{ id: 'contains', names: ['Ostrander'] },
			{ id: 'dotted', names: ['', '', 'giang.tran'] },
			{ id: 'later-word', names: ['Matran Tran'] }
		];
		expect(rankByMatch(rows, 'tran', (row) => row.names).map((row) => row.id)).toEqual(['dotted', 'later-word', 'contains']);
	});

	it('orders equal matches by the name shown, numbers by value, and leaves rows alone without a search', () => {
		const rows = [
			{ names: ['', 'Old Timer 099'] },
			{ names: ['Old Timer 098'] },
			{ names: [undefined, 'Old Timer 090', 'oldtimer_090'] },
			{ names: ['Old Timer 9'] },
			{ names: ['Old Timer 10'] }
		];
		const shown = (ranked: typeof rows) => ranked.map((row) => row.names.find(Boolean));
		expect(shown(rankByMatch(rows, 'old timer', (row) => row.names))).toEqual([
			'Old Timer 9',
			'Old Timer 10',
			'Old Timer 090',
			'Old Timer 098',
			'Old Timer 099'
		]);
		expect(rankByMatch(rows, '  ', (row) => row.names)).toEqual(rows);
	});

	it('keeps an accented server row under a longer unaccented query, and returns the answer itself when nothing drops', () => {
		const users = [{ display_name: 'Nguyễn Văn A' }, { display_name: 'Đức Hạnh' }];
		expect(serverRowsFor({ needle: 'nguy', users }, 'nguye')).toEqual([{ display_name: 'Nguyễn Văn A' }]);
		expect(serverRowsFor({ needle: 'han', users }, 'hanh')).toEqual([{ display_name: 'Đức Hạnh' }]);
		expect(serverRowsFor({ needle: 'n', users }, 'n')).toBe(users);
		expect(serverRowsFor({ needle: 'a', users }, 'an')).toBe(users);
		const none: typeof users = [];
		expect(serverRowsFor({ needle: '', users: none }, 'zz')).toBe(none);
	});

	it('lists the server answer for the typed query whole', () => {
		const users = [{ username: 'giang' }, { username: 'ngoc', display_name: 'Ngoc', clan_nick: 'N' }];
		expect(serverRowsFor({ needle: 'gi', users }, 'gi')).toBe(users);
	});

	it('drops rows of an earlier query that no longer match while the new one is out', () => {
		const users = [
			{ username: 'oldtimer_031', display_name: 'Old Timer 031' },
			{ username: 'x', clan_nick: 'Oldtimer_05 nick' },
			{ username: 'oldtimer_050' }
		];
		expect(serverRowsFor({ needle: 'oldtimer_03', users }, 'oldtimer_05').map((user) => user.username)).toEqual(['x', 'oldtimer_050']);
		expect(serverRowsFor({ needle: 'oldtimer_0', users }, 'oldtimer_03').map((user) => user.username)).toEqual(['oldtimer_031']);
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

	it('names a member from the listing when the roster entry carries no name', () => {
		const row = permissionMemberRow(
			'9',
			{ user: { username: '', display_name: '' } },
			{ username: 'wumpus', displayName: 'Wumpus', avatar: 'a.png' }
		);
		expect(row.name).toBe('Wumpus');
		expect(matchesNeedle('wump', row.keywords)).toBe(true);
	});

	it('falls back to the username, then the id, so no row is ever blank', () => {
		expect(permissionMemberRow('9', null, { username: 'wumpus', displayName: '', avatar: '' }).name).toBe('wumpus');
		expect(permissionMemberRow('9').name).toBe('9');
		expect(permissionMemberRow('9').keywords).toEqual([]);
	});
});
