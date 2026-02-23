import type { InvitesEntity } from '@mezon/store';
import { getStore, inviteActions, selectDirectById, selectInviteById } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload } from '@mezon/utils';
import { EBacktickType, INVITE_URL_REGEX, processText, sleep } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useSendInviteMessage() {
	const { t } = useTranslation('linkMessageInvite');
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

			const mk = [...markdowns, ...linkInMk];

			const store = getStore();
			const inviteMatch = url.match(INVITE_URL_REGEX);
			const inviteId = inviteMatch?.[1] || '';
			if (inviteId) {
				let inviteInfo: InvitesEntity | undefined = selectInviteById(inviteId)(store.getState());
				if (!inviteInfo) {
					try {
						inviteInfo = await store.dispatch(inviteActions.getLinkInvite({ inviteId }) as any).unwrap();
					} catch {
						inviteInfo = undefined;
					}
				}

				const inviteLink = links.find((link) => {
					const start = link?.s ?? 0;
					const end = link?.e ?? 0;
					if (!end || end <= start) return false;
					const linkValue = url.substring(start, end);
					return INVITE_URL_REGEX.test(linkValue);
				});
				const inviteIndex = inviteLink?.s ?? 0;
				const memberCount = Number(inviteInfo?.member_count || 0);
				mk.push({
					type: EBacktickType.OGP_PREVIEW,
					s: url.length,
					e: url.length + 1,
					index: inviteIndex,
					title: inviteInfo?.clan_name || t('unknownClan'),
					description: inviteInfo ? t('memberCount', { count: memberCount }) : '',
					image: inviteInfo?.clan_logo || ''
				});
			}

			const content: IMessageSendPayload = {
				t: url,
				mk
			};

			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !channel_id) {
				console.error(client, session, socket, channel_id);
				throw new Error('Client is not initialized');
			}

			const foundDM = selectDirectById(store.getState(), channel_id);
			if (!foundDM) {
				await sleep(100);
			}

			await client.sendChannelMessage(
				session,
				'0',
				channel_id,
				channelMode,
				false,
				typeof content === 'object' ? JSON.stringify(content) : content,
				[],
				[],
				[],
				undefined,
				undefined,
				undefined,
				code
			);
		},
		[sessionRef, clientRef, socketRef, t]
	);

	return useMemo(
		() => ({
			client,
			sendInviteMessage
		}),
		[client, sendInviteMessage]
	);
}
