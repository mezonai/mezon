// eslint-disable-next-line @nx/enforce-module-boundaries
import { ChannelsEntity } from '@mezon/store-mobile';
import {
	EBacktickType,
	ETokenMessage,
	IEmojiOnMessage,
	IExtendedMessage,
	IHashtagOnMessage,
	ILinkOnMessage,
	ILinkVoiceRoomOnMessage,
	IMarkdownOnMessage,
	IMentionOnMessage,
	IMessageWithUser
} from '@mezon/utils';
import { ChannelStreamMode, HashtagDm } from 'mezon-js';

export const convertMentionsToText = (text: string) => {
	if (!text) {
		return '';
	}
	const mentionPattern = /{@}\[([^\]]+)\]\(\d+\)|{#}\[([^\]]+)\]\((\d+)\)|\{:\}\[([^\]]+)\]\(([^)]+)\)/g;

	return text?.replace(mentionPattern, (match, userMention, hashtagMention, hashtagId, tagValue) => {
		if (userMention) {
			return `@[${userMention}]`;
		} else if (hashtagMention && hashtagId) {
			return `<#${hashtagMention}>`;
		} else if (tagValue) {
			return `${tagValue}`;
		} else {
			return match;
		}
	});
};
export const convertMentionsToData = (text: string) => {
	const mentionPattern = /({@}|{#})\[([^\]]+)\]\((\d+)\)/g;
	const result = [];
	let match;
	while ((match = mentionPattern.exec(text)) !== null) {
		const prefix = match[1];
		const mention = match[2];
		const id = match[3];
		result.push({
			id: id,
			display: `${prefix === '{@}' ? '@' : '#'}${mention}`
		});
	}
	return result;
};

export const getChannelHashtag = (hashtagDmEntities: HashtagDm[], channelsEntities: ChannelsEntity[], mode: number, channelLabel: string) => {
	if ([ChannelStreamMode.STREAM_MODE_DM].includes(mode)) {
		return hashtagDmEntities?.find((item) => item?.channel_label === channelLabel);
	} else {
		return channelsEntities?.find((item) => item?.channel_label === channelLabel);
	}
};

type EmojiPicked = {
	shortName: string;
	s?: number;
	e?: number;
};

type ElementToken =
	| (IMentionOnMessage & { kindOf: ETokenMessage.MENTIONS })
	| (IHashtagOnMessage & { kindOf: ETokenMessage.HASHTAGS })
	| (IEmojiOnMessage & { kindOf: ETokenMessage.EMOJIS })
	| (ILinkOnMessage & { kindOf: ETokenMessage.LINKS })
	| (IMarkdownOnMessage & { kindOf: ETokenMessage.MARKDOWNS })
	| (ILinkVoiceRoomOnMessage & { kindOf: ETokenMessage.VOICE_LINKS });

export const createFormattedString = (data: IExtendedMessage) => {
	const { t = '' } = data;
	const elements: ElementToken[] = (Object.keys(data) as (keyof IExtendedMessage)[])
		.flatMap((key) => (Array.isArray(data[key]) ? data[key].map((item) => item && { ...item, kindOf: key }) : []))
		.filter(Boolean) as ElementToken[];
	elements?.sort((a, b) => (a.s ?? 0) - (b.s ?? 0));
	let formatContentDraft = '';
	const emojiPicked: EmojiPicked[] = [];
	let lastIndex = 0;

	elements?.forEach((element) => {
		const startindex = element.s ?? lastIndex;
		const endindex = element.e ?? startindex;
		formatContentDraft += t.slice(lastIndex, startindex);
		const contentInElement = t.substring(startindex, endindex);

		switch (element.kindOf) {
			case ETokenMessage.MENTIONS:
				if (element.user_id || element.role_id) {
					const id = element.user_id ?? element.role_id;
					formatContentDraft += `{@}[${contentInElement.slice(1)}](${id})`;
				}
				break;
			case ETokenMessage.HASHTAGS:
				formatContentDraft += `{#}[${contentInElement.slice(1)}](${element.channelid})`;
				break;
			case ETokenMessage.EMOJIS:
				emojiPicked?.push({ ...element, shortName: contentInElement });
				formatContentDraft += contentInElement;
				break;
			case ETokenMessage.MARKDOWNS:
				if (element?.type === EBacktickType.LINKYOUTUBE || element?.type === EBacktickType.LINK || element?.type === EBacktickType.VOICE_LINK) {
					formatContentDraft += contentInElement?.replace(/^```|```$/g, '');
				} else if (element?.type === EBacktickType.PRE || element?.type === EBacktickType.TRIPLE) {
					formatContentDraft += '```' + contentInElement?.replace(/^```|```$/g, '') + '```';
				} else if (element?.type === EBacktickType.BOLD) {
					formatContentDraft += `**${contentInElement}**`;
				} else if (element?.type === EBacktickType.CODE || element?.type === EBacktickType.SINGLE) {
					formatContentDraft += '`' + contentInElement?.replace(/^`|`$/g, '') + '`';
				} else {
					formatContentDraft += contentInElement;
				}
				break;
			default:
				formatContentDraft += contentInElement;
				break;
		}

		lastIndex = endindex;
	});
	formatContentDraft += t.slice(lastIndex);
	return { formatContentDraft, emojiPicked };
};

export const formatContentEditMessage = (message: IMessageWithUser) => {
	const processedContentMentionsDraft = {
		t: message?.content?.t,
		hg: message?.content?.hg,
		ej: message?.content?.ej,
		lk: message?.content?.lk,
		mk: message?.content?.mk,
		vk: message?.content?.vk,
		mentions: message?.mentions
	};
	const { formatContentDraft, emojiPicked } = createFormattedString(processedContentMentionsDraft);

	return { formatContentDraft, emojiPicked };
};
