import { describe, expect, it, jest } from '@jest/globals';
import {
	MAX_LIVE_COMMENT_LENGTH,
	formatStreamCommentToken,
	isStreamCommentToken,
	parseRoomComment,
	parseStreamCommentToken,
	resolveClanMemberSender
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
});
