import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { size, useTheme } from '@mezon/mobile-ui';
import { MessagesEntity } from '@mezon/store-mobile';
import React, { useCallback, useMemo } from 'react';
import { Keyboard, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import { FlatList } from 'react-native-gesture-handler';
import { style } from './styles';

interface IChannelListMessageProps {
	flatListRef: React.RefObject<FlatList<MessagesEntity>>;
	messages: MessagesEntity[];
	handleScroll: (event) => void;
	renderItem: ({ item }: { item: MessagesEntity }) => React.ReactElement;
	onLoadMore: (direction: ELoadMoreDirection) => void;
}

export const ViewLoadMore = ({ isLoadMoreTop = false }: { isLoadMoreTop?: boolean }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	return (
		<View style={[styles.wrapperLoadMore, isLoadMoreTop ? { top: 0 } : { bottom: 0 }]}>
			<Flow size={size.s_30} color={themeValue.text} />
		</View>
	);
};

const ChannelListMessage = React.memo(({ flatListRef, messages, handleScroll, renderItem, onLoadMore }: IChannelListMessageProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const keyExtractor = useCallback((message) => `${message?.id}_${message?.channel_id}`, []);

	const isCannotLoadMore = useMemo(() => {
		const lastMessage = messages?.[messages?.length - 1];

		return lastMessage?.sender_id === '0' && !lastMessage?.content?.t && lastMessage?.username?.toLowerCase() === 'system';
	}, [messages]);

	const handleEndReached = () => {
		if (messages?.length && !isCannotLoadMore) {
			onLoadMore(ELoadMoreDirection.top);
		}
	};
	return (
		<FlatList
			data={messages}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			inverted={true}
			showsVerticalScrollIndicator={true}
			contentContainerStyle={styles.listChannels}
			initialNumToRender={5}
			maxToRenderPerBatch={10}
			windowSize={10}
			onEndReachedThreshold={0.7}
			maintainVisibleContentPosition={{
				minIndexForVisible: 0,
				autoscrollToTopThreshold: 10
			}}
			ref={flatListRef}
			// overrideProps={{ isInvertedVirtualizedList: true }}
			onMomentumScrollEnd={handleScroll}
			keyboardShouldPersistTaps={'handled'}
			// removeClippedSubviews={false}
			// decelerationRate={'fast'}
			// updateCellsBatchingPeriod={100}
			onEndReached={handleEndReached}
			// scrollEventThrottle={16}
			// estimatedItemSize={220}
			onScrollBeginDrag={() => {
				Keyboard.dismiss();
			}}
			viewabilityConfig={{
				minimumViewTime: 0,
				viewAreaCoveragePercentThreshold: 0,
				itemVisiblePercentThreshold: 0,
				waitForInteraction: false
			}}
			contentInsetAdjustmentBehavior="automatic"
			onScrollToIndexFailed={(info) => {
				const wait = new Promise((resolve) => setTimeout(resolve, 200));
				if (info?.highestMeasuredFrameIndex < info?.index && info?.index <= messages?.length) {
					flatListRef.current?.scrollToIndex({ index: info.highestMeasuredFrameIndex, animated: true });
					wait.then(() => {
						flatListRef.current?.scrollToIndex({ index: info?.index, animated: true });
					});
				}
			}}
			disableVirtualization
		/>
	);
});
export default ChannelListMessage;
