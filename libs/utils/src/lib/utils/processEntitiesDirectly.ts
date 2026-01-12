import type { IEmojiOnMessage, IHashtagOnMessage, IMarkdownOnMessage, IMentionOnMessage } from '../types';
import { EBacktickType } from '../types';

export const processEntitiesDirectly = (entities: any[], content: string, rolesClan: any[]) => {
	const mentions: IMentionOnMessage[] = [];
	const hashtags: IHashtagOnMessage[] = [];
	const emojis: IEmojiOnMessage[] = [];
	const markdown: IMarkdownOnMessage[] = [];

	entities.forEach((entity: any) => {
		const { type, offset, length, user_id, id, document_id, role_id } = entity;

		const s = offset;
		const e = offset + length;
		const display = content.substring(offset, offset + length);

		switch (type) {
			case 'MessageEntityMentionName':
				if (user_id) {
					const isRole = rolesClan.some((role) => role.roleId === user_id);
					mentions.push({
						role_id: isRole ? user_id : undefined,
						user_id: !isRole ? user_id : undefined,
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
						channelid: id
					});
				}
				break;

			case 'MessageEntityCustomEmoji':
				if (document_id) {
					emojis.push({
						s,
						e,
						emojiid: document_id
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
