import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { size, useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import React, { useCallback, useMemo, useRef } from 'react';
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
	initialScrollIndex?: number;
}

const VIEWABILITY_CONFIG = {
	minimumViewTime: 0,
	viewAreaCoveragePercentThreshold: 0,
	itemVisiblePercentThreshold: 0,
	waitForInteraction: false
};

export const ViewLoadMore = ({ isLoadMoreTop = false }: { isLoadMoreTop?: boolean }) => {
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue), [themeValue]);

	return (
		<View style={[styles.wrapperLoadMore, isLoadMoreTop ? { top: 0 } : { bottom: 0 }]}>
			<Flow size={size.s_30} color={themeValue.text} />
		</View>
	);
};

const ChannelListMessage = React.memo(
	({
		flatListRef,
		messages,
		handleScroll,
		renderItem,
		onLoadMore,
		isLoadMoreBottom,
		lastSeenMessageId: _lastSeenMessageId,
		initialScrollIndex
	}: IChannelListMessageProps) => {
		const { themeValue } = useTheme();
		const styles = useMemo(() => style(themeValue), [themeValue]);
		const keyExtractor = useCallback((message: MessagesEntity) => `${message?.id}_${message?.channel_id}`, []);
		const initialScrollIndexRef = useRef(initialScrollIndex);
		const needsInitialScroll = initialScrollIndexRef.current !== undefined && initialScrollIndexRef.current > 0;
		const needsDelayedScroll = needsInitialScroll;
		const hasScrolled = useRef(false);

		const isCannotLoadMore = useMemo(() => {
			const lastMessage = messages?.[messages?.length - 1];
			return lastMessage?.sender_id === '0' && !lastMessage?.content?.t && lastMessage?.username?.toLowerCase() === 'system';
		}, [messages]);

		const handleEndReached = useCallback(() => {
			if (messages?.length && !isCannotLoadMore) {
				onLoadMore(ELoadMoreDirection.top);
			}
		}, [messages?.length, isCannotLoadMore, onLoadMore]);

		const handleScrollBeginDrag = useCallback(() => {
			Keyboard.dismiss();
		}, []);

		const handleLayout = useCallback(() => {
			if (!needsDelayedScroll || hasScrolled.current) {
				return;
			}

			hasScrolled.current = true;

			requestAnimationFrame(() => {
				if (flatListRef.current && needsInitialScroll) {
					const targetIndex = initialScrollIndexRef.current || 0;
					if (targetIndex > 0) {
						flatListRef.current.scrollToIndex({
							index: targetIndex,
							animated: false,
							viewPosition: 0.5
						});
					}
				}
			});
		}, [needsDelayedScroll, needsInitialScroll, flatListRef]);

		return (
			<View style={{ flex: 1 }}>
				<FlatList
					data={messages}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					inverted={true}
					bounces={false}
					showsVerticalScrollIndicator={true}
					contentContainerStyle={styles.listChannels}
					initialNumToRender={needsDelayedScroll ? Math.max((initialScrollIndexRef.current || 0) + 10, 20) : 10}
					maxToRenderPerBatch={15}
					windowSize={15}
					onEndReachedThreshold={0.1}
					maintainVisibleContentPosition={{
						minIndexForVisible: Platform.OS === 'ios' && messages?.length <= 2 ? 0 : 1,
						autoscrollToTopThreshold: isLoadMoreBottom ? undefined : 1000
					}}
					ref={flatListRef}
					onScroll={handleScroll}
					keyboardShouldPersistTaps={'handled'}
					keyboardDismissMode={'interactive'}
					onEndReached={handleEndReached}
					onScrollBeginDrag={handleScrollBeginDrag}
					viewabilityConfig={VIEWABILITY_CONFIG}
					contentInsetAdjustmentBehavior="automatic"
					onLayout={handleLayout}
					onScrollToIndexFailed={(info) => {
						if (info?.highestMeasuredFrameIndex > 0) {
							flatListRef.current?.scrollToIndex({
								index: info.highestMeasuredFrameIndex,
								animated: false,
								viewPosition: 0.5
							});
							requestAnimationFrame(() => {
								if (info?.index <= messages?.length) {
									flatListRef.current?.scrollToIndex({
										index: info.index,
										animated: false,
										viewPosition: 0.5
									});
								}
							});
						}
					}}
				/>
			</View>
		);
	}
);
export default ChannelListMessage;
