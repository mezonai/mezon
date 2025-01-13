import { IEmojiOnMessage, IHashtagOnMessage, IMarkdownOnMessage, IMentionOnMessage } from '../types/messageLine';

export const isWithinMarkdownRanges = (item: { s: number; e: number }, markdownList: IMarkdownOnMessage[]): boolean => {
	const result = !markdownList.some(
		(markdown) => markdown.s !== undefined && markdown.e !== undefined && markdown.s < item.s && item.e < markdown.e
	);
	return result;
};

export const filterValidItems = <T extends { s?: number; e?: number }>(list: T[], validator: (item: { s: number; e: number }) => boolean): T[] => {
	const filteredList = list.filter((item) => item.s !== undefined && item.e !== undefined && validator(item as { s: number; e: number }));
	return filteredList;
};

export const checkTokenOnMarkdown = (
	markdownList: IMarkdownOnMessage[],
	hashtagList: IHashtagOnMessage[],
	mentionList: IMentionOnMessage[],
	emojiList: IEmojiOnMessage[]
) => {
	if (markdownList.length === 0 || (hashtagList.length === 0 && mentionList.length === 0 && emojiList.length === 0)) {
		return {
			validHashtagList: hashtagList,
			validMentionList: mentionList,
			validEmojiList: emojiList
		};
	}

	const validHashtagList = filterValidItems(hashtagList, (item) => isWithinMarkdownRanges(item, markdownList));
	const validMentionList = filterValidItems(mentionList, (item) => isWithinMarkdownRanges(item, markdownList));
	const validEmojiList = filterValidItems(emojiList, (item) => isWithinMarkdownRanges(item, markdownList));

	return {
		validHashtagList,
		validMentionList,
		validEmojiList
	};
};
