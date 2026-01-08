import { getStore, selectDirectById } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload } from '@mezon/utils';
import { EBacktickType, processText, sleep } from '@mezon/utils';
import React, { useMemo } from 'react';

export function useSendInviteMessage() {
	const { clientRef, sessionRef, socketRef } = useMezon();
	const client = clientRef.current;

	const sendInviteMessage = React.useCallback(
		async (url: string, channelId: string, channelMode: number, code?: number) => {
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
				mk: [...markdowns, ...linkInMk]
			};

			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !channelId) {
				console.error(client, session, socket, channelId);
				throw new Error('Client is not initialized');
			}

			const store = getStore();
			const foundDM = selectDirectById(store.getState(), channelId);
			if (!foundDM) {
				await sleep(100);
			}

			await socket.writeChatMessage('0', channelId, channelMode, false, content, [], [], [], undefined, undefined, undefined, code);
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
