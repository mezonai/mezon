// Last seen message update mechanism
// Every time message component is rendered
// component triggers updateLastSeenMessage action
// action contains channelId, messageId, message create time
// push action into cache, keep the payload with the latest create time
// set timeout to 1 second, if no new action comes in, send the latest action to clan

import type { MessagesEntity } from '@mezon/store';
import { directMetaActions, messagesActions, useAppDispatch } from '@mezon/store';
import { isBackgroundModeActive, isDMStreamMode, normalizeClanId } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

interface MarkAsReadOptions {
	isTopic?: boolean;
	parentChannelId?: string;
}

export function useSeenMessagePool() {
	const dispatch = useAppDispatch();
	const isFocus = !isBackgroundModeActive();

	const markAsReadSeen = useCallback(
		(message: MessagesEntity, mode: number, badge_count: number, options?: MarkAsReadOptions) => {
			if (message?.isSending) {
				return;
			}
			dispatch(
				messagesActions.updateLastSeenMessage({
					clanId: isDMStreamMode(mode) ? '0' : normalizeClanId(message?.clan_id),
					channelId: message?.channel_id,
					messageId: message?.id,
					mode,
					badge_count,
					isTopic: options?.isTopic,
					parentChannelId: options?.parentChannelId
				})
			);
			if (isFocus && isDMStreamMode(mode)) {
				dispatch(directMetaActions.updateLastSeenTime(message));
			}
		},
		[isFocus]
	);

	return useMemo(
		() => ({
			markAsReadSeen
		}),
		[markAsReadSeen]
	);
}
