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
import { Direction_Mode, LIMIT_MESSAGE, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode } from 'mezon-js';
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
import { style } from './styles';

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
};

const getEntitiesArray = (state: any) => {
	if (!state?.ids) return [];
	return state.ids.map((id) => state?.entities?.[id])?.reverse();
};

const ChannelMessages = React.memo(
	({ channelId, lastSeenMessageId, lastSentMessageId, topicId, clanId, mode, isDM, isPublic, topicChannelId }: ChannelMessagesProps) => {
		const dispatch = useAppDispatch();
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const selectMessagesByChannelMemoized = useAppSelector((state) => selectMessagesByChannel(state, channelId));
		const messages = useMemo(() => getEntitiesArray(selectMessagesByChannelMemoized), [selectMessagesByChannelMemoized]);
		const isLoadMore = useRef({});
		const [isDisableLoadMore, setIsDisableLoadMore] = useState<boolean | string>(false);
		const idMessageToJump = useSelector(selectIdMessageToJump);
		const isLoadingJumpMessage = useSelector(selectIsLoadingJumpMessage);
		const flatListRef = useRef(null);
		const timeOutRef = useRef(null);
		const [isShowJumpToPresent, setIsShowJumpToPresent] = useState(false);
		const navigation = useNavigation<any>();
		const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
		const lastMessageId = useMemo(() => lastMessage?.id, [lastMessage]);
		const userId = useSelector(selectAllAccount)?.user?.id;
		const hasJumpedToLastSeen = useRef(false);
		const [haveScrollToBottom, setHaveScrollToBottom] = useState<boolean>(false);

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
		}, [channelId, clanId, dispatch, lastMessageId, lastSeenMessageId]);

		useEffect(() => {
			if (!lastSeenMessageId || !messages?.length || hasJumpedToLastSeen.current) {
				return;
			}

			let timeoutId: NodeJS.Timeout;

			const checkMessageExistence = () => {
				hasJumpedToLastSeen.current = true;
				timeoutId = setTimeout(() => {
					const store = getStore();
					const isMessageExist = selectIsMessageIdExist(store.getState() as any, channelId, lastSeenMessageId);

					if (isMessageExist) {
						const indexToJump = messages?.findIndex?.((message: { id: string }) => message.id === lastSeenMessageId);
						if (
							indexToJump !== -1 &&
							flatListRef?.current &&
							indexToJump > 0 &&
							messages?.length - 1 >= indexToJump &&
							indexToJump >= 3
						) {
							flatListRef?.current?.scrollToIndex?.({
								animated: true,
								index: indexToJump - 3
							});
						}
					}
				}, 200);
			};

			checkMessageExistence();

			return () => {
				if (timeoutId) clearTimeout(timeoutId);
			};
		}, [channelId, lastSeenMessageId, messages]);

		useEffect(() => {
			let timeout;

			const checkMessageExistence = () => {
				const store = getStore();
				if (idMessageToJump.id === 'temp') return;
				const isMessageExist = selectIsMessageIdExist(store.getState() as any, channelId, idMessageToJump?.id);
				if (isMessageExist) {
					const indexToJump = messages?.findIndex?.((message: { id: string }) => message.id === idMessageToJump?.id);
					if (indexToJump !== -1 && flatListRef.current && indexToJump > 0 && messages?.length - 1 >= indexToJump) {
						setTimeout(() => {
							flatListRef?.current?.scrollToIndex?.({
								animated: true,
								index: indexToJump,
								viewPosition: 0.5,
								viewOffset: 20
							});
						}, 100);
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
				if (messages?.length < 10) return;
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
			[messages?.length, dispatch, clanId, topicChannelId, channelId, topicId, isCanLoadMore]
		);

		const renderItem = useCallback(
			({ item, index }) => {
				const previousMessage = messages?.[index + 1];
				const previousMessageId = previousMessage?.id;
				const isPreviousMessageLastSeen =
					Boolean(previousMessageId === lastSeenMessageId && previousMessageId !== lastMessageId) &&
					messages.length > 2 &&
					lastSeenMessageId &&
					previousMessage;
				const shouldShowUnreadBreak = isPreviousMessageLastSeen && item?.sender_id !== userId && !haveScrollToBottom;
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
						/>
						{shouldShowUnreadBreak && <MessageNewLine key={`unread-${previousMessageId}`} />}
					</>
				);
			},
			[channelId, haveScrollToBottom, idMessageToJump?.id, lastMessageId, lastSeenMessageId, messages, mode, topicChannelId, userId]
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

		const handleSetShowJumpLast = useCallback(
			(nativeEvent) => {
				const { contentOffset } = nativeEvent;
				const isLastMessageVisible = contentOffset.y >= 100;
				if (isLastMessageVisible !== isShowJumpToPresent) {
					setIsShowJumpToPresent(isLastMessageVisible);
				}
			},
			[isShowJumpToPresent]
		);

		const handleScroll = useCallback(
			async ({ nativeEvent }) => {
				handleSetShowJumpLast(nativeEvent);
				if (nativeEvent.contentOffset.y <= 0 && !isLoadMore?.current?.[ELoadMoreDirection.bottom] && !isDisableLoadMore) {
					setHaveScrollToBottom(true);
					const canLoadMore = await isCanLoadMore(ELoadMoreDirection.bottom);
					if (!canLoadMore) {
						setIsDisableLoadMore(false);
						return;
					}
					await onLoadMore(ELoadMoreDirection.bottom);
				}
			},
			[handleSetShowJumpLast, isDisableLoadMore, isCanLoadMore, onLoadMore]
		);

		return (
			<View style={styles.wrapperChannelMessage}>
				<TopAlert />

				<ChannelMessageLoading channelId={channelId} isEmptyMsg={!messages?.length} />
				{isLoadMore.current?.[ELoadMoreDirection.top] && <ViewLoadMore isLoadMoreTop={true} />}
				{messages?.length ? (
					<ChannelMessageList
						flatListRef={flatListRef}
						messages={messages}
						handleScroll={handleScroll}
						renderItem={renderItem}
						onLoadMore={onLoadMore}
						isLoadMoreBottom={isLoadMore?.current?.[ELoadMoreDirection.bottom]}
					/>
				) : (
					<View />
				)}
				{isLoadMore.current?.[ELoadMoreDirection.bottom] && <ViewLoadMore />}
				<View style={styles.spacerHeight8} />
				{isShowJumpToPresent && messages?.length >= LIMIT_MESSAGE && (
					<ButtonJumpToPresent
						handleJumpToPresent={handleJumpToPresent}
						lastSeenMessageId={lastSeenMessageId}
						lastSentMessageId={lastSentMessageId}
						hasNewLine={lastSentMessageId !== lastSeenMessageId && !haveScrollToBottom}
					/>
				)}

				<MessageUserTyping channelId={channelId} isDM={isDM} isPublic={isPublic} mode={mode} />
			</View>
		);
	}
);

export default ChannelMessages;
