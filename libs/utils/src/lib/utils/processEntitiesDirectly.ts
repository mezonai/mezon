import type { IEmojiOnMessage, IHashtagOnMessage, IMarkdownOnMessage, IMentionOnMessage } from '../types';
import { EBacktickType } from '../types';

export const processEntitiesDirectly = (entities: any[], content: string, rolesClan: any[]) => {
	const mentions: IMentionOnMessage[] = [];
	const hashtags: IHashtagOnMessage[] = [];
	const emojis: IEmojiOnMessage[] = [];
	const markdown: IMarkdownOnMessage[] = [];

	entities.forEach((entity: any) => {
		const { type, offset, length, userId, id, documentId, role_id } = entity;

		const s = offset;
		const e = offset + length;
		const display = content.substring(offset, offset + length);

		switch (type) {
			case 'MessageEntityMentionName':
				if (userId) {
					const isRole = rolesClan.some((role) => role.roleId === userId);
					mentions.push({
						role_id: isRole ? userId : undefined,
						user_id: !isRole ? userId : undefined,
						s,
						e,
						display
					});
				}
				break;

			case 'MessageEntityMentionRole':
				mentions.push({
					role_id,
					s,
					e,
					display
				});
				break;

			case 'MessageEntityHashtag':
				if (id) {
					hashtags.push({
						s,
						e,
						channelId: id
					});
				}
				break;

			case 'MessageEntityCustomEmoji':
				if (documentId) {
					emojis.push({
						s,
						e,
						emojiid: documentId
					});
				}
				break;

			case 'MessageEntityBold':
				markdown.push({ s, e, type: EBacktickType.BOLD });
				break;

			case 'MessageEntityUnderline':
				markdown.push({ s, e, type: EBacktickType.CODE });
				break;

			case 'MessageEntityCode':
				markdown.push({ s, e, type: EBacktickType.CODE });
				break;

			case 'MessageEntityPre':
				markdown.push({ s, e, type: EBacktickType.PRE });
				break;

			case 'MessageEntityTextUrl':
				markdown.push({ s, e, type: EBacktickType.LINK });
				break;

			case 'MessageEntityUrl':
				markdown.push({ s, e, type: EBacktickType.LINK });
				break;

			default:
				break;
		}
	});

	return { mentions, hashtags, emojis, markdown };
};
