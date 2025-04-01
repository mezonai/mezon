import { useMezon } from '@mezon/transport';
import { EBacktickType, IMessageSendPayload, processText } from '@mezon/utils';
import React, { useMemo } from 'react';

export function useSendInviteMessage() {
	const { clientRef, sessionRef, socketRef } = useMezon();
	const client = clientRef.current;

	const sendInviteMessage = React.useCallback(
		async (url: string, channel_id: string, channelMode: number, code?: number) => {
			const { links, markdowns } = processText(url);
			const linkInMk: { type: EBacktickType; e?: number; s?: number }[] = [];

			links.forEach((link) => {
				const item = {
					type: EBacktickType.LINK,
					e: link?.e,
					s: link?.s
				};
				linkInMk.push(item);
			});

			const content: IMessageSendPayload = {
				t: url,
				lk: links,
				mk: [...markdowns, ...linkInMk]
			};

			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !channel_id) {
				console.error(client, session, socket, channel_id);
				throw new Error('Client is not initialized');
			}

			await socket.writeChatMessage('0', channel_id, channelMode, false, content, [], [], [], undefined, undefined, undefined, code);
		},
		[sessionRef, clientRef, socketRef]
	);

	return useMemo(
		() => ({
			client,
			sendInviteMessage
		}),
		[client, sendInviteMessage]
	);
}
