import {
	channelMetaActions,
	ChannelsEntity,
	messagesActions,
	selectAllChannelMembers,
	selectAllRolesClan,
	selectChannelById,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { IMessageSendPayload, uniqueUsers } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useChannelMembers } from './useChannelMembers';

export type UseThreadMessage = {
	channelId: string;
	mode: number;
};

export function useThreadMessage({ channelId, mode }: UseThreadMessage) {
	mode = ChannelStreamMode.STREAM_MODE_THREAD;

	const currentClanId = useSelector(selectCurrentClanId);
	const thread = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const dispatch = useAppDispatch();

	const { clientRef, sessionRef, socketRef } = useMezon();
	const { addMemberToThread } = useChannelMembers({
		channelId: channelId,
		mode: ChannelStreamMode.STREAM_MODE_THREAD
	});

	const membersOfChild = useAppSelector((state) => (thread?.channel_id ? selectAllChannelMembers(state, thread?.channel_id as string) : null));
	const rolesClan = useSelector(selectAllRolesClan);

	const mapToMemberIds = useMemo(() => {
		return membersOfChild?.map((item) => item.id);
	}, [membersOfChild]);

	const sendMessageThread = React.useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			thread?: ApiChannelDescription
		) => {
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !thread || !currentClanId) {
				throw new Error('Client is not initialized');
			}

			await socket.writeChatMessage(
				currentClanId,
				thread.channel_id as string,
				ChannelStreamMode.STREAM_MODE_THREAD,
				thread.channel_private === 0,
				content,
				mentions,
				attachments,
				references
			);

			const userIds = uniqueUsers(mentions as ApiMessageMention[], membersOfChild, rolesClan, []).slice(0, -1);
			const usersNotExistingInThread = userIds.filter((userId) => !mapToMemberIds?.includes(userId as string));
			if (usersNotExistingInThread.length > 0) {
				addMemberToThread(thread as ChannelsEntity, usersNotExistingInThread as string[]);
			}

			const timestamp = Date.now() / 1000;
			dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId, timestamp }));
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sessionRef, clientRef, socketRef, currentClanId, mode, dispatch, channelId]
	);

	const sendMessageTyping = React.useCallback(async () => {
		if (channelId) {
			dispatch(
				messagesActions.sendTypingUser({
					clanId: currentClanId || '',
					channelId: channelId,
					mode: ChannelStreamMode.STREAM_MODE_THREAD,
					isPublic: false
				})
			);
		}
	}, [channelId, dispatch, currentClanId, mode]);

	const editSendMessage = React.useCallback(
		async (content: string, messageId: string) => {
			const editMessage: IMessageSendPayload = {
				t: content
			};
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !currentClanId) {
				throw new Error('Client is not initialized');
			}
			await socket.updateChatMessage(
				currentClanId,
				channelId,
				ChannelStreamMode.STREAM_MODE_THREAD,
				thread ? !thread.channel_private : false,
				messageId,
				editMessage
			);
		},
		[sessionRef, clientRef, socketRef, currentClanId, channelId, mode, thread]
	);

	return useMemo(
		() => ({
			sendMessageThread,
			sendMessageTyping,
			editSendMessage
		}),
		[sendMessageThread, sendMessageTyping, editSendMessage]
	);
}
