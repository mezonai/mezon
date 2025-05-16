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
import { ActivityIndicator, DeviceEventEmitter, Platform, TouchableOpacity, UIManager, View } from 'react-native';
import uuid from 'react-native-uuid';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import MessageItem from './MessageItem';
import ChannelMessageList from './components/ChannelMessageList';
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

if (Platform.OS === 'android') {
	if (UIManager.setLayoutAnimationEnabledExperimental) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}
}

const ChannelMessages = React.memo(({ channelId, topicId, clanId, mode, isDM, isPublic, topicChannelId }: ChannelMessagesProps) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const selectMessagesByChannelMemoized = useAppSelector((state) => selectMessagesByChannel(state, channelId));
	const messages = useMemo(() => getEntitiesArray(selectMessagesByChannelMemoized), [selectMessagesByChannelMemoized]);
	const [isLoadingScrollBottom, setIsLoadingScrollBottom] = React.useState<boolean>(false);
	const isLoadMore = useRef({});
	const [, setTriggerRender] = useState<boolean | string>(false);
	// check later
	const isViewingOldMessage = useAppSelector((state) =>
		selectIsViewingOlderMessagesByChannelId(state, topicChannelId ? (topicChannelId ?? '') : (channelId ?? ''))
	);
	const idMessageToJump = useSelector(selectIdMessageToJump);
	const isLoadingJumpMessage = useSelector(selectIsLoadingJumpMessage);
	const flatListRef = useRef(null);
	const timeOutRef = useRef(null);
	const timeOutRef2 = useRef(null);
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
			if (timeOutRef2?.current) clearTimeout(timeOutRef2.current);
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
		let retryCount = 0;
		const maxRetries = 3;

		const checkMessageExistence = () => {
			const store = getStore();
			const isMessageExist = selectIsMessageIdExist(store.getState() as any, channelId, idMessageToJump?.id);
			if (isMessageExist) {
				const indexToJump = messages?.findIndex?.((message: { id: string }) => message.id === idMessageToJump?.id);
				if (indexToJump !== -1 && flatListRef.current && indexToJump > 0 && messages?.length - 1 >= indexToJump) {
					flatListRef?.current?.scrollToIndex?.({
						animated: true,
						index: indexToJump,
						viewPosition: 0.5
					});
					clearTimeout(timeout);
					setTimeout(() => {
						dispatch(messagesActions.setIdMessageToJump(null));
					}, 3000);
				}
			} else if (retryCount < maxRetries) {
				retryCount++;
				timeout = setTimeout(checkMessageExistence, 1000);
			}
		};

		if (idMessageToJump?.id && !isLoadingJumpMessage) {
			timeout = setTimeout(checkMessageExistence, 0);
		}

		return () => {
			timeout && clearTimeout(timeout);
		};
	}, [channelId, dispatch, idMessageToJump?.id, isLoadingJumpMessage, messages]);

	const scrollChannelMessageToIndex = useCallback(
		(index: number) => {
			if (flatListRef.current && index > 0 && messages?.length - 1 >= index) {
				flatListRef?.current?.scrollToIndex?.({ animated: true, index: index });
			}
		},
		[messages?.length]
	);

	const onLoadMore = useCallback(
		async (direction: ELoadMoreDirection) => {
			const store = getStore();
			const isFetching = selectMessageIsLoading(store.getState());
			if (isLoadMore?.current?.[direction] || isFetching) return;
			if (direction === ELoadMoreDirection.bottom) {
				const hasMoreBottom = selectHasMoreBottomByChannelId2(store.getState(), channelId);
				if (!hasMoreBottom) return;
			}
			if (direction === ELoadMoreDirection.top) {
				const hasMoreTop = selectHasMoreMessageByChannelId2(store.getState(), channelId);
				if (!hasMoreTop) return;
			}
			isLoadMore.current[direction] = true;
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
				setTriggerRender(uuid.v4());
				scrollChannelMessageToIndex(LIMIT_MESSAGE + Math.floor(LIMIT_MESSAGE / 1.2));
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
			setTriggerRender(uuid.v4());
			// if (messages?.length >= LIMIT_MESSAGE * 4) {
			// 	scrollChannelMessageToIndex(LIMIT_MESSAGE * 3);
			// }

			return true;
		},
		[dispatch, clanId, topicChannelId, channelId, topicId, scrollChannelMessageToIndex]
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
		// Jump to present
		setIsLoadingScrollBottom(true);
		isLoadMore.current[ELoadMoreDirection.top] = true;
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
			flatListRef?.current?.scrollToOffset?.({ animated: true, offset: 0 });
			setIsLoadingScrollBottom(false);
		}, 300);
		timeOutRef2.current = setTimeout(() => {
			isLoadMore.current[ELoadMoreDirection.top] = false;
		}, 800);
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
			if (nativeEvent.contentOffset.y <= 0) {
				await onLoadMore(ELoadMoreDirection.bottom);
			}
		},
		[handleSetShowJumpLast, onLoadMore]
	);

	return (
		<View style={styles.wrapperChannelMessage}>
			<ChannelMessageLoading channelId={channelId} isEmptyMsg={!messages?.length} />

			{messages?.length ? (
				<ChannelMessageList
					flatListRef={flatListRef}
					messages={messages}
					handleScroll={handleScroll}
					renderItem={renderItem}
					onLoadMore={onLoadMore}
					isLoadMoreTop={isLoadMore.current?.[ELoadMoreDirection.top]}
					isLoadMoreBottom={isLoadMore.current?.[ELoadMoreDirection.bottom]}
				/>
			) : (
				<View />
			)}
			<View
				style={{
					height: size.s_8
				}}
			/>
			{isShowJumpToPresent && (
				<TouchableOpacity style={styles.btnScrollDown} onPress={handleJumpToPresent} activeOpacity={0.8}>
					{isLoadingScrollBottom ? (
						<ActivityIndicator size="small" color={themeValue.textStrong} />
					) : (
						<MezonIconCDN icon={IconCDN.arrowLargeDownIcon} color={themeValue.textStrong} height={size.s_20} width={size.s_20} />
					)}
				</TouchableOpacity>
			)}

			<MessageUserTyping channelId={channelId} isDM={isDM} isPublic={isPublic} mode={mode} />
		</View>
	);
});

export default ChannelMessages;
