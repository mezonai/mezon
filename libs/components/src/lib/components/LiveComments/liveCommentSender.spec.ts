import { describe, expect, it, jest } from '@jest/globals';
import {
	MAX_LIVE_COMMENT_LENGTH,
	canAcceptLiveCommentSender,
	findMemberInAnyLoadedClan,
	formatStreamCommentToken,
	isClanRosterLoaded,
	isStreamCommentToken,
	parseRoomComment,
	parseStreamCommentToken,
	resolveClanMemberSender,
	resolveLiveCommentSender
} from './liveCommentSender';

jest.mock(
	'@mezon/utils',
	() => ({
		getNameForPrioritize: (clanNickname: string | undefined, displayName: string | undefined, username: string | undefined) => {
			if (clanNickname && clanNickname !== '') return clanNickname;
			if (displayName && displayName !== '') return displayName;
			return username;
		},
		getAvatarForPrioritize: (clanAvatar: string | undefined, userAvatar: string | undefined) => {
			if (clanAvatar && clanAvatar !== userAvatar) return clanAvatar;
			return userAvatar;
		}
	}),
	{ virtual: true }
);

describe('liveCommentSender', () => {
	describe('resolveClanMemberSender', () => {
		it('returns null when userId is invalid or member is absent', () => {
			expect(resolveClanMemberSender(undefined, { clan_nick: 'Alice' })).toBeNull();
			expect(resolveClanMemberSender(null, { clan_nick: 'Alice' })).toBeNull();
			expect(resolveClanMemberSender('0', { clan_nick: 'Zero' })).toBeNull();
			expect(resolveClanMemberSender('', { clan_nick: 'Blank' })).toBeNull();
			expect(resolveClanMemberSender('   ', { clan_nick: 'Spaces' })).toBeNull();
			expect(resolveClanMemberSender('10', undefined)).toBeNull();
			expect(resolveClanMemberSender('10', null)).toBeNull();
		});

		it('resolves clan nick > display name > username and clan avatar > user avatar', () => {
			expect(
				resolveClanMemberSender('10', {
					clan_nick: 'Nick',
					clan_avatar: 'https://cdn/clan.png',
					user: { display_name: 'Display', username: 'User', avatar_url: 'https://cdn/user.png' }
				})
			).toEqual({
				userId: '10',
				name: 'Nick',
				avatar: 'https://cdn/clan.png'
			});

			expect(
				resolveClanMemberSender('10', {
					user: { display_name: 'Display', username: 'User', avatar_url: 'https://cdn/user.png' }
				})
			).toEqual({
				userId: '10',
				name: 'Display',
				avatar: 'https://cdn/user.png'
			});

			expect(
				resolveClanMemberSender('10', {
					user: { display_name: '', username: 'User' }
				})
			).toEqual({
				userId: '10',
				name: 'User',
				avatar: ''
			});
		});

		it('trims names so whitespace-only values fall through to the next fallback', () => {
			expect(
				resolveClanMemberSender('10', {
					clan_nick: '   ',
					user: { display_name: '  Display  ', username: 'User' }
				})
			).toEqual({
				userId: '10',
				name: 'Display',
				avatar: ''
			});

			expect(
				resolveClanMemberSender('10', {
					clan_nick: '   ',
					user: { display_name: '\t ', username: '  User  ' }
				})
			).toEqual({
				userId: '10',
				name: 'User',
				avatar: ''
			});

			expect(
				resolveClanMemberSender('10', {
					clan_nick: '   ',
					user: { display_name: '  ', username: '   ' }
				})
			).toEqual({
				userId: '10',
				name: '10',
				avatar: ''
			});
		});
	});

	describe('parseRoomComment', () => {
		it('parses valid room comment JSON and ignores payload sender metadata', () => {
			const parsed = parseRoomComment(
				JSON.stringify({
					id: 'spoofed',
					name: 'Spoofed Name',
					avatar: 'https://evil/avatar.png',
					content: '  hello world  ',
					timestamp: 123456
				})
			);
			expect(parsed).toEqual({ content: 'hello world', timestamp: 123456 });
		});

		it('returns null for malformed JSON, non-object JSON, or empty content', () => {
			expect(parseRoomComment(undefined)).toBeNull();
			expect(parseRoomComment('')).toBeNull();
			expect(parseRoomComment('{bad json')).toBeNull();
			expect(parseRoomComment('null')).toBeNull();
			expect(parseRoomComment('["hello"]')).toBeNull();
			expect(parseRoomComment('"hello"')).toBeNull();
			expect(parseRoomComment(JSON.stringify({ content: 123 }))).toBeNull();
			expect(parseRoomComment(JSON.stringify({ content: '   ' }))).toBeNull();
		});

		it('truncates content exceeding 500 characters and defaults missing timestamp', () => {
			const longText = 'a'.repeat(MAX_LIVE_COMMENT_LENGTH + 25);
			const parsed = parseRoomComment(JSON.stringify({ content: longText }));
			expect(parsed?.content).toHaveLength(MAX_LIVE_COMMENT_LENGTH);
			expect(typeof parsed?.timestamp).toBe('number');
			expect(Number.isFinite(parsed?.timestamp)).toBe(true);
		});
	});

	describe('stream comment tokens', () => {
		it('parses and trims comment: tokens and cuts to 500 chars', () => {
			expect(isStreamCommentToken('comment:hi')).toBe(true);
			expect(isStreamCommentToken('sound:boom')).toBe(false);
			expect(parseStreamCommentToken('comment:  hello stream  ')).toBe('hello stream');

			const longBody = 'x'.repeat(MAX_LIVE_COMMENT_LENGTH + 40);
			const parsed = parseStreamCommentToken(`comment:${longBody}`);
			expect(parsed).toHaveLength(MAX_LIVE_COMMENT_LENGTH);
		});

		it('returns null for non-comment tokens and blank comment tokens', () => {
			expect(parseStreamCommentToken(undefined)).toBeNull();
			expect(parseStreamCommentToken('')).toBeNull();
			expect(parseStreamCommentToken('comment:')).toBeNull();
			expect(parseStreamCommentToken('comment:    ')).toBeNull();
			expect(parseStreamCommentToken('sound:abc')).toBeNull();
			expect(parseStreamCommentToken('raising-up:123')).toBeNull();
			expect(parseStreamCommentToken('123456789')).toBeNull();
		});

		it('formats stream comment tokens with trimming and 500 char cap', () => {
			expect(formatStreamCommentToken('   ')).toBeNull();
			expect(formatStreamCommentToken('  nice stream  ')).toBe('comment:nice stream');
			const longInput = `  ${'z'.repeat(MAX_LIVE_COMMENT_LENGTH + 10)}  `;
			const formatted = formatStreamCommentToken(longInput);
			expect(formatted).toBe(`comment:${'z'.repeat(MAX_LIVE_COMMENT_LENGTH)}`);
		});
	});

	describe('isClanRosterLoaded', () => {
		it('returns false when roster is missing or lacks a boolean rosterCapped flag', () => {
			expect(isClanRosterLoaded(undefined)).toBe(false);
			expect(isClanRosterLoaded(null)).toBe(false);
			expect(isClanRosterLoaded({})).toBe(false);
			expect(isClanRosterLoaded({ entities: { entities: { '1': { clan_nick: 'Partial' } } } })).toBe(false);
		});

		it('returns true when rosterCapped is explicitly boolean', () => {
			expect(isClanRosterLoaded({ rosterCapped: false })).toBe(true);
			expect(isClanRosterLoaded({ rosterCapped: true })).toBe(true);
		});
	});

	describe('canAcceptLiveCommentSender', () => {
		it('drops empty, whitespace, and zero user ids', () => {
			expect(canAcceptLiveCommentSender({ userId: undefined, inClanRoster: true, rosterLoaded: true, rosterCapped: true })).toBe(false);
			expect(canAcceptLiveCommentSender({ userId: null, inClanRoster: true, rosterLoaded: true, rosterCapped: true })).toBe(false);
			expect(canAcceptLiveCommentSender({ userId: '', inClanRoster: true, rosterLoaded: true, rosterCapped: true })).toBe(false);
			expect(canAcceptLiveCommentSender({ userId: '   ', inClanRoster: true, rosterLoaded: true, rosterCapped: true })).toBe(false);
			expect(canAcceptLiveCommentSender({ userId: '0', inClanRoster: true, rosterLoaded: true, rosterCapped: true })).toBe(false);
			expect(canAcceptLiveCommentSender({ userId: ' 0 ', inClanRoster: true, rosterLoaded: true, rosterCapped: true })).toBe(false);
		});

		it('drops unknown sender when roster is loaded and not capped', () => {
			expect(canAcceptLiveCommentSender({ userId: '10', inClanRoster: false, rosterLoaded: true, rosterCapped: false })).toBe(false);
		});

		it('keeps unknown sender when roster is loaded and capped', () => {
			expect(canAcceptLiveCommentSender({ userId: '10', inClanRoster: false, rosterLoaded: true, rosterCapped: true })).toBe(true);
		});

		it('keeps unknown sender when roster is not loaded', () => {
			expect(canAcceptLiveCommentSender({ userId: '10', inClanRoster: false, rosterLoaded: false, rosterCapped: false })).toBe(true);
		});

		it('keeps known clan member regardless of roster flags', () => {
			expect(canAcceptLiveCommentSender({ userId: '10', inClanRoster: true, rosterLoaded: true, rosterCapped: false })).toBe(true);
			expect(canAcceptLiveCommentSender({ userId: '10', inClanRoster: true, rosterLoaded: true, rosterCapped: true })).toBe(true);
			expect(canAcceptLiveCommentSender({ userId: '10', inClanRoster: true, rosterLoaded: false, rosterCapped: false })).toBe(true);
		});
	});

	describe('findMemberInAnyLoadedClan', () => {
		it('returns null for invalid userId, empty clans, or missing user', () => {
			expect(findMemberInAnyLoadedClan(undefined, '10')).toBeNull();
			expect(findMemberInAnyLoadedClan(null, '10')).toBeNull();
			expect(findMemberInAnyLoadedClan({}, '')).toBeNull();
			expect(findMemberInAnyLoadedClan({}, '0')).toBeNull();
			expect(findMemberInAnyLoadedClan({ 'clan-a': { entities: { entities: {} } } }, '10')).toBeNull();
		});

		it('skips excludeClanId and prefers a member with global name and avatar', () => {
			const partial = { clan_nick: 'StubOnly' };
			const nameOnly = { user: { display_name: 'Global Name', username: 'global_user' } };
			const complete = { user: { display_name: 'Full Name', username: 'full_user', avatar_url: 'https://cdn/full.png' } };
			const excluded = { user: { display_name: 'Excluded', avatar_url: 'https://cdn/excluded.png' } };

			expect(
				findMemberInAnyLoadedClan(
					{
						'clan-target': { entities: { entities: { '10': excluded } } },
						'clan-1': { entities: { entities: { '10': partial } } },
						'clan-2': { entities: { entities: { '10': nameOnly } } },
						'clan-3': { entities: { entities: { '10': complete } } }
					},
					'10',
					'clan-target'
				)
			).toBe(complete);

			expect(
				findMemberInAnyLoadedClan(
					{
						'clan-1': { entities: { entities: { '10': partial } } },
						'clan-2': { entities: { entities: { '10': nameOnly } } }
					},
					'10'
				)
			).toBe(nameOnly);
		});
	});

	describe('resolveLiveCommentSender', () => {
		it('drops empty or zero sender ids even when fallbacks exist', () => {
			expect(
				resolveLiveCommentSender({
					userId: '',
					clanMember: { clan_nick: 'Alice' },
					rosterLoaded: true,
					rosterCapped: true,
					fallbackMember: { user: { display_name: 'Alice', avatar_url: 'https://cdn/a.png' } },
					fallbackName: 'Alice'
				})
			).toBeNull();

			expect(
				resolveLiveCommentSender({
					userId: '0',
					clanMember: null,
					rosterLoaded: true,
					rosterCapped: true,
					fallbackName: 'Zero'
				})
			).toBeNull();
		});

		it('drops unknown sender when roster is loaded and uncapped even with fallback member and name', () => {
			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: true,
					rosterCapped: false,
					fallbackMember: { user: { display_name: 'Other Clan', avatar_url: 'https://cdn/other.png' } },
					fallbackName: 'Tile Name'
				})
			).toBeNull();
		});

		it('resolves target clan member first over fallback member and fallback name', () => {
			expect(
				resolveLiveCommentSender({
					userId: ' 10 ',
					clanMember: {
						clan_nick: 'ClanNick',
						clan_avatar: 'https://cdn/clan-avt.png',
						user: { display_name: 'Display', username: 'user', avatar_url: 'https://cdn/user-avt.png' }
					},
					rosterLoaded: true,
					rosterCapped: false,
					fallbackMember: {
						clan_nick: 'WrongNick',
						clan_avatar: 'https://cdn/wrong.png',
						user: { display_name: 'FallbackDisplay', avatar_url: 'https://cdn/fb.png' }
					},
					fallbackName: 'FallbackScreenName'
				})
			).toEqual({
				userId: '10',
				name: 'ClanNick',
				avatar: 'https://cdn/clan-avt.png'
			});
		});

		it('uses fallback member global user data when target clan member is absent on a capped roster, ignoring other clan nick and avatar', () => {
			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: true,
					rosterCapped: true,
					fallbackMember: {
						clan_nick: 'OtherClanNick',
						clan_avatar: 'https://cdn/other-clan-avatar.png',
						user: {
							display_name: 'Global Display',
							username: 'global_user',
							avatar_url: 'https://cdn/global-avatar.png'
						}
					},
					fallbackName: 'ScreenName'
				})
			).toEqual({
				userId: '10',
				name: 'Global Display',
				avatar: 'https://cdn/global-avatar.png'
			});

			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: true,
					rosterCapped: true,
					fallbackMember: {
						clan_nick: 'OtherClanNick',
						clan_avatar: 'https://cdn/other-clan-avatar.png',
						user: {
							display_name: '   ',
							username: 'global_user'
						}
					},
					fallbackName: 'ScreenName'
				})
			).toEqual({
				userId: '10',
				name: 'global_user',
				avatar: ''
			});
		});

		it('falls back to fallbackName with empty avatar when no member resolves a name, on capped or unloaded roster', () => {
			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: true,
					rosterCapped: true,
					fallbackMember: null,
					fallbackName: '  Viewer Name  '
				})
			).toEqual({
				userId: '10',
				name: 'Viewer Name',
				avatar: ''
			});

			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: false,
					rosterCapped: false,
					fallbackMember: { clan_nick: 'IgnoredOtherNick', clan_avatar: 'https://cdn/ignored.png', user: {} },
					fallbackName: 'Tile Name'
				})
			).toEqual({
				userId: '10',
				name: 'Tile Name',
				avatar: ''
			});
		});

		it('preserves user avatar from fallbackMember if only fallbackName provides the name', () => {
			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: true,
					rosterCapped: true,
					fallbackMember: { user: { avatar_url: 'https://cdn/u.png' } },
					fallbackName: 'Screen Name'
				})
			).toEqual({
				userId: '10',
				name: 'Screen Name',
				avatar: 'https://cdn/u.png'
			});
		});

		it('drops the comment when nothing resolves a name', () => {
			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: true,
					rosterCapped: true,
					fallbackMember: null,
					fallbackName: '   '
				})
			).toBeNull();

			expect(
				resolveLiveCommentSender({
					userId: '10',
					clanMember: null,
					rosterLoaded: false,
					rosterCapped: false
				})
			).toBeNull();
		});
	});
});
