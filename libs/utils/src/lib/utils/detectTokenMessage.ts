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
			let insideBoldText = 0;

			while (i < inputString.length) {
				if (inputString[i] === '*' && inputString[i + 1] === '*') {
					if (insideBoldText === 0) {
						const endIndex = i + 2;
						if (boldText.trim().length > 0) {
							const isWrappingMarkdown = markdowns.some((md) => {
								const mdStart = md.s ?? 0;
								const mdEnd = md.e ?? 0;
								return startIndex <= mdStart && endIndex >= mdEnd;
							});
							if (isOutsideRange(startIndex, endIndex, markdowns) && !isWrappingMarkdown) {
								boldTexts.push({
									s: startIndex,
									e: endIndex,
									type: EBacktickType.BOLD
								});
							}
						}
						i += 2;
						break;
					} else {
						insideBoldText--;
					}
				} else {
					boldText += inputString[i];
				}
				i++;
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

	//case ** wrapper ` or ```
	const isWrappedByAsterisks = (start: number, end: number): boolean => {
		return input[start - 2] === '*' && input[start - 1] === '*' && input[end + 1] === '*' && input[end + 2] === '*';
	};

	if (
		isTripleValid &&
		((firstTripleStart <= firstSingleStart && lastTripleEnd + 2 === lastSingleEnd) || lastTripleEnd + 2 > lastSingleEnd || !isSingleValid)
	) {
		const isBold = isWrappedByAsterisks(firstTripleStart, lastTripleEnd + tripleBacktick.length - 1);
		tripleBackticks.push({
			type: EBacktickType.TRIPLE,
			s: firstTripleStart,
			e: lastTripleEnd + tripleBacktick.length,
			...(isBold ? { isBold: true } : {})
		});
	} else if (isSingleValid || firstTripleStart > firstSingleStart || lastTripleEnd + 2 === lastSingleEnd) {
		const isBold = isWrappedByAsterisks(firstSingleStart, lastSingleEnd + singleBacktick.length - 1);
		singleBackticks.push({
			type: EBacktickType.SINGLE,
			s: firstSingleStart,
			e: lastSingleEnd + singleBacktick.length,
			...(isBold ? { isBold: true } : {})
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
export function removeSyntaxMkOrBold(t: string, boldOrMkRanges: (IMarkdownOnMessage | IBoldTextOnMessage)[]): string {
	const cleanContent = boldOrMkRanges.map((content) => {
		const originalContent = t.slice(content.s, content.e);
		if (originalContent.startsWith('```') && originalContent.endsWith('```')) {
			return originalContent.slice(3, originalContent.length - 3);
		} else if (originalContent.startsWith('`') && originalContent.endsWith('`')) {
			return originalContent.slice(1, originalContent.length - 1);
		} else if (originalContent.startsWith('**') && originalContent.endsWith('**')) {
			return originalContent.slice(2, originalContent.length - 2);
		}
		return originalContent;
	});
	let result = t;
	boldOrMkRanges.forEach((content, index) => {
		const originalContent = t.slice(content.s, content.e);
		result = result.replace(originalContent, cleanContent[index]);
	});

	return result;
}
// cal new index of mk and b
export function calculateNewIndex(boldOrMkRanges: (IMarkdownOnMessage | IBoldTextOnMessage)[]) {
	const result: {
		numMarkers: number;
		oldRange: { s: number; e: number };
		newRange: { s: number; e: number; isBold: boolean };
		type: EBacktickType;
	}[] = [];

	const updatedRanges = boldOrMkRanges
		.map((range) => {
			let numMarkers = 0;

			if (range.type === EBacktickType.TRIPLE) {
				numMarkers = 3;
			} else if (range.type === EBacktickType.SINGLE) {
				numMarkers = 1;
			} else if (range.type === EBacktickType.BOLD) {
				numMarkers = 2;
			} else {
				numMarkers = 0;
			}
			return {
				...range,
				numMarkers
			};
		})
		.sort((a, b) => (a.s ?? 0) - (b.s ?? 0));
	let cumulativeMarkers = 0;

	for (let i = 0; i < updatedRanges.length; i++) {
		const range = updatedRanges[i];
		let newStart = 0;
		let newEnd = 0;

		if (i === 0) {
			newStart = range.s ?? 0;
			newEnd = (range.e ?? 0) - range.numMarkers * 2;
		} else {
			newStart = (range.s ?? 0) - cumulativeMarkers * 2;
			newEnd = (range.e ?? 0) - cumulativeMarkers * 2 - range.numMarkers * 2;
		}

		cumulativeMarkers += range.numMarkers;

		result.push({
			numMarkers: range.numMarkers,
			oldRange: { s: range.s ?? 0, e: range.e ?? 0 },
			newRange: { s: newStart, e: newEnd, isBold: range.isBold as boolean },
			type: range.type as EBacktickType
		});
	}
	return result;
}
// get token text no prefix
export function getToken(t: string, token: (IHashtagOnMessage | IEmojiOnMessage | IMentionOnMessage)[]): string[] {
	return token?.map(({ s = 0, e = 0 }) => t?.substring(s, e));
}
// get new boldtext and mk
export function getUpdatedRangesByType(
	replacements: Array<{ type: EBacktickType; newRange: { s: number; e: number; isBold?: boolean } }>,
	type: EBacktickType
) {
	return replacements
		.filter((r) => r.type === type)
		.map((r) => {
			const { s, e, isBold } = r.newRange;
			const result: { s: number; e: number; type: EBacktickType; isBold?: boolean } = { s, e, type: r.type };

			if (isBold) {
				result.isBold = isBold;
			}
			return result;
		});
}

// get new index of payload and mention after remove syntax
export function updatePayload(payload: IMessageSendPayload, mentions: IMentionOnMessage[]) {
	// eslint-disable-next-line prefer-const
	let { t, ej, lk, vk, hg, mk, b } = payload;
	const combineMkB = [...(mk ?? []), ...(b ?? [])].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));
	// console.log('combineMkB: ', combineMkB);
	const replacements = calculateNewIndex(combineMkB);
	// console.log('replacements: ', replacements);
	const newT = removeSyntaxMkOrBold(t as string, combineMkB);
	// console.log('newT: ', newT);
	const updatedMkTypeS = getUpdatedRangesByType(replacements, EBacktickType.SINGLE);
	// console.log('updatedMkTypeS: ', updatedMkTypeS);
	const updatedMkTypeT = getUpdatedRangesByType(replacements, EBacktickType.TRIPLE);
	// console.log('updatedMkTypeT: ', updatedMkTypeT);
	const updatedMk = [...(updatedMkTypeS ?? []), ...(updatedMkTypeT ?? [])];
	const updatedB = getUpdatedRangesByType(replacements, EBacktickType.BOLD);
	// console.log('updatedB: ', updatedB);
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
