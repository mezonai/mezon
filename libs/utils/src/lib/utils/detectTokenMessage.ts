import { EBacktickType, IBoldTextOnMessage, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage } from '../types';

export const isOutsideMarkdown = (start: number, end: number, markdowns: IMarkdownOnMessage[]): boolean => {
	return !markdowns.some((markdown) => {
		if (markdown.s !== undefined && markdown.e !== undefined) {
			return start >= markdown.s && end <= markdown.e;
		}
		return false;
	});
};

export const processBoldText = (inputString: string, markdowns: IMarkdownOnMessage[]) => {
	const boldTexts: IBoldTextOnMessage[] = [];
	let i = 0;

	while (i < inputString.length) {
		if (inputString[i] === '*' && inputString[i + 1] === '*') {
			const startIndex = i;
			i += 2;

			let boldText = '';
			while (i < inputString.length && !(inputString[i] === '*' && inputString[i + 1] === '*')) {
				boldText += inputString[i];
				i++;
			}

			if (i < inputString.length && inputString[i] === '*' && inputString[i + 1] === '*') {
				const endIndex = i + 2;

				if (boldText.trim().length > 0) {
					if (isOutsideMarkdown(startIndex, endIndex, markdowns)) {
						boldTexts.push({
							s: startIndex,
							e: endIndex
						});
					}
				}

				i += 2;
			}
		} else {
			i++;
		}
	}

	return boldTexts;
};

export const processBacktick = (input: string): { tripleBackticks: IMarkdownOnMessage[]; singleBackticks: IMarkdownOnMessage[] } => {
	if (!input) return { tripleBackticks: [], singleBackticks: [] };

	const tripleBacktick = '```';
	const singleBacktick = '`';

	const tripleBackticks: IMarkdownOnMessage[] = [];
	const singleBackticks: IMarkdownOnMessage[] = [];

	const firstTripleStart = input.indexOf(tripleBacktick);
	const lastTripleEnd = input.lastIndexOf(tripleBacktick);

	const firstSingleStart = input.indexOf(singleBacktick);
	const lastSingleEnd = input.lastIndexOf(singleBacktick);

	const isTripleValid =
		firstTripleStart !== -1 &&
		lastTripleEnd !== -1 &&
		lastTripleEnd >= firstTripleStart + tripleBacktick.length &&
		input.slice(firstTripleStart + tripleBacktick.length, lastTripleEnd).trim().length > 0;

	const isSingleValid =
		firstSingleStart !== -1 &&
		lastSingleEnd !== -1 &&
		lastSingleEnd >= firstSingleStart + singleBacktick.length &&
		input.slice(firstSingleStart + singleBacktick.length, lastSingleEnd).trim().length > 0;

	if (
		isTripleValid &&
		((firstTripleStart <= firstSingleStart && lastTripleEnd + 2 === lastSingleEnd) || lastTripleEnd + 2 >= lastSingleEnd || !isSingleValid)
	) {
		tripleBackticks.push({
			type: EBacktickType.TRIPLE,
			s: firstTripleStart,
			e: lastTripleEnd + tripleBacktick.length
		});
	} else if (isSingleValid || firstTripleStart > firstSingleStart) {
		singleBackticks.push({
			type: EBacktickType.SINGLE,
			s: firstSingleStart,
			e: lastSingleEnd + singleBacktick.length
		});
	}

	return { tripleBackticks, singleBackticks };
};

const processLinks = (inputString: string, markdowns: IMarkdownOnMessage[]) => {
	const links: ILinkOnMessage[] = [];
	const voiceRooms: ILinkVoiceRoomOnMessage[] = [];
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
			if (isOutsideMarkdown(startindex, endindex, markdowns)) {
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
	if (!inputString) return { links: [], voiceRooms: [], markdowns: [], boldTexts: [] };

	const { tripleBackticks, singleBackticks } = processBacktick(inputString);
	const markdowns: IMarkdownOnMessage[] = [...singleBackticks, ...tripleBackticks];
	const { links, voiceRooms } = processLinks(inputString, markdowns);
	const boldTexts = processBoldText(inputString, markdowns);

	return { links, voiceRooms, markdowns, boldTexts };
};
