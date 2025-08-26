import { selectEmojiObjSuggestion } from '@mezon/store-mobile';
import { EBacktickType, IEmojiOnMessage, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage, isYouTubeLink } from '@mezon/utils';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const useProcessedContent = (inputText: string) => {
	const emojiList = useRef<IEmojiOnMessage[]>([]);
	const linkList = useRef<ILinkOnMessage[]>([]);
	const markdownList = useRef<IMarkdownOnMessage[]>([]);
	const voiceLinkRoomList = useRef<ILinkVoiceRoomOnMessage[]>([]);
	const emojiObjPicked = useSelector(selectEmojiObjSuggestion);
	const boldList = useRef<ILinkOnMessage[]>([]);

	useEffect(() => {
		const processInput = () => {
			const resultString = inputText.replace(/[[\]<>]/g, '');
			const { bolds } = processBold(resultString);
			const { emojis, links, markdowns, voiceRooms } = processText(resultString, emojiObjPicked);
			emojiList.current = emojis;
			linkList.current = links;
			markdownList.current = markdowns;
			markdownList.current = markdowns;
			voiceLinkRoomList.current = voiceRooms;
			boldList.current = bolds;
		};

		processInput();
	}, [inputText]);
	return { emojiList, linkList, markdownList, inputText, voiceLinkRoomList, boldList };
};

export default useProcessedContent;

const processBold = (inputString: string) => {
	const bolds: ILinkOnMessage[] = [];
	const boldPrefix = '**';
	let i = 0;
	let cleanedPosition = 0;

	while (i < inputString.length) {
		const start = inputString.indexOf(boldPrefix, i);
		if (start === -1) break;

		const end = inputString.indexOf(boldPrefix, start + boldPrefix.length);
		if (end === -1) break;

		const boldText = inputString.slice(start + boldPrefix.length, end);

		cleanedPosition += start - i;

		if (boldText.trim().length > 0) {
			const startIndex = cleanedPosition;
			const endIndex = startIndex + boldText.length;

			bolds.push({
				type: EBacktickType.BOLD,
				s: startIndex,
				e: endIndex
			} as ILinkOnMessage);

			cleanedPosition += boldText.length;
		}

		i = end + boldPrefix.length;
	}

	return { bolds };
};

const processText = (rawInputString: string, emojiObjPicked: any) => {
	const emojis: IEmojiOnMessage[] = [];
	const links: ILinkOnMessage[] = [];
	const markdowns: IMarkdownOnMessage[] = [];
	const voiceRooms: ILinkVoiceRoomOnMessage[] = [];

	const singleBacktick = '`';
	const tripleBacktick = '```';
	const googleMeetPrefix = 'https://meet.google.com/';
	const colon = ':';
	const inputString = rawInputString?.replace?.(/\*\*([\s\S]*?)\*\*/g, '$1');

	type Handler = {
		predicate: (i: number) => boolean;
		handler: (i: number) => number | void;
	};

	let i = 0;

	const handlers: Handler[] = [
		// Emoji handler
		{
			predicate: (idx) =>
				inputString[idx] === ':' &&
				idx + 1 < inputString.length &&
				inputString.indexOf(':', idx + 1) !== -1 &&
				!inputString.startsWith('http://', idx + 1) &&
				!inputString.startsWith('https://', idx + 1),
			handler: (idx) => {
				const startindex = idx;
				let shortname = '';
				let j = idx + 1;
				while (j < inputString.length && inputString[j] !== colon) {
					shortname += inputString[j];
					j++;
				}
				if (j < inputString.length && inputString[j] === colon && shortname.length > 0) {
					const endindex = j + 1;
					const preCharFour = inputString.substring(startindex - 4, startindex);
					const preCharFive = inputString.substring(startindex - 5, startindex);
					const emojiId = emojiObjPicked?.[`:${shortname}:`];
					if (preCharFour !== 'http' && preCharFive !== 'https' && emojiId) {
						emojis.push({ emojiid: emojiId, s: startindex, e: endindex });
						return endindex;
					}
				}
				return idx + 1;
			}
		},
		// Link handler
		{
			predicate: (idx) => inputString.startsWith('http://', idx) || inputString.startsWith('https://', idx),
			handler: (idx) => {
				const startindex = idx;
				let i2 = idx + (inputString.startsWith('https://', idx) ? 'https://'.length : 'http://'.length);
				const stopChars = [' ', '\n', '\r', '\t'];
				while (i2 < inputString.length && !stopChars.includes(inputString[i2])) {
					i2++;
				}
				let endindex = i2;
				let link = inputString.substring(startindex, endindex);
				// Remove any trailing punctuation if present
				const trailingPunctuations = [',', '.', '!', '?', ';', ':'];
				while (link.length > 0 && trailingPunctuations.includes(link[link.length - 1])) {
					link = link.slice(0, -1);
					endindex--;
				}
				if (link.startsWith(googleMeetPrefix)) {
					voiceRooms.push({
						type: EBacktickType.VOICE_LINK,
						s: startindex,
						e: endindex
					} as ILinkVoiceRoomOnMessage);
				} else {
					const isYouTube = isYouTubeLink(link);
					links.push({
						type: isYouTube ? EBacktickType.LINKYOUTUBE : EBacktickType.LINK,
						s: startindex,
						e: endindex
					} as ILinkOnMessage);
				}
				return i2;
			}
		},
		// Triple backtick markdown handler
		{
			predicate: (idx) => inputString.substring(idx, idx + tripleBacktick.length) === tripleBacktick,
			handler: (idx) => {
				const startindex = idx;
				let i2 = idx + tripleBacktick.length;
				let markdown = '';
				while (i2 < inputString.length && inputString.substring(i2, i2 + tripleBacktick.length) !== tripleBacktick) {
					markdown += inputString[i2];
					i2++;
				}
				if (i2 < inputString.length && inputString.substring(i2, i2 + tripleBacktick.length) === tripleBacktick) {
					i2 += tripleBacktick.length;
					const endindex = i2;
					if (markdown?.length > 0) {
						markdowns.push({ type: EBacktickType.TRIPLE, s: startindex, e: endindex } as IMarkdownOnMessage);
					}
					return endindex;
				}
				return idx + 1;
			}
		},
		// Single backtick markdown handler
		{
			predicate: (idx) => inputString[idx] === singleBacktick,
			handler: (idx) => {
				const startindex = idx;
				let i2 = idx + 1;
				let foundTriple = false;
				let tripleIdx = -1;
				// Find triple backtick after this point
				while (i2 < inputString.length) {
					if (inputString.substring(i2, i2 + tripleBacktick.length) === tripleBacktick) {
						foundTriple = true;
						tripleIdx = i2;
						break;
					}
					i2++;
				}
				if (foundTriple) {
					// If there is a triple backtick after, take the part from single backtick to before triple backtick
					// (including the preceding `, not closing the single backtick)
					// Do not add to markdownList, just move the pointer past this part
					// (can handle this part outside if you want to save this string)
					return tripleIdx; // jump to triple backtick for the triple handler to process next
				}
				// If there is no triple backtick, handle single backtick as before
				let i3 = idx + 1;
				let markdown = '';
				while (i3 < inputString.length && inputString[i3] !== singleBacktick) {
					markdown += inputString[i3];
					i3++;
				}
				if (i3 < inputString.length && inputString[i3] === singleBacktick) {
					const endindex = i3 + 1;
					const nextChar = inputString[endindex];
					if (!markdown.includes('``') && markdown.trim().length > 0 && nextChar !== singleBacktick) {
						markdowns.push({ type: EBacktickType.SINGLE, s: startindex, e: endindex } as IMarkdownOnMessage);
					}
					return endindex;
				}
				return idx + 1;
			}
		}
	];

	while (i < inputString.length) {
		let handled = false;
		for (const { predicate, handler } of handlers) {
			if (predicate(i)) {
				const nextI = handler(i);
				i = typeof nextI === 'number' ? nextI : i + 1;
				handled = true;
				break;
			}
		}
		if (!handled) i++;
	}

	return { emojis, links, markdowns, voiceRooms };
};
