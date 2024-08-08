import { ELoadMoreDirection, IBeforeRenderCb, useChatScroll } from '@mezon/chat-scroll';
import { ChatWelcome, MessageContextMenuProvider, MessageModalImage } from '@mezon/components';
import {
	messagesActions,
	selectFirstMessageId,
	selectHasMoreBottomByChannelId,
	selectHasMoreMessageByChannelId,
	selectIdMessageToJump,
	selectIsJumpingToPresent,
	selectIsMessageIdExist,
	selectIsViewingOlderMessagesByChannelId,
	selectMessageIdsByChannelId,
	selectMessageIsLoading,
	selectMessageNotifed,
	selectOpenModalAttachment,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Direction_Mode } from '@mezon/utils';
import classNames from 'classnames';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ChannelMessage, MemorizedChannelMessage } from './ChannelMessage';

type ChannelMessagesProps = {
	channelId: string;
	type: ChannelType;
	channelLabel?: string;
	avatarDM?: string;
	mode: number;
	userName?: string;
};

export default function ChannelMessages({ channelId, channelLabel, type, avatarDM, userName, mode }: ChannelMessagesProps) {
	const messages = useAppSelector((state) => selectMessageIdsByChannelId(state, channelId));

	const chatRef = useRef<HTMLDivElement | null>(null);
	const appearanceTheme = useSelector(selectTheme);
	const idMessageNotifed = useSelector(selectMessageNotifed);
	const firstMessageId = useAppSelector((state) => selectFirstMessageId(state, channelId));
	const idMessageToJump = useSelector(selectIdMessageToJump);
	const isJumpingToPresent = useSelector(selectIsJumpingToPresent);
	const isMessageExist = useSelector(selectIsMessageIdExist(channelId, idMessageToJump));
	const isViewingOlderMessages = useSelector(selectIsViewingOlderMessagesByChannelId(channelId));

	const isFetching = useSelector(selectMessageIsLoading);
	const hasMoreTop = useSelector(selectHasMoreMessageByChannelId(channelId));
	const hasMoreBottom = useSelector(selectHasMoreBottomByChannelId(channelId));

	console.log('hasMoreTop', hasMoreTop, 'hasMoreBottom', hasMoreBottom);

	const dispatch = useAppDispatch();
	const openModalAttachment = useSelector(selectOpenModalAttachment);

	const loadMoreMessage = useCallback(async (direction: ELoadMoreDirection, cb: IBeforeRenderCb) => {
		console.log('loadMoreMessage', direction === 1 ? 'bottom' : 'top', isFetching, hasMoreTop, hasMoreBottom);

		if (isFetching) {
			return;
		}

		if (direction === ELoadMoreDirection.bottom && !hasMoreBottom) {
			return;
		}

		if (direction === ELoadMoreDirection.top && !hasMoreTop) {
			return;
		}

		if (typeof cb === 'function') {
			cb();
		}

		if (direction === ELoadMoreDirection.bottom) {
			return dispatch(messagesActions.loadMoreMessage({ channelId, direction: Direction_Mode.AFTER_TIMESTAMP }));
		}

		return dispatch(messagesActions.loadMoreMessage({ channelId, direction: Direction_Mode.BEFORE_TIMESTAMP }));
	}, [dispatch, channelId, hasMoreTop, hasMoreBottom, isFetching]);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const chatScrollRef = useChatScroll(chatRef, {
		data: messages,
		hasNextPage: hasMoreBottom,
		hasPreviousPage: hasMoreTop,
	}, loadMoreMessage);

	const messagesView = useMemo(() => {
		return messages.map((messageId) => {
			if (firstMessageId === messageId) {
				return (
					<ChatWelcome
						key={messageId}
						name={channelLabel}
						avatarDM={avatarDM}
						userName={userName}
						mode={0} />
				)
			}
			return (
				<MemorizedChannelMessage
					key={messageId}
					messageId={messageId}
					channelId={channelId}
					isHighlight={messageId === idMessageNotifed}
					mode={mode}
					channelLabel={channelLabel ?? ''}
				/>
			);
		});
	}, [messages, firstMessageId, channelId, idMessageNotifed, mode, channelLabel, avatarDM, userName]);


	useEffect(() => {
		if (idMessageToJump && isMessageExist) {
			console.log('scrollToMessage', idMessageToJump);
			chatScrollRef.scrollToMessage(`msg-${idMessageToJump}`)
				.then((res) => {
					if (res) {
						dispatch(messagesActions.setIdMessageToJump(null));
					}
				});
		}
	}, [dispatch, idMessageToJump, isMessageExist, chatScrollRef]);

	useEffect(() => {
		if (isJumpingToPresent) {
			console.log('scrollToBottom');
			chatScrollRef.scrollToBottom().then(() => {
				dispatch(messagesActions.setIsJumpingToPresent(false));
			});
		}
	}, [dispatch, isJumpingToPresent, chatScrollRef]);

	useEffect(() => {
		chatScrollRef.updateLoadMoreCb(loadMoreMessage);
	}, [loadMoreMessage, chatScrollRef]);

	useEffect(() => {
		if (isViewingOlderMessages) {
			chatScrollRef.disableStickyScroll();
		} else {
			chatScrollRef.enableStickyScroll();
		}
	}, [chatScrollRef, isViewingOlderMessages]);

	useEffect(() => {
		// Update last message of channel when component unmount
		return () => {
			dispatch(
				messagesActions.UpdateChannelLastMessage({
					channelId,
				}),
			);
		};
	}, [channelId, dispatch]);

	return (
		<MessageContextMenuProvider>
			<div
				className={classNames('dark:bg-bgPrimary pb-5 bg-bgLightPrimary overflow-y-scroll overflow-x-hidden h-full', {
					customScrollLightMode: appearanceTheme === 'light',
				})}
				id="scrollLoading"
				ref={chatRef}
			>
				<div className="flex flex-col min-h-full justify-end">
					{isFetching && <p className="font-semibold text-center dark:text-textDarkTheme text-textLightTheme">Loading messages...</p>}
					{messagesView}
					{openModalAttachment && <MessageModalImage />}
				</div>
			</div>
		</MessageContextMenuProvider>
	);
}

ChannelMessages.Skeleton = () => {
	return (
		<>
			<ChannelMessage.Skeleton />
			<ChannelMessage.Skeleton />
			<ChannelMessage.Skeleton />
		</>
	);
};
