import { getStore } from '@mezon/store';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { selectChannelById, selectEmojiObjSuggestion } from '@mezon/store-mobile';
import type { IEmojiOnMessage, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage } from '@mezon/utils';
import { ChannelStatusEnum, EBacktickType, isYouTubeLink } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { clanAndChannelIdLinkRegex } from '../../../../../../utils/helpers';

const useProcessedContent = (inputText: string) => {
	const emojiList = useRef<IEmojiOnMessage[]>([]);
	const linkList = useRef<ILinkOnMessage[]>([]);
	const markdownList = useRef<IMarkdownOnMessage[]>([]);
	const voiceLinkRoomList = useRef<ILinkVoiceRoomOnMessage[]>([]);
	const emojiObjPicked = useSelector(selectEmojiObjSuggestion);
	const boldList = useRef<ILinkOnMessage[]>([]);

	useEffect(() => {
		const processInput = () => {
			const resultString = inputText.replace(/@\[(.*?)\]/g, '@$1').replace(/<#(.*?)>/g, '#$1');
			const { bolds } = processBold(resultString);
			const { emojis, links, markdowns, voiceRooms } = processText(resultString, emojiObjPicked);
			emojiList.current = emojis;
			linkList.current = links;
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
	const getCleanLen = (str: string) => {
		return str?.replace(/```([\s\S]*?)```|`([^`]+)`/g, (match, p1, p2) => (p1 !== undefined ? p1 : p2)).length;
	};

	while (i < inputString.length) {
		const start = inputString.indexOf(boldPrefix, i);
		if (start === -1) break;

		const end = inputString.indexOf(boldPrefix, start + boldPrefix.length);
		if (end === -1) break;

		const boldText = inputString.slice(start + boldPrefix.length, end);
		const segmentBefore = inputString.slice(i, start);

		cleanedPosition += getCleanLen(segmentBefore);

		if (boldText.trim().length > 0) {
			const boldTextCleanLen = getCleanLen(boldText);
			const startIndex = cleanedPosition;
			const endIndex = startIndex + boldTextCleanLen;

			bolds.push({
				type: EBacktickType.BOLD,
				s: startIndex,
				e: endIndex
			} as ILinkOnMessage);

			cleanedPosition += boldTextCleanLen;
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
	const inputString = rawInputString;

	let shift = 0;
	const getCleanLenBold = (str: string) => str?.replace(/\*\*(.*?)\*\*/g, '$1')?.length;

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
						emojis.push({ emojiid: emojiId, s: startindex - shift, e: endindex - shift });
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
						s: startindex - shift,
						e: endindex - shift
					} as ILinkVoiceRoomOnMessage);
				} else {
					const isYouTube = isYouTubeLink(link);
					const channelMessageMatch = link.match(clanAndChannelIdLinkRegex);
					const clanId = channelMessageMatch?.[1] || '';
					const channelId = channelMessageMatch?.[2] || '';
					let isThreadPublish = false;
					let channelName = '';
					if (channelId) {
						const store = getStore();
						const channel = selectChannelById(store.getState(), channelId as string) as ChannelsEntity;
						isThreadPublish =
							channel?.type === ChannelType.CHANNEL_TYPE_THREAD && channel?.channel_private !== ChannelStatusEnum.isPrivate;
						channelName = channel?.channel_label || '';
					}

					links.push({
						channelId: channelId ? channelId : '',
						clanId: clanId ? clanId : '',
						channelLabel: isThreadPublish && channelName ? channelName : '',
						type: isYouTube ? EBacktickType.LINKYOUTUBE : EBacktickType.LINK,
						s: startindex - shift,
						e: endindex - shift
					} as ILinkOnMessage);
				}
				return i2;
			}
		},
		// Triple backtick markdown handler (PRE)
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
					const content = markdown;
					const contentCleanLen = getCleanLenBold(content);

					const s = startindex - shift;
					const e = s + contentCleanLen;

					if (markdown?.length > 0) {
						markdowns.push({ type: EBacktickType.PRE, s, e } as IMarkdownOnMessage);
					}

					shift += 6 + (content?.length - contentCleanLen);
					return endindex;
				}
				return idx + 1;
			}
		},

		// Single backtick markdown handler
		{
			predicate: (idx) => inputString[idx] === singleBacktick && inputString.substring(idx, idx + tripleBacktick.length) !== tripleBacktick,
			handler: (idx) => {
				const startindex = idx;
				let i3 = idx + 1;
				let markdown = '';
				while (i3 < inputString.length && inputString[i3] !== singleBacktick) {
					markdown += inputString[i3];
					i3++;
				}
				if (i3 < inputString.length && inputString[i3] === singleBacktick) {
					const endindex = i3 + 1;
					let allow = true;
					if (inputString.substring(i3, i3 + tripleBacktick.length) === tripleBacktick) {
						let k = i3 + tripleBacktick.length;
						let hasClosingTriple = false;
						while (k < inputString.length - 2) {
							if (inputString.substring(k, k + tripleBacktick.length) === tripleBacktick) {
								hasClosingTriple = true;
								break;
							}
							k++;
						}
						if (hasClosingTriple) allow = false;
					}

					if (allow && !markdown.includes('``') && markdown.trim().length > 0) {
						const content = markdown;
						const contentCleanLen = getCleanLenBold(content);
						const s = startindex - shift;
						const e = s + contentCleanLen;

						markdowns.push({ type: EBacktickType.CODE, s, e } as IMarkdownOnMessage);

						shift += 2 + (content.length - contentCleanLen);
						return endindex;
					}
				}
				return idx + 1;
			}
		},
		// Bold Ghost Handler (strip **)
		{
			predicate: (idx) => inputString.startsWith('**', idx),
			handler: (idx) => {
				shift += 2;
				return idx + 2;
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
