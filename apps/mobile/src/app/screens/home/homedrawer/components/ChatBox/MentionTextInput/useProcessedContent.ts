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
			const { emojis, links, markdowns, voiceRooms, bolds } = processText(resultString, emojiObjPicked);
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

const processText = (inputString: string, emojiObjPicked: any) => {
	const emojis: IEmojiOnMessage[] = [];
	const links: ILinkOnMessage[] = [];
	const markdowns: IMarkdownOnMessage[] = [];
	const voiceRooms: ILinkVoiceRoomOnMessage[] = [];
	const bolds: ILinkOnMessage[] = [];

	const singleBacktick = '`';
	const tripleBacktick = '```';
	const googleMeetPrefix = 'https://meet.google.com/';
	const colon = ':';
	const boldPrefix = '**';

	let i = 0;
	while (i < inputString.length) {
		if (
			inputString[i] === ':' &&
			i + 1 < inputString.length &&
			inputString.indexOf(':', i + 1) !== -1 &&
			!inputString.startsWith('http://', i + 1) &&
			!inputString.startsWith('https://', i + 1)
		) {
			// Emoji processing
			const startindex = i;
			let shortname = '';
			let j = i + 1;

			while (j < inputString.length && inputString[j] !== colon) {
				shortname += inputString[j];
				j++;
			}

			if (j < inputString.length && inputString[j] === ':' && shortname.length > 0) {
				const endindex = j + 1;
				const preCharFour = inputString.substring(startindex - 4, startindex);
				const preCharFive = inputString.substring(startindex - 5, startindex);
				const emojiId = emojiObjPicked?.[`:${shortname}:`];
				if (preCharFour !== 'http' && preCharFive !== 'https' && emojiId) {
					emojis.push({
						emojiid: emojiId,
						s: startindex,
						e: endindex
					});
					i = endindex;
					continue;
				}
			}
			i++;
		} else if (inputString.startsWith('http://', i) || inputString.startsWith('https://', i)) {
			// Link processing
			const startindex = i;
			i += inputString.startsWith('https://', i) ? 'https://'.length : 'http://'.length;
			while (i < inputString.length && ![' ', '\n', '\r', '\t'].includes(inputString[i])) {
				i++;
			}
			const endindex = i;
			const link = inputString.substring(startindex, endindex);

			// TODO: convert html parser like web
			if (link.startsWith(googleMeetPrefix)) {
				voiceRooms.push({
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					type: EBacktickType.VOICE_LINK,
					s: startindex,
					e: endindex
				});
			} else {
				const isYouTube = isYouTubeLink(inputString);
				links.push({
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					type: isYouTube ? EBacktickType.LINKYOUTUBE : EBacktickType.LINK,
					s: startindex,
					e: endindex
				});
			}
		} else if (inputString.substring(i, i + boldPrefix.length) === boldPrefix) {
			// Triple backtick markdown processing
			const startindex = i;
			i += boldPrefix.length;
			let bold = '';
			while (i < inputString.length && inputString.substring(i, i + boldPrefix.length) !== boldPrefix) {
				bold += inputString[i];
				i++;
			}
			if (i < inputString.length && inputString.substring(i, i + boldPrefix.length) === boldPrefix) {
				i += boldPrefix.length;
				const endindex = i;
				if (bold.trim().length > 0) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					bolds.push({ type: EBacktickType.BOLD, s: startindex, e: endindex - boldPrefix?.length * 2 });
				}
			}
		} else if (inputString.substring(i, i + tripleBacktick.length) === tripleBacktick) {
			// Triple backtick markdown processing
			const startindex = i;
			i += tripleBacktick.length;
			let markdown = '';
			while (i < inputString.length && inputString.substring(i, i + tripleBacktick.length) !== tripleBacktick) {
				markdown += inputString[i];
				i++;
			}
			if (i < inputString.length && inputString.substring(i, i + tripleBacktick.length) === tripleBacktick) {
				i += tripleBacktick.length;
				const endindex = i;
				if (markdown.trim().length > 0) {
					markdowns.push({ type: EBacktickType.TRIPLE, s: startindex, e: endindex });
				}
			}
		} else if (inputString[i] === singleBacktick) {
			// Single backtick markdown processing
			const startindex = i;
			i++;
			let markdown = '';
			while (i < inputString.length && inputString[i] !== singleBacktick) {
				markdown += inputString[i];
				i++;
			}
			if (i < inputString.length && inputString[i] === singleBacktick) {
				const endindex = i + 1;
				const nextChar = inputString[endindex];
				if (!markdown.includes('``') && markdown.trim().length > 0 && nextChar !== singleBacktick) {
					markdowns.push({ type: EBacktickType.SINGLE, s: startindex, e: endindex });
				}
				i++;
			}
		} else {
			i++;
		}
	}

	return { emojis, links, markdowns, voiceRooms, bolds };
};
