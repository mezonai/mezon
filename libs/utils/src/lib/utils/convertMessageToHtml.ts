import type { IEmojiOnMessage, IExtendedMessage, IHashtagOnMessage, IMarkdownOnMessage, IMentionOnMessage } from '../types';
import { EBacktickType } from '../types';

const escapeHtml = (text: string): string => {
	return text
		.replace(/&(?!amp;|lt;|gt;|quot;|#39;|nbsp;)/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
		.replace(/ {2}/g, '&nbsp;&nbsp;')
		.replace(/\n/g, '<br>');
};

export const convertMessageToHtml = (message: IExtendedMessage): string => {
	const { t: text = '', mentions = [], hg: hashtags = [], ej: emojis = [], mk: markdown = [] } = message;

	if (!text) return '';

	const allEntities: Array<{
		start: number;
		end: number;
		html: string;
		type: string;
	}> = [];

	mentions.forEach((mention: IMentionOnMessage) => {
		let start = mention.s;
		const end = mention.e;

		if (start === undefined && end !== undefined) {
			const beforeEnd = text.substring(0, end);
			const atMatch = beforeEnd.lastIndexOf('@');
			if (atMatch !== -1) {
				start = atMatch;
			}
		}

		if (start !== undefined && end !== undefined) {
			const mentionText = text.substring(start, end);
			if (mention.user_id) {
				allEntities.push({
					start,
					end,
					html: `<a class="text-entity-link mention" data-entity-type="MessageEntityMentionName" data-user-id="${mention.user_id}" contenteditable="false" dir="auto">${mentionText}</a>`,
					type: 'mention'
				});
			} else if (mention.role_id) {
				allEntities.push({
					start,
					end,
					html: `<a class="text-entity-link mention" data-entity-type="MessageEntityMentionRole" data-user-id="${mention.role_id}" contenteditable="false" dir="auto">${mentionText}</a>`,
					type: 'mention'
				});
			}
		}
	});

	hashtags.forEach((hashtag: IHashtagOnMessage) => {
		if (hashtag.s !== undefined && hashtag.e !== undefined) {
			const hashtagText = text.substring(hashtag.s, hashtag.e);

			if (hashtag.channelid) {
				allEntities.push({
					start: hashtag.s,
					end: hashtag.e,
					html: `<a class="text-entity-link hashtag" data-entity-type="MessageEntityHashtag" data-id="${hashtag.channelid}" contenteditable="false" dir="auto">${hashtagText}</a>`,
					type: 'hashtag'
				});
			}
		}
	});

	emojis.forEach((emoji: IEmojiOnMessage) => {
		if (emoji.s !== undefined && emoji.e !== undefined) {
			const emojiText = text.substring(emoji.s, emoji.e);

			if (emoji.emojiid) {
				allEntities.push({
					start: emoji.s,
					end: emoji.e,
					html: `<span class="text-entity-link emoji" data-entity-type="MessageEntityCustomEmoji" data-document-id="${emoji.emojiid}" contenteditable="false">${emojiText}</span>`,
					type: 'emoji'
				});
			}
		}
	});

	markdown.forEach((mark: IMarkdownOnMessage) => {
		if (mark.s !== undefined && mark.e !== undefined) {
			const markdownText = text.substring(mark.s, mark.e);
			let markdownFormatted = '';

			switch (mark.type) {
				case EBacktickType.PRE:
					markdownFormatted = `\`\`\`${markdownText}\`\`\``;
					break;
				case EBacktickType.CODE:
					markdownFormatted = `\`${markdownText}\``;
					break;
				case EBacktickType.BOLD:
					markdownFormatted = `**${markdownText}**`;
					break;
				// case EBacktickType.SINGLE:
				//   markdownFormatted = `*${markdownText}*`;
				//   break;
				case EBacktickType.LINK:
					markdownFormatted = markdownText;
					break;
				default:
					markdownFormatted = markdownText;
					break;
			}

			allEntities.push({
				start: mark.s,
				end: mark.e,
				html: markdownFormatted,
				type: 'markdown'
			});
		}
	});

	allEntities.sort((a, b) => a.start - b.start);

	let result = '';
	let lastIndex = 0;

	allEntities.forEach((entity) => {
		const beforeEntityText = text.substring(lastIndex, entity.start);
		const escapedBeforeText = escapeHtml(beforeEntityText);

		result += escapedBeforeText;

		if (entity.type === 'markdown') {
			const markdownMatch = markdown.find((m) => m.s === entity.start && m.e === entity.end);
			if (markdownMatch && (markdownMatch.type === EBacktickType.PRE || markdownMatch.type === EBacktickType.CODE)) {
				const codeContent = text.substring(entity.start, entity.end);
				const escapedCodeContent = escapeHtml(codeContent);

				if (markdownMatch.type === EBacktickType.PRE) {
					result += `\`\`\`${escapedCodeContent}\`\`\``;
				} else {
					result += `\`${escapedCodeContent}\``;
				}
			} else {
				result += entity.html;
			}
		} else {
			result += entity.html;
		}

		lastIndex = entity.end;
	});

	const remainingText = text.substring(lastIndex);
	const escapedRemainingText = escapeHtml(remainingText);

	result += escapedRemainingText;

	return result;
};
