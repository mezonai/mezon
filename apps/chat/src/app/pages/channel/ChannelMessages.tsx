import { ELoadMoreDirection, IBeforeRenderCb } from '@mezon/chat-scroll';
import { MessageContextMenuProvider, MessageWithUser } from '@mezon/components';
import {
	LoadMoreDirection,
	isBackgroundModeActive,
	useContainerHeight,
	useCurrentInbox,
	useIdleRender,
	useLayoutEffectWithPrevDeps,
	useScrollHooks,
	useStateRef,
	useSyncEffect
} from '@mezon/core';
import {
	MessagesEntity,
	RootState,
	messagesActions,
	pinMessageActions,
	selectAllAccount,
	selectAllChannelMemberIds,
	selectAllRoleIds,
	selectCurrentChannelId,
	selectDataReferences,
	selectFirstMessageOfCurrentTopic,
	selectHasMoreBottomByChannelId2,
	selectHasMoreMessageByChannelId2,
	selectIdMessageToJump,
	selectIsJumpingToPresent,
	selectIsMessageIdExist,
	selectJumpPinMessageId,
	selectLastMessageByChannelId,
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId2,
	selectMessageIsLoading,
	selectMessageNotified,
	selectTheme,
	selectUnreadMessageIdByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	Direction_Mode,
	animateScroll,
	convertInitialMessageOfTopic,
	forceMeasure,
	isAnimatingScroll,
	requestForcedReflow,
	requestMeasure,
	resetScroll,
	restartCurrentScrollAnimation,
	toggleDisableHover
} from '@mezon/utils';
import { ChannelMessage as ChannelMessageType, ChannelType } from 'mezon-js';
import { ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import { ChannelMessage, MemorizedChannelMessage } from './ChannelMessage';

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
	topicId?: string;
};

const MESSAGE_LIST_SLICE = 50;
const MESSAGE_ANIMATION_DURATION = 500;
const BOTTOM_THRESHOLD = 100;
const BOTTOM_FOCUS_MARGIN = 20;

function ChannelMessages({
	clanId,
	channelId,
	channelLabel,
	avatarDM,
	userName,
	mode,
	userIdsFromThreadBox,
	isThreadBox = false,
	isTopicBox,
	topicId
}: ChannelMessagesProps) {
	const store = useStore();
	const appearanceTheme = useSelector(selectTheme);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentInbox = useCurrentInbox();
	const messageIds = useAppSelector((state) => selectMessageIdsByChannelId2(state, channelId));
	const idMessageNotified = useSelector(selectMessageNotified);
	const isJumpingToPresent = useAppSelector((state) => selectIsJumpingToPresent(state, channelId));
	const isFetching = useSelector(selectMessageIsLoading);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const getMemberIds = useAppSelector((state) => selectAllChannelMemberIds(state, currentInbox?.channel_id as string));
	const allUserIdsInChannel = isThreadBox ? userIdsFromThreadBox : getMemberIds;
	const allRolesInClan = useSelector(selectAllRoleIds);
	const dataReferences = useSelector(selectDataReferences(channelId ?? ''));
	const lastMessageId = lastMessage?.id;
	const lastMessageUnreadId = useAppSelector((state) => selectUnreadMessageIdByChannelId(state, channelId as string));
	const userActiveScroll = useRef<boolean>(false);
	const dispatch = useAppDispatch();
	const chatRef = useRef<HTMLDivElement | null>(null);

	const isFetchingRef = useRef<boolean>(false);
	const skipCalculateScroll = useRef<boolean>(false);

	const anchorIdRef = useRef<string | null>(null);
	const anchorTopRef = useRef<number | null>(null);
	const setAnchor = useRef<number | null>(null);

	useSyncEffect(() => {
		userActiveScroll.current = false;
		skipCalculateScroll.current = false;
		anchorIdRef.current = null;
		anchorTopRef.current = null;
	}, [channelId]);

	useEffect(() => {
		isFetchingRef.current = isFetching;
	}, [isFetching]);

	const loadMoreMessage = useCallback(
		async (direction: ELoadMoreDirection, cb?: IBeforeRenderCb) => {
			if (isFetchingRef.current) {
				return;
			}

			if (direction === ELoadMoreDirection.bottom) {
				const hasMoreBottom = selectHasMoreBottomByChannelId2(store.getState() as RootState, channelId);
				if (!hasMoreBottom) {
					dispatch(messagesActions.setViewingOlder({ channelId, status: false }));
					return;
				}
			}

			if (direction === ELoadMoreDirection.top) {
				const hasMoreTop = selectHasMoreMessageByChannelId2(store.getState() as RootState, channelId);
				if (!hasMoreTop) {
					return;
				}
			}

			if (typeof cb === 'function') {
				cb();
			}

			if (direction === ELoadMoreDirection.bottom) {
				//load more in topic
				if (isTopicBox) {
					await dispatch(
						messagesActions.loadMoreMessage({
							clanId,
							channelId: currentChannelId as string,
							direction: Direction_Mode.AFTER_TIMESTAMP,
							topicId
						})
					);
					return true;
				}
				await dispatch(messagesActions.loadMoreMessage({ clanId, channelId, direction: Direction_Mode.AFTER_TIMESTAMP }));
				// dispatch(messagesActions.setViewingOlder({ channelId, status: true }));
				return true;
			}

			//load more in topic
			if (isTopicBox) {
				await dispatch(
					messagesActions.loadMoreMessage({
						clanId,
						channelId: currentChannelId as string,
						direction: Direction_Mode.BEFORE_TIMESTAMP,
						topicId
					})
				);
				return true;
			}

			await dispatch(messagesActions.loadMoreMessage({ clanId, channelId, direction: Direction_Mode.BEFORE_TIMESTAMP }));

			return true;
		},
		[isTopicBox, dispatch, clanId, channelId, currentChannelId, topicId]
	);

	const getChatScrollBottomOffset = useCallback(() => {
		const element = chatRef.current;
		if (!element) {
			return 0;
		}
		return Math.abs(element?.scrollHeight - element?.clientHeight - element?.scrollTop);
	}, []);

	const isLoadMore = useRef<boolean>(false);
	const currentScrollDirection = useRef<ELoadMoreDirection | null>(null);

	const handleOnChange = useCallback(
		async (direction: LoadMoreDirection) => {
			if (!userActiveScroll.current) return;
			if (isLoadMore.current || !chatRef.current?.scrollHeight) return;
			switch (direction) {
				case LoadMoreDirection.Backwards:
					currentScrollDirection.current = ELoadMoreDirection.top;
					isLoadMore.current = true;
					await loadMoreMessage(ELoadMoreDirection.top);
					setTimeout(() => {
						isLoadMore.current = false;
					}, 200);
					break;
				case LoadMoreDirection.Forwards:
					currentScrollDirection.current = ELoadMoreDirection.bottom;
					isLoadMore.current = true;
					await loadMoreMessage(ELoadMoreDirection.bottom);
					setTimeout(() => {
						isLoadMore.current = false;
					}, 200);
					break;
			}
		},
		[loadMoreMessage, messageIds]
	);

	const scrollToLastMessage = useCallback(() => {
		if (userActiveScroll.current) {
			userActiveScroll.current = false;
			skipCalculateScroll.current = true;
			anchorIdRef.current = null;
			anchorTopRef.current = null;
		}

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
				setAnchor.current = new Date().getTime();
			});
		}
	}, [dispatch, isJumpingToPresent, channelId, scrollToLastMessage]);

	const shouldRender = useIdleRender();
	if (!shouldRender) return null;

	return (
		<MessageContextMenuProvider channelId={channelId} allUserIdsInChannel={allUserIdsInChannel as string[]} allRolesInClan={allRolesInClan}>
			<ChatMessageList
				key={channelId}
				messageIds={messageIds}
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
				isTopic={isTopicBox}
				skipCalculateScroll={skipCalculateScroll}
				anchorIdRef={anchorIdRef}
				anchorTopRef={anchorTopRef}
				setAnchor={setAnchor}
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
	messageIds: string[];
	chatRef: React.RefObject<HTMLDivElement>;
	userActiveScroll: React.MutableRefObject<boolean>;
	skipCalculateScroll: React.MutableRefObject<boolean>;
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
	onChange: (direction: LoadMoreDirection) => void;
	isTopic?: boolean;
	anchorIdRef: React.MutableRefObject<string | null>;
	anchorTopRef: React.MutableRefObject<number | null>;
	setAnchor: React.MutableRefObject<number | null>;
};

const ChatMessageList: React.FC<ChatMessageListProps> = memo(
	({
		messageIds,
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
		isTopic,
		skipCalculateScroll,
		anchorIdRef,
		anchorTopRef,
		setAnchor
	}) => {
		const store = useStore();
		const dispatch = useAppDispatch();
		const userId = useSelector(selectAllAccount)?.user?.id;
		const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
		const idMessageToJump = useSelector(selectIdMessageToJump);
		const jumpPinMessageId = useSelector(selectJumpPinMessageId);
		const entities = useAppSelector((state) => selectMessageEntitiesByChannelId(state, channelId));
		const firstMsgOfThisTopic = useSelector(selectFirstMessageOfCurrentTopic);

		const [getContainerHeight, prevContainerHeightRef] = useContainerHeight(chatRef, true);

		const isViewportNewest = true;
		const isUnread = true;
		const isReady = true;

		const [isScrollDownNeeded, setIsScrollDownShown] = useState(false);

		const [isNotchShown, setIsNotchShown] = useState<boolean | undefined>();

		const { withHistoryTriggers, backwardsTriggerRef, forwardsTriggerRef, fabTriggerRef } = useScrollHooks(
			'thread',
			chatRef,
			messageIds,
			getContainerHeight,
			isViewportNewest,
			isUnread,
			setIsScrollDownShown,
			setIsNotchShown,
			isReady,
			(event: { direction: LoadMoreDirection }) => {
				onChange(event.direction);
			}
		);

		const listItemElementsRef = useRef<HTMLDivElement[]>();

		const scrollOffsetRef = useRef<number>(0);

		const memoFocusingIdRef = useRef<number>();

		const attachmentSending = useRef<string | null>();

		useSyncEffect(() => {
			if (idMessageToJump || jumpPinMessageId) {
				userActiveScroll.current = false;
				skipCalculateScroll.current = true;
				anchorIdRef.current = null;
				anchorTopRef.current = null;
			}
		}, [idMessageToJump, jumpPinMessageId]);

		// useSyncEffect(() => {
		// 	memoFocusingIdRef.current = focusingId;
		// }, [focusingId]);

		// Handles updated message list, takes care of scroll repositioning
		useLayoutEffectWithPrevDeps(
			([prevMessageIds, prevIsViewportNewest]) => {
				if (skipCalculateScroll.current) return;
				const containerHeight = getContainerHeight();
				const prevContainerHeight = prevContainerHeightRef.current;
				prevContainerHeightRef.current = containerHeight;

				// Skip initial resize observer callback
				if (
					messageIds === prevMessageIds &&
					isViewportNewest === prevIsViewportNewest &&
					containerHeight !== prevContainerHeight &&
					prevContainerHeight === undefined
				) {
					return;
				}

				const container = chatRef.current!;
				listItemElementsRef.current = Array.from(container.querySelectorAll<HTMLDivElement>('.message-list-item'));

				const lastItemElement = listItemElementsRef.current[listItemElementsRef.current.length - 1];
				// const firstUnreadElement = memoFirstUnreadIdRef.current
				// 	? container.querySelector<HTMLDivElement>(`#${getMessageHtmlId(memoFirstUnreadIdRef.current)}`)
				// 	: undefined;

				const hasLastMessageChanged =
					messageIds && prevMessageIds && messageIds[messageIds.length - 1] !== prevMessageIds[prevMessageIds.length - 1];
				const hasViewportShifted = messageIds?.[0] !== prevMessageIds?.[0] && messageIds?.length === MESSAGE_LIST_SLICE / 2 + 1;
				const wasMessageAdded = hasLastMessageChanged && !hasViewportShifted;

				// Add extra height when few messages to allow scroll animation
				if (
					isViewportNewest &&
					wasMessageAdded &&
					messageIds &&
					messageIds.length < MESSAGE_LIST_SLICE / 2 &&
					!container.parentElement!.classList.contains('force-messages-scroll') &&
					forceMeasure(() => (container.firstElementChild as HTMLDivElement)!.clientHeight <= container.offsetHeight * 2)
				) {
					// addExtraClass(container.parentElement!, 'force-messages-scroll');
					container.parentElement!.classList.add('force-messages-scroll');

					setTimeout(() => {
						if (container.parentElement) {
							// removeExtraClass(container.parentElement!, 'force-messages-scroll');
							container.parentElement!.classList.remove('force-messages-scroll');
						}
					}, MESSAGE_ANIMATION_DURATION);
				}

				requestForcedReflow(() => {
					const { scrollTop, scrollHeight, offsetHeight } = container;
					const scrollOffset = scrollOffsetRef.current;
					let bottomOffset = scrollOffset - (prevContainerHeight || offsetHeight);
					if (wasMessageAdded) {
						// If two new messages come at once (e.g. when bot responds) then the first message will update `scrollOffset`
						// right away (before animation) which creates inconsistency until the animation completes. To work around that,
						// we calculate `isAtBottom` with a "buffer" of the latest message height (this is approximate).
						const lastItemHeight = lastItemElement ? lastItemElement.offsetHeight : 0;
						bottomOffset -= lastItemHeight;
					}
					// const isAtBottom = isViewportNewest && prevIsViewportNewest && bottomOffset <= BOTTOM_THRESHOLD;
					const isAtBottom =
						chatRef?.current &&
						Math.abs(chatRef.current.scrollHeight - chatRef.current.clientHeight - chatRef.current.scrollTop) <= BOTTOM_THRESHOLD;
					// const isAlreadyFocusing = messageIds && memoFocusingIdRef.current === messageIds[messageIds.length - 1];
					const isAlreadyFocusing = false;
					// Animate incoming message, but if app is in background mode, scroll to the first unread
					if (lastMessage?.isSending && lastMessage?.attachments?.[0]) {
						attachmentSending.current = lastMessage?.attachments[0].url;
					}
					if (
						(isAtBottom || (attachmentSending.current && attachmentSending.current === lastMessage?.attachments?.[0]?.url)) &&
						!isAlreadyFocusing
					) {
						// Break out of `forceLayout`
						requestMeasure(() => {
							const shouldScrollToBottom = !isBackgroundModeActive();
							// firstUnreadElement
							// noMessageSendingAnimation

							animateScroll(
								container,
								shouldScrollToBottom ? lastItemElement! : null!,
								shouldScrollToBottom ? 'end' : 'start',
								BOTTOM_FOCUS_MARGIN,
								undefined,
								undefined,
								undefined
							);
						});
						if (userId === lastMessage?.sender_id) {
							if (attachmentSending.current === lastMessage?.attachments?.[0]?.url && !lastMessage?.isSending) {
								attachmentSending.current = null;
							}
							return;
						}
					}

					const isResized = prevContainerHeight !== undefined && prevContainerHeight !== containerHeight;
					if (isResized && isAnimatingScroll()) {
						return undefined;
					}

					const anchor = anchorIdRef.current && container.querySelector(`#${anchorIdRef.current}`);
					// const unreadDivider =
					// 	!anchor && memoUnreadDividerBeforeIdRef.current && container.querySelector<HTMLDivElement>(`.${UNREAD_DIVIDER_CLASS}`);

					let newScrollTop!: number;
					if (isAtBottom && isResized) {
						newScrollTop = scrollHeight - offsetHeight;
					} else if (anchor) {
						const newAnchorTop = anchor.getBoundingClientRect().top;
						newScrollTop = scrollTop + (newAnchorTop - (anchorTopRef.current || 0));
					} else {
						newScrollTop = scrollHeight - scrollOffset;
					}

					return () => {
						resetScroll(container, Math.ceil(newScrollTop));
						restartCurrentScrollAnimation();
						scrollOffsetRef.current = Math.max(Math.ceil(scrollHeight - newScrollTop), offsetHeight);
						// if (!memoFocusingIdRef.current) {
						// 	isScrollTopJustUpdatedRef.current = true;
						// 	requestMeasure(() => {
						// 		isScrollTopJustUpdatedRef.current = false;
						// 	});
						// }
					};
				});
				// This should match deps for `useSyncEffect` above
			},
			[messageIds, isViewportNewest, getContainerHeight, prevContainerHeightRef]
		);

		const rememberScrollPositionRef = useStateRef(() => {
			if (!messageIds || !listItemElementsRef.current || !userActiveScroll.current) {
				return;
			}

			const preservedItemElements = listItemElementsRef.current.filter((element) => messageIds.includes(element.id.replace('msg-', '')));

			// We avoid the very first item as it may be a partly-loaded album
			// and also because it may be removed when messages limit is reached
			const anchor = preservedItemElements[1] || preservedItemElements[0];

			if (!anchor) {
				return;
			}
			anchorIdRef.current = anchor.id;
			anchorTopRef.current = anchor.getBoundingClientRect().top;
		});

		useEffect(() => {
			if (!setAnchor?.current) return;
			const container = chatRef?.current;
			if (!container) return;
			listItemElementsRef.current = Array.from(container.querySelectorAll<HTMLDivElement>('.message-list-item'));
			rememberScrollPositionRef.current();
		}, [setAnchor?.current, rememberScrollPositionRef]);

		useSyncEffect(
			() => forceMeasure(() => rememberScrollPositionRef.current()),
			// This will run before modifying content and should match deps for `useLayoutEffectWithPrevDeps` below
			[messageIds, userActiveScroll.current, isViewportNewest, rememberScrollPositionRef]
		);

		useEffect(
			() => rememberScrollPositionRef.current(),
			// This is only needed to react on signal updates
			[getContainerHeight, rememberScrollPositionRef]
		);

		const convertedFirstMsgOfThisTopic = useMemo(() => {
			if (!firstMsgOfThisTopic?.message) {
				return firstMsgOfThisTopic as MessagesEntity;
			}
			return convertInitialMessageOfTopic(firstMsgOfThisTopic.message as ChannelMessageType);
		}, [firstMsgOfThisTopic]);

		// Handle scroll to specific message (jump/pin)
		const timerRef = useRef<number | null>(null);
		useEffect(() => {
			const clearTimer = () => {
				if (timerRef.current) {
					clearTimeout(timerRef.current);
					timerRef.current = null;
				}
			};

			const scrollToMessage = (messageId: string) => {
				const messageElement = document.getElementById('msg-' + messageId);
				if (messageElement) {
					setAnchor.current = new Date().getTime();
					userActiveScroll.current = true;
					messageElement.scrollIntoView({ behavior: 'auto', block: 'center' });
				}
			};

			clearTimer();

			const isPinMessageExist = selectIsMessageIdExist(store.getState() as RootState, channelId, jumpPinMessageId);
			const isMessageExist = selectIsMessageIdExist(store.getState() as RootState, channelId, idMessageToJump?.id);

			if (jumpPinMessageId && isPinMessageExist) {
				scrollToMessage(jumpPinMessageId);
				timerRef.current = window.setTimeout(() => {
					dispatch(pinMessageActions.setJumpPinMessageId(null));
				}, 1000);
			} else if (idMessageToJump && isMessageExist && !jumpPinMessageId) {
				if (idMessageToJump?.navigate) {
					setTimeout(() => {
						scrollToMessage(idMessageToJump.id);
						timerRef.current = window.setTimeout(() => {
							dispatch(messagesActions.setIdMessageToJump(null));
						}, 1000);
					});
				} else {
					scrollToMessage(idMessageToJump.id);
					timerRef.current = window.setTimeout(() => {
						dispatch(messagesActions.setIdMessageToJump(null));
					}, 1000);
				}
			}

			return clearTimer;
		}, [jumpPinMessageId, idMessageToJump]);

		// Cleanup on unmount
		useEffect(() => {
			return () => {
				dispatch(messagesActions.setIdMessageToJump(null));
				dispatch(pinMessageActions.setJumpPinMessageId(null));
			};
		}, [dispatch]);

		const scrollTimeoutId2 = useRef<NodeJS.Timeout | null>(null);
		return (
			<div className="messages-container">
				<div
					onWheelCapture={() => {
						toggleDisableHover(chatRef.current, scrollTimeoutId2);
						userActiveScroll.current = true;
						skipCalculateScroll.current = false;
					}}
					onTouchStart={() => {
						userActiveScroll.current = true;
						skipCalculateScroll.current = false;
					}}
					onMouseDown={() => {
						userActiveScroll.current = true;
						skipCalculateScroll.current = false;
					}}
					ref={chatRef}
					id="scrollLoading"
					className="dark:bg-bgPrimary"
				>
					<div className="flex flex-col min-h-full mt-auto justify-end">
						{isTopic && convertedFirstMsgOfThisTopic && (
							<div className="sticky top-0 z-[1] dark:bg-bgPrimary bg-bgLightPrimary">
								<div
									className={`fullBoxText relative group ${convertedFirstMsgOfThisTopic?.references?.[0]?.message_ref_id ? 'pt-3' : ''}`}
								>
									<MessageWithUser
										isTopic={isTopic}
										allowDisplayShortProfile={true}
										message={convertedFirstMsgOfThisTopic}
										mode={mode}
									/>
								</div>
							</div>
						)}
						{withHistoryTriggers && <div ref={backwardsTriggerRef} key="backwards-trigger" className="backwards-trigger" />}
						{messageIds.map((messageId, index) => {
							const checkMessageTargetToMoved = idMessageToJump?.id === messageId && messageId !== lastMessageId;
							const messageReplyHighlight = (dataReferences?.message_ref_id && dataReferences?.message_ref_id === messageId) || false;
							return (
								<div className="message-list-item" key={messageId} id={'msg-' + messageId}>
									<MemorizedChannelMessage
										index={index}
										message={entities[messageId]}
										previousMessage={entities[messageIds[index - 1]]}
										avatarDM={avatarDM}
										userName={userName}
										messageId={messageId}
										nextMessageId={messageIds[index + 1]}
										channelId={channelId}
										isHighlight={messageId === idMessageNotified}
										mode={mode}
										channelLabel={channelLabel ?? ''}
										isLastSeen={Boolean(messageId === lastMessageUnreadId && messageId !== lastMessageId)}
										checkMessageTargetToMoved={checkMessageTargetToMoved}
										messageReplyHighlight={messageReplyHighlight}
										isTopic={isTopic}
									/>
								</div>
							);
						})}
						{withHistoryTriggers && <div ref={forwardsTriggerRef} key="forwards-trigger" className="forwards-trigger" />}

						<div ref={fabTriggerRef} key="fab-trigger" className="fab-trigger" />
						<div className="h-[20px] w-[1px] pointer-events-none"></div>
					</div>
				</div>
			</div>
		);
	},
	(prev, curr) => {
		return (
			prev.messageIds === curr.messageIds &&
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
