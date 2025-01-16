/* eslint-disable no-dupe-else-if */
import {
	EBacktickType,
	IBoldTextOnMessage,
	IEmojiOnMessage,
	IHashtagOnMessage,
	ILinkOnMessage,
	ILinkVoiceRoomOnMessage,
	IMarkdownOnMessage,
	IMentionOnMessage,
	IMessageSendPayload
} from '../types';

export const isOutsideRange = (start: number, end: number, ranges: (IMarkdownOnMessage | IBoldTextOnMessage)[]): boolean => {
	return !ranges.some((range) => {
		if (range.s !== undefined && range.e !== undefined) {
			return start >= range.s && end <= range.e;
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
					if (isOutsideRange(startIndex, endIndex, markdowns)) {
						boldTexts.push({
							s: startIndex,
							e: endIndex,
							type: EBacktickType.BOLD
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

const processLinks = (inputString: string, markdowns: IMarkdownOnMessage[], boldtexts: IBoldTextOnMessage[]) => {
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
			if (isOutsideRange(startindex, endindex, markdowns) && isOutsideRange(startindex, endindex, boldtexts)) {
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
	const boldTexts = processBoldText(inputString, markdowns);
	const { links, voiceRooms } = processLinks(inputString, markdowns, boldTexts);

	return { links, voiceRooms, markdowns, boldTexts };
};

// calc new s and e of token
export function updateItems<T extends { s?: number; e?: number }>(
	items: T[] | undefined,
	replacements: { numMarkers: number; oldRange: { s?: number; e?: number }; newRange: { s: number; e: number } }[]
): T[] | undefined {
	return items?.map((item) => {
		// eslint-disable-next-line prefer-const
		let updatedItem = { ...item };
		updatedItem.s = updatedItem.s ?? 0;
		updatedItem.e = updatedItem.e ?? updatedItem.s;
		let totalAdjustment = 0;
		replacements.forEach((replacement) => {
			const { numMarkers, oldRange } = replacement;
			const rangeEnd = oldRange.e ?? 0;
			if (updatedItem.s && rangeEnd <= updatedItem.s) {
				totalAdjustment += numMarkers * 2;
			}
		});

		updatedItem.s -= totalAdjustment;
		updatedItem.e -= totalAdjustment;

		return updatedItem;
	});
}
// create new content after remove syntax mk and boldtext
export function removeSyntaxMkOrBold(t: string, mk: IMarkdownOnMessage[], b: IBoldTextOnMessage[]) {
	const mkContent = getToken(t, mk);
	const bContent = getToken(t, b);
	const cleanMkContent = mkContent?.map((content) => {
		if (content.startsWith('```')) {
			return content.slice(3, content.length - 3);
		} else if (content.startsWith('`')) {
			return content.slice(1, content.length - 1);
		}
		return content;
	});

	const cleanBContent = bContent?.map((content) => content.slice(2, content.length - 2));
	let result = t;
	mkContent?.forEach((content, index) => {
		result = result.replace(content, cleanMkContent[index]);
	});

	bContent?.forEach((content, index) => {
		result = result.replace(content, cleanBContent[index]);
	});
	return result;
}

export function calculateNewIndex(oldText: string, newText: string, boldOrMkRanges: (IMarkdownOnMessage | IBoldTextOnMessage)[]) {
	const result: {
		numMarkers: number;
		oldRange: { s: number; e: number };
		newRange: { s: number; e: number };
		type: EBacktickType;
	}[] = [];
	const seenPositions = new Set<number>();

	boldOrMkRanges.forEach((range) => {
		const oldContent = oldText.slice(range.s, range.e);
		let cleanedOldContent = '';
		let type: EBacktickType;

		if (oldContent.includes('```')) {
			cleanedOldContent = oldContent.replace(/^```/, '').replace(/```$/, '');
			type = EBacktickType.TRIPLE;
		} else if (oldContent.includes('`')) {
			cleanedOldContent = oldContent.replace(/^`/, '').replace(/`$/, '');
			type = EBacktickType.SINGLE;
		} else if (oldContent.includes('**')) {
			cleanedOldContent = oldContent.replace(/\*\*/g, '');
			type = EBacktickType.BOLD;
		} else {
			return;
		}

		let newStart = newText.indexOf(cleanedOldContent);

		while (seenPositions.has(newStart) && newStart !== -1) {
			newStart = newText.indexOf(cleanedOldContent, newStart + 1);
		}

		if (newStart === -1) {
			console.error('Could not find new position for: ', oldContent);
			return;
		}
		seenPositions.add(newStart);
		const newEnd = newStart + cleanedOldContent.length;

		result.push({
			numMarkers: type === EBacktickType.BOLD ? 2 : type === EBacktickType.TRIPLE ? 3 : 1,
			oldRange: { s: range.s ?? 0, e: range.e ?? 0 },
			newRange: { s: newStart, e: newEnd },
			type
		});
	});

	return result;
}

// create new s and e mk and boldtext
export const createReplacements = (mk: IMarkdownOnMessage[], b: IBoldTextOnMessage[], t: string) => {
	const combinedItems = [...(mk ?? []), ...(b ?? [])];
	const newT = removeSyntaxMkOrBold(t as string, mk as IMarkdownOnMessage[], b as IBoldTextOnMessage[]);
	const updatedBoldText = calculateNewIndex(t, newT, combinedItems);
	return updatedBoldText;
};

export function getToken(t: string, token: (IHashtagOnMessage | IEmojiOnMessage | IMentionOnMessage)[]): string[] {
	return token?.map(({ s = 0, e = 0 }) => t?.substring(s, e));
}

// get new index of payload and mention after remove syntax
export function updatePayload(payload: IMessageSendPayload, mentions: IMentionOnMessage[]) {
	// eslint-disable-next-line prefer-const
	let { t, ej, lk, vk, hg, mk, b } = payload;
	const replacements = createReplacements(mk as IMarkdownOnMessage[], b as IBoldTextOnMessage[], t as string);
	const newT = removeSyntaxMkOrBold(t as string, mk as IMarkdownOnMessage[], b as IBoldTextOnMessage[]);
	const updatedMk = replacements
		.filter((r) => r.type === EBacktickType.SINGLE || r.type === EBacktickType.TRIPLE)
		.map((r) => ({
			s: r.newRange.s,
			e: r.newRange.e,
			type: r.type
		}));

	const updatedB = replacements
		.filter((r) => r.type === EBacktickType.BOLD)
		.map((r) => ({
			s: r.newRange.s,
			e: r.newRange.e,
			type: r.type
		}));
	const updatedHg = updateItems(hg, replacements);
	const updatedEj = updateItems(ej, replacements);
	const updatedLk = updateItems(lk, replacements);
	const updatedVk = updateItems(vk, replacements);
	const updatedMentions = updateItems(mentions, replacements);

	return {
		payload: { t: newT, ej: updatedEj, lk: updatedLk, vk: updatedVk, hg: updatedHg, mk: updatedMk, b: updatedB },
		mentions: updatedMentions
	};
}
