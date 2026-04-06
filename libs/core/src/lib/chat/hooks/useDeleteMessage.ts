import {
	getStore,
	messagesActions,
	selectClanView,
	selectCurrentChannel,
	selectCurrentClanId,
	selectMessagesByChannel,
	useAppDispatch
} from '@mezon/store';
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
	const { clientRef, sessionRef } = useMezon();
	const channelMessages = useSelector((state: any) => selectMessagesByChannel(state, channelId));
	const deleteSendMessage = React.useCallback(
		async (messageId: string) => {
			const client = clientRef.current;
			if (!client || !sessionRef.current) return;
			const store = getStore();

			const channel = selectCurrentChannel(store.getState());

			try {
				const message = channelMessages?.entities?.[messageId];
				const mentions = message?.mentions || [];
				const references = message?.references || [];
				const mentionsBytes = mentions.length > 0 ? new Uint8Array(1) : new Uint8Array();
				const referencesBytes = references.length > 0 ? new Uint8Array(1) : new Uint8Array();
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
					await client.deleteChannelMessage(
						sessionRef.current,
						payload.clan_id,
						channel?.channel_id || '0',
						mode,
						payload.is_public,
						messageId,
						hasAttachment,
						channelId,
						mentionsBytes as any,
						referencesBytes as any
					);

					return;
				}

				await client.deleteChannelMessage(
					sessionRef.current,
					payload.clan_id || '0',
					channelId,
					mode,
					payload.is_public,
					messageId,
					hasAttachment,
					undefined,
					mentionsBytes as any,
					referencesBytes as any
				);
			} catch (e) {
				console.error(e);
			}
		},
		[channelMessages?.entities, dispatch, channelId, currentClanId, isClanView, isTopic, mode, hasAttachment]
	);

	return useMemo(
		() => ({
			deleteSendMessage
		}),
		[deleteSendMessage]
	);
}
