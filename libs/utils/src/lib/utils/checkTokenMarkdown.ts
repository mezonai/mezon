import { IEmojiOnMessage, IHashtagOnMessage, IMarkdownOnMessage, IMentionOnMessage } from '../types/messageLine';

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
	const isWithinMarkdownRanges = (item: { s: number; e: number }) => {
		const result = !markdownList.some(
			(markdown) => markdown.s !== undefined && markdown.e !== undefined && markdown.s < item.s && item.e < markdown.e
		);
		return result;
	};

	const filterValidItems = <T extends { s?: number; e?: number }>(list: T[], validator: (item: { s: number; e: number }) => boolean) => {
		const filteredList = list.filter((item) => item.s !== undefined && item.e !== undefined && validator(item as { s: number; e: number }));
		return filteredList;
	};

	const validHashtagList = filterValidItems(hashtagList, isWithinMarkdownRanges);
	const validMentionList = filterValidItems(mentionList, isWithinMarkdownRanges);
	const validEmojiList = filterValidItems(emojiList, isWithinMarkdownRanges);

	return {
		validHashtagList,
		validMentionList,
		validEmojiList
	};
};
