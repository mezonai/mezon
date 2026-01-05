import type { IBeforeRenderCb } from '@mezon/chat-scroll';
import { ELoadMoreDirection } from '@mezon/chat-scroll';
import { MessageContextMenuProvider, MessageWithUser, useMessageContextMenu } from '@mezon/components';
import { useMessageObservers, usePermissionChecker } from '@mezon/core';
import type { RootState } from '@mezon/store';
import {
	channelsActions,
	getStore,
	messagesActions,
	selectAllAccount,
	selectChannelDraftMessage,
	selectChannelMessageCache,
	selectCurrentChannelId,
	selectCurrentUserId,
	selectDataReferences,
	selectFirstMessageOfCurrentTopic,
	selectHasMoreBottomByChannelId,
	selectHasMoreMessageByChannelId,
	selectIdMessageRefEdit,
	selectIdMessageToJump,
	selectIsMessageIdExist,
	selectLastMessageByChannelId,
	selectLastSentMessageStateByChannelId,
	selectLatestMessageId,
	selectMemberClanByUserId,
	selectMessageEntitiesByChannelId,
	selectMessageIsLoading,
	selectMessageNotified,
	selectMessageViewportIdsByChannelId,
	selectOpenEditMessageState,
	selectScrollPositionByChannelId,
	selectShowScrollDownButton,
	selectTheme,
	selectUnreadMessageIdByChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { BooleanToVoidFunction, ChannelMembersEntity } from '@mezon/utils';
import {
	Direction_Mode,
	EOverriddenPermission,
	LoadMoreDirection,
	animateScroll,
	buildClassName,
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
import type { ChannelType } from 'mezon-js';
import type { ApiMessageRef } from 'mezon-js/api.gen';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChannelMessage, MemorizedChannelMessage } from './ChannelMessage';

const useSafeTimeout = () => {
	const timeoutsRef = useRef<Set<number>>(new Set());

	const clearSafeTimeout = useCallback((timeoutId?: number | null) => {
		if (timeoutId === undefined || timeoutId === null) {
			return;
		}
		clearTimeout(timeoutId);
		timeoutsRef.current.delete(timeoutId);
	}, []);

	const setSafeTimeout = useCallback((fn: () => void, delay: number) => {
		const timeoutId = window.setTimeout(() => {
			timeoutsRef.current.delete(timeoutId);
			fn();
		}, delay);
		timeoutsRef.current.add(timeoutId);
		return timeoutId;
	}, []);

	useEffect(() => {
		timeoutsRef.current.forEach((timeoutId) => {
			clearTimeout(timeoutId);
		});
		timeoutsRef.current.clear();
	}, []);

	return { setSafeTimeout, clearSafeTimeout };
};

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
const WHEEL_DEBOUNCE = 100;

const runDebouncedForScroll = debounce((cb) => cb(), SCROLL_DEBOUNCE, false);
const runDebouncedForWheel = debounce((cb) => cb(), WHEEL_DEBOUNCE, false);

const hasScrolledToUnreadMap = new Map<string, boolean>();

const DMMessageWrapper = ({ channelId, children }: { channelId: string; children: React.ReactNode }) => {
	return <MessageContextMenuProvider channelId={channelId}>{children}</MessageContextMenuProvider>;
};

const HasmoreBottomTracker = memo(({ channelId, topicId }: { channelId: string; topicId?: string }) => {
	const dispatch = useAppDispatch();
	const hasMoreBottom = useAppSelector((state) => selectHasMoreBottomByChannelId(state, channelId));

	useEffect(() => {
		if (!hasMoreBottom) return;
		dispatch(
			channelsActions.setScrollDownVisibility({
				channelId: topicId || channelId,
				isVisible: hasMoreBottom
			})
		);
	}, [hasMoreBottom, channelId, dispatch]);
	return null;
});

const FirstJoinLoadTracker = memo(({ channelId, isFirstJoinLoadRef }: { channelId: string; isFirstJoinLoadRef: React.MutableRefObject<boolean> }) => {
	const channelCache = useAppSelector((state) => selectChannelMessageCache(state, channelId));

	useEffect(() => {
		if (channelCache) {
			isFirstJoinLoadRef.current = true;
		}
	}, [channelCache, channelId, isFirstJoinLoadRef]);

	return null;
});

const ClanMessageWrapper = ({ channelId, children }: { channelId: string; children: React.ReactNode }) => {
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
	const effectiveChannelId = topicId || channelId;

	const appearanceTheme = useSelector(selectTheme);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const messageIds = useAppSelector((state) => selectMessageViewportIdsByChannelId(state, effectiveChannelId));
	const idMessageNotified = useSelector(selectMessageNotified);
	const lastMessage = useAppSelector((state) => selectLastSentMessageStateByChannelId(state, effectiveChannelId));
	const dataReferences = useAppSelector((state) => selectDataReferences(state, effectiveChannelId ?? ''));
	const lastMessageId = lastMessage?.id;

	const userActiveScroll = useRef<boolean>(false);
	const dispatch = useAppDispatch();
	const chatRef = useRef<HTMLDivElement | null>(null);

	const skipCalculateScroll = useRef<boolean>(false);
	const isScrollTopJustUpdatedRef = useRef(false);

	const anchorIdRef = useRef<string | null>(null);
	const anchorTopRef = useRef<number | null>(null);
	const setAnchor = useRef<number | null>(null);
	const previousChannelId = useRef<string | null>(null);
	const preventScrollbottom = useRef<boolean>(false);
	const isFirstJoinLoadRef = useRef<boolean>(true);
	const lastSeenAtBottomRef = useRef<string | null>(null);
	const isJumpingToPresentRef = useRef<boolean>(false);

	const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();
	const loadMoreResetTimeoutRef = useRef<number | null>(null);

	useSyncEffect(() => {
		userActiveScroll.current = false;
		skipCalculateScroll.current = false;
		anchorIdRef.current = null;
		anchorTopRef.current = null;
		preventScrollbottom.current = false;
		isFirstJoinLoadRef.current = true;
		lastSeenAtBottomRef.current = null;
		isJumpingToPresentRef.current = false;

		previousChannelId.current = channelId;

		return () => {
			if (!channelId) return;

			const state = getStore()?.getState();
			const currentMessageIds = selectMessageViewportIdsByChannelId(state, effectiveChannelId);
			const lastMessageViewport = currentMessageIds?.at(-1);

			if (lastMessageViewport) {
				const lastSeenMessageId = selectUnreadMessageIdByChannelId(state, effectiveChannelId);

				let shouldUpdate = true;
				if (lastSeenMessageId) {
					try {
						const distance = Math.round(Number((BigInt(lastMessageViewport) >> BigInt(22)) - (BigInt(lastSeenMessageId) >> BigInt(22))));
						shouldUpdate = distance >= 0;
					} catch (e) {
						shouldUpdate = true;
					}
				}

				if (shouldUpdate) {
					dispatch(
						messagesActions.UpdateChannelLastMessage({
							channelId,
							messageId: lastMessageViewport
						})
					);
				}
			}

			const scrollPosition = selectScrollPositionByChannelId(state, effectiveChannelId);
			if (!scrollPosition?.messageId && lastMessageViewport) {
				dispatch(
					channelsActions.setScrollPosition({
						channelId,
						messageId: lastMessageViewport
					})
				);
			}
		};
	}, [channelId]);

	useSyncEffect(() => {
		if (lastMessage && preventScrollbottom.current) {
			preventScrollbottom.current = false;
		}
	}, [lastMessage?.id]);

	const loadMoreMessage = useCallback(
		async (direction: ELoadMoreDirection, cb?: IBeforeRenderCb) => {
			const store = getStore();
			const state = store.getState();
			const isFetching = selectMessageIsLoading(state);
			if (isFetching) {
				return;
			}

			if (direction === ELoadMoreDirection.bottom) {
				const hasMoreBottom = selectHasMoreBottomByChannelId(state as RootState, effectiveChannelId);
				if (!hasMoreBottom || preventScrollbottom.current) {
					dispatch(messagesActions.setViewingOlder({ channelId: effectiveChannelId, status: false }));
					return;
				}
			}

			if (direction === ELoadMoreDirection.top) {
				const hasMoreTop = selectHasMoreMessageByChannelId(state as RootState, effectiveChannelId);
				if (!hasMoreTop) {
					return;
				}
			}

			if (typeof cb === 'function') {
				cb();
			}

			if (direction === ELoadMoreDirection.bottom) {
				isLoadingMoreBottomRef.current = true;

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
		[isTopicBox, dispatch, clanId, channelId, currentChannelId, topicId, effectiveChannelId]
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
	const isLoadingMoreBottomRef = useRef<boolean>(false);

	const handleOnChange = useCallback(
		async (direction: LoadMoreDirection) => {
			if (!userActiveScroll.current) return;
			if (isLoadMore.current || !chatRef.current?.scrollHeight) return;

			switch (direction) {
				case LoadMoreDirection.Backwards:
					currentScrollDirection.current = ELoadMoreDirection.top;
					isLoadMore.current = true;
					await loadMoreMessage(ELoadMoreDirection.top);
					if (loadMoreResetTimeoutRef.current) {
						clearSafeTimeout(loadMoreResetTimeoutRef.current);
					}
					loadMoreResetTimeoutRef.current = setSafeTimeout(() => {
						isLoadMore.current = false;
						loadMoreResetTimeoutRef.current = null;
					}, 200);
					break;
				case LoadMoreDirection.Forwards:
					currentScrollDirection.current = ELoadMoreDirection.bottom;
					isLoadMore.current = true;
					await loadMoreMessage(ELoadMoreDirection.bottom);
					if (loadMoreResetTimeoutRef.current) {
						clearSafeTimeout(loadMoreResetTimeoutRef.current);
					}
					loadMoreResetTimeoutRef.current = setSafeTimeout(() => {
						isLoadMore.current = false;
						loadMoreResetTimeoutRef.current = null;
					}, 200);
					break;
			}
		},
		[loadMoreMessage, clearSafeTimeout, setSafeTimeout]
	);

	const scrollToLastMessage = useCallback(() => {
		if (userActiveScroll.current) {
			userActiveScroll.current = false;
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
		if (dataReferences?.messageRefId && getChatScrollBottomOffset() <= 100) {
			scrollToLastMessage();
		}
	}, [dataReferences, lastMessage, scrollToLastMessage, getChatScrollBottomOffset]);

	const handleScrollDownVisibilityChange = useCallback(
		(isVisible: boolean) => {
			const store = getStore();

			const hasMoreBottom = selectHasMoreBottomByChannelId(store.getState(), effectiveChannelId);

			if (hasMoreBottom) return;

			const showFAB = selectShowScrollDownButton(store.getState(), effectiveChannelId);
			if (showFAB === isVisible) return;

			dispatch(
				channelsActions.setScrollDownVisibility({
					channelId: effectiveChannelId,
					isVisible
				})
			);
		},
		[effectiveChannelId, dispatch]
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
						isLoadingMoreBottomRef={isLoadingMoreBottomRef}
						isFirstJoinLoadRef={isFirstJoinLoadRef}
						userActiveScroll={userActiveScroll}
						isScrollTopJustUpdatedRef={isScrollTopJustUpdatedRef}
						appearanceTheme={appearanceTheme}
						lastMessageId={lastMessageId as string}
						dataReferences={dataReferences}
						idMessageNotified={idMessageNotified}
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
						onScrollDownToggle={handleScrollDownVisibilityChange}
						onNotchToggle={setIsNotchShown}
						lastSeenAtBottomRef={lastSeenAtBottomRef}
						isJumpingToPresentRef={isJumpingToPresentRef}
					/>
				</DMMessageWrapper>
			) : (
				<ClanMessageWrapper channelId={currentChannelId || channelId}>
					<ChatMessageList
						key={channelId}
						messageIds={messageIds}
						chatRef={chatRef}
						isLoadingMoreBottomRef={isLoadingMoreBottomRef}
						isFirstJoinLoadRef={isFirstJoinLoadRef}
						userActiveScroll={userActiveScroll}
						isScrollTopJustUpdatedRef={isScrollTopJustUpdatedRef}
						appearanceTheme={appearanceTheme}
						lastMessageId={lastMessageId as string}
						dataReferences={dataReferences}
						idMessageNotified={idMessageNotified}
						avatarDM={avatarDM}
						username={username}
						channelId={isTopicBox ? currentChannelId || channelId : channelId}
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
						onScrollDownToggle={handleScrollDownVisibilityChange}
						onNotchToggle={setIsNotchShown}
						lastSeenAtBottomRef={lastSeenAtBottomRef}
						isJumpingToPresentRef={isJumpingToPresentRef}
					/>
				</ClanMessageWrapper>
			)}
			<ScrollDownButton
				channelId={channelId}
				effectiveChannelId={effectiveChannelId}
				clanId={clanId}
				messageIds={messageIds}
				chatRef={chatRef}
				lastSeenAtBottomRef={lastSeenAtBottomRef}
				userActiveScroll={userActiveScroll}
				isScrollTopJustUpdatedRef={isScrollTopJustUpdatedRef}
				isJumpingToPresentRef={isJumpingToPresentRef}
				setAnchor={setAnchor}
			/>
			<HasmoreBottomTracker channelId={channelId} topicId={topicId} />
			<FirstJoinLoadTracker channelId={channelId} isFirstJoinLoadRef={isFirstJoinLoadRef} />
		</>
	);
}

const ScrollDownButton = memo(
	({
		channelId,
		effectiveChannelId,
		clanId,
		messageIds,
		chatRef,
		lastSeenAtBottomRef,
		userActiveScroll,
		isScrollTopJustUpdatedRef,
		isJumpingToPresentRef,
		setAnchor
	}: {
		channelId: string;
		effectiveChannelId: string;
		clanId: string;
		messageIds: string[];
		chatRef: React.RefObject<HTMLDivElement>;
		lastSeenAtBottomRef: React.MutableRefObject<string | null>;
		userActiveScroll: React.MutableRefObject<boolean>;
		isScrollTopJustUpdatedRef: React.MutableRefObject<boolean>;
		isJumpingToPresentRef: React.MutableRefObject<boolean>;
		setAnchor: React.MutableRefObject<number | null>;
	}) => {
		const dispatch = useAppDispatch();

		const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();
		const jumpToPresentTimeoutRef = useRef<number | null>(null);

		const isVisible = useAppSelector((state) => selectShowScrollDownButton(state, effectiveChannelId));
		const appearanceTheme = useAppSelector(selectTheme);
		const lastMessageUnreadId = useAppSelector((state) => selectUnreadMessageIdByChannelId(state, effectiveChannelId));
		const lastSent = useAppSelector((state) => selectLastSentMessageStateByChannelId(state, effectiveChannelId));
		const currentUserId = useAppSelector(selectCurrentUserId);

		const unreadCount = useMemo(() => {
			if (lastSent?.senderId === currentUserId) {
				return 0;
			}

			let count = 0;
			const baseMessageId = lastSeenAtBottomRef.current || lastMessageUnreadId;

			if (baseMessageId && lastSent.id) {
				try {
					count = Math.max(0, Math.round(Number((BigInt(lastSent.id) >> BigInt(22)) - (BigInt(baseMessageId) >> BigInt(22)))));
				} catch (e) {
					count = 0;
				}
			}
			return count;
		}, [lastSeenAtBottomRef.current, lastMessageUnreadId, lastSent, currentUserId]);

		const handleJumpToPresent = async () => {
			isJumpingToPresentRef.current = true;
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
		};

		const handleScrollDownClick = useLastCallback(async () => {
			const messagesContainer = chatRef.current;
			if (!messagesContainer) return;
			const state = getStore().getState();

			const lastSentMessageId = selectLatestMessageId(state, effectiveChannelId);

			const jumpPresent = !!lastSentMessageId && !messageIds.includes(lastSentMessageId as string) && messageIds.length >= 20;

			if (jumpPresent) {
				await handleJumpToPresent();
			}

			requestAnimationFrame(() => {
				const messageElements = messagesContainer.querySelectorAll<HTMLDivElement>('.message-list-item');
				const lastMessageElement = messageElements[messageElements.length - 1];
				if (!lastMessageElement) {
					return;
				}

				dispatch(messagesActions.jumToPresent({ channelId }));

				userActiveScroll.current = false;
				isScrollTopJustUpdatedRef.current = true;
				animateScroll({
					container: messagesContainer,
					element: lastMessageElement,
					position: 'end',
					margin: BOTTOM_FOCUS_MARGIN
				});
				if (jumpToPresentTimeoutRef.current) {
					clearSafeTimeout(jumpToPresentTimeoutRef.current);
				}
				jumpToPresentTimeoutRef.current = setSafeTimeout(() => {
					isScrollTopJustUpdatedRef.current = false;
					isJumpingToPresentRef.current = false;
					dispatch(
						channelsActions.setScrollPosition({
							channelId: effectiveChannelId,
							messageId: lastSentMessageId
						})
					);
					setAnchor.current = new Date().getTime();
					lastSeenAtBottomRef.current = lastSentMessageId;
					jumpToPresentTimeoutRef.current = null;
				}, 200);
			});
		});

		return (
			<button
				onClick={handleScrollDownClick}
				className={`bg-theme-primary ${
					isVisible ? 'opacity-100' : 'opacity-0'
				} cursor-pointer absolute z-10 rounded-full bg-clip-padding border text-token-text-secondary border-token-border-light w-8 h-8 flex items-center justify-center bottom-5 right-[12px] transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-inner`}
			>
				{unreadCount > 0 && (
					<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-semibold">
						{unreadCount > 99 ? '99+' : unreadCount}
					</div>
				)}
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
	isLoadingMoreBottomRef: React.MutableRefObject<boolean>;
	isFirstJoinLoadRef: React.MutableRefObject<boolean>;
	userActiveScroll: React.MutableRefObject<boolean>;
	isScrollTopJustUpdatedRef: React.MutableRefObject<boolean>;
	skipCalculateScroll: React.MutableRefObject<boolean>;
	appearanceTheme: string;
	lastMessageId: string;
	dataReferences: ApiMessageRef;
	idMessageNotified: string;
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
	onScrollDownToggle: BooleanToVoidFunction;
	onNotchToggle: BooleanToVoidFunction;
	lastSeenAtBottomRef: React.MutableRefObject<string | null>;
	isJumpingToPresentRef: React.MutableRefObject<boolean>;
};

const ChatMessageList: React.FC<ChatMessageListProps> = memo(
	({
		messageIds,
		chatRef,
		isLoadingMoreBottomRef,
		isFirstJoinLoadRef,
		userActiveScroll,
		isScrollTopJustUpdatedRef,
		appearanceTheme,
		lastMessageId,
		dataReferences,
		idMessageNotified,

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
		onScrollDownToggle,
		onNotchToggle,
		lastSeenAtBottomRef,
		isJumpingToPresentRef
	}) => {
		const effectiveChannelId = topicId || channelId;

		const dispatch = useAppDispatch();
		const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();
		const removeForceScrollTimeoutRef = useRef<number | null>(null);
		const user = useSelector(selectAllAccount);
		const currentClanUser = useAppSelector((state) => selectMemberClanByUserId(state, user?.user?.id as string));
		const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, effectiveChannelId));
		const idMessageToJump = useSelector(selectIdMessageToJump);
		const entities = useAppSelector((state) => selectMessageEntitiesByChannelId(state, effectiveChannelId));
		const firstMsgOfThisTopic = useAppSelector((state) => selectFirstMessageOfCurrentTopic(state, channelId));
		const lastMessageUnreadId = useAppSelector((state) => selectUnreadMessageIdByChannelId(state, effectiveChannelId));

		const openEditMessageState = useSelector(selectOpenEditMessageState);
		const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
		const channelDraftMessage = useAppSelector((state) => selectChannelDraftMessage(state, effectiveChannelId));

		const getIsEditing = useCallback(
			(messageId: string) => {
				return channelDraftMessage?.messageId === messageId ? openEditMessageState : openEditMessageState && idMessageRefEdit === messageId;
			},
			[channelDraftMessage?.messageId, openEditMessageState, idMessageRefEdit]
		);

		const scrollPositionRef = useRef<{ messageId?: string; offset?: number } | null>(null);

		useSyncEffect(() => {
			const store = getStore();
			const state = store.getState();
			let scrollPosition = selectScrollPositionByChannelId(state, effectiveChannelId);
			if (!scrollPosition?.messageId) {
				if (lastMessageUnreadId && !hasScrolledToUnreadMap.get(effectiveChannelId) && messageIds?.length > 0) {
					scrollPosition = { messageId: lastMessageUnreadId };
					hasScrolledToUnreadMap.set(effectiveChannelId, true);
				}
			}

			scrollPositionRef.current = scrollPosition;
		}, [effectiveChannelId, lastMessageUnreadId, messageIds?.length]);

		const [getContainerHeight, prevContainerHeightRef] = useContainerHeight(chatRef, true);

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

		useSyncEffect(() => {
			if (idMessageToJump) {
				userActiveScroll.current = false;
				skipCalculateScroll.current = true;
				anchorIdRef.current = null;
				anchorTopRef.current = null;
			}
		}, [idMessageToJump]);

		const updateScrollPosition = useLastCallback(() => {
			const container = chatRef.current;
			if (!container) return;

			const isAtBottom =
				chatRef?.current &&
				Math.abs(chatRef.current.scrollHeight - chatRef.current.clientHeight - chatRef.current.scrollTop) <= BOTTOM_THRESHOLD;

			if (isAtBottom) {
				onChange(LoadMoreDirection.Forwards);
				const store = getStore();
				const hasMoreBottom = selectHasMoreBottomByChannelId(store.getState(), effectiveChannelId);
				const lastMsgId = messageIds?.at(-1);
				if (lastMsgId) {
					const message = entities[lastMsgId];

					if (message && !message?.isSending) {
						dispatch(
							channelsActions.setScrollPosition({
								channelId: effectiveChannelId,
								messageId: lastMsgId
							})
						);
						if (lastMsgId && !hasMoreBottom) {
							lastSeenAtBottomRef.current = lastMsgId;
						}
					}
				}

				if (hasMoreBottom) return;
				const showFAB = selectShowScrollDownButton(store.getState(), effectiveChannelId);
				if (!showFAB) return;
				dispatch(
					channelsActions.setScrollDownVisibility({
						channelId: effectiveChannelId,
						isVisible: false
					})
				);
				return;
			}

			const containerRect = container.getBoundingClientRect();
			const containerTop = containerRect.top;
			const containerBottom = containerRect.bottom;

			const messageElements = Array.from(container.querySelectorAll<HTMLDivElement>('.message-list-item'));
			let visibleMessageId: string | null = null;

			for (const msgElement of messageElements) {
				const rect = msgElement.getBoundingClientRect();

				if (rect.top >= containerTop && rect.top <= containerBottom) {
					visibleMessageId = msgElement.id.replace('msg-', '');
					break;
				}

				if (rect.top > containerBottom) {
					break;
				}
			}

			if (visibleMessageId) {
				dispatch(
					channelsActions.setScrollPosition({
						channelId: effectiveChannelId,
						messageId: visibleMessageId
					})
				);
			}
		});

		const handleScroll = useLastCallback(() => {
			if (isScrollTopJustUpdatedRef.current) {
				return;
			}

			if (!userActiveScroll.current) return;

			const container = chatRef.current;

			if (!container) {
				return;
			}

			runDebouncedForScroll(() => {
				requestAnimationFrame(() => {
					if (isScrollTopJustUpdatedRef.current) {
						return;
					}
					if (!userActiveScroll.current) return;

					const { scrollTop } = container;

					if (scrollTop < 1000 && messageIds.length > 0) {
						onChange(LoadMoreDirection.Backwards);
					}
				});
			});
		});

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

					if (removeForceScrollTimeoutRef.current) {
						clearSafeTimeout(removeForceScrollTimeoutRef.current);
					}
					removeForceScrollTimeoutRef.current = setSafeTimeout(() => {
						if (container.parentElement) {
							container.parentElement!.classList.remove('force-messages-scroll');
						}
						removeForceScrollTimeoutRef.current = null;
					}, MESSAGE_ANIMATION_DURATION);
				}

				requestForcedReflow(() => {
					const { scrollTop, scrollHeight } = container;

					const store = getStore();
					const isAtBottom = !selectShowScrollDownButton(store.getState(), effectiveChannelId);

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
					let shouldUpdateScrollPosition = false;

					const lastMsgId = messageIds?.at(-1) || '';
					const message = entities[lastMsgId];

					if (
						isJumpingToPresentRef.current ||
						(!isLoadingMoreBottomRef.current &&
							((!isFirstJoinLoadRef.current && isAtBottom) || (userActiveScroll.current && isAtBottom))) ||
						(user?.user?.id === lastMessage?.senderId &&
							lastMessage?.createTime &&
							new Date().getTime() - new Date(lastMessage.createTime).getTime() < 1000)
					) {
						newScrollTop = scrollHeight;
						shouldUpdateScrollPosition = !message?.isSending;
					} else if (anchor && !isScrollTopJustUpdatedRef.current) {
						const newAnchorTop = anchor.getBoundingClientRect().top;
						newScrollTop = scrollTop + (newAnchorTop - (anchorTopRef.current || 0));
					} else if (scrollPositionRef.current?.messageId && !isScrollTopJustUpdatedRef.current) {
						const savedMessageElement = container.querySelector(`#msg-${scrollPositionRef.current.messageId}`);
						if (savedMessageElement) {
							const savedMessageRect = savedMessageElement.getBoundingClientRect();
							const containerRect = container.getBoundingClientRect();
							newScrollTop = scrollTop + (savedMessageRect.top - containerRect.top);
						} else {
							const hasMoreBottom = selectHasMoreBottomByChannelId(store.getState() as RootState, effectiveChannelId);
							newScrollTop = scrollHeight - (hasMoreBottom ? 1000 : 0);
							shouldUpdateScrollPosition = !message?.isSending;
						}
					} else {
						const hasMoreBottom = selectHasMoreBottomByChannelId(store.getState() as RootState, effectiveChannelId);
						newScrollTop = scrollHeight - (hasMoreBottom ? 1000 : 0);
						shouldUpdateScrollPosition = !message?.isSending;
					}

					return () => {
						userActiveScroll.current = false;
						resetScroll(container, Math.ceil(newScrollTop));

						if (message && shouldUpdateScrollPosition) {
							dispatch(
								channelsActions.setScrollPosition({
									channelId: effectiveChannelId,
									messageId: lastMsgId
								})
							);
						}

						if (isJumpingToPresentRef.current) {
							isJumpingToPresentRef.current = false;
						}

						isLoadingMoreBottomRef.current = false;
						isFirstJoinLoadRef.current = false;
					};
				});
			},
			[messageIds, isViewportNewest, getContainerHeight, prevContainerHeightRef, effectiveChannelId]
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

		useSyncEffect(() => forceMeasure(() => rememberScrollPositionRef.current()), [messageIds, isViewportNewest, rememberScrollPositionRef]);

		useEffect(() => rememberScrollPositionRef.current(), [getContainerHeight, rememberScrollPositionRef]);

		const msgIdJumpHightlight = useRef<string | null>(null);
		const jumpHighlightTimeoutRef = useRef<number | null>(null);

		useEffect(() => {
			if (!idMessageToJump?.id) return;

			const scrollToMessage = (messageId: string) => {
				const messageElement = chatRef.current?.querySelector(`#msg-${messageId}`);
				if (messageElement) {
					setAnchor.current = new Date().getTime();
					userActiveScroll.current = false;
					isScrollTopJustUpdatedRef.current = true;
					messageElement.scrollIntoView({ behavior: 'auto', block: 'center' });
					requestAnimationFrame(() => {
						isScrollTopJustUpdatedRef.current = false;
					});
				}
			};
			const store = getStore();
			const isMessageExist = selectIsMessageIdExist(store.getState() as RootState, effectiveChannelId, idMessageToJump?.id);

			if (idMessageToJump && isMessageExist) {
				if (idMessageToJump.id === 'temp') return;
				scrollToMessage(idMessageToJump.id);
				msgIdJumpHightlight.current = idMessageToJump.id;
				dispatch(messagesActions.setIdMessageToJump(null));

				if (jumpHighlightTimeoutRef.current) {
					clearSafeTimeout(jumpHighlightTimeoutRef.current);
				}
				jumpHighlightTimeoutRef.current = setSafeTimeout(() => {
					msgIdJumpHightlight.current = null;
					setForceRender((prev) => !prev);
					jumpHighlightTimeoutRef.current = null;
				}, 1000);
			}
		}, [
			idMessageToJump,
			effectiveChannelId,
			clearSafeTimeout,
			dispatch,
			setSafeTimeout,
			chatRef,
			isScrollTopJustUpdatedRef,
			setAnchor,
			userActiveScroll
		]);

		const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], channelId);

		const { showMessageContextMenu, selectedMessageId } = useMessageContextMenu();

		const renderedMessages = useMemo(() => {
			// Use lastSeenAtBottomRef (saved when user was at bottom) or fallback to lastMessageUnreadId
			const baseUnreadMessageId = lastSeenAtBottomRef.current || lastMessageUnreadId;
			return messageIds.map((messageId, index) => {
				const checkMessageTargetToMoved = msgIdJumpHightlight.current === messageId && messageId !== lastMessageId;
				const messageReplyHighlight = (dataReferences?.messageRefId && dataReferences?.messageRefId === messageId) || false;
				const isSelected = selectedMessageId === messageId;
				const isEditing = getIsEditing(messageId);
				const previousMessageId = messageIds[index - 1];
				const isPreviousMessageLastSeen =
					baseUnreadMessageId && Boolean(previousMessageId === baseUnreadMessageId && previousMessageId !== lastMessageId);
				const shouldShowUnreadBreak = isPreviousMessageLastSeen && entities[messageId]?.senderId !== user?.user?.id;

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
						checkMessageTargetToMoved={checkMessageTargetToMoved}
						messageReplyHighlight={messageReplyHighlight}
						isTopic={isTopic}
						canSendMessage={canSendMessage}
						observeIntersectionForLoading={observeIntersectionForLoading}
						user={currentClanUser || user}
						showMessageContextMenu={showMessageContextMenu}
						isSelected={isSelected}
						isEditing={isEditing}
						shouldShowUnreadBreak={!!shouldShowUnreadBreak}
					/>
				);
			});
		}, [
			messageIds,
			avatarDM,
			canSendMessage,
			channelId,
			channelLabel,
			dataReferences?.messageRefId,
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
			forceRender,
			currentClanUser,
			user,
			observeIntersectionForLoading,
			showMessageContextMenu,
			isPrivate
		]);

		const scrollTimeoutId2 = useRef<NodeJS.Timeout | null>(null);

		const handleWheel = useLastCallback(() => {
			toggleDisableHover(chatRef.current, scrollTimeoutId2);
			userActiveScroll.current = true;
			skipCalculateScroll.current = false;
			runDebouncedForWheel(() => {
				requestAnimationFrame(() => {
					if (!userActiveScroll.current) return;
					updateScrollPosition();
				});
			});
		});

		const handleTouchStart = useLastCallback(() => {
			userActiveScroll.current = true;
			skipCalculateScroll.current = false;
		});

		const handleKeyboardEvent = useLastCallback((event: KeyboardEvent) => {
			if (!chatRef.current?.contains(event.target as Node)) return;
			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				userActiveScroll.current = true;
				skipCalculateScroll.current = false;
				handleWheel();
			}
		});

		useEffect(() => {
			document.addEventListener('keydown', handleKeyboardEvent);
			return () => {
				document.removeEventListener('keydown', handleKeyboardEvent);
			};
		}, [handleKeyboardEvent]);

		const handleTouchEnd = useLastCallback(() => {
			runDebouncedForWheel(() => {
				requestAnimationFrame(() => {
					if (!userActiveScroll.current) return;
					updateScrollPosition();
				});
			});
		});

		return (
			<div className="w-full h-full relative messages-container select-text bg-theme-chat ">
				<StickyLoadingIndicator messageCount={messageIds?.length} />
				<div
					tabIndex={-1}
					onScroll={handleScroll}
					onWheelCapture={handleWheel}
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
					onMouseDown={() => {
						userActiveScroll.current = true;
						skipCalculateScroll.current = false;
					}}
					ref={chatRef}
					className={'messages-scroll outline-none w-full scroll-big'}
				>
					<div className="messages-wrap flex flex-col min-h-full mt-auto justify-end">
						{isTopic && firstMsgOfThisTopic && (
							<div className={`fullBoxText relative group ${firstMsgOfThisTopic?.references?.[0]?.messageRefId ? 'pt-3' : ''}`}>
								<MessageWithUser
									isTopic={isTopic}
									allowDisplayShortProfile={true}
									message={firstMsgOfThisTopic}
									mode={mode}
									user={currentClanUser || user}
								/>
							</div>
						)}
						{withHistoryTriggers && <div ref={backwardsTriggerRef} key="backwards-trigger" className="backwards-trigger" />}
						{messageIds?.[0] && <LoadingSkeletonMessages channelId={channelId} isTopic={isTopic} topicId={topicId} />}
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
	({ channelId, isTopic }: { channelId: string; isTopic?: boolean; topicId?: string }) => {
		const hasMoreTop = useAppSelector((state) => selectHasMoreMessageByChannelId(state, channelId));
		// TODO: check hasMoreTop topic check backend alway return true
		if (!hasMoreTop || isTopic) return null;
		return (
			<div id="msg-loading-top" className="py-2">
				<MessageSkeleton randomKey={channelId} />
			</div>
		);
	},
	(prev, next) => {
		return prev.channelId === next.channelId && prev.isTopic === next.isTopic;
	}
);

LoadingSkeletonMessages.displayName = 'LoadingSkeletonMessages';

const SKELETON_ITEMS = [
	{ line1: [75, 68, 82, 91, 77], line2: [88, 71, 94, 83, 69], image: 180 },
	{ line1: [82, 95, 73, 87, 91], line2: [76, 89, 84, 78, 93], image: 220 },
	{ line1: [68, 84, 92, 77, 85], line2: [91, 73, 88, 95, 81], image: 150 },
	{ line1: [91, 72, 86, 94, 79], line2: [84, 97, 76, 89, 85], image: 200 },
	{ line1: [77, 89, 81, 93, 88], line2: [79, 92, 87, 74, 96], image: 170 }
] as const;

// Pre-compute style objects to avoid recreating them on every render
const SKELETON_LINE_STYLES = SKELETON_ITEMS.map((item) => ({
	line1: item.line1.map((width) => ({ width: `${width}%` })),
	line2: item.line2.map((width) => ({ width: `${width}%` })),
	image: { width: item.image, height: 120, maxWidth: '100%' }
}));

export const MessageSkeleton = memo(
	function MessageSkeleton({ className, randomKey = 'skeleton' }: MessageSkeletonProps) {
		return (
			<div className={buildClassName('flex flex-col px-4 py-2 w-[60%] h-[1000px] overflow-hidden', className)}>
				{SKELETON_ITEMS.map((item, index) => {
					const styles = SKELETON_LINE_STYLES[index];
					return (
						<div key={`${randomKey}-${index}`} className="flex items-start gap-3 pb-4">
							<div className="rounded-full dark:bg-skeleton-dark bg-skeleton-white h-10 w-10 flex-shrink-0" />

							<div className="flex-1 py-2">
								<div className="flex items-center gap-2 pb-2">
									<div className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded w-24" />
									<div className="h-3 dark:bg-skeleton-dark bg-skeleton-white rounded w-16" />
								</div>

								<div className="flex gap-2">
									{item.line1.map((_, i) => (
										<div key={i} className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded" style={styles.line1[i]} />
									))}
								</div>

								<div className="flex gap-2 pt-2">
									{item.line2.map((_, i) => (
										<div key={i} className="h-4 dark:bg-skeleton-dark bg-skeleton-white rounded" style={styles.line2[i]} />
									))}
								</div>

								<div className="dark:bg-skeleton-dark bg-skeleton-white rounded-md mt-2" style={styles.image} />
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
