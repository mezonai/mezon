import { processText } from './detectTokenMessage';

jest.mock('../types', () => jest.requireActual('../types/messageLine'));

describe('processText links', () => {
	it('leaves out the close paren that wraps a link', () => {
		expect(processText('(https://www.youtube.com/)').links).toEqual([{ s: 1, e: 25 }]);
		expect(processText('(see https://a.com))').links).toEqual([{ s: 5, e: 18 }]);
		expect(processText('(https://www.youtube.com/).').links).toEqual([{ s: 1, e: 25 }]);
		expect(processText('((https://www.youtube.com/))').links).toEqual([{ s: 2, e: 26 }]);
	});

	it('keeps a close paren the link opened itself', () => {
		const url = 'https://en.wikipedia.org/wiki/Rust_(programming_language)';
		expect(processText(url).links).toEqual([{ s: 0, e: 57 }]);
		expect(processText(`(${url})`).links).toEqual([{ s: 1, e: 58 }]);
	});
});
