import { messagesActions, selectAllAccount, selectAnonymousMode, useAppDispatch } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { IMessageSendPayload, TypeMessage } from '@mezon/utils';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

export type UseChatSendingOptions = {
	mode: number;
	channelOrDirect: ApiChannelDescription | undefined;
	isEventMessage?: boolean;
};

// TODO: separate this hook into 2 hooks for send and edit message
export function useChatSending({ mode, channelOrDirect, isEventMessage = false }: UseChatSendingOptions) {
	const dispatch = useAppDispatch();
	const getClanId = channelOrDirect?.clan_id;
	const isPublic = !channelOrDirect?.channel_private;
	const channelIdOrDirectId = channelOrDirect?.channel_id;

	const userProfile = useSelector(selectAllAccount);
	const currentUserId = userProfile?.user?.id || '';
	const anonymousMode = useSelector(selectAnonymousMode);
	const { clientRef, sessionRef, socketRef } = useMezon();
	const sendMessage = React.useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			anonymous?: boolean,
			mentionEveryone?: boolean,
			isMobile?: boolean,
			code?: number
		) => {
			await dispatch(
				messagesActions.sendMessage({
					channelId: channelIdOrDirectId ?? '',
					clanId: getClanId || '',
					mode,
					isPublic: isPublic,
					content,
					mentions,
					attachments,
					references,
					anonymous,
					mentionEveryone,
					senderId: isEventMessage ? '0' : currentUserId,
					avatar: isEventMessage ? '' : userProfile?.user?.avatar_url,
					isMobile,
					username: isEventMessage ? 'Sytem' : userProfile?.user?.display_name,
					code: isEventMessage ? TypeMessage.Welcome : code
				})
			);
		},
		[dispatch, channelIdOrDirectId, getClanId, mode, isPublic, currentUserId]
	);

	const sendMessageTyping = React.useCallback(async () => {
		if (!anonymousMode) {
			dispatch(
				messagesActions.sendTypingUser({
					clanId: getClanId || '',
					channelId: channelIdOrDirectId ?? '',
					mode,
					isPublic: isPublic
				})
			);
		}
	}, [channelIdOrDirectId, getClanId, dispatch, isPublic, mode, anonymousMode]);

	// Move this function to to a new action of messages slice
	const editSendMessage = React.useCallback(
		async (
			content: IMessageSendPayload,
			messageId: string,
			mentions: ApiMessageMention[],
			attachments?: ApiMessageAttachment[],
			hide_editted?: boolean,
			topic_id?: string
		) => {
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;
			if (!client || !session || !socket || !channelOrDirect) {
				throw new Error('Client is not initialized');
			}

			await socket.updateChatMessage(
				getClanId || '',
				channelIdOrDirectId ?? '',
				mode,
				isPublic,
				messageId,
				content,
				mentions,
				attachments,
				hide_editted,
				topic_id
			);
		},
		[sessionRef, clientRef, socketRef, channelOrDirect, getClanId, channelIdOrDirectId, mode, isPublic]
	);

	return useMemo(
		() => ({
			sendMessage,
			sendMessageTyping,
			editSendMessage
		}),
		[sendMessage, sendMessageTyping, editSendMessage]
	);
}
