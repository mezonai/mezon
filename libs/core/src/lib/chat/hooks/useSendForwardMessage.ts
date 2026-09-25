import { toastActions, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload, IMessageWithUser } from '@mezon/utils';
import { MAX_FORWARD_MESSAGE_LENGTH } from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse, type ApiMessageMention } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useSendForwardMessage() {
	const { t } = useTranslation('forwardMessage');
	const { clientRef, sessionRef } = useMezon();

	const dispatch = useAppDispatch();

	const client = clientRef.current;

	const sendForwardMessage = React.useCallback(
		async (clanid: string, channel_id: string, mode: number, isPublic: boolean, message: IMessageWithUser, additionalMessage?: string) => {
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!client || !session || !channel_id) {
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
				const parsedContent: IMessageSendPayload =
					typeof message.content === 'string'
						? safeJSONParse(message.content) || { t: message.content }
						: (message.content as IMessageSendPayload) || {};

				const messageMentions = message.mentions ?? (parsedContent as any)?.mentions;
				let parsedMentions: any[] = [];
				if (Array.isArray(messageMentions)) {
					parsedMentions = messageMentions;
				} else if (typeof messageMentions === 'string' && messageMentions.trim()) {
					try {
						const parsed = JSON.parse(messageMentions);
						parsedMentions = Array.isArray(parsed) ? parsed : [];
					} catch {
						parsedMentions = [];
					}
				}
				const sanitizedMentions: ApiMessageMention[] = parsedMentions
					.filter((m: any) => m && typeof m === 'object')
					.map((m: any) => {
						const mention: ApiMessageMention = {};
						if (m.user_id !== undefined && m.user_id !== null) mention.user_id = String(m.user_id);
						if (m.username !== undefined && m.username !== null) mention.username = String(m.username);
						if (m.role_id !== undefined && m.role_id !== null) mention.role_id = String(m.role_id);
						if (m.rolename !== undefined && m.rolename !== null) mention.rolename = String(m.rolename);
						if (m.s !== undefined && m.s !== null) {
							const sNum = Number(m.s);
							if (!isNaN(sNum)) mention.s = sNum;
						}
						if (m.e !== undefined && m.e !== null) {
							const eNum = Number(m.e);
							if (!isNaN(eNum)) mention.e = eNum;
						}
						return mention;
					})
					.filter((m) => Object.keys(m).length > 0);

				const validatedContent = {
					...parsedContent,
					fwd: true
				};

				const mentions = message.channel_id === channel_id ? sanitizedMentions : [];

				await client.joinChat(session, clanid || '0', channel_id, type, isPublic);

				await client.writeChatMessage(session, clanid || '0', channel_id, mode, isPublic, validatedContent, mentions, message.attachments);

				if (additionalMessage && additionalMessage.trim()) {
					const trimmedMessage = additionalMessage.trim();

					if (trimmedMessage.length > MAX_FORWARD_MESSAGE_LENGTH) {
						throw new Error(`Additional message is too long (max ${MAX_FORWARD_MESSAGE_LENGTH} characters)`);
					}

					const additionalContent: IMessageSendPayload = {
						t: trimmedMessage
					};
					await client.writeChatMessage(session, clanid || '0', channel_id, mode, isPublic, additionalContent, [], []);
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
		[sessionRef, clientRef, dispatch, t]
	);

	return useMemo(
		() => ({
			client,
			sendForwardMessage
		}),
		[client, sendForwardMessage]
	);
}
