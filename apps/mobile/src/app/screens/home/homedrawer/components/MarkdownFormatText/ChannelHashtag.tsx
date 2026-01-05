import { type ChannelsEntity } from '@mezon/store-mobile';
import { ChannelType } from 'mezon-js';

type IChannelHashtag = {
	channelHashtagId: string;
	channelEntity: ChannelsEntity;
};
export const ChannelHashtag = ({ channelHashtagId, channelEntity }: IChannelHashtag) => {
	const channel = channelEntity || {
		id: channelHashtagId,
		channelLabel: 'unknown'
	};

	const dataPress = `${channel.type}***${channel.channelId}***${channel.clanId}***${channel.status}***${channel.meeting_code}***${channel.categoryId}`;

	if (channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
		return `[${channel.channelLabel}](##voice${JSON.stringify(dataPress)})`;
	}
	if (channel.type === ChannelType.CHANNEL_TYPE_STREAMING) {
		return `[${channel.channelLabel}](#stream${JSON.stringify(dataPress)})`;
	}
	if (channel.type === ChannelType.CHANNEL_TYPE_APP) {
		return `[${channel.channelLabel}](#app${JSON.stringify(dataPress)})`;
	}
	if (channel.parent_id !== '0') {
		return `[${channel.channelLabel}](#thread${JSON.stringify(dataPress)})`;
	}
	return channel['channelId']
		? `[#${channel.channelLabel}](#${JSON.stringify(dataPress)})`
		: `[\\# ${channel.channelLabel}](#${JSON.stringify(dataPress)})`;
};
