// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	getStore,
	messagesActions,
	selectAllAccount,
	selectHasMoreBottomByChannelId2,
	selectHasMoreMessageByChannelId2,
	selectIdMessageToJump,
	selectIsLoadingJumpMessage,
	selectIsMessageIdExist,
	selectIsViewingOlderMessagesByChannelId,
	selectMessageIsLoading,
	selectMessagesByChannel,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { Direction_Mode, LIMIT_MESSAGE } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import MessageItem from './MessageItem';
import ChannelMessageList, { ViewLoadMore } from './components/ChannelMessageList';
import { ChannelMessageLoading } from './components/ChannelMessageLoading';
import { MessageUserTyping } from './components/MessageUserTyping';
import { style } from './styles';

type ChannelMessagesProps = {
	channelId: string;
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

const ChannelMessages = React.memo(({ channelId, topicId, clanId, mode, isDM, isPublic, topicChannelId }: ChannelMessagesProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const selectMessagesByChannelMemoized = useAppSelector((state) => selectMessagesByChannel(state, channelId));
	const messages = useMemo(() => getEntitiesArray(selectMessagesByChannelMemoized), [selectMessagesByChannelMemoized]);
	const isLoadMore = useRef({});
	const [isDisableLoadMore, setIsDisableLoadMore] = useState<boolean | string>(false);
	const isViewingOldMessage = useAppSelector((state) =>
		selectIsViewingOlderMessagesByChannelId(state, topicChannelId ? (topicChannelId ?? '') : (channelId ?? ''))
	);
	const idMessageToJump = useSelector(selectIdMessageToJump);
	const isLoadingJumpMessage = useSelector(selectIsLoadingJumpMessage);
	const flatListRef = useRef(null);
	const timeOutRef = useRef(null);
	const [isShowJumpToPresent, setIsShowJumpToPresent] = useState(false);

	const userId = useSelector(selectAllAccount)?.user?.id;

	useEffect(() => {
		const event = DeviceEventEmitter.addListener(ActionEmitEvent.SCROLL_TO_BOTTOM_CHAT, () => {
			if (!isViewingOldMessage) {
				flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
			}
		});

		return () => {
			if (timeOutRef?.current) clearTimeout(timeOutRef.current);
			event.remove();
		};
	}, [isViewingOldMessage]);

	useEffect(() => {
		if (flatListRef?.current && channelId) {
			flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
		}
	}, [channelId]);

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

	const isCanLoadMore = useCallback(
		async (direction: ELoadMoreDirection) => {
			try {
				const store = getStore();
				const isFetching = selectMessageIsLoading(store.getState());
				if (isLoadMore?.current?.[direction] || isFetching) return false;
				if (direction === ELoadMoreDirection.bottom) {
					const hasMoreBottom = selectHasMoreBottomByChannelId2(store.getState(), channelId);
					if (!hasMoreBottom) return false;
				}
				if (direction === ELoadMoreDirection.top) {
					const hasMoreTop = selectHasMoreMessageByChannelId2(store.getState(), channelId);
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
			if (messages?.length < LIMIT_MESSAGE - 10 || idMessageToJump?.id) return;
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
		[messages?.length, idMessageToJump?.id, dispatch, clanId, topicChannelId, channelId, topicId, isCanLoadMore]
	);

	const renderItem = useCallback(
		({ item, index }) => {
			const previousMessage = messages?.[index + 1];
			return (
				<MessageItem
					userId={userId}
					message={item}
					previousMessage={previousMessage}
					messageId={item.id}
					mode={mode}
					channelId={channelId}
					isHighlight={idMessageToJump?.id?.toString() === item?.id?.toString()}
				/>
			);
		},
		[messages, userId, mode, channelId, idMessageToJump?.id]
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
				const canLoadMore = await isCanLoadMore(ELoadMoreDirection.bottom);
				if (!canLoadMore) {
					setIsDisableLoadMore(false);
					return;
				}
				flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 20 });
				await onLoadMore(ELoadMoreDirection.bottom);
			}
		},
		[handleSetShowJumpLast, isDisableLoadMore, isCanLoadMore, onLoadMore]
	);

	return (
		<View style={styles.wrapperChannelMessage}>
			<ChannelMessageLoading channelId={channelId} isEmptyMsg={!messages?.length} />
			{isLoadMore.current?.[ELoadMoreDirection.top] && <ViewLoadMore isLoadMoreTop={true} />}
			{messages?.length ? (
				<ChannelMessageList
					flatListRef={flatListRef}
					messages={messages}
					handleScroll={handleScroll}
					renderItem={renderItem}
					onLoadMore={onLoadMore}
				/>
			) : (
				<View />
			)}
			{isLoadMore.current?.[ELoadMoreDirection.bottom] && <ViewLoadMore />}
			<View
				style={{
					height: size.s_8
				}}
			/>
			{isShowJumpToPresent && !isLoadMore.current?.[ELoadMoreDirection.bottom] && (
				<TouchableOpacity style={styles.btnScrollDown} onPress={handleJumpToPresent} activeOpacity={0.8}>
					<MezonIconCDN icon={IconCDN.arrowLargeDownIcon} color={themeValue.textStrong} height={size.s_18} width={size.s_18} />
				</TouchableOpacity>
			)}

			<MessageUserTyping channelId={channelId} isDM={isDM} isPublic={isPublic} mode={mode} />
		</View>
	);
});

export default ChannelMessages;
