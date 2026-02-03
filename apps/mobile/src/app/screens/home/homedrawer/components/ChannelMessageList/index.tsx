import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { size, useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import { FlatList } from 'react-native-gesture-handler';
import { style } from './styles';

interface IChannelListMessageProps {
	flatListRef: React.RefObject<FlatList<MessagesEntity>>;
	messages: MessagesEntity[];
	handleScroll: (event) => void;
	renderItem: ({ item }: { item: MessagesEntity }) => React.ReactElement;
	onLoadMore: (direction: ELoadMoreDirection) => void;
	isLoadMoreBottom: boolean;
	lastSeenMessageId?: string;
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

const ChannelListMessage = React.memo(
	({ flatListRef, messages, handleScroll, renderItem, onLoadMore, isLoadMoreBottom, lastSeenMessageId }: IChannelListMessageProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const hasJumpedToLastSeen = useRef(false);
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

		useEffect(() => {
			if (!lastSeenMessageId || !messages?.length || hasJumpedToLastSeen.current) {
				return;
			}

			const indexToJump = messages?.findIndex?.((message: { id: string }) => message.id === lastSeenMessageId);
			hasJumpedToLastSeen.current = true;

			if (indexToJump !== -1 && indexToJump >= 5) {
				flatListRef.current?.scrollToIndex({
					index: indexToJump,
					animated: true,
					viewOffset: 0,
					viewPosition: 0.5
				});
			}
		}, [flatListRef, lastSeenMessageId, messages]);

		return (
			<FlatList
				data={messages}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				inverted={true}
				bounces={false}
				showsVerticalScrollIndicator={true}
				contentContainerStyle={styles.listChannels}
				initialNumToRender={5}
				maxToRenderPerBatch={10}
				windowSize={10}
				onEndReachedThreshold={0.2}
				maintainVisibleContentPosition={{
					minIndexForVisible: Platform.OS === 'ios' && messages?.length <= 2 ? 0 : 1,
					autoscrollToTopThreshold: isLoadMoreBottom ? undefined : 1000
				}}
				ref={flatListRef}
				onScroll={handleScroll}
				keyboardShouldPersistTaps={'handled'}
				keyboardDismissMode={'interactive'}
				onEndReached={handleEndReached}
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
						flatListRef.current?.scrollToIndex({ index: info.highestMeasuredFrameIndex, animated: true, viewPosition: 0.5 });
						wait.then(() => {
							flatListRef.current?.scrollToIndex({ index: info?.index, animated: true, viewPosition: 0.5 });
						});
					}
				}}
				disableVirtualization={Platform.OS === 'ios'}
			/>
		);
	}
);
export default ChannelListMessage;
