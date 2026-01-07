import { ChatContext, useChatReaction } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { getStore, selectCurrentChannel, selectDmGroupCurrentId } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { isPublicChannel } from '@mezon/utils';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { useSelector } from 'react-redux';
import type { IReactionMessageProps } from './components/MessageReaction';

const maxRetries = 10;
const ChannelMessageReactionListener = React.memo(() => {
	const store = getStore();
	const currentDirectId = useSelector(selectDmGroupCurrentId);
	const { reactionMessageDispatch } = useChatReaction({ isMobile: true, isClanViewMobile: !currentDirectId });
	const { socketRef } = useMezon();
	const { handleReconnect } = useContext(ChatContext);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const counterRef = useRef(0);

	const onReactionMessage = useCallback(
		async (data: IReactionMessageProps) => {
			const currentChannel = await selectCurrentChannel(store.getState() as any);
			if (!socketRef?.current?.isOpen()) {
				handleReconnect('');
				intervalRef.current = setInterval(() => {
					if (counterRef.current >= maxRetries) {
						clearInterval(intervalRef.current);
						return;
					}
					DeviceEventEmitter.emit(ActionEmitEvent.ON_RETRY_REACTION_MESSAGE_ITEM, data);
					counterRef.current++;
				}, 700); // Check and retry every 700ms
			} else {
				intervalRef.current && clearInterval(intervalRef.current);
				await reactionMessageDispatch({
					id: data?.id ?? '',
					messageId: data?.messageId ?? '',
					emojiId: data?.emojiId ?? '',
					emoji: data?.emoji?.trim() ?? '',
					count: data?.countToRemove ?? 0,
					messageSenderId: data?.senderId ?? '',
					actionDelete: data?.actionDelete ?? false,
					isPublic: currentDirectId ? false : isPublicChannel(currentChannel),
					clanId: currentDirectId ? '0' : currentChannel?.clanId,
					channelId: currentDirectId || currentChannel?.channelId,
					isFocusTopicBox: !!data?.topicId,
					channelIdOnMessage: data?.channelId ?? ''
				});
			}
		},
		[store, socketRef, handleReconnect, reactionMessageDispatch, currentDirectId]
	);

	const onReactionMessageRetry = useCallback(
		async (data: IReactionMessageProps) => {
			if (socketRef?.current?.isOpen()) {
				const currentChannel = selectCurrentChannel(store.getState() as any);
				counterRef.current = 0;
				intervalRef?.current && clearInterval(intervalRef.current);
				await reactionMessageDispatch({
					id: data?.id ?? '',
					messageId: data?.messageId ?? '',
					emojiId: data?.emojiId ?? '',
					emoji: data?.emoji?.trim() ?? '',
					count: data?.countToRemove ?? 0,
					messageSenderId: data?.senderId ?? '',
					actionDelete: data?.actionDelete ?? false,
					isPublic: currentDirectId ? false : isPublicChannel(currentChannel),
					clanId: currentDirectId ? '0' : currentChannel?.clanId,
					channelId: currentDirectId || currentChannel?.channelId,
					isFocusTopicBox: !!data?.topicId,
					channelIdOnMessage: data?.channelId ?? ''
				});
			}
		},
		[socketRef, store, reactionMessageDispatch, currentDirectId]
	);

	useEffect(() => {
		const eventOnReaction = DeviceEventEmitter.addListener(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, onReactionMessage);
		const eventOnRetryReaction = DeviceEventEmitter.addListener(ActionEmitEvent.ON_RETRY_REACTION_MESSAGE_ITEM, onReactionMessageRetry);

		return () => {
			eventOnReaction.remove();
			eventOnRetryReaction.remove();
			intervalRef?.current && clearInterval(intervalRef.current);
		};
	}, [onReactionMessage, onReactionMessageRetry]);

	return <View />;
});

export default ChannelMessageReactionListener;
