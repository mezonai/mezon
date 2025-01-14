import { EBacktickType, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage } from '../types';
export const processSingleBacktick = (inputString: string, excludeRange: { start: number; end: number }) => {
	const result: IMarkdownOnMessage[] = [];
	let i = 0;

	while (i < inputString.length) {
		if (i >= excludeRange.start && i < excludeRange.end) {
			i = excludeRange.end;
			continue;
		}

		if (inputString[i] === '`') {
			const startindex = i;
			i++;
			let markdown = '';
			while (i < inputString.length && inputString[i] !== '`') {
				markdown += inputString[i];
				i++;
			}
			if (i < inputString.length && inputString[i] === '`') {
				const endindex = i + 1;
				const nextChar = inputString[endindex];
				if (!markdown.includes('``') && markdown.trim().length > 0 && nextChar !== '`') {
					result.push({ type: EBacktickType.SINGLE, s: startindex, e: endindex });
				}
				i++;
			}
		} else {
			i++;
		}
	}

	return result;
};

export const processBacktick = (input: string): { tripleBackticks: IMarkdownOnMessage[]; singleBackticks: IMarkdownOnMessage[] } => {
	if (!input) return { tripleBackticks: [], singleBackticks: [] };
	const backtick = '```';
	const singleBacktick = '`';
	const firstStart = input.indexOf(backtick);
	const lastEnd = input.lastIndexOf(backtick);

	const tripleBackticks: IMarkdownOnMessage[] = [];
	const singleBackticks: IMarkdownOnMessage[] = [];

	const singleStart = input.indexOf(singleBacktick);
	const singleEnd = input.lastIndexOf(singleBacktick);

	if (singleStart !== -1 && singleEnd !== -1 && singleStart < firstStart && lastEnd + backtick.length < singleEnd) {
		singleBackticks.push({ s: singleStart, e: singleEnd + 1, type: EBacktickType.SINGLE });
	} else if (firstStart !== -1 && lastEnd !== -1 && firstStart !== lastEnd) {
		const contentBetween = input.slice(firstStart + backtick.length, lastEnd).trim();
		if (contentBetween) {
			tripleBackticks.push({ s: firstStart, e: lastEnd + backtick.length, type: EBacktickType.TRIPLE });
		}
		const singles = processSingleBacktick(input, { start: firstStart, end: lastEnd + backtick.length });
		singleBackticks.push(...singles);
	} else {
		const singles = processSingleBacktick(input, { start: 0, end: 0 });
		singleBackticks.push(...singles);
	}

	return { tripleBackticks, singleBackticks };
};

const processLinks = (inputString: string, markdowns: IMarkdownOnMessage[]) => {
	const links: ILinkOnMessage[] = [];
	const voiceRooms: ILinkVoiceRoomOnMessage[] = [];

	const isOutsideMarkdown = (start: number, end: number): boolean => {
		return !markdowns.some((markdown) => {
			if (markdown.s !== undefined && markdown.e !== undefined) {
				return start >= markdown.s && end <= markdown.e;
			}
			return false;
		});
	};

	let i = 0;

	while (i < inputString.length) {
		if (inputString.startsWith('http://', i) || inputString.startsWith('https://', i)) {
			const startindex = i;
			i += inputString.startsWith('https://', i) ? 'https://'.length : 'http://'.length;

			while (i < inputString.length && ![' ', '\n', '\r', '\t'].includes(inputString[i])) {
				i++;
			}

			const endindex = i;
			const link = inputString.substring(startindex, endindex);
			if (isOutsideMarkdown(startindex, endindex)) {
				if (link.startsWith('https://meet.google.com/')) {
					voiceRooms.push({
						s: startindex,
						e: endindex
					});
				} else {
					links.push({
						s: startindex,
						e: endindex
					});
				}
			}
		} else {
			i++;
		}
	}
	return { links, voiceRooms };
};

export const processText = (inputString: string) => {
	if (!inputString) return { links: [], voiceRooms: [], markdowns: [] };

	const { tripleBackticks, singleBackticks } = processBacktick(inputString);
	const markdowns: IMarkdownOnMessage[] = [...singleBackticks, ...tripleBackticks];
	const { links, voiceRooms } = processLinks(inputString, markdowns);

	return { links, voiceRooms, markdowns };
};
