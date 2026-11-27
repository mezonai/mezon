import { EBacktickType } from '../types/messageLine';
import { convertMessageToHtml } from './convertMessageToHtml';
import { escapeInlineStyles, escapeMatchedInlineStyles, extractInlineStyles, styleAt, styleSegments } from './inlineMarkdownStyles';
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

	it('parses __u__, ___ui___, ||sp|| and spoilers around other styles', () => {
		expect(extractInlineStyles('__u__ ___ui___ ||sp||', [])).toEqual({
			text: 'u ui sp',
			entities: [
				{ type: 'MessageEntityUnderline', offset: 0, length: 1 },
				{ type: 'MessageEntityUnderline', offset: 2, length: 2 },
				{ type: 'MessageEntityItalic', offset: 2, length: 2 },
				{ type: 'MessageEntitySpoiler', offset: 5, length: 2 }
			]
		});
		expect(extractInlineStyles('||a **b** __c__||', [])).toEqual({
			text: 'a b c',
			entities: [
				{ type: 'MessageEntitySpoiler', offset: 0, length: 5 },
				{ type: 'MessageEntityBold', offset: 2, length: 1 },
				{ type: 'MessageEntityUnderline', offset: 4, length: 1 }
			]
		});
		expect(extractInlineStyles('gạch__chân__ and a||b||c', [])).toEqual({
			text: 'gạchchân and abc',
			entities: [
				{ type: 'MessageEntityUnderline', offset: 4, length: 4 },
				{ type: 'MessageEntitySpoiler', offset: 14, length: 1 }
			]
		});
	});

	it('leaves a || b, ||| x |||, | a || b | table cells, and an unclosed __x untouched', () => {
		expect(extractInlineStyles('a || b', [])).toEqual({ text: 'a || b', entities: [] });
		expect(extractInlineStyles('|||x|||', [])).toEqual({ text: '|||x|||', entities: [] });
		expect(extractInlineStyles('| a || b |', [])).toEqual({ text: '| a || b |', entities: [] });
		expect(extractInlineStyles('__x and y', [])).toEqual({ text: '__x and y', entities: [] });
	});

	it('leaves snake_case_name, * bullet, ** x**, multiline, and Code entities untouched', () => {
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
		const plain = { underline: false, spoiler: -1 };
		expect(segments).toEqual([
			{ s: 0, e: 2, bold: true, italic: false, strike: false, ...plain },
			{ s: 2, e: 6, bold: true, italic: false, strike: true, ...plain },
			{ s: 6, e: 8, bold: true, italic: true, strike: true, ...plain },
			{ s: 8, e: 11, bold: true, italic: true, strike: false, ...plain },
			{ s: 11, e: 12, bold: false, italic: false, strike: false, ...plain }
		]);
		expect(styleAt(tokens, 6, 8)).toEqual({ bold: true, italic: true, strike: true, ...plain });
	});

	it('splits underline and keeps each spoiler identified by its start', () => {
		const tokens = [
			{ type: EBacktickType.UNDERLINE, s: 0, e: 4 },
			{ type: EBacktickType.SPOILER, s: 2, e: 6 },
			{ type: EBacktickType.SPOILER, s: 6, e: 8 }
		];
		const base = { bold: false, italic: false, strike: false };
		expect(styleSegments(tokens, 0, 8)).toEqual([
			{ s: 0, e: 2, ...base, underline: true, spoiler: -1 },
			{ s: 2, e: 4, ...base, underline: true, spoiler: 2 },
			{ s: 4, e: 6, ...base, underline: false, spoiler: 2 },
			{ s: 6, e: 8, ...base, underline: false, spoiler: 6 }
		]);
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

	it('round-trips underline and spoiler, with the spoiler outside other styles', () => {
		const mixed = roundTripPlain({
			t: 'secret under word',
			mk: [
				{ type: EBacktickType.SPOILER, s: 0, e: 6 },
				{ type: EBacktickType.BOLD, s: 0, e: 6 },
				{ type: EBacktickType.UNDERLINE, s: 7, e: 12 },
				{ type: EBacktickType.ITALIC, s: 7, e: 12 }
			]
		});
		expect(mixed.html).toBe('||**secret**|| __*under*__ word');
		expect(mixed.text).toBe('secret under word');
		expect(mixed.mk).toEqual([
			{ type: EBacktickType.SPOILER, s: 0, e: 6 },
			{ type: EBacktickType.BOLD, s: 0, e: 6 },
			{ type: EBacktickType.UNDERLINE, s: 7, e: 12 },
			{ type: EBacktickType.ITALIC, s: 7, e: 12 }
		]);

		const literal = roundTripPlain({ t: 'a||b||c and x || y', mk: [] });
		expect(literal.html).toBe('a\\|\\|b\\|\\|c and x || y');
		expect(literal.text).toBe('a||b||c and x || y');
		expect(literal.mk).toEqual([]);
	});

	it('round-trips literal markers in the text as escapes', () => {
		const html = convertMessageToHtml({ t: '5*2=10, 3*4=12 bold', mk: [{ type: EBacktickType.BOLD, s: 15, e: 19 }] });
		expect(html).toBe('5\\*2=10, 3\\*4=12 **bold**');
		expect(extractInlineStyles(html, [])).toEqual({
			text: '5*2=10, 3*4=12 bold',
			entities: [{ type: 'MessageEntityBold', offset: 15, length: 4 }]
		});
	});
});

describe('style escapes', () => {
	it('keeps escaped markers literal and drops the backslash outside protected entities', () => {
		expect(extractInlineStyles('5\\*2=10, 3\\*4=12', [])).toEqual({ text: '5*2=10, 3*4=12', entities: [] });
		expect(extractInlineStyles('**5\\*2**', [])).toEqual({
			text: '5*2',
			entities: [{ type: 'MessageEntityBold', offset: 0, length: 3 }]
		});
		expect(extractInlineStyles('\\_a\\_ \\~\\~b\\~\\~', [])).toEqual({ text: '_a_ ~~b~~', entities: [] });
		expect(extractInlineStyles('a\\*b', [{ type: 'MessageEntityCode', offset: 1, length: 2 }])).toEqual({
			text: 'a\\*b',
			entities: [{ type: 'MessageEntityCode', offset: 1, length: 2 }]
		});
	});

	it('escapes only markers that could be parsed and leaves URLs alone', () => {
		expect(escapeInlineStyles('5*2=10, 3*4=12')).toBe('5\\*2=10, 3\\*4=12');
		expect(escapeInlineStyles('snake_case a * b ~5 _x_')).toBe('snake_case a * b ~5 \\_x\\_');
		expect(escapeInlineStyles('~~x~~ see https://x.com/~a_b*c')).toBe('\\~\\~x\\~\\~ see https://x.com/~a_b*c');
		expect(escapeInlineStyles('__init__ ||x|| a || b | c ||| d https://x.com/a||b')).toBe(
			'\\_\\_init\\_\\_ \\|\\|x\\|\\| a || b | c ||| d https://x.com/a||b'
		);
	});

	it('treats \\| as an escape only next to another pipe, and keeps it on table rows where the renderer splits cells', () => {
		expect(extractInlineStyles('\\|\\|x\\|\\|', [])).toEqual({ text: '||x||', entities: [] });
		expect(extractInlineStyles("grep 'a\\|b' file", [])).toEqual({ text: "grep 'a\\|b' file", entities: [] });
		expect(extractInlineStyles('| a \\| b | \\*c\\* |\nx \\| y', [])).toEqual({ text: '| a \\| b | *c* |\nx \\| y', entities: [] });
		expect(extractInlineStyles('| \\|\\|x\\|\\| | y |', [])).toEqual({ text: '| \\|\\|x\\|\\| | y |', entities: [] });
	});

	it('keeps a line-start backslash when dropping it would turn the line into a list, rule or table', () => {
		const keep = ['\\* item', '\\***', '  \\* nested', 'a\n\\* b', '\\| a | b |'];
		keep.forEach((text) => expect(extractInlineStyles(text, [])).toEqual({ text, entities: [] }));
		expect(extractInlineStyles('\\*\\*\\*', [])).toEqual({ text: '\\***', entities: [] });
		expect(extractInlineStyles('\\_\\_\\_', [])).toEqual({ text: '\\___', entities: [] });
		expect(extractInlineStyles('\\*not italic*', [])).toEqual({ text: '*not italic*', entities: [] });
		expect(extractInlineStyles('x \\* y', [])).toEqual({ text: 'x * y', entities: [] });
		expect(extractInlineStyles('\\* **bold**', [])).toEqual({
			text: '\\* bold',
			entities: [{ type: 'MessageEntityBold', offset: 3, length: 4 }]
		});
	});

	it('leaves line-start list and rule markers unescaped when converting a message back for editing', () => {
		const toText = (html: string) => html.replace(/<br>/g, '\n').replace(/&nbsp;/g, ' ');
		const t = 'x\n* a\n  * b\n***\n___\n\\* literal\n\\***';
		const html = convertMessageToHtml({ t, mk: [] });
		expect(toText(html)).toBe('x\n* a\n  * b\n*\\*\\*\n_\\_\\_\n\\\\* literal\n\\\\*\\*\\*');
		expect(extractInlineStyles(toText(html), [])).toEqual({ text: t, entities: [] });

		const styled = convertMessageToHtml({ t: '* bold item', mk: [{ type: EBacktickType.BOLD, s: 2, e: 6 }] });
		expect(styled).toBe('* **bold** item');
		expect(extractInlineStyles(styled, [])).toEqual({ text: '* bold item', entities: [{ type: 'MessageEntityBold', offset: 2, length: 4 }] });
	});
});

describe('escapeMatchedInlineStyles', () => {
	it('escapes only markers that would become styles', () => {
		expect(escapeMatchedInlineStyles('obj.__dict__ and def __init__(self):')).toBe('obj.\\_\\_dict\\_\\_ and def \\_\\_init\\_\\_(self):');
		expect(escapeMatchedInlineStyles('**bold** ~~st~~ ||sp|| _it_')).toBe('\\*\\*bold\\*\\* \\~\\~st\\~\\~ \\|\\|sp\\|\\| \\_it\\_');
		const untouched = '5*2=10, a * b, snake_case, ~5, x || y\n* item\n***';
		expect(escapeMatchedInlineStyles(untouched)).toBe(untouched);
	});

	it('keeps existing backslashes, code and URLs literal', () => {
		expect(escapeMatchedInlineStyles('C:\\_temp\\*.txt')).toBe('C:\\\\_temp\\\\*.txt');
		expect(escapeMatchedInlineStyles('`__x__` and https://a.com/__b__ and __c__')).toBe('`__x__` and https://a.com/__b__ and \\_\\_c\\_\\_');
		expect(escapeMatchedInlineStyles('```\n__x__\n```')).toBe('```\n__x__\n```');
	});

	it('does not double \\| that stays literal or sits on a table row', () => {
		const table = '| a | b |\n|---|---|\n| x \\| y | \\|\\|z\\|\\| |';
		expect(escapeMatchedInlineStyles(table)).toBe(table);
		expect(extractInlineStyles(escapeMatchedInlineStyles(table), [])).toEqual({ text: table, entities: [] });
		expect(escapeMatchedInlineStyles("grep 'a\\|b'")).toBe("grep 'a\\|b'");
	});

	it('sends back exactly the pasted text', () => {
		['obj.__dict__', '*a **b* c**', 'C:\\_temp\\*.txt', '**x** and __y__', '||a|| b ||c||', '\\* item', '__init__ = 1'].forEach((text) =>
			expect(extractInlineStyles(escapeMatchedInlineStyles(text), [])).toEqual({ text, entities: [] })
		);
	});
});
