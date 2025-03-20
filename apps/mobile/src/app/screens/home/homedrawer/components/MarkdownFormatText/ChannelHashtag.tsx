import { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStreamMode, ChannelType, HashtagDm } from 'mezon-js';

type IChannelHashtag = {
	channelHashtagId: string;
	currentChannelId?: string;
	hashtagDmEntities?: Record<string, HashtagDm>;
	channelsEntities: Record<string, ChannelsEntity>;
	mode?: number;
};
export const ChannelHashtag = ({ channelHashtagId, currentChannelId, mode, hashtagDmEntities, channelsEntities }: IChannelHashtag) => {
	const getChannelById = (channelHashtagId: string): ChannelsEntity => {
		let channel;
		if (currentChannelId && [ChannelStreamMode.STREAM_MODE_DM].includes(mode)) {
			channel = hashtagDmEntities?.[channelHashtagId];
		} else {
			channel = channelsEntities[channelHashtagId];
		}
		if (channel) {
			return channel;
		}

		return {
			id: channelHashtagId,
			channel_label: 'unknown'
		};
	};

	const channel = getChannelById(channelHashtagId);

	const dataPress = `${channel.type}_${channel.channel_id}_${channel.clan_id}_${channel.status}_${channel.meeting_code}_${channel.category_id}`;

	if (channel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
		return `[${channel.channel_label}](##voice${JSON.stringify(dataPress)})`;
	}
	if (channel.type === ChannelType.CHANNEL_TYPE_STREAMING) {
		return `[${channel.channel_label}](#stream${JSON.stringify(dataPress)})`;
	}
	if (channel.parent_id !== '0') {
		return `[${channel.channel_label}](#thread${JSON.stringify(dataPress)})`;
	}
	return channel['channel_id']
		? `[#${channel.channel_label}](#${JSON.stringify(dataPress)})`
		: `[\\# ${channel.channel_label}](#${JSON.stringify(dataPress)})`;
};
