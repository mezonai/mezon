import type { IMessageSendPayload } from '../types';
import { EBacktickType } from '../types/messageLine';
import {
	MESSAGE_CHAR_LIMIT,
	MESSAGE_CHAR_LIMIT_BOT,
	MESSAGE_CHAR_LIMIT_PRO,
	MESSAGE_FILE_LIMIT_MULTIPLIER,
	MESSAGE_MAX_PART_BYTES,
	countMessageChars,
	getMessageCharLimit,
	splitMessagePayload,
	splitMessageRanges
} from './splitMessage';

describe('splitMessage', () => {
	describe('constants and getMessageCharLimit', () => {
		it('exposes the shared message limits', () => {
			expect(MESSAGE_CHAR_LIMIT).toBe(2048);
			expect(MESSAGE_CHAR_LIMIT_PRO).toBe(4096);
			expect(MESSAGE_CHAR_LIMIT_BOT).toBe(4096);
			expect(MESSAGE_FILE_LIMIT_MULTIPLIER).toBe(3);
			expect(MESSAGE_MAX_PART_BYTES).toBe(3072);
		});

		it('returns the right limit for normal, Pro, and bot users', () => {
			expect(getMessageCharLimit({})).toBe(2048);
			expect(getMessageCharLimit({ isPro: false, isBot: false })).toBe(2048);
			expect(getMessageCharLimit({ isPro: true })).toBe(4096);
			expect(getMessageCharLimit({ isBot: true })).toBe(4096);
			expect(getMessageCharLimit({ isPro: true, isBot: true })).toBe(4096);
		});
	});

	describe('countMessageChars', () => {
		it('counts Unicode code points instead of UTF-16 code units', () => {
			expect(countMessageChars('hello')).toBe(5);
			expect(countMessageChars('Xin chào')).toBe(8);
			expect(countMessageChars('😀')).toBe(1);
			expect(countMessageChars('😀'.repeat(2048))).toBe(2048);
			expect('😀'.repeat(2048).length).toBe(4096);
		});
	});

	describe('splitMessagePayload & splitMessageRanges', () => {
		it('returns the same payload object without copying when text is at or below the limit', () => {
			const payload: IMessageSendPayload = {
				t: 'a'.repeat(MESSAGE_CHAR_LIMIT),
				mk: [{ s: 0, e: 5, type: EBacktickType.BOLD }],
				cvtt: { c1: 'Canvas' }
			};
			const mentions = [{ user_id: 'u1', s: 0, e: 4 }];

			const result = splitMessagePayload(payload, mentions, MESSAGE_CHAR_LIMIT);

			expect(result).toHaveLength(1);
			expect(result[0].content).toBe(payload);
			expect(result[0].mentions).toBe(mentions);
		});

		it('defaults undefined mentions to an empty array when under the limit', () => {
			const payload: IMessageSendPayload = { t: 'short' };
			const result = splitMessagePayload(payload, undefined, 2048);

			expect(result).toHaveLength(1);
			expect(result[0].content).toBe(payload);
			expect(result[0].mentions).toEqual([]);
		});

		it('splits 3 paragraphs of 900 chars at paragraph boundaries into [P1+P2] and [P3]', () => {
			const p1 = 'a'.repeat(900);
			const p2 = 'b'.repeat(900);
			const p3 = 'c'.repeat(900);
			const text = `${p1}\n\n${p2}\n\n${p3}`;

			const parts = splitMessagePayload({ t: text }, [], 2048);

			expect(parts).toHaveLength(2);
			expect(parts[0].content.t).toBe(`${p1}\n\n${p2}`);
			expect(parts[1].content.t).toBe(p3);
		});

		it('consumes a whole run of whitespace-only blank lines between paragraphs', () => {
			const p1 = 'a'.repeat(12);
			const p2 = 'b'.repeat(12);
			const text = `${p1}\n  \n\t\n\r\n${p2}`;

			const parts = splitMessagePayload({ t: text }, [], 20);

			expect(parts.map((part) => part.content.t)).toEqual([p1, p2]);
		});

		it('cuts a single paragraph exceeding the limit at the last single newline', () => {
			const line1 = 'a'.repeat(1200);
			const line2 = 'b'.repeat(1200);
			const text = `${line1}\n${line2}`;

			const parts = splitMessagePayload({ t: text }, [], 2048);

			expect(parts.map((part) => part.content.t)).toEqual([line1, line2]);
		});

		it('cuts at the last space or tab when there is no newline in the window', () => {
			const words1 = `${'w'.repeat(1500)} ${'x'.repeat(300)}`;
			const words2 = 'y'.repeat(600);
			const text = `${words1}\t${words2}`;

			const parts = splitMessagePayload({ t: text }, [], 2048);

			expect(parts.map((part) => part.content.t)).toEqual([words1, words2]);
		});

		it('hard-cuts when there is no whitespace, never splits surrogate pairs, and counts limit in code points', () => {
			const exactEmojis = '😀'.repeat(2048);
			expect(splitMessagePayload({ t: exactEmojis }, [], 2048, Number.POSITIVE_INFINITY)).toHaveLength(1);

			const overEmojis = '😀'.repeat(2049);
			const parts = splitMessagePayload({ t: overEmojis }, [], 2048, Number.POSITIVE_INFINITY);

			expect(parts).toHaveLength(2);
			expect(countMessageChars(parts[0].content.t ?? '')).toBe(2048);
			expect(countMessageChars(parts[1].content.t ?? '')).toBe(1);
			expect(parts[0].content.t).toBe('😀'.repeat(2048));
			expect(parts[1].content.t).toBe('😀');
			expect(parts[0].content.t?.isWellFormed?.() ?? true).toBe(true);
			expect(parts[1].content.t?.isWellFormed?.() ?? true).toBe(true);

			const byteCappedParts = splitMessagePayload({ t: exactEmojis }, [], 2048);
			expect(byteCappedParts.length).toBeGreaterThan(1);
			for (const part of byteCappedParts) {
				expect(Buffer.byteLength(JSON.stringify({ ...part.content, mentions: part.mentions }), 'utf8')).toBeLessThanOrEqual(
					MESSAGE_MAX_PART_BYTES
				);
				expect(part.content.t?.isWellFormed?.() ?? true).toBe(true);
			}
			expect(byteCappedParts.map((part) => part.content.t).join('')).toBe(exactEmojis);
		});

		it('moves a mention crossing the cut whole to the next part and rebases both mentions and content.mentions offsets', () => {
			const prefix = 'hello';
			const mentionText = '@alice_wonder';
			const suffix = ' ok';
			const text = `${prefix}${mentionText}${suffix}`;
			const mentionStart = prefix.length;
			const mentionEnd = mentionStart + mentionText.length;

			const content = {
				t: text,
				mentions: [{ user_id: 'u1', s: mentionStart, e: mentionEnd }]
			} as IMessageSendPayload & { mentions: Array<{ user_id: string; s: number; e: number }> };
			const mentions = [{ user_id: 'u1', s: mentionStart, e: mentionEnd }];

			const parts = splitMessagePayload(content, mentions, 16);

			expect(parts).toHaveLength(2);
			expect(parts[0].content.t).toBe('hello');
			expect(parts[0].mentions).toEqual([]);
			expect((parts[0].content as typeof content).mentions).toBeUndefined();

			expect(parts[1].content.t).toBe(`${mentionText}${suffix}`);
			expect(parts[1].mentions).toEqual([{ user_id: 'u1', s: 0, e: mentionText.length }]);
			expect((parts[1].content as typeof content).mentions).toEqual([{ user_id: 'u1', s: 0, e: mentionText.length }]);
		});

		it('keeps an atomic entity whole even if it exceeds the limit on its own', () => {
			const longMention = `@${'m'.repeat(30)}`;
			const text = `${longMention} tail`;
			const mentions = [{ user_id: 'u1', s: 0, e: longMention.length }];

			const parts = splitMessagePayload({ t: text }, mentions, 10);

			expect(parts).toHaveLength(2);
			expect(parts[0].content.t).toBe(longMention);
			expect(parts[0].mentions).toEqual([{ user_id: 'u1', s: 0, e: longMention.length }]);
			expect(parts[1].content.t).toBe(' tail');
			expect(parts[1].mentions).toEqual([]);
		});

		it('keeps hashtags, emojis, and link entities whole across cuts and rebases their offsets', () => {
			const prefix = 'prefix ';
			const hashtag = '#general-chat';
			const mid = ' mid ';
			const emoji = ':party_blob:';
			const tail = ' end https://example.com/path';
			const text = `${prefix}${hashtag}${mid}${emoji}${tail}`;

			const hgStart = prefix.length;
			const hgEnd = hgStart + hashtag.length;
			const ejStart = hgEnd + mid.length;
			const ejEnd = ejStart + emoji.length;
			const lkStart = text.indexOf('https://');
			const lkEnd = text.length;

			const payload: IMessageSendPayload = {
				t: text,
				hg: [{ s: hgStart, e: hgEnd, channelId: 'ch1' }],
				ej: [{ s: ejStart, e: ejEnd, emojiid: 'em1' }],
				lk: [{ s: lkStart, e: lkEnd }],
				vk: [{ s: lkStart, e: lkEnd }],
				mk: [{ s: lkStart, e: lkEnd, type: EBacktickType.LINK }]
			};

			const parts = splitMessagePayload(payload, [], 15);

			const joined = parts.map((p) => p.content.t ?? '').join('|');
			expect(joined).toContain(hashtag);
			expect(joined).toContain(emoji);
			expect(joined).toContain('https://example.com/path');

			const hgPart = parts.find((p) => p.content.hg?.length);
			const hgEntity = hgPart?.content.hg?.[0];
			expect(hgEntity).toBeDefined();
			expect(hgPart?.content.t?.slice(hgEntity?.s, hgEntity?.e)).toBe(hashtag);

			const ejPart = parts.find((p) => p.content.ej?.length);
			const ejEntity = ejPart?.content.ej?.[0];
			expect(ejEntity).toBeDefined();
			expect(ejPart?.content.t?.slice(ejEntity?.s, ejEntity?.e)).toBe(emoji);

			const lkPart = parts.find((p) => p.content.lk?.length);
			const lkEntity = lkPart?.content.lk?.[0];
			expect(lkEntity).toBeDefined();
			expect(lkPart?.content.t?.slice(lkEntity?.s, lkEntity?.e)).toBe('https://example.com/path');
			expect(lkPart?.content.vk).toEqual(lkPart?.content.lk);
			expect(lkPart?.content.mk).toEqual([{ s: lkEntity?.s, e: lkEntity?.e, type: EBacktickType.LINK }]);
		});

		it('clips formatting mk (bold, pre with language) into each part, keeps language, and drops zero-length entries', () => {
			const part1 = 'alpha bold';
			const part2 = 'beta bold';
			const text = `${part1}\n${part2}`;
			const payload: IMessageSendPayload = {
				t: text,
				mk: [
					{ s: 0, e: text.length, type: EBacktickType.BOLD },
					{ s: 0, e: text.length, type: EBacktickType.PRE, language: 'typescript' },
					{ s: 0, e: 5, type: EBacktickType.ITALIC }
				]
			};

			const parts = splitMessagePayload(payload, [], 12);

			expect(parts).toHaveLength(2);
			expect(parts[0].content.t).toBe(part1);
			expect(parts[0].content.mk).toEqual([
				{ s: 0, e: part1.length, type: EBacktickType.BOLD },
				{ s: 0, e: part1.length, type: EBacktickType.PRE, language: 'typescript' },
				{ s: 0, e: 5, type: EBacktickType.ITALIC }
			]);

			expect(parts[1].content.t).toBe(part2);
			expect(parts[1].content.mk).toEqual([
				{ s: 0, e: part2.length, type: EBacktickType.BOLD },
				{ s: 0, e: part2.length, type: EBacktickType.PRE }
			]);
		});

		it('splits 2000 chars of Vietnamese text with diacritics so each part JSON fits within MESSAGE_MAX_PART_BYTES', () => {
			const input = 'đẹp đẽ ửng đỏ ươm ướt ầm ĩ ếch ộp ủ rũ '.repeat(55).slice(0, 2000).trim();
			expect(countMessageChars(input)).toBeLessThanOrEqual(2048);
			expect(Buffer.byteLength(input, 'utf8')).toBeGreaterThan(MESSAGE_MAX_PART_BYTES);

			const parts = splitMessagePayload({ t: input }, [], 2048);

			expect(parts.length).toBeGreaterThan(1);
			for (const part of parts) {
				expect(Buffer.byteLength(JSON.stringify({ ...part.content, mentions: part.mentions }), 'utf8')).toBeLessThanOrEqual(
					MESSAGE_MAX_PART_BYTES
				);
			}
			expect(parts.map((part) => part.content.t).join(' ')).toBe(input);
			for (const part of parts.slice(0, -1)) {
				expect(Buffer.byteLength(part.content.t ?? '', 'utf8')).toBeGreaterThan(MESSAGE_MAX_PART_BYTES / 2);
			}
		});

		it('splits 4096 ASCII chars with Pro limit 4096 into parts within MESSAGE_MAX_PART_BYTES and keeps short messages as one identical object', () => {
			const shortPayload: IMessageSendPayload = { t: 'hello world' };
			const shortParts = splitMessagePayload(shortPayload, [], 4096);
			expect(shortParts).toHaveLength(1);
			expect(shortParts[0].content).toBe(shortPayload);

			const proInput = 'a'.repeat(4096);
			const proParts = splitMessagePayload({ t: proInput }, [], 4096);

			expect(proParts.length).toBeGreaterThanOrEqual(2);
			for (const part of proParts) {
				expect(Buffer.byteLength(JSON.stringify({ ...part.content, mentions: part.mentions }), 'utf8')).toBeLessThanOrEqual(
					MESSAGE_MAX_PART_BYTES
				);
			}
			expect(proParts.map((part) => part.content.t).join('')).toBe(proInput);
		});

		it('re-splits parts with heavy entities to fit MESSAGE_MAX_PART_BYTES and keeps an oversized single atomic entity intact', () => {
			const words = Array.from({ length: 80 }, (_, index) => `@user_${String(index).padStart(3, '0')}`);
			const text = words.join(' ');
			const mentions: Array<{ user_id: string; s: number; e: number }> = [];
			let cursor = 0;
			for (const word of words) {
				mentions.push({ user_id: `uid_${cursor}_very_long_identifier`, s: cursor, e: cursor + word.length });
				cursor += word.length + 1;
			}

			const parts = splitMessagePayload({ t: text }, mentions, 2048);
			expect(parts.length).toBeGreaterThan(1);
			for (const part of parts) {
				expect(Buffer.byteLength(JSON.stringify({ ...part.content, mentions: part.mentions }), 'utf8')).toBeLessThanOrEqual(
					MESSAGE_MAX_PART_BYTES
				);
			}

			const singleHugeMention = `@${'m'.repeat(3500)}`;
			const oversizedParts = splitMessagePayload({ t: singleHugeMention }, [{ user_id: 'u1', s: 0, e: singleHugeMention.length }], 4096);
			expect(oversizedParts).toHaveLength(1);
			expect(oversizedParts[0].content.t).toBe(singleHugeMention);
		});

		it('copies cvtt to every part and copies other payload fields to the first part only', () => {
			const text = `${'a'.repeat(15)}\n${'b'.repeat(15)}`;
			const cvtt = { canvas1: 'Spec Doc' };
			const embed = [{ title: 'Card' }];
			const payload: IMessageSendPayload = {
				t: text,
				cvtt,
				embed,
				e2ee: 1
			};

			const parts = splitMessagePayload(payload, [], 20);

			expect(parts).toHaveLength(2);
			expect(parts[0].content.cvtt).toEqual(cvtt);
			expect(parts[1].content.cvtt).toEqual(cvtt);
			expect(parts[0].content.embed).toEqual(embed);
			expect(parts[0].content.e2ee).toBe(1);
			expect(parts[1].content.embed).toBeUndefined();
			expect(parts[1].content.e2ee).toBeUndefined();
		});

		it('drops whitespace-only parts when splitting over the limit', () => {
			expect(splitMessageRanges('   \n\n   \t  ', 4)).toEqual([]);

			const parts = splitMessagePayload({ t: 'hello world\n\n     ' }, [], 12);
			expect(parts.map((part) => part.content.t)).toEqual(['hello world']);
		});

		it('does not split inside ZWJ emoji sequences on hard cuts', () => {
			const familyEmoji = '👨‍👩‍👧';
			const text = familyEmoji.repeat(2100);

			const parts = splitMessagePayload({ t: text }, [], 2048, Number.POSITIVE_INFINITY);

			expect(parts.length).toBeGreaterThan(1);
			for (const part of parts) {
				const partText = part.content.t ?? '';
				expect(partText.startsWith('\u200d')).toBe(false);
				expect(partText.endsWith('\u200d')).toBe(false);
				expect(partText.isWellFormed?.() ?? true).toBe(true);
			}
			expect(parts.map((part) => part.content.t).join('')).toBe(text);
		});

		it('drops trailing carriage return when breaking at CRLF newlines', () => {
			const text = `${'a'.repeat(1500)}\r\n${'b'.repeat(1000)}`;

			const parts = splitMessagePayload({ t: text }, [], 2048);

			expect(parts.map((part) => part.content.t)).toEqual(['a'.repeat(1500), 'b'.repeat(1000)]);
			expect(parts[0].content.t?.endsWith('\r')).toBe(false);
		});
	});
});
