import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	getStore,
	messagesActions,
	selectAllAccount,
	selectHasMoreBottomByChannelId,
	selectHasMoreMessageByChannelId,
	selectIdMessageToJump,
	selectIsLoadingJumpMessage,
	selectIsMessageIdExist,
	selectLastMessageByChannelId,
	selectMessageIsLoading,
	selectMessagesByChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { Direction_Mode, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import type { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, Keyboard, View } from 'react-native';
import { useSelector } from 'react-redux';
import MessageNewLine from '../../../components/MessageNewLine/MessageNewLine';
import { TopAlert } from '../../../components/NotificationPermissionAlert';
import MessageItem from './MessageItem';
import ButtonJumpToPresent from './components/ButtonJumpToPresent';
import ChannelMessageList, { ViewLoadMore } from './components/ChannelMessageList';
import { ChannelMessageLoading } from './components/ChannelMessageLoading';
import { MessageUserTyping } from './components/MessageUserTyping';
import QuickReactionButton from './components/QuickReaction';
import { style } from './styles';

const scrollPositionCache = new Map<string, number>();
type ChannelMessagesProps = {
	channelId: string;
	lastSeenMessageId?: string;
	lastSentMessageId?: string;
	topicId?: string;
	clanId: string;
	mode: ChannelStreamMode;
	isDM?: boolean;
	isPublic?: boolean;
	topicChannelId?: string;
	isBanned?: boolean;
	isFromTopic?: boolean;
	dmType?: number;
};

const getEntitiesArray = (state: any) => {
	if (!state?.ids) return [];
	return state.ids.map((id) => state?.entities?.[id])?.reverse();
};

const ChannelMessages = React.memo(
	({
		channelId,
		lastSeenMessageId,
		lastSentMessageId,
		topicId,
		clanId,
		mode,
		isDM,
		isPublic,
		topicChannelId,
		isBanned,
		isFromTopic,
		dmType
	}: ChannelMessagesProps) => {
		const dispatch = useAppDispatch();
		const { themeValue } = useTheme();
		const styles = useMemo(() => style(themeValue), [themeValue]);
		const selectMessagesByChannelMemoized = useAppSelector((state) => selectMessagesByChannel(state, channelId));
		const messages = useMemo(() => getEntitiesArray(selectMessagesByChannelMemoized), [selectMessagesByChannelMemoized]);
		const isLoadMore = useRef({});
		const [isDisableLoadMore, setIsDisableLoadMore] = useState<boolean | string>(false);
		const idMessageToJump = useSelector(selectIdMessageToJump);
		const isLoadingJumpMessage = useSelector(selectIsLoadingJumpMessage);
		const flatListRef = useRef(null);
		const timeOutRef = useRef(null);
		const readyToLoadMore = useRef(false);
		const timeOutLoadMoreRef = useRef(null);
		const [isShowJumpToPresent, setIsShowJumpToPresent] = useState(false);
		const navigation = useNavigation<any>();
		const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
		const lastMessageId = useMemo(() => lastMessage?.id, [lastMessage]);
		const userId = useSelector(selectAllAccount)?.user?.id;
		const [haveScrollToBottom, setHaveScrollToBottom] = useState<boolean>(false);
		const [listMessageLayout, setListMessageLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
		const savedScrollOffset = useMemo(() => scrollPositionCache.get(channelId), [channelId]);

		const messagesRef = useRef(messages);
		messagesRef.current = messages;
		const haveScrollToBottomRef = useRef(haveScrollToBottom);
		haveScrollToBottomRef.current = haveScrollToBottom;
		const isShowJumpToPresentRef = useRef(isShowJumpToPresent);
		isShowJumpToPresentRef.current = isShowJumpToPresent;
		const initialScrollIndex = useMemo(() => {
			if (!lastSeenMessageId || !messages?.length) return undefined;
			const index = messages.findIndex((message: { id: string }) => message.id === lastSeenMessageId);
			return index >= 5 ? index : undefined;
		}, [lastSeenMessageId, messages]);

		useEffect(() => {
			const event = DeviceEventEmitter.addListener(ActionEmitEvent.SCROLL_TO_BOTTOM_CHAT, () => {
				setIsShowJumpToPresent(false);
				flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
			});

			return () => {
				if (timeOutRef?.current) clearTimeout(timeOutRef.current);
				event.remove();
			};
		}, []);

		useEffect(() => {
			timeOutLoadMoreRef.current = setTimeout(() => {
				readyToLoadMore.current = true;
			}, 1000);
			return () => {
				clearTimeout(timeOutLoadMoreRef.current);
			};
		}, []);

		useEffect(() => {
			return () => {
				dispatch(
					channelsActions.updateLastSeenMessage({
						clanId,
						channelId,
						lastSeenMessage: {
							id: lastMessageId || '',
							timestamp: new Date().toISOString()
						}
					})
				);
			};
		}, [channelId, clanId, dispatch, lastMessageId]);

		useEffect(() => {
			let timeout;

			const checkMessageExistence = () => {
				const store = getStore();
				if (idMessageToJump.id === 'temp') return;
				const isMessageExist = selectIsMessageIdExist(store.getState() as any, channelId, idMessageToJump?.id);
				if (isMessageExist) {
					const indexToJump = messages?.findIndex?.((message: { id: string }) => message.id === idMessageToJump?.id);
					if (indexToJump !== -1 && flatListRef.current && indexToJump > 0 && messages?.length - 1 >= indexToJump) {
						flatListRef?.current?.scrollToIndex?.({
							animated: true,
							index: indexToJump,
							viewPosition: 0.5,
							viewOffset: 20
						});
					}
				}
				timeout = setTimeout(() => {
					dispatch(messagesActions.setIdMessageToJump(null));
					isLoadMore.current[ELoadMoreDirection.top] = false;
					isLoadMore.current[ELoadMoreDirection.bottom] = false;
				}, 2000);
			};

			if (idMessageToJump?.id && !isLoadingJumpMessage) {
				checkMessageExistence();
			}

			return () => {
				timeout && clearTimeout(timeout);
			};
		}, [channelId, dispatch, idMessageToJump?.id, isLoadingJumpMessage, messages]);

		useEffect(() => {
			const sub = navigation.addListener('transitionStart', (e) => {
				if (e?.data?.closing) {
					Keyboard.dismiss();
				}
			});
			return () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
					isShow: false
				});
				sub();
			};
		}, [navigation]);

		const isCanLoadMore = useCallback(
			async (direction: ELoadMoreDirection) => {
				try {
					const store = getStore();
					const isFetching = selectMessageIsLoading(store.getState());
					if (isLoadMore?.current?.[direction] || isFetching) return false;
					if (direction === ELoadMoreDirection.bottom) {
						const hasMoreBottom = selectHasMoreBottomByChannelId(store.getState(), channelId);
						if (!hasMoreBottom) return false;
					}
					if (direction === ELoadMoreDirection.top) {
						const hasMoreTop = selectHasMoreMessageByChannelId(store.getState(), channelId);
						if (!hasMoreTop) return false;
					}
					setIsDisableLoadMore(true);
					isLoadMore.current[direction] = true;
					return true;
				} catch (error) {
					console.error('Error checking if can load more messages:', error);
					return false;
				}
			},
			[channelId]
		);

		const onLoadMore = useCallback(
			async (direction: ELoadMoreDirection) => {
				if (!readyToLoadMore.current) return;
				if (messagesRef.current?.length < 10) return;
				try {
					if (direction === ELoadMoreDirection.top) {
						const canLoadMore = await isCanLoadMore(ELoadMoreDirection.top);
						if (!canLoadMore) {
							isLoadMore.current[direction] = false;
							setIsDisableLoadMore(false);
							return;
						}
					}
					if (direction === ELoadMoreDirection.bottom) {
						await dispatch(
							messagesActions.loadMoreMessage({
								clanId,
								channelId: topicChannelId ? topicChannelId : channelId,
								direction: Direction_Mode.AFTER_TIMESTAMP,
								fromMobile: true,
								topicId: topicId || ''
							})
						);
						await sleep(500);
						isLoadMore.current[direction] = false;
						setIsDisableLoadMore(false);
						return;
					}
					await dispatch(
						messagesActions.loadMoreMessage({
							clanId,
							channelId: topicChannelId ? topicChannelId : channelId,
							direction: Direction_Mode.BEFORE_TIMESTAMP,
							fromMobile: true,
							topicId: topicId || ''
						})
					);
					isLoadMore.current[direction] = false;
					setIsDisableLoadMore(false);
					return;
				} catch (error) {
					isLoadMore.current[direction] = false;
					setIsDisableLoadMore(false);
					console.error('Error in onLoadMore:', error);
				}
			},
			[dispatch, clanId, topicChannelId, channelId, topicId, isCanLoadMore]
		);

		const renderItem = useCallback(
			({ item, index }) => {
				const currentMessages = messagesRef.current;
				const previousMessage = currentMessages?.[index + 1];
				const previousMessageId = previousMessage?.id;
				const isPreviousMessageLastSeen =
					Boolean(previousMessageId === lastSeenMessageId && previousMessageId !== lastMessageId) &&
					currentMessages.length > 2 &&
					lastSeenMessageId &&
					previousMessage;
				const shouldShowUnreadBreak = isPreviousMessageLastSeen && item?.sender_id !== userId && !haveScrollToBottomRef.current;
				return (
					<>
						<MessageItem
							userId={userId}
							message={item}
							previousMessage={previousMessage}
							messageId={item.id}
							mode={mode}
							channelId={channelId}
							topicChannelId={topicChannelId}
							isHighlight={idMessageToJump?.id?.toString() === item?.id?.toString()}
							preventAction={isBanned}
						/>
						{shouldShowUnreadBreak && <MessageNewLine key={`unread-${previousMessageId}`} />}
					</>
				);
			},
			[channelId, idMessageToJump?.id, isBanned, lastMessageId, lastSeenMessageId, mode, topicChannelId, userId]
		);

		const handleJumpToPresent = useCallback(async () => {
			isLoadMore.current[ELoadMoreDirection.bottom] = true;
			await dispatch(
				messagesActions.fetchMessages({
					clanId,
					channelId: topicChannelId ? topicChannelId : channelId,
					isFetchingLatestMessages: true,
					noCache: true,
					isClearMessage: true,
					toPresent: true
				})
			);
			dispatch(messagesActions.setIdMessageToJump(null));
			timeOutRef.current = setTimeout(() => {
				isLoadMore.current[ELoadMoreDirection.bottom] = false;
				setIsShowJumpToPresent(false);
				flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
			}, 300);
		}, [clanId, channelId, dispatch, topicChannelId]);

		const handleSetShowJumpLast = useCallback((nativeEvent) => {
			const { contentOffset } = nativeEvent;
			const isLastMessageVisible = contentOffset.y >= 100;
			if (isLastMessageVisible !== isShowJumpToPresentRef.current) {
				setIsShowJumpToPresent(isLastMessageVisible);
			}
		}, []);

		const handleScroll = useCallback(
			async ({ nativeEvent }) => {
				scrollPositionCache.set(channelId, nativeEvent.contentOffset.y);
				handleSetShowJumpLast(nativeEvent);
				if (
					readyToLoadMore?.current &&
					nativeEvent.contentOffset.y <= 0 &&
					!isLoadMore?.current?.[ELoadMoreDirection.bottom] &&
					!isDisableLoadMore
				) {
					setHaveScrollToBottom(true);
					const canLoadMore = await isCanLoadMore(ELoadMoreDirection.bottom);
					if (!canLoadMore) {
						setIsDisableLoadMore(false);
						return;
					}
					await onLoadMore(ELoadMoreDirection.bottom);
				}
			},
			[channelId, handleSetShowJumpLast, isDisableLoadMore, isCanLoadMore, onLoadMore]
		);

		const handleLayout = useCallback((event) => {
			const { width, height } = event.nativeEvent.layout;
			setListMessageLayout({ width, height });
		}, []);

		return (
			<View style={styles.wrapperChannelMessage} onLayout={handleLayout}>
				<TopAlert />

				<ChannelMessageLoading isFromTopic={isFromTopic} channelId={channelId} isDM={isDM} dmType={dmType} isEmptyMsg={!messages?.length} />
				{isLoadMore.current?.[ELoadMoreDirection.top] && <ViewLoadMore isLoadMoreTop={true} />}
				{messages?.length ? (
					<ChannelMessageList
						flatListRef={flatListRef}
						messages={messages}
						handleScroll={handleScroll}
						renderItem={renderItem}
						lastSeenMessageId={lastSeenMessageId}
						onLoadMore={onLoadMore}
						isLoadMoreBottom={isLoadMore?.current?.[ELoadMoreDirection.bottom]}
						initialScrollIndex={initialScrollIndex}
						savedScrollOffset={initialScrollIndex === undefined ? savedScrollOffset : undefined}
					/>
				) : (
					<View />
				)}
				{isLoadMore.current?.[ELoadMoreDirection.bottom] && <ViewLoadMore />}
				<View style={styles.spacerHeight8} />
				<QuickReactionButton
					channelId={channelId}
					mode={mode}
					isShowJumpToPresent={isShowJumpToPresent}
					windowWidth={listMessageLayout.width}
					windowHeight={listMessageLayout.height}
				/>
				{isShowJumpToPresent && (
					<ButtonJumpToPresent
						handleJumpToPresent={handleJumpToPresent}
						lastSeenMessageId={lastSeenMessageId}
						lastSentMessageId={lastSentMessageId}
						hasNewLine={lastSentMessageId !== lastSeenMessageId && !haveScrollToBottom}
					/>
				)}

				<MessageUserTyping channelId={channelId} />
			</View>
		);
	}
);

export default ChannelMessages;
