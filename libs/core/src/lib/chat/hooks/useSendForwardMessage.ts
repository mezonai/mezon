import { toastActions, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload, IMessageWithUser } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useSendForwardMessage() {
	const { t } = useTranslation('forwardMessage');
	const { clientRef, sessionRef, socketRef } = useMezon();

	const dispatch = useAppDispatch();

	const client = clientRef.current;

	const sendForwardMessage = React.useCallback(
		async (clanid: string, channel_id: string, mode: number, isPublic: boolean, message: IMessageWithUser, additionalMessage?: string) => {
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !channel_id) {
				// eslint-disable-next-line no-console
				console.log(client, session, socket, channel_id);
				throw new Error('Client is not initialized');
			}

			try {
				let type = ChannelType.CHANNEL_TYPE_CHANNEL;
				if (mode === ChannelStreamMode.STREAM_MODE_DM) {
					type = ChannelType.CHANNEL_TYPE_DM;
				} else if (mode === ChannelStreamMode.STREAM_MODE_GROUP) {
					type = ChannelType.CHANNEL_TYPE_GROUP;
				} else if (mode === ChannelStreamMode.STREAM_MODE_THREAD) {
					type = ChannelType.CHANNEL_TYPE_THREAD;
				}
				const validatedContent = {
					...(message.content as IMessageSendPayload),
					fwd: true
				};
				await socket.joinChat(clanid, channel_id, type, isPublic);
				await socket.writeChatMessage(
					clanid,
					channel_id,
					mode,
					isPublic,
					validatedContent,
					message.channel_id === channel_id ? message.mentions : [],
					message.attachments
				);

				if (additionalMessage && additionalMessage.trim()) {
					const trimmedMessage = additionalMessage.trim();

					if (trimmedMessage.length > 2000) {
						throw new Error('Additional message is too long (max 2000 characters)');
					}

					const additionalContent: IMessageSendPayload = {
						t: trimmedMessage
					};
					await socket.writeChatMessage(clanid, channel_id, mode, isPublic, additionalContent, [], []);
				}

				dispatch(
					toastActions.addToast({
						type: 'success',
						message: t('successMessage')
					})
				);
			} catch (e) {
				dispatch(
					toastActions.addToast({
						type: 'error',
						message: t('errorMessage')
					})
				);
			}
		},
		[sessionRef, clientRef, socketRef, dispatch, t]
	);

	return useMemo(
		() => ({
			client,
			sendForwardMessage
		}),
		[client, sendForwardMessage]
	);
}
