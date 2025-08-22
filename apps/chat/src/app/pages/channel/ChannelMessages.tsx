import { ELoadMoreDirection, IBeforeRenderCb } from '@mezon/chat-scroll';
import { MessageContextMenuProvider, MessageWithUser, useMessageContextMenu } from '@mezon/components';
import { useMessageObservers, usePermissionChecker } from '@mezon/core';
import {
	MessagesEntity,
	RootState,
	channelsActions,
	getStore,
	messagesActions,
	selectAllAccount,
	selectChannelDraftMessage,
	selectCurrentChannelId,
	selectDataReferences,
	selectFirstMessageOfCurrentTopic,
	selectHasMoreBottomByChannelId2,
	selectHasMoreMessageByChannelId2,
	selectIdMessageRefEdit,
	selectIdMessageToJump,
	selectIsJumpingToPresent,
	selectIsMessageIdExist,
	selectLastMessageByChannelId,
	selectLatestMessageId,
	selectMemberClanByUserId2,
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId2,
	selectMessageIsLoading,
	selectMessageNotified,
	selectOpenEditMessageState,
	selectScrollOffsetByChannelId,
	selectShowScrollDownButton,
	selectTheme,
	selectUnreadMessageIdByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	BooleanToVoidFunction,
	ChannelMembersEntity,
	Direction_Mode,
	EOverriddenPermission,
	LoadMoreDirection,
	animateScroll,
	buildClassName,
	convertInitialMessageOfTopic,
	debounce,
	forceMeasure,
	isAnimatingScroll,
	isBackgroundModeActive,
	requestForcedReflow,
	requestMeasure,
	resetScroll,
	toggleDisableHover,
	useContainerHeight,
	useLastCallback,
	useLayoutEffectWithPrevDeps,
	useScrollHooks,
	useStateRef,
	useSyncEffect
} from '@mezon/utils';
import classNames from 'classnames';
import { ChannelMessage as ChannelMessageType, ChannelType } from 'mezon-js';
import { ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChannelMessage, MemorizedChannelMessage } from './ChannelMessage';

type ChannelMessagesProps = {
	clanId: string;
	channelId: string;
	type: ChannelType;
	channelLabel?: string;
	avatarDM?: string;
	mode: number;
	username?: string;
	userIdsFromThreadBox?: string[];
	userIdsFromTopicBox?: string[] | ChannelMembersEntity[];
	isThreadBox?: boolean;
	isTopicBox?: boolean;
	topicId?: string;
	isDM?: boolean;
	isPrivate?: number;
};

const MESSAGE_LIST_SLICE = 50;
const MESSAGE_ANIMATION_DURATION = 500;
const BOTTOM_THRESHOLD = 100;
const BOTTOM_FOCUS_MARGIN = 20;
const SCROLL_DEBOUNCE = 200;

const runDebouncedForScroll = debounce((cb) => cb(), SCROLL_DEBOUNCE, false);

const DMMessageWrapper = ({ channelId, children }: { channelId: string; children: React.ReactNode }) => {
	return <MessageContextMenuProvider channelId={channelId}>{children}</MessageContextMenuProvider>;
};

const ClanMessageWrapper = ({
	channelId,
	isThreadBox,
	isTopicBox,
	userIdsFromThreadBox,
	userIdsFromTopicBox,
	children
}: {
	channelId: string;
	isThreadBox?: boolean;
	isTopicBox?: boolean;
	userIdsFromThreadBox?: string[];
	userIdsFromTopicBox?: string[] | ChannelMembersEntity[];
	children: React.ReactNode;
}) => {
	return <MessageContextMenuProvider channelId={channelId}>{children}</MessageContextMenuProvider>;
};

function ChannelMessages({
	clanId,
	channelId,
	channelLabel,
	avatarDM,
	username,
	mode,
	userIdsFromThreadBox,
	userIdsFromTopicBox,
	isThreadBox = false,
	isTopicBox,
	isDM,
	topicId,
	isPrivate
}: ChannelMessagesProps) {
	const appearanceTheme = useSelector(selectTheme);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const messageIds = useAppSelector((state) => selectMessageIdsByChannelId2(state, channelId));
	const idMessageNotified = useSelector(selectMessageNotified);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
	const dataReferences = useAppSelector((state) => selectDataReferences(state, channelId ?? ''));
	const lastMessageId = lastMessage?.id;
	const lastMessageUnreadId = useAppSelector((state) => selectUnreadMessageIdByChannelId(state, channelId as string));
	const userActiveScroll = useRef<boolean>(false);
	const dispatch = useAppDispatch();
	const chatRef = useRef<HTMLDivElement | null>(null);

	const skipCalculateScroll = useRef<boolean>(false);

	const anchorIdRef = useRef<string | null>(null);
	const anchorTopRef = useRef<number | null>(null);
	const setAnchor = useRef<number | null>(null);
	const previousChannelId = useRef<string | null>(null);
	const preventScrollbottom = useRef<boolean>(false);

	useSyncEffect(() => {
		userActiveScroll.current = false;
		skipCalculateScroll.current = false;
		anchorIdRef.current = null;
		anchorTopRef.current = null;
		preventScrollbottom.current = false;
		requestIdleCallback &&
			requestIdleCallback(() => {
				previousChannelId.current && dispatch(messagesActions.updateLastFiftyMessagesAction(previousChannelId.current));
				previousChannelId.current = channelId;
			});
	}, [channelId]);

	useSyncEffect(() => {
		return () => {
			requestIdleCallback &&
				requestIdleCallback(() => {
					previousChannelId.current && dispatch(messagesActions.updateLastFiftyMessagesAction(previousChannelId.current));
				});
		};
	}, []);

	const loadMoreMessage = useCallback(
		async (direction: ELoadMoreDirection, cb?: IBeforeRenderCb) => {
			const store = getStore();
			const isFetching = selectMessageIsLoading(store.getState());
			if (isFetching) {
				return;
			}

			if (direction === ELoadMoreDirection.bottom) {
				const hasMoreBottom = selectHasMoreBottomByChannelId2(store.getState() as RootState, channelId);
				if (!hasMoreBottom || preventScrollbottom.current) {
					dispatch(messagesActions.setViewingOlder({ channelId, status: false }));
					return;
				}
			}

			if (direction === ELoadMoreDirection.top) {
				// const hasMoreTop = selectHasMoreMessageByChannelId2(store.getState() as RootState, channelId);
				// if (!hasMoreTop) {
				// 	return;
				// }
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

				const res = await dispatch(messagesActions.loadMoreMessage({ clanId, channelId, direction: Direction_Mode.AFTER_TIMESTAMP }));
				const messages = (res?.payload as any)?.payload?.messages || [];
				if (lastMessageId === messages[0]?.id) {
					preventScrollbottom.current = true;
				} else {
					preventScrollbottom.current = false;
				}

				dispatch(messagesActions.resetLoading());
				// dispatch(messagesActions.setViewingOlder({ channelId, status: true }));
				return true;
			}

			preventScrollbottom.current = false;

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

			dispatch(messagesActions.resetLoading());

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

	const handleScrollDownVisibilityChange = useCallback(
		(isVisible: boolean) => {
			dispatch(
				channelsActions.setScrollDownVisibility({
					channelId,
					isVisible
				})
			);
		},
		[channelId]
	);

	const [isNotchShown, setIsNotchShown] = useState<boolean | undefined>();

	return (
		<>
			{isDM ? (
				<DMMessageWrapper channelId={channelId}>
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
						username={username}
						channelId={channelId}
						topicId={topicId}
						mode={mode}
						channelLabel={channelLabel}
						onChange={handleOnChange}
						isTopic={isTopicBox}
						skipCalculateScroll={skipCalculateScroll}
						anchorIdRef={anchorIdRef}
						anchorTopRef={anchorTopRef}
						setAnchor={setAnchor}
						isPrivate={isPrivate}
						clanId={clanId}
						onScrollDownToggle={handleScrollDownVisibilityChange}
						onNotchToggle={setIsNotchShown}
					/>
				</DMMessageWrapper>
			) : (
				<ClanMessageWrapper
					channelId={channelId}
					isThreadBox={isThreadBox}
					isTopicBox={isTopicBox}
					userIdsFromThreadBox={userIdsFromThreadBox}
					userIdsFromTopicBox={userIdsFromTopicBox}
				>
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
						username={username}
						channelId={channelId}
						topicId={topicId}
						mode={mode}
						channelLabel={channelLabel}
						onChange={handleOnChange}
						isTopic={isTopicBox}
						skipCalculateScroll={skipCalculateScroll}
						anchorIdRef={anchorIdRef}
						anchorTopRef={anchorTopRef}
						setAnchor={setAnchor}
						isPrivate={isPrivate}
						clanId={clanId}
						onScrollDownToggle={handleScrollDownVisibilityChange}
						onNotchToggle={setIsNotchShown}
					/>
				</ClanMessageWrapper>
			)}
			<ScrollDownButton channelId={channelId} clanId={clanId} messageIds={messageIds} chatRef={chatRef} />
		</>
	);
}

const ScrollDownButton = memo(
	({
		channelId,
		clanId,
		messageIds,
		chatRef
	}: {
		channelId: string;
		clanId: string;
		messageIds: string[];
		chatRef: React.RefObject<HTMLDivElement>;
	}) => {
		const dispatch = useAppDispatch();

		const isVisible = useAppSelector((state) => selectShowScrollDownButton(state, channelId));
		const appearanceTheme = useAppSelector(selectTheme);

		const handleJumpToPresent = async () => {
			await dispatch(
				messagesActions.fetchMessages({
					clanId,
					channelId,
					isFetchingLatestMessages: true,
					noCache: true,
					isClearMessage: true,
					toPresent: true
				})
			);
			dispatch(messagesActions.setIsJumpingToPresent({ channelId, status: true }));
		};

		const handleScrollDownClick = useLastCallback(() => {
			const messagesContainer = chatRef.current;
			if (!messagesContainer) return;
			const state = getStore().getState();

			const lastSentMessageId = selectLatestMessageId(state, channelId);

			const jumpPresent = !!lastSentMessageId && !messageIds.includes(lastSentMessageId as string) && messageIds.length >= 20;

			dispatch(
				channelsActions.setScrollOffset({
					channelId: channelId,
					offset: 0
				})
			);

			if (jumpPresent) {
				handleJumpToPresent();
				return;
			}

			const messageElements = messagesContainer.querySelectorAll<HTMLDivElement>('.message-list-item');
			const lastMessageElement = messageElements[messageElements.length - 1];
			if (!lastMessageElement) {
				return;
			}

			dispatch(messagesActions.jumToPresent({ channelId }));

			animateScroll({
				container: messagesContainer,
				element: lastMessageElement,
				position: 'end',
				margin: BOTTOM_FOCUS_MARGIN
			});
		});

		return (
			<button
				onClick={handleScrollDownClick}
				className={`bg-theme-primary ${
					isVisible ? 'opacity-100' : 'opacity-0'
				} cursor-pointer absolute z-10 rounded-full bg-clip-padding border text-token-text-secondary border-token-border-light w-8 h-8 flex items-center justify-center bottom-5 right-[12px] transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-inner`}
			>
				<svg
					width={18}
					height={18}
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={`icon-md ${appearanceTheme === 'light' ? 'text-black' : 'text-token-text-primary'}`}
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 21C11.7348 21 11.4804 20.8946 11.2929 20.7071L4.29289 13.7071C3.90237 13.3166 3.90237 12.6834 4.29289 12.2929C4.68342 11.9024 5.31658 11.9024 5.70711 12.2929L11 17.5858V4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4V17.5858L18.2929 12.2929C18.6834 11.9024 19.3166 11.9024 19.7071 12.2929C20.0976 12.6834 20.0976 13.3166 19.7071 13.7071L12.7071 20.7071C12.5196 20.8946 12.2652 21 12 21Z"
						fill="currentColor"
					/>
				</svg>
			</button>
		);
	}
);

ChannelMessages.Skeleton = () => {
	if (ChannelMessage.Skeleton) {
		return <></>;
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
	username?: string;
	isPrivate?: number;
	channelId: string;
	topicId?: string;
	mode: number;
	channelLabel?: string;
	onChange: (direction: LoadMoreDirection) => void;
	isTopic?: boolean;
	anchorIdRef: React.MutableRefObject<string | null>;
	anchorTopRef: React.MutableRefObject<number | null>;
	setAnchor: React.MutableRefObject<number | null>;
	clanId: string;
	onScrollDownToggle: BooleanToVoidFunction;
	onNotchToggle: BooleanToVoidFunction;
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
		username,
		channelId,
		topicId,
		mode,
		channelLabel,
		onChange,
		isTopic,
		skipCalculateScroll,
		anchorIdRef,
		anchorTopRef,
		setAnchor,
		isPrivate,
		clanId,
		onScrollDownToggle,
		onNotchToggle
	}) => {
		const dispatch = useAppDispatch();
		const user = useSelector(selectAllAccount);
		const currentClanUser = useAppSelector((state) => selectMemberClanByUserId2(state, user?.user?.id as string));
		const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, channelId));
		const idMessageToJump = useSelector(selectIdMessageToJump);
		const entities = useAppSelector((state) => selectMessageEntitiesByChannelId(state, channelId));
		const jumpToPresent = useAppSelector((state) => selectIsJumpingToPresent(state, channelId));
		const firstMsgOfThisTopic = useSelector(selectFirstMessageOfCurrentTopic);

		const openEditMessageState = useSelector(selectOpenEditMessageState);
		const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
		const channelDraftMessage = useAppSelector((state) => selectChannelDraftMessage(state, channelId));

		const getIsEditing = useCallback(
			(messageId: string) => {
				return channelDraftMessage?.message_id === messageId ? openEditMessageState : openEditMessageState && idMessageRefEdit === messageId;
			},
			[channelDraftMessage?.message_id, openEditMessageState, idMessageRefEdit]
		);

		const scrollOffsetRef = useRef<number>(0);

		useSyncEffect(() => {
			const store = getStore();
			const scrollOffset = selectScrollOffsetByChannelId(store.getState(), channelId);
			scrollOffsetRef.current = scrollOffset;
		}, [channelId]);

		const [getContainerHeight, prevContainerHeightRef] = useContainerHeight(chatRef, true);

		const isScrollTopJustUpdatedRef = useRef(false);
		const isViewportNewest = true;
		const isUnread = true;
		const isReady = useRef(false);
		useEffect(() => {
			if (messageIds?.length > 0) {
				isReady.current = true;
			}
			return () => {
				isReady.current = false;
			};
		}, [messageIds]);

		const [forceRender, setForceRender] = useState<boolean>(false);

		useEffect(() => {
			if (chatRef.current && jumpToPresent) {
				const container = chatRef.current;
				if (!container) return;
				const messageElements = container.querySelectorAll<HTMLDivElement>('.message-list-item');
				const lastMessageElement = messageElements[messageElements.length - 1];
				if (!lastMessageElement) {
					return;
				}
				animateScroll({
					container: container,
					element: lastMessageElement,
					position: 'end',
					margin: BOTTOM_FOCUS_MARGIN
				});
				dispatch(messagesActions.setIsJumpingToPresent({ channelId, status: false }));
			}
		}, [jumpToPresent]);

		const { withHistoryTriggers, backwardsTriggerRef, forwardsTriggerRef, fabTriggerRef } = useScrollHooks(
			'thread',
			chatRef,
			messageIds,
			getContainerHeight,
			isViewportNewest,
			isUnread,
			onScrollDownToggle,
			onNotchToggle,
			isReady,
			(event: { direction: LoadMoreDirection }) => {
				onChange(event.direction);
			}
		);

		const { observeIntersectionForLoading } = useMessageObservers('thread', chatRef, null, null, channelId);

		const listItemElementsRef = useRef<HTMLDivElement[]>();

		const memoFocusingIdRef = useRef<number>();

		useSyncEffect(() => {
			if (idMessageToJump) {
				userActiveScroll.current = false;
				skipCalculateScroll.current = true;
				anchorIdRef.current = null;
				anchorTopRef.current = null;
			}
		}, [idMessageToJump]);

		const handleScroll = useLastCallback(() => {
			if (isScrollTopJustUpdatedRef.current) {
				isScrollTopJustUpdatedRef.current = false;
				return;
			}

			const container = chatRef.current;

			if (!container) {
				return;
			}

			runDebouncedForScroll(() => {
				if (!userActiveScroll.current) return;

				const { scrollHeight, clientHeight, scrollTop } = container;
				if (container.scrollTop < 1000) {
					if (messageIds.length > 0) {
						onChange(LoadMoreDirection.Backwards);
					}
				}

				const bottomOffset = Math.abs(scrollHeight - clientHeight - scrollTop);
				const isAtBottom = bottomOffset <= BOTTOM_THRESHOLD;

				if (isAtBottom) {
					onChange(LoadMoreDirection.Forwards);
				}

				scrollOffsetRef.current = container.scrollHeight - container.scrollTop;

				dispatch(
					channelsActions.setScrollOffset({
						channelId: channelId,
						offset: scrollOffsetRef.current
					})
				);
			});
		});
		useSyncEffect(() => {
			const container = chatRef.current;
			if (!container) return;
			if (
				user?.user?.id === lastMessage?.sender_id &&
				lastMessage?.create_time &&
				new Date().getTime() - new Date(lastMessage.create_time).getTime() < 500
			) {
				const isRelyMessage = lastMessage?.references?.length && lastMessage?.references?.length > 0;
				const isAtBottom =
					chatRef?.current &&
					Math.abs(chatRef.current.scrollHeight - chatRef.current.clientHeight - chatRef.current.scrollTop) <= BOTTOM_THRESHOLD;

				if (isAtBottom && !isRelyMessage) return;
				skipCalculateScroll.current = true;
				const { scrollHeight, offsetHeight } = container;
				const newScrollTop = scrollHeight - offsetHeight;
				resetScroll(container, Math.ceil(newScrollTop));
				setTimeout(() => {
					skipCalculateScroll.current = false;
				}, 0);
			}
		}, [lastMessage]);

		useLayoutEffectWithPrevDeps(
			([prevMessageIds, prevIsViewportNewest]) => {
				if (skipCalculateScroll.current) return;
				const container = chatRef.current!;
				if (!container) return;
				const containerHeight = getContainerHeight();
				const prevContainerHeight = prevContainerHeightRef.current;
				prevContainerHeightRef.current = containerHeight;

				if (
					messageIds === prevMessageIds &&
					isViewportNewest === prevIsViewportNewest &&
					containerHeight !== prevContainerHeight &&
					prevContainerHeight === undefined
				) {
					return;
				}

				listItemElementsRef.current = Array.from(container.querySelectorAll<HTMLDivElement>('.message-list-item'));

				const lastItemElement = listItemElementsRef.current[listItemElementsRef.current.length - 1];

				const hasLastMessageChanged =
					messageIds && prevMessageIds && messageIds[messageIds.length - 1] !== prevMessageIds[prevMessageIds.length - 1];
				const hasViewportShifted = messageIds?.[0] !== prevMessageIds?.[0] && messageIds?.length === MESSAGE_LIST_SLICE / 2 + 1;
				const wasMessageAdded = hasLastMessageChanged && !hasViewportShifted;

				if (
					isViewportNewest &&
					wasMessageAdded &&
					messageIds &&
					messageIds.length < MESSAGE_LIST_SLICE / 2 &&
					!container.parentElement!.classList.contains('force-messages-scroll') &&
					forceMeasure(() => (container.firstElementChild as HTMLDivElement)!.clientHeight <= container.offsetHeight * 2)
				) {
					container.parentElement!.classList.add('force-messages-scroll');

					setTimeout(() => {
						if (container.parentElement) {
							container.parentElement!.classList.remove('force-messages-scroll');
						}
					}, MESSAGE_ANIMATION_DURATION);
				}

				requestForcedReflow(() => {
					const { scrollTop, scrollHeight, offsetHeight } = container;
					const scrollOffset = scrollOffsetRef.current;
					let bottomOffset = scrollOffset - (prevContainerHeight || offsetHeight);
					if (wasMessageAdded) {
						const lastItemHeight = lastItemElement ? lastItemElement.offsetHeight : 0;
						bottomOffset -= lastItemHeight;
					}
					const isAtBottom =
						chatRef?.current &&
						Math.abs(chatRef.current.scrollHeight - chatRef.current.clientHeight - chatRef.current.scrollTop) <= BOTTOM_THRESHOLD;

					const isAlreadyFocusing = false;
					if (isAtBottom && !isAlreadyFocusing) {
						if (!lastItemElement) return;

						requestMeasure(() => {
							const shouldScrollToBottom = !isBackgroundModeActive();
							if (!shouldScrollToBottom) return;
						});
					}

					const isResized = prevContainerHeight !== undefined && prevContainerHeight !== containerHeight;
					if (isResized && isAnimatingScroll()) {
						return undefined;
					}

					const anchor = anchorIdRef.current && container.querySelector(`#${anchorIdRef.current}`);

					let newScrollTop!: number;
					if (isAtBottom) {
						newScrollTop = scrollHeight;
					} else if (anchor) {
						const newAnchorTop = anchor.getBoundingClientRect().top;
						newScrollTop = scrollTop + (newAnchorTop - (anchorTopRef.current || 0));
					} else {
						newScrollTop = scrollHeight - scrollOffset;
					}

					return () => {
						resetScroll(container, Math.ceil(newScrollTop));
						scrollOffsetRef.current = Math.max(Math.ceil(scrollHeight - newScrollTop), offsetHeight);
						if (!memoFocusingIdRef.current) {
							isScrollTopJustUpdatedRef.current = true;
							requestMeasure(() => {
								isScrollTopJustUpdatedRef.current = false;
							});
						}
					};
				});
			},
			[messageIds, isViewportNewest, getContainerHeight, prevContainerHeightRef]
		);

		const rememberScrollPositionRef = useStateRef(() => {
			if (!messageIds || !listItemElementsRef.current || !userActiveScroll.current) {
				return;
			}

			const preservedItemElements = listItemElementsRef.current.filter((element) => messageIds.includes(element.id?.replace('msg-', '')));

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
			[messageIds, userActiveScroll.current, isViewportNewest, rememberScrollPositionRef]
		);

		useEffect(() => rememberScrollPositionRef.current(), [getContainerHeight, rememberScrollPositionRef]);

		const convertedFirstMsgOfThisTopic = useMemo(() => {
			if (!firstMsgOfThisTopic?.message) {
				return firstMsgOfThisTopic as MessagesEntity;
			}
			return convertInitialMessageOfTopic(firstMsgOfThisTopic.message as ChannelMessageType);
		}, [firstMsgOfThisTopic]);

		const msgIdJumpHightlight = useRef<string | null>(null);

		const timerRef = useRef<number | null>(null);
		useEffect(() => {
			if (!idMessageToJump?.id) return;

			const scrollToMessage = (messageId: string) => {
				const messageElement = chatRef.current?.querySelector('#msg-' + messageId);
				if (messageElement) {
					setAnchor.current = new Date().getTime();
					userActiveScroll.current = true;
					messageElement.scrollIntoView({ behavior: 'auto', block: 'center' });
				}
			};
			const store = getStore();
			const isMessageExist = selectIsMessageIdExist(store.getState() as RootState, channelId, idMessageToJump?.id);

			if (idMessageToJump && isMessageExist) {
				if (idMessageToJump.id === 'temp') return;
				scrollToMessage(idMessageToJump.id);
				msgIdJumpHightlight.current = idMessageToJump.id;
				dispatch(messagesActions.setIdMessageToJump(null));

				timerRef.current = window.setTimeout(() => {
					msgIdJumpHightlight.current = null;
					setForceRender(!forceRender);
				}, 1000);
			}
		}, [idMessageToJump]);

		const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], channelId);

		const { showMessageContextMenu, selectedMessageId } = useMessageContextMenu();

		const renderedMessages = useMemo(() => {
			return messageIds.map((messageId, index) => {
				const checkMessageTargetToMoved = msgIdJumpHightlight.current === messageId && messageId !== lastMessageId;
				const messageReplyHighlight = (dataReferences?.message_ref_id && dataReferences?.message_ref_id === messageId) || false;
				const isSelected = selectedMessageId === messageId;
				const isEditing = getIsEditing(messageId);

				return (
					<MemorizedChannelMessage
						key={messageId}
						index={index}
						message={entities[messageId]}
						previousMessage={entities[messageIds[index - 1]]}
						avatarDM={avatarDM}
						username={username}
						messageId={messageId}
						nextMessageId={messageIds[index + 1]}
						channelId={channelId}
						isHighlight={messageId === idMessageNotified}
						mode={mode}
						channelLabel={channelLabel ?? ''}
						isPrivate={isPrivate}
						isLastSeen={Boolean(messageId === lastMessageUnreadId && messageId !== lastMessageId)}
						checkMessageTargetToMoved={checkMessageTargetToMoved}
						messageReplyHighlight={messageReplyHighlight}
						isTopic={isTopic}
						canSendMessage={canSendMessage}
						observeIntersectionForLoading={observeIntersectionForLoading}
						user={currentClanUser || user}
						showMessageContextMenu={showMessageContextMenu}
						isSelected={isSelected}
						isEditing={isEditing}
					/>
				);
			});
		}, [
			messageIds,
			avatarDM,
			canSendMessage,
			channelId,
			channelLabel,
			dataReferences?.message_ref_id,
			entities,
			idMessageNotified,
			idMessageToJump?.id,
			isTopic,
			lastMessageId,
			lastMessageUnreadId,
			mode,
			username,
			selectedMessageId,
			getIsEditing,
			forceRender
		]);

		const scrollTimeoutId2 = useRef<NodeJS.Timeout | null>(null);
		return (
			<div className="w-full h-full relative messages-container select-text bg-theme-chat ">
				<StickyLoadingIndicator messageCount={messageIds?.length} />
				<div
					onScroll={handleScroll}
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
					className={classNames([
						'thread-scroll',
						'w-full',
						{
							customScrollLightMode: appearanceTheme === 'light'
						},
						'scroll-big'
					])}
				>
					<div className="messages-wrap flex flex-col min-h-full mt-auto justify-end">
						{isTopic && convertedFirstMsgOfThisTopic && (
							<div
								className={`fullBoxText relative group ${convertedFirstMsgOfThisTopic?.references?.[0]?.message_ref_id ? 'pt-3' : ''}`}
							>
								<MessageWithUser
									isTopic={isTopic}
									allowDisplayShortProfile={true}
									message={convertedFirstMsgOfThisTopic}
									mode={mode}
									user={currentClanUser}
								/>
							</div>
						)}
						{withHistoryTriggers && <div ref={backwardsTriggerRef} key="backwards-trigger" className="backwards-trigger" />}
						{messageIds?.[0] && (
							<LoadingSkeletonMessages messageId={messageIds[0]} channelId={channelId} isTopic={isTopic} topicId={topicId} />
						)}
						{renderedMessages}
						{withHistoryTriggers && <div ref={forwardsTriggerRef} key="forwards-trigger" className="forwards-trigger" />}

						<div ref={fabTriggerRef} key="fab-trigger" className="fab-trigger"></div>
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
			prev.appearanceTheme === curr.appearanceTheme &&
			prev.avatarDM === curr.avatarDM &&
			prev.channelLabel === curr.channelLabel
		);
	}
);

const MemoizedChannelMessages = memo(
	ChannelMessages,
	(prev, cur) => prev.channelId === cur.channelId && prev.avatarDM === cur.avatarDM && prev.channelLabel === cur.channelLabel
) as unknown as typeof ChannelMessages & {
	Skeleton: typeof ChannelMessages.Skeleton;
};

export default MemoizedChannelMessages;

(MemoizedChannelMessages as any).displayName = 'MemoizedChannelMessages';

const StickyLoadingIndicator = memo(({ messageCount }: { messageCount: number }) => {
	const isLoading = useAppSelector(selectMessageIsLoading);
	const [showLoading, setShowLoading] = useState(false);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (isLoading && !messageCount) {
			timeoutId = setTimeout(() => {
				setShowLoading(true);
			}, 1000);
		} else {
			setShowLoading(false);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [isLoading, messageCount]);

	if (!showLoading) return null;

	return <MessageSkeleton className="mr-auto" randomKey={`StickyLoadingIndicator`} />;
});

StickyLoadingIndicator.displayName = 'StickyLoadingIndicator';

interface MessageSkeletonProps {
	count?: number;
	className?: string;
	randomKey?: string;
}

const LoadingSkeletonMessages = memo(
	({
		messageId,
		channelId,
		topicId,
		isTopic,
		imageFrequency = 0.5
	}: {
		messageId?: string;
		count?: number;
		imageFrequency?: number;
		channelId: string;
		isTopic?: boolean;
		topicId?: string;
	}) => {
		const hasMoreTop = useAppSelector((state) => selectHasMoreMessageByChannelId2(state, channelId));
		// TODO: check hasMoreTop topic check backend alway return true
		if (!hasMoreTop || isTopic) return null;
		return (
			<div id="msg-loading-top" className="py-2">
				<MessageSkeleton randomKey={`top-${messageId || ''}`} />
			</div>
		);
	}
);

export const MessageSkeleton = memo(
	function MessageSkeleton({ className, randomKey }: MessageSkeletonProps) {
		return (
			<div style={{ width: '60%', height: '1000px', overflow: 'hidden' }} className={buildClassName('flex flex-col px-4 py-2', className)}>
				{Array.from({ length: 5 }).map((_, index) => {
					const imageWidth = Math.floor(Math.random() * 200) + 100;

					return (
						<div key={`${randomKey}-${index}`} className="flex items-start gap-3 pb-4">
							<div className="rounded-full dark:bg-skeleton-dark bg-skeleton-white h-10 w-10 flex-shrink-0" />

							<div className="flex-1 py-2">
								<div className="flex items-center gap-2 pb-2">
									<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-24" />
									<div className="h-3 dark:bg-skeleton-dark bg-skeleton-white rounded w-16" />
								</div>

								<div className="flex gap-2">
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
								</div>

								<div className="flex gap-2 pt-2">
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
									<div
										className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded"
										style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
									/>
								</div>

								<div
									className="dark:bg-skeleton-dark bg-skeleton-white rounded-md mt-2"
									style={{
										width: imageWidth,
										height: 120,
										maxWidth: '100%'
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.randomKey === nextProps.randomKey;
	}
);
