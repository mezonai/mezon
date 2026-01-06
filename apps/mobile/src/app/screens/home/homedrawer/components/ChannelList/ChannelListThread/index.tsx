import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannelId } from '@mezon/store-mobile';
import { ChannelThreads, IChannel } from '@mezon/utils';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import ChannelListThreadItem from '../ChannelListThreadItem';
import { style } from './styles';

type IListChannelThreadProps = {
	threads: IChannel[];
	onPress: (thread: IChannel) => void;
	onLongPress?: (thread: ChannelThreads) => void;
};

const ListChannelThread = React.memo(({ threads, onPress, onLongPress }: IListChannelThreadProps) => {
	const styles = style(useTheme().themeValue);
	const currentChanelId = useSelector(selectCurrentChannelId);
	return (
		<View style={styles.containerThreadList}>
			{threads.map((thread, index) => {
				const isFirstThread = threads.indexOf(thread) === 0;
				const isActive = currentChanelId === thread.channelId;

				return (
					<ChannelListThreadItem
						key={`${thread?.id}_channel_thread_item${index}`}
						thread={thread}
						isActive={isActive}
						isFirstThread={isFirstThread}
						onPress={onPress}
						onLongPress={onLongPress}
					/>
				);
			})}
		</View>
	);
});

export default ListChannelThread;
