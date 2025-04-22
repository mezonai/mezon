import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { View } from 'react-native';
import ChannelMessages from './ChannelMessages';

type ChannelMessagesProps = {
	channelId: string;
	topicId?: string;
	clanId: string;
	avatarDM?: string;
	mode: ChannelStreamMode;
	isPublic?: boolean;
	isDM?: boolean;
	topicChannelId?: string;
};

const ChannelMessagesWrapper = React.memo(({ channelId, topicId, clanId, mode, isPublic, isDM, topicChannelId }: ChannelMessagesProps) => {
	return (
		<View style={{ flex: 1 }}>
			<ChannelMessages
				channelId={channelId}
				topicId={topicId}
				clanId={clanId}
				mode={mode}
				isDM={isDM}
				isPublic={isPublic}
				topicChannelId={topicChannelId}
			/>
		</View>
	);
});

export default ChannelMessagesWrapper;
