import { findMarkdownBlockLines, findNamedLinks } from './markdownBlocks';

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

	it('does not match ---, ***x***, -x, *x*, 1.x, or bare >', () => {
		const text = ['---', '***', '***x***', '-x', '*x*', '1.x', '>', '>   ', '-   ', '1.   '].join('\n');
		expect(findMarkdownBlockLines(text, [])).toEqual([]);
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
