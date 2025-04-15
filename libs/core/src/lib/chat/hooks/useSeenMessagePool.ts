// Last seen message update mechanism
// Every time message component is rendered
// component triggers updateLastSeenMessage action
// action contains channelId, messageId, message create time
// push action into cache, keep the payload with the latest create time
// set timeout to 1 second, if no new action comes in, send the latest action to clan

import { messagesActions, MessagesEntity, seenMessagePool, useAppDispatch } from '@mezon/store';
import { IMessage } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

export function useSeenMessagePool() {
	const dispatch = useAppDispatch();

	const initWorker = useCallback(() => {
		seenMessagePool.registerSeenMessageWorker((action) => {
			dispatch(
				messagesActions.updateLastSeenMessage({
					clanId: action.clanId,
					channelId: action.channelId,
					messageId: action.messageId,
					mode: action.mode,
					badge_count: 0
				})
			);
		});
	}, [dispatch]);

	const unInitWorker = useCallback(() => {
		seenMessagePool.unRegisterSeenMessageWorker();
	}, []);

	const markMessageAsSeen = useCallback((message: IMessage) => {
		// if message is sending, do not mark as seen
		if (message.isSending) {
			return;
		}

		seenMessagePool.addSeenMessage({
			clanId: message.clan_id || '',
			channelId: message.channel_id || '',
			channelLabel: message.channel_label,
			messageId: message.id || '',
			messageCreatedAt: message.create_time_seconds ? +message.create_time_seconds : 0,
			messageSeenAt: +Date.now(),
			mode: message.mode as number
		});
	}, []);

	const markAsReadSeen = useCallback(
		(message: MessagesEntity, mode: number, badge_count: number) => {
			// if message is sending, do not mark as seen
			if (message?.isSending) {
				return;
			}

			dispatch(
				messagesActions.updateLastSeenMessage({
					clanId: message?.clan_id || '',
					channelId: message?.channel_id,
					messageId: message?.id,
					mode: mode,
					badge_count
				})
			);
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			markMessageAsSeen,
			markAsReadSeen,
			initWorker,
			unInitWorker
		}),
		[initWorker, markMessageAsSeen, markAsReadSeen, unInitWorker]
	);
}
