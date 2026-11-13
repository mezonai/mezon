import type { IEmojiOnMessage, IExtendedMessage, IHashtagOnMessage, IMarkdownOnMessage, IMentionOnMessage } from '../types';
import { EBacktickType } from '../types/messageLine';

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
			if (mention.user_id && mention.user_id !== '0') {
				allEntities.push({
					start,
					end,
					html: `<a class="text-entity-link mention" data-entity-type="MessageEntityMentionName" data-user-id="${mention.user_id}" contenteditable="false" dir="auto">${mentionText}</a>`,
					type: 'mention'
				});
			} else if (mention.role_id && mention.role_id !== '0') {
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

			if (hashtag.channelId) {
				allEntities.push({
					start: hashtag.s,
					end: hashtag.e,
					html: `<a class="text-entity-link hashtag" data-entity-type="MessageEntityHashtag" data-id="${hashtag.channelId}" contenteditable="false" dir="auto">${hashtagText}</a>`,
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

	const styleByRange = new Map<string, { s: number; e: number; bold: boolean; italic: boolean; strike: boolean }>();

	markdown.forEach((mark: IMarkdownOnMessage) => {
		if (mark.s !== undefined && mark.e !== undefined) {
			if (mark.type === EBacktickType.PRE || mark.type === EBacktickType.CODE) {
				const codeContent = text.substring(mark.s, mark.e);
				const escapedCodeContent = escapeHtml(codeContent);
				const markdownFormatted = mark.type === EBacktickType.PRE ? `\`\`\`${escapedCodeContent}\`\`\`` : `\`${escapedCodeContent}\``;

				allEntities.push({
					start: mark.s,
					end: mark.e,
					html: markdownFormatted,
					type: 'markdown'
				});
			} else if (
				mark.s < mark.e &&
				(mark.type === EBacktickType.BOLD || mark.type === EBacktickType.ITALIC || mark.type === EBacktickType.STRIKE)
			) {
				const s = Math.max(0, mark.s);
				const e = Math.min(text.length, mark.e);
				if (s < e) {
					const key = `${s}:${e}`;
					const entry = styleByRange.get(key) ?? { s, e, bold: false, italic: false, strike: false };
					if (mark.type === EBacktickType.BOLD) entry.bold = true;
					if (mark.type === EBacktickType.ITALIC) entry.italic = true;
					if (mark.type === EBacktickType.STRIKE) entry.strike = true;
					styleByRange.set(key, entry);
				}
			}
		}
	});

	const styleEntries = Array.from(styleByRange.values());
	const styleMarkers: Array<{ s: number; e: number; marker: string; rank: number }> = [];

	styleEntries.forEach((entry) => {
		if (entry.strike) {
			styleMarkers.push({ s: entry.s, e: entry.e, marker: '~~', rank: 3 });
		}
		if (entry.bold && entry.italic) {
			styleMarkers.push({ s: entry.s, e: entry.e, marker: '***', rank: 2 });
		} else if (entry.bold) {
			styleMarkers.push({ s: entry.s, e: entry.e, marker: '**', rank: 1 });
		} else if (entry.italic) {
			const sharesBoundWithBold = styleEntries.some((other) => other !== entry && other.bold && (other.s === entry.s || other.e === entry.e));
			styleMarkers.push({ s: entry.s, e: entry.e, marker: sharesBoundWithBold ? '_' : '*', rank: 0 });
		}
	});

	allEntities.sort((a, b) => a.start - b.start);

	const splitPointSet = new Set<number>([0, text.length]);
	allEntities.forEach((entity) => {
		splitPointSet.add(Math.max(0, Math.min(text.length, entity.start)));
		splitPointSet.add(Math.max(0, Math.min(text.length, entity.end)));
	});
	styleMarkers.forEach((sm) => {
		splitPointSet.add(sm.s);
		splitPointSet.add(sm.e);
	});
	const splitPoints = Array.from(splitPointSet).sort((a, b) => a - b);

	let result = '';
	let cursor = 0;

	while (cursor <= text.length) {
		if (cursor > 0) {
			const closing = styleMarkers.filter((sm) => sm.e === cursor).sort((a, b) => b.s - a.s || a.rank - b.rank);
			closing.forEach((sm) => {
				result += sm.marker;
			});
		}

		if (cursor === text.length) {
			break;
		}

		const opening = styleMarkers.filter((sm) => sm.s === cursor).sort((a, b) => b.e - a.e || b.rank - a.rank);
		opening.forEach((sm) => {
			result += sm.marker;
		});

		const entityAtCursor = allEntities.find((entity) => entity.start === cursor && entity.end > cursor);
		if (entityAtCursor) {
			result += entityAtCursor.html;
			cursor = entityAtCursor.end;
		} else {
			const nextPos = splitPoints.find((p) => p > cursor) ?? text.length;
			result += escapeHtml(text.substring(cursor, nextPos));
			cursor = nextPos;
		}
	}

	return result;
};
