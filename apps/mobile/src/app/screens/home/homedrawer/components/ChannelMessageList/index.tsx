import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { size, useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, Platform, View } from 'react-native';
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
		const styles = style(themeValue);
		const keyExtractor = useCallback((message: MessagesEntity) => `${message?.id}_${message?.channel_id}`, []);
		const initialScrollIndexRef = useRef(initialScrollIndex);
		const needsInitialScroll = initialScrollIndexRef.current !== undefined && initialScrollIndexRef.current > 0;
		const hasScrolled = useRef(false);
		const [isReady, setIsReady] = useState(!needsInitialScroll);
		const opacityAnim = useRef(new Animated.Value(needsInitialScroll ? 0 : 1)).current;

		const isCannotLoadMore = useMemo(() => {
			const lastMessage = messages?.[messages?.length - 1];
			return lastMessage?.sender_id === '0' && !lastMessage?.content?.t && lastMessage?.username?.toLowerCase() === 'system';
		}, [messages]);

		const handleEndReached = useCallback(() => {
			if (messages?.length && !isCannotLoadMore) {
				onLoadMore(ELoadMoreDirection.top);
			}
		}, [messages?.length, isCannotLoadMore, onLoadMore]);

		const showList = useCallback(() => {
			if (!isReady) {
				setIsReady(true);
				opacityAnim.setValue(1);
			}
		}, [isReady, opacityAnim]);

		const handleLayout = useCallback(() => {
			if (!needsInitialScroll || hasScrolled.current) {
				return;
			}

			hasScrolled.current = true;
			const targetIndex = initialScrollIndexRef.current || 0;

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (flatListRef.current && targetIndex > 0) {
						flatListRef.current.scrollToIndex({
							index: targetIndex,
							animated: false,
							viewPosition: 0.5
						});
					}
					showList();
				});
			});
		}, [needsInitialScroll, flatListRef, showList]);

		useEffect(() => {
			if (!needsInitialScroll || isReady) return;

			const timeout = setTimeout(() => {
				showList();
			}, 300);

			return () => clearTimeout(timeout);
		}, [needsInitialScroll, isReady, showList]);

		return (
			<Animated.View style={{ flex: 1, opacity: opacityAnim }}>
				<FlatList
					data={messages}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					inverted={true}
					bounces={false}
					showsVerticalScrollIndicator={true}
					contentContainerStyle={styles.listChannels}
					initialNumToRender={needsInitialScroll ? Math.max((initialScrollIndexRef.current || 0) + 10, 20) : 10}
					maxToRenderPerBatch={15}
					windowSize={15}
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
								showList();
							});
						} else {
							showList();
						}
					}}
					disableVirtualization={Platform.OS === 'ios'}
				/>
			</Animated.View>
		);
	}
);
export default ChannelListMessage;
