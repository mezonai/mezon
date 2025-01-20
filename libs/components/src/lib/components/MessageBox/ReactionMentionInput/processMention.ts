import { ChannelMembersEntity, RolesClanEntity } from '@mezon/store';
import {
	ETypeMEntion,
	IBoldTextOnMessage,
	IEmojiOnMessage,
	IHashtagOnMessage,
	IMarkdownOnMessage,
	IMentionOnMessage,
	filterItemsOutsideMarkdown,
	getRoleList,
	uniqueUsers
} from '@mezon/utils';
import { MentionItem } from 'react-mentions';

const processMention = (
	mentionsRaw: MentionItem[],
	roles: RolesClanEntity[],
	membersOfChild: ChannelMembersEntity[],
	membersOfParent: ChannelMembersEntity[],
	refereceSenderId?: string,
	boldTextList?: IBoldTextOnMessage[],
	backTickList?: IMarkdownOnMessage[]
) => {
	const roleList = getRoleList(roles);
	const mentions: IMentionOnMessage[] = [];
	const hashtags: IHashtagOnMessage[] = [];
	const emojis: IEmojiOnMessage[] = [];
	const boldTextAndBacktick = [...(boldTextList ?? []), ...(backTickList ?? [])];

	mentionsRaw?.forEach((item) => {
		const { id, display, plainTextIndex, childIndex } = item;
		const s = plainTextIndex;
		const e = plainTextIndex + display.length;
		const isRole = roleList.some((role) => role.roleId === id);

		if (childIndex === ETypeMEntion.MENTION) {
			if (isRole) {
				mentions.push({
					role_id: id,
					s,
					e
				});
			} else {
				mentions.push({
					user_id: id,
					s,
					e
				});
			}
		} else if (childIndex === ETypeMEntion.HASHTAG) {
			hashtags.push({
				channelid: id,
				s,
				e
			});
		} else if (childIndex === ETypeMEntion.EMOJI) {
			emojis.push({
				emojiid: id,
				s,
				e
			});
		}
	});

	const mentionOutsideMardown = filterItemsOutsideMarkdown(mentions, boldTextAndBacktick);
	const hashtagOutsideMardown = filterItemsOutsideMarkdown(hashtags, boldTextAndBacktick);
	const emojiOutsideMardown = filterItemsOutsideMarkdown(emojis, boldTextAndBacktick);
	const userIds = uniqueUsers(mentionOutsideMardown, membersOfChild, roles, [refereceSenderId || '']) as string[];
	const usersNotExistingInThread = userIds.filter((userId) => membersOfParent?.some((member) => member.id === userId)) as string[];

	return {
		usersNotExistingInThread,
		mentionList: mentionOutsideMardown,
		hashtagList: hashtagOutsideMardown,
		emojiList: emojiOutsideMardown
	};
};

export default processMention;
