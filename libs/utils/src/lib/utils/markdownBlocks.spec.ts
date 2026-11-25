import { findBlockEscapes, findMarkdownBlockLines, findNamedLinks, isMarkdownBlockLine } from './markdownBlocks';

describe('findMarkdownBlockLines', () => {
	it('detects ul, ol, and quote lines including nesting depth', () => {
		const text = [
			'- alpha',
			'  * nested-1',
			'    - nested-2',
			'      * nested-3',
			'        - clamped',
			'1. first',
			'  12) second',
			'> quoted',
			'>tight'
		].join('\n');
		const blocks = findMarkdownBlockLines(text, []);
		expect(blocks).toEqual([
			{ lineStart: 0, lineEnd: 7, markerStart: 0, contentStart: 2, kind: 'ul', depth: 0, marker: '•' },
			{ lineStart: 8, lineEnd: 20, markerStart: 10, contentStart: 12, kind: 'ul', depth: 1, marker: '•' },
			{ lineStart: 21, lineEnd: 35, markerStart: 25, contentStart: 27, kind: 'ul', depth: 2, marker: '•' },
			{ lineStart: 36, lineEnd: 52, markerStart: 42, contentStart: 44, kind: 'ul', depth: 3, marker: '•' },
			{ lineStart: 53, lineEnd: 70, markerStart: 61, contentStart: 63, kind: 'ul', depth: 3, marker: '•' },
			{ lineStart: 71, lineEnd: 79, markerStart: 71, contentStart: 74, kind: 'ol', depth: 0, marker: '1.' },
			{ lineStart: 80, lineEnd: 92, markerStart: 82, contentStart: 86, kind: 'ol', depth: 1, marker: '12)' },
			{ lineStart: 93, lineEnd: 101, markerStart: 93, contentStart: 95, kind: 'quote', depth: 0, marker: '' },
			{ lineStart: 102, lineEnd: 108, markerStart: 102, contentStart: 103, kind: 'quote', depth: 0, marker: '' }
		]);
	});

	it('does not match ***x***, -x, *x*, 1.x, --, or bare >', () => {
		const text = ['***x***', '-x', '*x*', '1.x', '--', '>', '>   ', '-   ', '1.   '].join('\n');
		expect(findMarkdownBlockLines(text, [])).toEqual([]);
	});

	it('detects ---, ***, ___ and - - - as horizontal rules before lists', () => {
		const text = ['---', '***', ' ___ ', '- - -', '-----'].join('\n');
		expect(findMarkdownBlockLines(text, []).map((block) => [block.kind, text.slice(block.lineStart, block.lineEnd)])).toEqual([
			['hr', '---'],
			['hr', '***'],
			['hr', ' ___ '],
			['hr', '- - -'],
			['hr', '-----']
		]);
	});

	it('detects task items with their checked state and keeps the box out of the content', () => {
		const text = '- [ ] todo\n  * [x] done\n- [X] caps\n- [] not a task';
		expect(findMarkdownBlockLines(text, [])).toEqual([
			{ lineStart: 0, lineEnd: 10, markerStart: 0, contentStart: 6, kind: 'ul', depth: 0, marker: '', checked: false },
			{ lineStart: 11, lineEnd: 23, markerStart: 13, contentStart: 19, kind: 'ul', depth: 1, marker: '', checked: true },
			{ lineStart: 24, lineEnd: 34, markerStart: 24, contentStart: 30, kind: 'ul', depth: 0, marker: '', checked: true },
			{ lineStart: 35, lineEnd: 50, markerStart: 35, contentStart: 37, kind: 'ul', depth: 0, marker: '•' }
		]);
	});

	it('detects a table with alignment, escaped pipes, missing trailing pipes and stops at the first non-row line', () => {
		const text = ['intro', '| Name | Qty | Note |', '|:-----|----:|:---:|', '| a \\| b | 1 | |', '| `x|y` | 22', 'after'].join('\n');
		const code = { s: text.indexOf('`x|y`'), e: text.indexOf('`x|y`') + 5 };
		const [table] = findMarkdownBlockLines(text, [code]);
		expect(table.kind).toBe('table');
		expect(text.slice(table.lineStart, table.lineEnd)).toBe(text.split('\n').slice(1, 5).join('\n'));
		expect(table.align).toEqual(['left', 'right', 'center']);
		expect(table.rows?.map((row) => row.map((cell) => text.slice(cell.s, cell.e)))).toEqual([
			['Name', 'Qty', 'Note'],
			['a \\| b', '1', ''],
			['`x|y`', '22']
		]);
	});

	it('rejects tables without a matching delimiter row or a leading pipe', () => {
		expect(findMarkdownBlockLines('| a | b |\n| --- |', [])).toEqual([]);
		expect(findMarkdownBlockLines('a | b\n--- | ---', [])).toEqual([]);
		expect(findMarkdownBlockLines('| a | b |\nplain', [])).toEqual([]);
	});

	it('skips lines inside a code block or multiline element and markers covered by inline code', () => {
		const codeBlock = '```\n- inside\n> quoted\n1. num\n```';
		expect(findMarkdownBlockLines(codeBlock, [{ s: 0, e: codeBlock.length }])).toEqual([]);

		const opensFence = '- start ```\nbody\n```';
		expect(findMarkdownBlockLines(opensFence, [{ s: 8, e: opensFence.length }])).toEqual([]);

		const inlineCodeMarker = '`- ` hello';
		expect(findMarkdownBlockLines(inlineCodeMarker, [{ s: 0, e: 4 }])).toEqual([]);

		const inlineCodeOverMarker = '- hello';
		expect(findMarkdownBlockLines(inlineCodeOverMarker, [{ s: 0, e: 2 }])).toEqual([]);
	});

	it('keeps a line as a block when a mention starts right after the marker', () => {
		const text = '- @alice hi\n> @bob yo\n1. @carol';
		const occupied = [
			{ s: 2, e: 8 },
			{ s: 14, e: 18 },
			{ s: 25, e: 31 }
		];
		expect(findMarkdownBlockLines(text, occupied)).toEqual([
			{ lineStart: 0, lineEnd: 11, markerStart: 0, contentStart: 2, kind: 'ul', depth: 0, marker: '•' },
			{ lineStart: 12, lineEnd: 21, markerStart: 12, contentStart: 14, kind: 'quote', depth: 0, marker: '' },
			{ lineStart: 22, lineEnd: 31, markerStart: 22, contentStart: 25, kind: 'ol', depth: 0, marker: '1.' }
		]);
	});
});

describe('findNamedLinks', () => {
	it('finds basic named links and labels with spaces', () => {
		const basic = '[Mezon](https://mezon.ai)';
		const basicLink = { s: 8, e: 24 };
		expect(Array.from(findNamedLinks(basic, [basicLink], [basicLink]).entries())).toEqual([
			[8, { open: 0, labelStart: 1, labelEnd: 6, urlStart: 8, urlEnd: 24, close: 24 }]
		]);

		const spaced = 'see [Mezon docs here](http://mezon.ai/docs) now';
		const urlStart = spaced.indexOf('http://mezon.ai/docs');
		const urlEnd = urlStart + 'http://mezon.ai/docs'.length;
		const spacedLink = { s: urlStart, e: urlEnd };
		expect(Array.from(findNamedLinks(spaced, [spacedLink], [spacedLink]).entries())).toEqual([
			[
				urlStart,
				{
					open: 4,
					labelStart: 5,
					labelEnd: 20,
					urlStart,
					urlEnd,
					close: urlEnd
				}
			]
		]);
	});

	it('rejects non-http(s) URLs, URL-like labels, empty labels, and unclosed links', () => {
		const ftp = '[file](ftp://example.com)';
		const ftpLink = { s: 7, e: 24 };
		expect(findNamedLinks(ftp, [ftpLink], [ftpLink]).size).toBe(0);

		const spoofHttps = '[https://evil.example](https://mezon.ai)';
		const spoofHttpsLink = { s: spoofHttps.indexOf('https://mezon.ai'), e: spoofHttps.length - 1 };
		expect(findNamedLinks(spoofHttps, [spoofHttpsLink], [spoofHttpsLink]).size).toBe(0);

		const spoofWww = '[ www.evil.example ](https://mezon.ai)';
		const spoofWwwLink = { s: spoofWww.indexOf('https://mezon.ai'), e: spoofWww.length - 1 };
		expect(findNamedLinks(spoofWww, [spoofWwwLink], [spoofWwwLink]).size).toBe(0);

		const emptyLabel = '[   ](https://mezon.ai)';
		const emptyLabelLink = { s: emptyLabel.indexOf('https://mezon.ai'), e: emptyLabel.length - 1 };
		expect(findNamedLinks(emptyLabel, [emptyLabelLink], [emptyLabelLink]).size).toBe(0);

		const unclosed = '[a](https://mezon.ai';
		const unclosedLink = { s: 4, e: unclosed.length };
		expect(findNamedLinks(unclosed, [unclosedLink], [unclosedLink]).size).toBe(0);
	});

	it('marks ![alt](url) as an image that starts at the !, and allows an empty alt', () => {
		const text = 'see ![a cat](https://x.example/cat.png) and ![](https://x.example/b.png)';
		const s1 = text.indexOf('https://x.example/cat.png');
		const e1 = s1 + 'https://x.example/cat.png'.length;
		const s2 = text.indexOf('https://x.example/b.png');
		const e2 = s2 + 'https://x.example/b.png'.length;
		const links = [
			{ s: s1, e: e1 },
			{ s: s2, e: e2 }
		];
		const found = findNamedLinks(text, links, links);
		expect(found.get(s1)).toEqual({ open: 4, labelStart: 6, labelEnd: 11, urlStart: s1, urlEnd: e1, close: e1, image: true });
		expect(found.get(s2)).toEqual({ open: s2 - 4, labelStart: s2 - 2, labelEnd: s2 - 2, urlStart: s2, urlEnd: e2, close: e2, image: true });
	});

	it('rejects a named link whose label overlaps a mention or other occupied range', () => {
		const text = 'hi [@alice](https://mezon.ai) ok';
		const urlStart = text.indexOf('https://mezon.ai');
		const urlEnd = urlStart + 'https://mezon.ai'.length;
		const link = { s: urlStart, e: urlEnd };
		const mention = { s: 4, e: 10 };
		expect(findNamedLinks(text, [link], [mention, link]).size).toBe(0);
	});

	it('finds two named links on the same line', () => {
		const text = 'go to [one](https://one.example) and [two words](https://two.example)!';
		const s1 = text.indexOf('https://one.example');
		const e1 = s1 + 'https://one.example'.length;
		const s2 = text.indexOf('https://two.example');
		const e2 = s2 + 'https://two.example'.length;
		const links = [
			{ s: s1, e: e1 },
			{ s: s2, e: e2 }
		];
		const found = findNamedLinks(text, links, links);
		expect(found.size).toBe(2);
		expect(found.get(s1)).toEqual({
			open: 6,
			labelStart: 7,
			labelEnd: 10,
			urlStart: s1,
			urlEnd: e1,
			close: e1
		});
		expect(found.get(s2)).toEqual({
			open: 37,
			labelStart: 38,
			labelEnd: 47,
			urlStart: s2,
			urlEnd: e2,
			close: e2
		});
	});
});

describe('block escapes', () => {
	it('recognizes lines that would render as a heading, list, quote, rule or table', () => {
		['# a', '- a', '* a', '1. a', '2) a', '> a', '---', '***', '_ _ _', '| a |'].forEach((line) => expect(isMarkdownBlockLine(line)).toBe(true));
		['#a', '-a', '||a||', 'text', '*a*', '>'].forEach((line) => expect(isMarkdownBlockLine(line)).toBe(false));
	});

	it('finds backslashes that escape a block marker at a line start or block content start', () => {
		const t = ['\\# a', '\\- b', '\\1. c', '\\> d', '\\---', '\\| e |', '\\#tag', 'x \\- y', '- \\[ ] f', '> \\# g', '  \\* h'].join('\n');
		const at = (line: string, offset = 0) => t.indexOf(line) + offset;
		expect(findBlockEscapes(t, findMarkdownBlockLines(t, []))).toEqual([
			at('\\# a'),
			at('\\- b'),
			at('\\1. c'),
			at('\\> d'),
			at('\\---'),
			at('\\| e |'),
			at('- \\[ ] f', 2),
			at('> \\# g', 2),
			at('  \\* h', 2)
		]);
	});
});
