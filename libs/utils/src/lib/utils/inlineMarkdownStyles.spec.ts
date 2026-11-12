import { EBacktickType } from '../types/messageLine';
import { convertMessageToHtml } from './convertMessageToHtml';
import { extractInlineStyles, styleAt, styleSegments } from './inlineMarkdownStyles';
import { processEntitiesDirectly } from './processEntitiesDirectly';

jest.mock('../types', () => jest.requireActual('../types/messageLine'));

describe('extractInlineStyles', () => {
	it('parses *it*, _it_, ***bi***, ~~st~~, and keeps a single * between letters or digits as text', () => {
		expect(extractInlineStyles('*it*', [])).toEqual({
			text: 'it',
			entities: [{ type: 'MessageEntityItalic', offset: 0, length: 2 }]
		});

		expect(extractInlineStyles('_it_', [])).toEqual({
			text: 'it',
			entities: [{ type: 'MessageEntityItalic', offset: 0, length: 2 }]
		});

		expect(extractInlineStyles('***bi***', [])).toEqual({
			text: 'bi',
			entities: [
				{ type: 'MessageEntityBold', offset: 0, length: 2 },
				{ type: 'MessageEntityItalic', offset: 0, length: 2 }
			]
		});

		expect(extractInlineStyles('~~st~~', [])).toEqual({
			text: 'st',
			entities: [{ type: 'MessageEntityStrike', offset: 0, length: 2 }]
		});

		expect(extractInlineStyles('mid*word*s', [])).toEqual({ text: 'mid*word*s', entities: [] });
		expect(extractInlineStyles('5*2=10, 3*4=12', [])).toEqual({ text: '5*2=10, 3*4=12', entities: [] });
		expect(extractInlineStyles('foo*.rs, bar*.toml', [])).toEqual({ text: 'foo*.rs, bar*.toml', entities: [] });
		expect(extractInlineStyles('a *b*c d', [])).toEqual({ text: 'a *b*c d', entities: [] });
	});

	it('keeps bold between letters and lets a literal * live inside a bold run', () => {
		expect(extractInlineStyles('mid**word**bold', [])).toEqual({
			text: 'midwordbold',
			entities: [{ type: 'MessageEntityBold', offset: 3, length: 4 }]
		});
		expect(extractInlineStyles('**5*2=10**', [])).toEqual({
			text: '5*2=10',
			entities: [{ type: 'MessageEntityBold', offset: 0, length: 6 }]
		});
		expect(extractInlineStyles('see *this* and 2*3', [])).toEqual({
			text: 'see this and 2*3',
			entities: [{ type: 'MessageEntityItalic', offset: 4, length: 4 }]
		});
	});

	it('parses nested styles **a ~~b~~ c** and *a **b** c*', () => {
		expect(extractInlineStyles('**a ~~b~~ c**', [])).toEqual({
			text: 'a b c',
			entities: [
				{ type: 'MessageEntityBold', offset: 0, length: 5 },
				{ type: 'MessageEntityStrike', offset: 2, length: 1 }
			]
		});

		expect(extractInlineStyles('*a **b** c*', [])).toEqual({
			text: 'a b c',
			entities: [
				{ type: 'MessageEntityItalic', offset: 0, length: 5 },
				{ type: 'MessageEntityBold', offset: 2, length: 1 }
			]
		});
	});

	it('leaves snake_case_name, * bullet, ** x**, multiline, __x__, ||x||, and Code entities untouched', () => {
		expect(extractInlineStyles('snake_case_name', [])).toEqual({
			text: 'snake_case_name',
			entities: []
		});

		expect(extractInlineStyles('* bullet', [])).toEqual({
			text: '* bullet',
			entities: []
		});

		expect(extractInlineStyles('** x**', [])).toEqual({
			text: '** x**',
			entities: []
		});

		expect(extractInlineStyles('**a\nb**', [])).toEqual({
			text: '**a\nb**',
			entities: []
		});

		expect(extractInlineStyles('__x__ and ||y||', [])).toEqual({
			text: '__x__ and ||y||',
			entities: []
		});

		const codeEntities = [{ type: 'MessageEntityCode', offset: 0, length: 9 }];
		expect(extractInlineStyles('**hello**', codeEntities)).toEqual({
			text: '**hello**',
			entities: [{ type: 'MessageEntityCode', offset: 0, length: 9 }]
		});
	});

	it('wraps a MentionName entity inside **@alice hi** and shifts its offset', () => {
		const res = extractInlineStyles('**@alice hi**', [{ type: 'MessageEntityMentionName', offset: 2, length: 6, userId: 'u1' }]);
		expect(res).toEqual({
			text: '@alice hi',
			entities: [
				{ type: 'MessageEntityMentionName', offset: 0, length: 6, userId: 'u1' },
				{ type: 'MessageEntityBold', offset: 0, length: 9 }
			]
		});
	});

	it('shifts an entity after removed markers to the left', () => {
		const res = extractInlineStyles('**bold** @bob', [{ type: 'MessageEntityMentionName', offset: 9, length: 4, userId: 'u2' }]);
		expect(res).toEqual({
			text: 'bold @bob',
			entities: [
				{ type: 'MessageEntityMentionName', offset: 5, length: 4, userId: 'u2' },
				{ type: 'MessageEntityBold', offset: 0, length: 4 }
			]
		});
	});

	it('computes UTF-16 offsets with astral emoji before style pairs', () => {
		const res = extractInlineStyles('😀 *i* ~~s~~ ***bi***', []);
		expect(res).toEqual({
			text: '😀 i s bi',
			entities: [
				{ type: 'MessageEntityItalic', offset: 3, length: 1 },
				{ type: 'MessageEntityStrike', offset: 5, length: 1 },
				{ type: 'MessageEntityBold', offset: 7, length: 2 },
				{ type: 'MessageEntityItalic', offset: 7, length: 2 }
			]
		});
	});
});

describe('styleSegments and styleAt', () => {
	it('splits nested and overlapping styles without dropping or duplicating characters', () => {
		const text = 'hello world!';
		const tokens = [
			{ type: EBacktickType.BOLD, s: 0, e: 11 },
			{ type: EBacktickType.ITALIC, s: 6, e: 11 },
			{ type: EBacktickType.STRIKE, s: 2, e: 8 }
		];
		const segments = styleSegments(tokens, 0, text.length);
		const reconstructed = segments.map((seg) => text.slice(seg.s, seg.e)).join('');
		expect(reconstructed).toBe(text);
		expect(segments).toEqual([
			{ s: 0, e: 2, bold: true, italic: false, strike: false },
			{ s: 2, e: 6, bold: true, italic: false, strike: true },
			{ s: 6, e: 8, bold: true, italic: true, strike: true },
			{ s: 8, e: 11, bold: true, italic: true, strike: false },
			{ s: 11, e: 12, bold: false, italic: false, strike: false }
		]);
		expect(styleAt(tokens, 6, 8)).toEqual({ bold: true, italic: true, strike: true });
	});
});

describe('convertMessageToHtml round trip', () => {
	const roundTripPlain = (msg: { t: string; mk: Array<{ type: EBacktickType; s: number; e: number }> }) => {
		const html = convertMessageToHtml(msg);
		const extracted = extractInlineStyles(html, []);
		const processed = processEntitiesDirectly(extracted.entities, extracted.text, []);
		return { html, text: extracted.text, mk: processed.markdown };
	};

	it('round-trips b, i, st, b+i same range, and nested b containing st', () => {
		const boldOnly = roundTripPlain({
			t: 'bold',
			mk: [{ type: EBacktickType.BOLD, s: 0, e: 4 }]
		});
		expect(boldOnly.html).toBe('**bold**');
		expect(boldOnly.text).toBe('bold');
		expect(boldOnly.mk).toEqual([{ type: EBacktickType.BOLD, s: 0, e: 4 }]);

		const italicOnly = roundTripPlain({
			t: 'italic',
			mk: [{ type: EBacktickType.ITALIC, s: 0, e: 6 }]
		});
		expect(italicOnly.html).toBe('*italic*');
		expect(italicOnly.text).toBe('italic');
		expect(italicOnly.mk).toEqual([{ type: EBacktickType.ITALIC, s: 0, e: 6 }]);

		const strikeOnly = roundTripPlain({
			t: 'strike',
			mk: [{ type: EBacktickType.STRIKE, s: 0, e: 6 }]
		});
		expect(strikeOnly.html).toBe('~~strike~~');
		expect(strikeOnly.text).toBe('strike');
		expect(strikeOnly.mk).toEqual([{ type: EBacktickType.STRIKE, s: 0, e: 6 }]);

		const boldItalic = roundTripPlain({
			t: 'both',
			mk: [
				{ type: EBacktickType.BOLD, s: 0, e: 4 },
				{ type: EBacktickType.ITALIC, s: 0, e: 4 }
			]
		});
		expect(boldItalic.html).toBe('***both***');
		expect(boldItalic.text).toBe('both');
		expect(boldItalic.mk).toEqual([
			{ type: EBacktickType.BOLD, s: 0, e: 4 },
			{ type: EBacktickType.ITALIC, s: 0, e: 4 }
		]);

		const nested = roundTripPlain({
			t: 'a b c',
			mk: [
				{ type: EBacktickType.BOLD, s: 0, e: 5 },
				{ type: EBacktickType.STRIKE, s: 2, e: 3 }
			]
		});
		expect(nested.html).toBe('**a ~~b~~ c**');
		expect(nested.text).toBe('a b c');
		expect(nested.mk).toEqual([
			{ type: EBacktickType.BOLD, s: 0, e: 5 },
			{ type: EBacktickType.STRIKE, s: 2, e: 3 }
		]);
	});

	it('round-trips a style over a mention without dropping or duplicating text', () => {
		const html = convertMessageToHtml({
			t: '@alice hi',
			mentions: [{ user_id: 'u1', s: 0, e: 6 }],
			mk: [{ type: EBacktickType.BOLD, s: 0, e: 9 }]
		});
		expect(html).toBe(
			'**<a class="text-entity-link mention" data-entity-type="MessageEntityMentionName" data-user-id="u1" contenteditable="false" dir="auto">@alice</a> hi**'
		);

		const extracted = extractInlineStyles('**@alice hi**', [{ type: 'MessageEntityMentionName', offset: 2, length: 6, userId: 'u1' }]);
		const processed = processEntitiesDirectly(extracted.entities, extracted.text, []);
		expect(extracted.text).toBe('@alice hi');
		expect(processed.mentions).toEqual([{ user_id: 'u1', s: 0, e: 6, display: '@alice', role_id: undefined }]);
		expect(processed.markdown).toEqual([{ type: EBacktickType.BOLD, s: 0, e: 9 }]);
	});
});
