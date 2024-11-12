import { ELoadMoreDirection, IBeforeRenderCb } from '@mezon/chat-scroll';
import { MessageContextMenuProvider } from '@mezon/components';
import { useAuth } from '@mezon/core';
import {
	messagesActions,
	pinMessageActions,
	selectAllChannelMemberIds,
	selectAllRoleIds,
	selectDataReferences,
	selectHasMoreBottomByChannelId,
	selectHasMoreMessageByChannelId,
	selectIdMessageToJump,
	selectIsJumpingToPresent,
	selectIsMessageIdExist,
	selectIsViewingOlderMessagesByChannelId,
	selectJumpPinMessageId,
	selectLastMessageByChannelId,
	selectLastMessageIdByChannelId,
	selectMessageIdsByChannelId,
	selectMessageIsLoading,
	selectMessageNotified,
	selectTheme,
	selectUnreadMessageIdByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Direction_Mode, toggleDisableHover } from '@mezon/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import classNames from 'classnames';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ChannelMessage, MemorizedChannelMessage } from './ChannelMessage';

const SCROLL_THRESHOLD = 500; // 500px

type ChannelMessagesProps = {
	clanId: string;
	channelId: string;
	type: ChannelType;
	channelLabel?: string;
	avatarDM?: string;
	mode: number;
	userName?: string;
	userIdsFromThreadBox?: string[];
	isThreadBox?: boolean;
};

function ChannelMessages({
	clanId,
	channelId,
	channelLabel,
	avatarDM,
	userName,
	mode,
	userIdsFromThreadBox,
	isThreadBox = false
}: ChannelMessagesProps) {
	const appearanceTheme = useSelector(selectTheme);
	const messages = useAppSelector((state) => selectMessageIdsByChannelId(state, channelId));
	const chatRef = useRef<HTMLDivElement | null>(null);
	const idMessageNotified = useSelector(selectMessageNotified);
	const idMessageToJump = useSelector(selectIdMessageToJump);
	const isJumpingToPresent = useSelector(selectIsJumpingToPresent(channelId));
	const isViewOlderMessage = useSelector(selectIsViewingOlderMessagesByChannelId(channelId));
	const isMessageExist = useSelector(selectIsMessageIdExist(channelId, idMessageToJump));
	const isFetching = useSelector(selectMessageIsLoading);
	const hasMoreTop = useSelector(selectHasMoreMessageByChannelId(channelId));
	const hasMoreBottom = useSelector(selectHasMoreBottomByChannelId(channelId));
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const { userId } = useAuth();
	const getMemberIds = useAppSelector((state) => selectAllChannelMemberIds(state, channelId as string));
	const allUserIdsInChannel = isThreadBox ? userIdsFromThreadBox : getMemberIds;
	const allRolesInClan = useSelector(selectAllRoleIds);
	const jumpPinMessageId = useSelector(selectJumpPinMessageId);
	const isPinMessageExist = useSelector(selectIsMessageIdExist(channelId, jumpPinMessageId));
	const dataReferences = useSelector(selectDataReferences(channelId ?? ''));
	const lastMessageId = useAppSelector((state) => selectLastMessageIdByChannelId(state, channelId as string));
	const lastMessageUnreadId = useAppSelector((state) => selectUnreadMessageIdByChannelId(state, channelId as string));
	const userActiveScroll = useRef<boolean>(false);
	const dispatch = useAppDispatch();

	const loadMoreMessage = useCallback(
		async (direction: ELoadMoreDirection, cb?: IBeforeRenderCb) => {
			if (isFetching) {
				return;
			}

			if (direction === ELoadMoreDirection.bottom && !hasMoreBottom) {
				dispatch(messagesActions.setViewingOlder({ channelId, status: false }));
				return;
			}

			if (direction === ELoadMoreDirection.top && !hasMoreTop) {
				return;
			}

			if (typeof cb === 'function') {
				cb();
			}

			if (direction === ELoadMoreDirection.bottom) {
				await dispatch(messagesActions.loadMoreMessage({ clanId, channelId, direction: Direction_Mode.AFTER_TIMESTAMP }));
				dispatch(messagesActions.setViewingOlder({ channelId, status: true }));
				return true;
			}

			await dispatch(messagesActions.loadMoreMessage({ clanId, channelId, direction: Direction_Mode.BEFORE_TIMESTAMP }));

			return true;
		},
		[dispatch, clanId, channelId, hasMoreTop, hasMoreBottom, isFetching]
	);

	const getChatScrollBottomOffset = useCallback(() => {
		const element = chatRef.current;
		if (!element) {
			return 0;
		}
		return Math.abs(element?.scrollHeight - element?.clientHeight - element?.scrollTop);
	}, []);

	const scrollTimeoutId2 = useRef<NodeJS.Timeout | null>(null);
	const isLoadMore = useRef<boolean>(false);
	const currentScrollDirection = useRef<ELoadMoreDirection | null>(null);
	const rowVirtualizer = useVirtualizer({
		count: messages.length,
		overscan: 5,
		getScrollElement: () => chatRef.current,
		estimateSize: () => 50,
		onChange: async (instance) => {
			if (!userActiveScroll.current) return;
			toggleDisableHover(chatRef.current, scrollTimeoutId2);
			if (isLoadMore.current || !chatRef.current?.scrollHeight) return;
			switch (instance.scrollDirection) {
				case 'backward':
					if (chatRef.current.scrollTop <= SCROLL_THRESHOLD && instance.scrollDirection === 'backward') {
						currentScrollDirection.current = ELoadMoreDirection.top;
						isLoadMore.current = true;
						firsRowCached.current = messages[1];
						await loadMoreMessage(ELoadMoreDirection.top);
						isLoadMore.current = false;
						return;
					}

					break;
				case 'forward':
					{
						const scrollElement = instance.scrollElement;
						if (!scrollElement) {
							return;
						}
						const isAtBottom =
							Math.abs(scrollElement?.scrollHeight - scrollElement?.clientHeight - scrollElement?.scrollTop) <= SCROLL_THRESHOLD;
						if (isAtBottom) {
							currentScrollDirection.current = ELoadMoreDirection.bottom;
							isLoadMore.current = true;
							lastRowCached.current = messages[messages.length - 1];
							await loadMoreMessage(ELoadMoreDirection.bottom);
							isLoadMore.current = false;
						}
					}
					break;
			}
		}
	});

	const scrollToLastMessage = useCallback(() => {
		return new Promise((rs) => {
			if (isLoadMore.current) return rs(true);
			chatRef.current && (chatRef.current.scrollTop = chatRef.current.scrollHeight);
			rs(true);
		});
	}, []);

	// maintain scroll position
	const firsRowCached = useRef<string>('');
	const lastRowCached = useRef<string>('');
	useLayoutEffect(() => {
		if (!isLoadMore.current || !chatRef.current || !userActiveScroll.current) return;
		const firstMessageId = messages[0];
		const lastMessageId = messages[messages.length - 1];
		if (firsRowCached.current !== firstMessageId) {
			if (firsRowCached.current && currentScrollDirection.current === ELoadMoreDirection.top) {
				const messageId = firsRowCached.current;
				rowVirtualizer.scrollToIndex(
					messages.findIndex((item) => item === messageId),
					{ align: 'start' }
				);
			}
			firsRowCached.current = messages[1];
			lastRowCached.current = messages[messages.length - 1];
			currentScrollDirection.current = null;
			return;
		}
		if (lastRowCached.current !== lastMessageId) {
			lastRowCached.current &&
				currentScrollDirection.current === ELoadMoreDirection.bottom &&
				rowVirtualizer.scrollToIndex(
					messages.findIndex((messageId) => messageId === lastRowCached.current),
					{ align: 'end' }
				);
			lastRowCached.current = messages[messages.length - 1];
		}
		currentScrollDirection.current = null;
	}, [messages, rowVirtualizer]);

	useEffect(() => {
		if (dataReferences?.message_ref_id && getChatScrollBottomOffset() <= 100) {
			scrollToLastMessage();
		}
	}, [dataReferences, lastMessage, scrollToLastMessage, getChatScrollBottomOffset]);

	// Jump to ,message from pin and reply, notification...
	const timerRef = useRef<number | null>(null);
	useEffect(() => {
		const handleScrollToIndex = (messageId: string) => {
			const index = messages.findIndex((item) => item === messageId);
			if (index >= 0) {
				rowVirtualizer.scrollToIndex(index, { align: 'start', behavior: 'auto' });
			}
		};

		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		if (jumpPinMessageId && isPinMessageExist) {
			userActiveScroll.current = true;
			handleScrollToIndex(jumpPinMessageId);
			timerRef.current = window.setTimeout(() => {
				dispatch(pinMessageActions.setJumpPinMessageId(null));
			}, 1000);
		} else if (idMessageToJump && isMessageExist && !jumpPinMessageId) {
			handleScrollToIndex(idMessageToJump);
			timerRef.current = window.setTimeout(() => {
				dispatch(messagesActions.setIdMessageToJump(null));
			}, 1000);
		}

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [dispatch, jumpPinMessageId, isPinMessageExist, idMessageToJump, isMessageExist, messages, rowVirtualizer]);

	// Jump to present when user is jumping to present
	useEffect(() => {
		if (isJumpingToPresent) {
			scrollToLastMessage().then(() => {
				dispatch(messagesActions.setIsJumpingToPresent({ channelId, status: false }));
			});
		}
	}, [dispatch, isJumpingToPresent, channelId, scrollToLastMessage]);

	// Handle scroll to bottom when user on the bottom and received new message
	useEffect(() => {
		if (isViewOlderMessage) {
			return;
		}

		const isNearAtBottom = getChatScrollBottomOffset() <= 100;

		if (userId === lastMessage?.sender_id || isNearAtBottom) {
			scrollToLastMessage();
			return;
		}
	}, [userId, messages.length, isViewOlderMessage, rowVirtualizer, scrollToLastMessage, getChatScrollBottomOffset]);

	useLayoutEffect(() => {
		if (!rowVirtualizer.getVirtualItems().length) return;
		if (!rowVirtualizer.getTotalSize()) return;
		if (chatRef.current && messages?.length && lastMessage?.channel_id && !userActiveScroll.current) {
			chatRef.current.scrollTop = chatRef.current.scrollHeight;
		}
	});

	return (
		<MessageContextMenuProvider allUserIdsInChannel={allUserIdsInChannel as string[]} allRolesInClan={allRolesInClan}>
			<div className={classNames(['w-full h-full', '[&_*]:overflow-anchor-none', 'relative'])}>
				<div
					onWheelCapture={() => {
						userActiveScroll.current = true;
					}}
					onTouchStart={() => {
						userActiveScroll.current = true;
					}}
					onMouseDown={() => {
						userActiveScroll.current = true;
					}}
					ref={chatRef}
					id="scrollLoading"
					className={classNames([
						'absolute top-0 left-0 bottom-0 right-0',
						'overflow-y-scroll overflow-x-hidden',
						'dark:bg-bgPrimary bg-bgLightPrimary',
						{
							customScrollLightMode: appearanceTheme === 'light'
						}
					])}
				>
					<div style={{ height: `calc(100% - 20px - ${rowVirtualizer.getTotalSize()}px)` }}></div>
					<div
						style={{
							height: `${rowVirtualizer.getTotalSize()}px`,
							width: '100%',
							position: 'relative'
						}}
					>
						<div
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px)`
							}}
						>
							{rowVirtualizer.getVirtualItems().map((virtualRow) => {
								const messageId = messages[virtualRow.index];
								const islastIndex = messages.length - 1 === virtualRow.index;
								const checkMessageTargetToMoved = idMessageToJump === messageId && messageId !== lastMessageId;
								const messageReplyHighlight =
									(dataReferences?.message_ref_id && dataReferences?.message_ref_id === messageId) || false;
								return (
									<div key={virtualRow.key} data-index={virtualRow.index} ref={rowVirtualizer.measureElement}>
										<MemorizedChannelMessage
											index={virtualRow.index}
											avatarDM={avatarDM}
											userName={userName}
											key={messageId}
											messageId={messageId}
											previousMessageId={messages[virtualRow.index - 1]}
											nextMessageId={messages[virtualRow.index + 1]}
											channelId={channelId}
											isHighlight={messageId === idMessageNotified}
											mode={mode}
											channelLabel={channelLabel ?? ''}
											isLastSeen={Boolean(messageId === lastMessageUnreadId && messageId !== lastMessageId)}
											checkMessageTargetToMoved={checkMessageTargetToMoved}
											messageReplyHighlight={messageReplyHighlight}
										/>
										{islastIndex && <div className="h-[20px] w-[1px] pointer-events-none"></div>}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</MessageContextMenuProvider>
	);
}

ChannelMessages.Skeleton = () => {
	if (ChannelMessage.Skeleton) {
		return (
			<>
				{/* <ChannelMessage.Skeleton />
				<ChannelMessage.Skeleton />
				<ChannelMessage.Skeleton />
				<ChannelMessage.Skeleton />
				<ChannelMessage.Skeleton />
				<ChannelMessage.Skeleton /> */}
			</>
		);
	}
};

const MemoizedChannelMessages = memo(ChannelMessages) as unknown as typeof ChannelMessages & { Skeleton: typeof ChannelMessages.Skeleton };

export default MemoizedChannelMessages;
