import { ELoadMoreDirection, IBeforeRenderCb } from '@mezon/chat-scroll';
import { MessageContextMenuProvider } from '@mezon/components';
import {
	messagesActions,
	pinMessageActions,
	selectAllAccount,
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
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId,
	selectMessageIsLoading,
	selectMessageNotified,
	selectTheme,
	selectUnreadMessageIdByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Direction_Mode, toggleDisableHover } from '@mezon/utils';
import { Action } from '@reduxjs/toolkit';
import classNames from 'classnames';
import { ChannelType } from 'mezon-js';
import { ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ChannelMessage, MemorizedChannelMessage } from './ChannelMessage';
import { Virtualizer } from './virtual-core/index';
import { useVirtualizer } from './virtual-core/useVirtualizer';

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
	isTopicBox?: boolean;
};

function ChannelMessages({
	clanId,
	channelId,
	channelLabel,
	avatarDM,
	userName,
	mode,
	userIdsFromThreadBox,
	isThreadBox = false,
	isTopicBox
}: ChannelMessagesProps) {
	const appearanceTheme = useSelector(selectTheme);
	const messages = useAppSelector((state) => selectMessageIdsByChannelId(state, channelId));
	const idMessageNotified = useSelector(selectMessageNotified);
	const isJumpingToPresent = useSelector(selectIsJumpingToPresent(channelId));
	const isViewOlderMessage = useSelector(selectIsViewingOlderMessagesByChannelId(channelId));
	const isFetching = useSelector(selectMessageIsLoading);
	const hasMoreTop = useSelector(selectHasMoreMessageByChannelId(channelId));
	const hasMoreBottom = useSelector(selectHasMoreBottomByChannelId(channelId));
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const userId = useSelector(selectAllAccount)?.user?.id;
	const getMemberIds = useAppSelector((state) => selectAllChannelMemberIds(state, channelId as string));
	const allUserIdsInChannel = isThreadBox ? userIdsFromThreadBox : getMemberIds;
	const allRolesInClan = useSelector(selectAllRoleIds);
	const dataReferences = useSelector(selectDataReferences(channelId ?? ''));
	const lastMessageId = lastMessage?.id;
	const lastMessageUnreadId = useAppSelector((state) => selectUnreadMessageIdByChannelId(state, channelId as string));
	const userActiveScroll = useRef<boolean>(false);
	const dispatch = useAppDispatch();

	const chatRef = useRef<HTMLDivElement | null>(null);

	const isFetchingRef = useRef<boolean>(false);
	const hasMoreTopRef = useRef<boolean>(false);
	const hasMoreBottomRef = useRef<boolean>(false);

	useEffect(() => {
		isFetchingRef.current = isFetching;
	}, [isFetching]);

	useEffect(() => {
		hasMoreTopRef.current = hasMoreTop;
	}, [hasMoreTop]);

	useEffect(() => {
		hasMoreBottomRef.current = hasMoreBottom;
	}, [hasMoreBottom]);

	const loadMoreMessage = useCallback(
		async (direction: ELoadMoreDirection, cb?: IBeforeRenderCb) => {
			if (isFetchingRef.current) {
				return;
			}

			if (direction === ELoadMoreDirection.bottom && !hasMoreBottomRef.current) {
				dispatch(messagesActions.setViewingOlder({ channelId, status: false }));
				return;
			}

			if (direction === ELoadMoreDirection.top && !hasMoreTopRef.current) {
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
		[dispatch, clanId, channelId]
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

	// maintain scroll position
	const firsRowCached = useRef<string>('');
	const lastRowCached = useRef<string>('');

	const handleOnChange = useCallback(
		async (instance: Virtualizer<HTMLDivElement, HTMLDivElement>) => {
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
						setTimeout(() => {
							isLoadMore.current = false;
						}, 200);
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
							setTimeout(() => {
								isLoadMore.current = false;
							}, 100);
						}
					}
					break;
			}
		},
		[loadMoreMessage, messages]
	);

	const scrollToLastMessage = useCallback(() => {
		return new Promise((rs) => {
			if (isLoadMore.current) return rs(true);
			chatRef.current && (chatRef.current.scrollTop = chatRef.current.scrollHeight);
			rs(true);
		});
	}, []);

	useEffect(() => {
		if (dataReferences?.message_ref_id && getChatScrollBottomOffset() <= 100) {
			scrollToLastMessage();
		}
	}, [dataReferences, lastMessage, scrollToLastMessage, getChatScrollBottomOffset]);

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
	}, [userId, messages.length, isViewOlderMessage, scrollToLastMessage, getChatScrollBottomOffset]);

	return (
		<MessageContextMenuProvider channelId={channelId} allUserIdsInChannel={allUserIdsInChannel as string[]} allRolesInClan={allRolesInClan}>
			<ChatMessageList
				messages={messages}
				chatRef={chatRef}
				userActiveScroll={userActiveScroll}
				appearanceTheme={appearanceTheme}
				lastMessageId={lastMessageId as string}
				dataReferences={dataReferences}
				idMessageNotified={idMessageNotified}
				lastMessageUnreadId={lastMessageUnreadId as string}
				avatarDM={avatarDM}
				userName={userName}
				channelId={channelId}
				mode={mode}
				channelLabel={channelLabel}
				onChange={handleOnChange}
				isLoadMore={isLoadMore}
				firsRowCached={firsRowCached}
				lastRowCached={lastRowCached}
				currentScrollDirection={currentScrollDirection}
			/>
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

type ChatMessageListProps = {
	messages: string[];
	chatRef: React.RefObject<HTMLDivElement>;
	userActiveScroll: React.MutableRefObject<boolean>;
	appearanceTheme: string;
	lastMessageId: string;
	dataReferences: ApiMessageRef;
	idMessageNotified: string;
	lastMessageUnreadId: string;
	avatarDM?: string;
	userName?: string;
	channelId: string;
	mode: number;
	channelLabel?: string;
	onChange: (instance: Virtualizer<HTMLDivElement, HTMLDivElement>) => void;
	isLoadMore: React.MutableRefObject<boolean>;
	firsRowCached: React.MutableRefObject<string>;
	lastRowCached: React.MutableRefObject<string>;
	currentScrollDirection: React.MutableRefObject<ELoadMoreDirection | null>;
};

const ChatMessageList: React.FC<ChatMessageListProps> = memo(
	({
		messages,
		chatRef,
		userActiveScroll,
		appearanceTheme,
		lastMessageId,
		dataReferences,
		idMessageNotified,
		lastMessageUnreadId,
		avatarDM,
		userName,
		channelId,
		mode,
		channelLabel,
		onChange,
		isLoadMore,
		firsRowCached,
		lastRowCached,
		currentScrollDirection
	}) => {
		const dispatch = useAppDispatch();
		const idMessageToJump = useSelector(selectIdMessageToJump);

		const jumpPinMessageId = useSelector(selectJumpPinMessageId);
		const isPinMessageExist = useSelector(selectIsMessageIdExist(channelId, jumpPinMessageId));
		const isMessageExist = useSelector(selectIsMessageIdExist(channelId, idMessageToJump?.id as string));
		const entities = useAppSelector((state) => selectMessageEntitiesByChannelId(state, channelId));

		const rowVirtualizer = useVirtualizer({
			count: messages.length,
			overscan: 5,
			getScrollElement: () => chatRef.current,
			estimateSize: () => 50,
			onChange
		});

		useLayoutEffect(() => {
			if (!rowVirtualizer.getVirtualItems().length) return;
			if (!rowVirtualizer.getTotalSize()) return;
			if (chatRef.current && messages?.length && !userActiveScroll.current) {
				chatRef.current.scrollTop = chatRef.current.scrollHeight;
			}
		});

		useLayoutEffect(() => {
			if (!isLoadMore.current || !chatRef.current || !userActiveScroll.current) return;
			const firstMessageId = messages[0];
			const lastMessageId = messages[messages.length - 1];
			if (firsRowCached.current !== firstMessageId) {
				if (firsRowCached.current && currentScrollDirection.current === ELoadMoreDirection.top) {
					const messageId = firsRowCached.current;
					chatRef.current.style.pointerEvents = 'none';
					const index = messages.findIndex((item) => item === messageId);
					if (index !== -1) {
						rowVirtualizer.scrollToIndex(index, { align: 'start' });
					}
					setTimeout(() => {
						if (!chatRef.current) return;
						chatRef.current.style.pointerEvents = 'auto';
					}, 200);
				}
				firsRowCached && (firsRowCached.current = messages[1]);
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

		const timerRef = useRef<number | null>(null);
		useEffect(() => {
			if (!rowVirtualizer.measurementsCache.length) return;

			let index = -1;

			const handleScrollToIndex = () => {
				if (index >= 0) {
					userActiveScroll.current = true;
					rowVirtualizer.scrollToIndex(index, { align: 'center', behavior: 'auto' });
				}
			};

			const clearTimer = () => {
				if (timerRef.current) {
					clearTimeout(timerRef.current);
					timerRef.current = null;
				}
			};

			clearTimer();

			const setTimer = (action: Action) => {
				timerRef.current = window.setTimeout(() => {
					dispatch(action);
				}, 1000);
			};

			if (jumpPinMessageId && isPinMessageExist) {
				index = messages.findIndex((item) => item === jumpPinMessageId);
				handleScrollToIndex();
				setTimer(pinMessageActions.setJumpPinMessageId(null));
			} else if (idMessageToJump && isMessageExist && !jumpPinMessageId) {
				index = messages.findIndex((item) => item === idMessageToJump?.id);
				if (idMessageToJump?.navigate) {
					setTimeout(() => {
						handleScrollToIndex();
						setTimer(messagesActions.setIdMessageToJump(null));
					});
				} else {
					handleScrollToIndex();
					setTimer(messagesActions.setIdMessageToJump(null));
				}
			}

			return clearTimer;
		}, [dispatch, jumpPinMessageId, isPinMessageExist, idMessageToJump, isMessageExist, messages, rowVirtualizer]);

		// RESET COMPONENT UNMOUNT
		useEffect(() => {
			return () => {
				messagesActions.setIdMessageToJump(null);
				pinMessageActions.setJumpPinMessageId(null);
			};
		}, []);

		return (
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
								const checkMessageTargetToMoved = idMessageToJump?.id === messageId && messageId !== lastMessageId;
								const messageReplyHighlight =
									(dataReferences?.message_ref_id && dataReferences?.message_ref_id === messageId) || false;
								return (
									<div key={virtualRow.key} data-index={virtualRow.index} ref={rowVirtualizer.measureElement}>
										<MemorizedChannelMessage
											index={virtualRow.index}
											message={entities[messageId]}
											previousMessage={entities[messages[virtualRow.index - 1]]}
											avatarDM={avatarDM}
											userName={userName}
											messageId={messageId}
											nextMessageId={messages[virtualRow.index + 1]}
											channelId={channelId}
											isHighlight={messageId === idMessageNotified}
											mode={mode}
											channelLabel={channelLabel ?? ''}
											isLastSeen={Boolean(messageId === lastMessageUnreadId && messageId !== lastMessageId)}
											checkMessageTargetToMoved={checkMessageTargetToMoved}
											messageReplyHighlight={messageReplyHighlight}
										/>
									</div>
								);
							})}
							<div className="h-[20px] w-[1px] pointer-events-none"></div>
						</div>
					</div>
				</div>
			</div>
		);
	},
	(prev, curr) => {
		return (
			prev.messages === curr.messages &&
			prev.lastMessageId === curr.lastMessageId &&
			prev.dataReferences === curr.dataReferences &&
			prev.idMessageNotified === curr.idMessageNotified &&
			prev.lastMessageUnreadId === curr.lastMessageUnreadId &&
			prev.appearanceTheme === curr.appearanceTheme
		);
	}
);

const MemoizedChannelMessages = memo(ChannelMessages, (prev, cur) => prev.channelId === cur.channelId) as unknown as typeof ChannelMessages & {
	Skeleton: typeof ChannelMessages.Skeleton;
};

export default MemoizedChannelMessages;

(MemoizedChannelMessages as any).displayName = 'MemoizedChannelMessages';
