import { messagesActions, selectClanView, selectCurrentChannel, selectCurrentClanId, selectMessagesByChannel, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { isPublicChannel, transformPayloadWriteSocket } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

export type UseDeleteMessageOptions = {
	channelId: string;
	mode: number;
	hasAttachment?: boolean;
	isTopic?: boolean;
};

export function useDeleteMessage({ channelId, mode, hasAttachment, isTopic }: UseDeleteMessageOptions) {
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const isClanView = useSelector(selectClanView);
	const { socketRef } = useMezon();
	const channel = useSelector(selectCurrentChannel);
	const channelMessages = useSelector((state: any) => selectMessagesByChannel(state, channelId));
	const deleteSendMessage = React.useCallback(
		async (messageId: string) => {
			const socket = socketRef.current;
			if (!socket) return;

			try {
				const message = channelMessages?.entities?.[messageId];
				const mentions = message?.mentions || [];
				const references = message?.references || [];
				const mentionsString = JSON.stringify(mentions);
				const referencesString = JSON.stringify(references);
				dispatch(
					messagesActions.remove({
						channelId,
						messageId
					})
				);

				const payload = transformPayloadWriteSocket({
					clanId: currentClanId as string,
					isPublicChannel: isPublicChannel(channel),
					isClanView: isClanView as boolean
				});

				if (isTopic) {
					await socket.removeChatMessage(
						payload.clan_id,
						channel?.channel_id || '',
						mode,
						payload.is_public,
						messageId,
						hasAttachment,
						channelId,
						mentionsString,
						referencesString
					);

					return;
				}

				await socket.removeChatMessage(
					payload.clan_id,
					channelId,
					mode,
					payload.is_public,
					messageId,
					hasAttachment,
					undefined,
					mentionsString,
					referencesString
				);
			} catch (e) {
				console.error(e);
			}
		},
		[socketRef, channelMessages?.entities, dispatch, channelId, currentClanId, channel, isClanView, isTopic, mode, hasAttachment]
	);

	return useMemo(
		() => ({
			deleteSendMessage
		}),
		[deleteSendMessage]
	);
}
