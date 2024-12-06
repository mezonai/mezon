// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { ActionEmitEvent, Icons, load, save, STORAGE_CHANNEL_CURRENT_CACHE } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import {
	messagesActions,
	RootState,
	selectHasMoreBottomByChannelId,
	selectHasMoreMessageByChannelId,
	selectIdMessageToJump,
	selectIsMessageIdExist,
	selectIsViewingOlderMessagesByChannelId,
	selectMessageIsLoading,
	selectMessagesByChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { Direction_Mode, LIMIT_MESSAGE, sleep } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, LayoutAnimation, Platform, TouchableOpacity, UIManager, View } from 'react-native';
import { useSelector } from 'react-redux';
import MessageItemSkeleton from '../../../components/Skeletons/MessageItemSkeleton';
import ChannelMessageList from './components/ChannelMessageList';
import { MessageUserTyping } from './components/MessageUserTyping';
import MessageItem from './MessageItem';
import { style } from './styles';

type ChannelMessagesProps = {
	channelId: string;
	clanId: string;
	mode: ChannelStreamMode;
	isDM?: boolean;
	isPublic?: boolean;
};

const getEntitiesArray = (state: any) => {
	if (!state?.ids) return [];
	return state.ids.map((id) => state?.entities?.[id])?.reverse();
};

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}
}

const ChannelMessages = React.memo(({ channelId, clanId, mode, isDM, isPublic }: ChannelMessagesProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const selectMessagesByChannelMemoized = useAppSelector((state) => selectMessagesByChannel(state, channelId));
	const messages = useMemo(() => getEntitiesArray(selectMessagesByChannelMemoized), [selectMessagesByChannelMemoized]);
	const isLoading = useSelector((state: RootState) => state?.messages?.loadingStatus);
	const [isShowSkeleton, setIsShowSkeleton] = React.useState<boolean>(true);
	const [isReadyShowChannelMsg, setIsReadyShowChannelMsg] = React.useState<boolean>(true);
	const [isLoadingScrollBottom, setIsLoadingScrollBottom] = React.useState<boolean>(false);
	const isLoadMore = useRef({});
	const [, setTriggerRender] = useState<boolean>(false);
	const isFetching = useSelector(selectMessageIsLoading);
	const hasMoreTop = useSelector(selectHasMoreMessageByChannelId(channelId));
	const hasMoreBottom = useSelector(selectHasMoreBottomByChannelId(channelId));
	const isViewingOldMessage = useSelector(selectIsViewingOlderMessagesByChannelId(channelId ?? ''));
	const idMessageToJump = useSelector(selectIdMessageToJump);
	const isMessageExist = useSelector(selectIsMessageIdExist(channelId, idMessageToJump?.id));

	const flatListRef = useRef(null);
	const timeOutRef = useRef(null);
	const timeOutRef2 = useRef(null);

	useEffect(() => {
		const event = DeviceEventEmitter.addListener(ActionEmitEvent.SCROLL_TO_BOTTOM_CHAT, () => {
			if (!isViewingOldMessage && !hasMoreBottom) {
				flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
			}
		});

		return () => {
			if (timeOutRef?.current) clearTimeout(timeOutRef.current);
			if (timeOutRef2?.current) clearTimeout(timeOutRef2.current);
			event.remove();
		};
	}, [hasMoreBottom, isViewingOldMessage]);

	useEffect(() => {
		const showSKlListener = DeviceEventEmitter.addListener(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, ({ isShow }) => {
			setIsShowSkeleton(isShow);
		});

		const onSwitchChannel = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SWITCH_CHANEL, async (time: number) => {
			if (time) {
				setIsReadyShowChannelMsg(false);
				await sleep(time);
				setIsReadyShowChannelMsg(true);
			}
		});
		return () => {
			showSKlListener.remove();
			onSwitchChannel.remove();
		};
	}, []);

	useEffect(() => {
		if (flatListRef?.current && channelId) {
			flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
		}
	}, [channelId]);

	useEffect(() => {
		if (idMessageToJump?.id && isMessageExist) {
			const indexToJump = messages?.findIndex?.((message: { id: string }) => message.id === idMessageToJump?.id);
			if (indexToJump !== -1 && flatListRef.current && indexToJump > 0 && messages?.length - 1 >= indexToJump) {
				flatListRef?.current?.scrollToIndex?.({
					animated: true,
					index: indexToJump - 2 >= 0 ? indexToJump - 2 : indexToJump
				});
				DeviceEventEmitter.emit(ActionEmitEvent.MESSAGE_ID_TO_JUMP, idMessageToJump?.id);
			}
		}
	}, [dispatch, idMessageToJump?.id, isMessageExist, messages]);

	const scrollChannelMessageToIndex = useCallback(
		(index: number) => {
			if (flatListRef.current && index > 0 && messages?.length - 1 >= index) {
				flatListRef?.current?.scrollToIndex?.({ animated: true, index: index });
			}
		},
		[messages?.length]
	);

	const isHaveJumpToPresent = useMemo(() => {
		return (isViewingOldMessage || hasMoreBottom || messages?.length >= LIMIT_MESSAGE * 3) && !!messages?.length;
	}, [hasMoreBottom, isViewingOldMessage, messages?.length]);

	const onLoadMore = useCallback(
		async (direction: ELoadMoreDirection) => {
			if (isLoadMore?.current?.[direction] || isFetching) return;
			if (direction === ELoadMoreDirection.bottom && !hasMoreBottom) {
				return;
			}
			if (direction === ELoadMoreDirection.top && !hasMoreTop) {
				return;
			}
			LayoutAnimation.configureNext({
				duration: 200,
				create: {
					type: LayoutAnimation.Types.easeInEaseOut,
					property: LayoutAnimation.Properties.opacity
				},
				update: {
					type: LayoutAnimation.Types.easeInEaseOut
				}
			});
			isLoadMore.current[direction] = true;
			setTriggerRender(true);
			if (direction === ELoadMoreDirection.bottom) {
				await dispatch(
					messagesActions.loadMoreMessage({
						clanId,
						channelId,
						direction: Direction_Mode.AFTER_TIMESTAMP,
						fromMobile: true
					})
				);
				isLoadMore.current[direction] = false;
				setTriggerRender(false);
				scrollChannelMessageToIndex(LIMIT_MESSAGE + Math.floor(LIMIT_MESSAGE / 1.2));
				return;
			}
			await dispatch(
				messagesActions.loadMoreMessage({
					clanId,
					channelId,
					direction: Direction_Mode.BEFORE_TIMESTAMP,
					fromMobile: true
				})
			);
			isLoadMore.current[direction] = false;
			setTriggerRender(false);
			// if (messages?.length >= LIMIT_MESSAGE * 4) {
			// 	scrollChannelMessageToIndex(LIMIT_MESSAGE * 3);
			// }

			return true;
		},
		[isFetching, hasMoreBottom, hasMoreTop, dispatch, clanId, channelId, scrollChannelMessageToIndex]
	);

	const renderItem = useCallback(
		({ item, index }) => {
			const previousMessage = messages?.[index + 1];
			return <MessageItem message={item} previousMessage={previousMessage} messageId={item.id} mode={mode} channelId={channelId} />;
		},
		[messages, mode, channelId]
	);

	const checkChannelCacheLoading = useMemo(() => {
		let isCached = false;
		const channelsCache = load(STORAGE_CHANNEL_CURRENT_CACHE) || [];

		// have cached
		if (channelsCache?.includes(channelId)) {
			isCached = true;
		} else {
			save(STORAGE_CHANNEL_CURRENT_CACHE, [...channelsCache, channelId]);
		}
		return isCached;
	}, [channelId]);

	const handleJumpToPresent = useCallback(async () => {
		// Jump to present
		setIsLoadingScrollBottom(true);
		isLoadMore.current[ELoadMoreDirection.top] = true;
		await dispatch(
			messagesActions.fetchMessages({
				clanId,
				channelId,
				isFetchingLatestMessages: true,
				noCache: true,
				isClearMessage: true
			})
		);
		timeOutRef.current = setTimeout(() => {
			flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
			setIsLoadingScrollBottom(false);
		}, 300);
		timeOutRef2.current = setTimeout(() => {
			isLoadMore.current[ELoadMoreDirection.top] = false;
		}, 800);
	}, [clanId, channelId, dispatch]);

	return (
		<View style={styles.wrapperChannelMessage}>
			{isLoading === 'loading' && !checkChannelCacheLoading && isShowSkeleton && !messages?.length && (
				<MessageItemSkeleton skeletonNumber={15} />
			)}

			{isReadyShowChannelMsg ? (
				<ChannelMessageList
					flatListRef={flatListRef}
					messages={messages}
					handleScroll={async ({ nativeEvent }) => {
						if (nativeEvent.contentOffset.y <= 0) {
							await onLoadMore(ELoadMoreDirection.bottom);
						}
					}}
					renderItem={renderItem}
					onLoadMore={onLoadMore}
					isLoadMoreTop={isLoadMore.current?.[ELoadMoreDirection.top]}
					isLoadMoreBottom={isLoadMore.current?.[ELoadMoreDirection.bottom]}
				/>
			) : (
				<MessageItemSkeleton skeletonNumber={15} />
			)}
			<Block height={size.s_8} />
			{isHaveJumpToPresent && (
				<TouchableOpacity style={styles.btnScrollDown} onPress={handleJumpToPresent} activeOpacity={0.8}>
					{isLoadingScrollBottom ? (
						<ActivityIndicator size="small" color={themeValue.textStrong} />
					) : (
						<Icons.ArrowLargeDownIcon color={themeValue.textStrong} height={size.s_20} width={size.s_20} />
					)}
				</TouchableOpacity>
			)}

			<MessageUserTyping channelId={channelId} isDM={isDM} isPublic={isPublic} mode={mode} />
		</View>
	);
});

export default ChannelMessages;
