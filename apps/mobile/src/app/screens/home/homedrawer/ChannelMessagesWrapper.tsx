import { useTheme } from '@mezon/mobile-ui';
import type { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { View } from 'react-native';
import ChannelMessages from './ChannelMessages';
import { style } from './styles';

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
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={styles.channelMessagesWrapperContainer}>
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
