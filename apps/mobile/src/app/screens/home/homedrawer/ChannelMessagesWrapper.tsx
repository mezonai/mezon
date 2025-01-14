import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { View } from 'react-native';
import ChannelMessageActionListener from './ChannelMessageActionListener';
import ChannelMessageListener from './ChannelMessageListener';
import ChannelMessageReactionListener from './ChannelMessageReactionListener';
import ChannelMessages from './ChannelMessages';

type ChannelMessagesProps = {
	channelId: string;
	topicId?: string;
	clanId: string;
	avatarDM?: string;
	mode: ChannelStreamMode;
	isPublic?: boolean;
	isDM?: boolean;
	isDisableLoadMore?: boolean;
	isDisableActionListener?: boolean;
};

const ChannelMessagesWrapper = React.memo(
	({ channelId, topicId, clanId, mode, isPublic, isDM, isDisableLoadMore, isDisableActionListener = false }: ChannelMessagesProps) => {
		return (
			<View style={{ flex: 1 }}>
				<ChannelMessages
					channelId={channelId}
					topicId={topicId}
					clanId={clanId}
					mode={mode}
					isDM={isDM}
					isPublic={isPublic}
					isDisableLoadMore={isDisableLoadMore}
				/>
				<ChannelMessageListener />
				<ChannelMessageReactionListener />
				{!isDisableActionListener && <ChannelMessageActionListener mode={mode} isPublic={isPublic} clanId={clanId} channelId={channelId} />}
			</View>
		);
	}
);

export default ChannelMessagesWrapper;
