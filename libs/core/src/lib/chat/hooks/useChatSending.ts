import {
	messagesActions,
	selectAllAccount,
	selectAnonymousMode,
	selectCurrentTopicId,
	selectInitTopicMessageId,
	selectMemberClanByUserId,
	selectTopicAnonymousMode,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiSdTopic, ApiSdTopicRequest } from 'mezon-js/api.gen';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export type UseChatSendingOptions = {
	mode: number;
	channelOrDirect: ApiChannelDescription | undefined;
	fromTopic?: boolean;
};

// TODO: separate this hook into 2 hooks for send and edit message
export function useChatSending({ mode, channelOrDirect, fromTopic = false }: UseChatSendingOptions) {
	const dispatch = useAppDispatch();
	const getClanId = channelOrDirect?.clan_id;
	const isPublic = !channelOrDirect?.channel_private;
	const channelIdOrDirectId = channelOrDirect?.channel_id;
	const currentTopicId = useSelector(selectCurrentTopicId);

	const userProfile = useSelector(selectAllAccount);

	const profileInTheClan = useAppSelector((state) => selectMemberClanByUserId(state, userProfile?.user?.id ?? ''));
	const priorityAvatar =
		mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL
			? profileInTheClan?.clan_avatar
				? profileInTheClan?.clan_avatar
				: userProfile?.user?.avatar_url
			: userProfile?.user?.avatar_url;

	const priorityDisplayName = userProfile?.user?.display_name ? userProfile?.user?.display_name : userProfile?.user?.username;
	const priorityNameToShow =
		mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL
			? profileInTheClan?.clan_nick
				? profileInTheClan?.clan_nick
				: priorityDisplayName
			: priorityDisplayName;

	const currentUserId = userProfile?.user?.id || '';
	const anonymousMode = useSelector((state) => selectAnonymousMode(state, getClanId as string));
	const topicAnonymousMode = useSelector(selectTopicAnonymousMode);
	const initTopicMessageId = useSelector(selectInitTopicMessageId);
	const { clientRef, sessionRef, socketRef } = useMezon();

	const createTopic = useCallback(async () => {
		const body: ApiSdTopicRequest = {
			clan_id: getClanId as string,
			channel_id: channelIdOrDirectId as string,
			message_id: initTopicMessageId as string
		};

		const topic = (await dispatch(topicsActions.createTopic(body))).payload as ApiSdTopic;
		return topic;
	}, [channelIdOrDirectId, dispatch, getClanId, initTopicMessageId]);

	const sendMessage = React.useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			_anonymous?: boolean,
			mentionEveryone?: boolean,
			isMobile?: boolean,
			code?: number,
			ephemeralReceiverId?: string
		) => {
			if (ephemeralReceiverId) {
				await dispatch(
					messagesActions.sendEphemeralMessage({
						receiverId: ephemeralReceiverId,
						channelId: channelIdOrDirectId ?? '',
						clanId: getClanId || '',
						mode,
						isPublic,
						content,
						mentions,
						attachments,
						references,
						senderId: currentUserId,
						avatar: priorityAvatar,
						username: priorityNameToShow
					})
				);
				return;
			}

			if (fromTopic) {
				if (!currentTopicId) {
					const topic = (await createTopic()) as ApiSdTopic;
					if (!topic) {
						return;
					}

					await dispatch(
						topicsActions.handleSendTopic({
							clanId: getClanId as string,
							channelId: channelIdOrDirectId as string,
							mode,
							anonymous: false,
							attachments,
							code: 0,
							content,
							isMobile,
							isPublic,
							mentionEveryone,
							mentions,
							references,
							topicId: topic?.id as string
						})
					);
					return dispatch(topicsActions.setCurrentTopicId(topic?.id as string));
				}

				dispatch(
					topicsActions.handleSendTopic({
						clanId: getClanId as string,
						channelId: channelIdOrDirectId as string,
						mode,
						anonymous: getClanId !== '0' ? topicAnonymousMode : false,
						attachments,
						code: 0,
						content,
						isMobile,
						isPublic,
						mentionEveryone,
						mentions,
						references,
						topicId: currentTopicId as string
					})
				);
				return;
			}
			await dispatch(
				messagesActions.sendMessage({
					channelId: channelIdOrDirectId ?? '',
					clanId: getClanId || '',
					mode,
					isPublic,
					content,
					mentions,
					attachments,
					references,
					anonymous: getClanId !== '0' ? anonymousMode : false,
					mentionEveryone,
					senderId: currentUserId,
					avatar: priorityAvatar,
					isMobile,
					username: priorityNameToShow,
					code
				})
			);
		},
		[
			fromTopic,
			dispatch,
			channelIdOrDirectId,
			getClanId,
			mode,
			isPublic,
			currentUserId,
			priorityAvatar,
			priorityNameToShow,
			currentTopicId,
			createTopic,
			anonymousMode,
			topicAnonymousMode
		]
	);

	const sendMessageTyping = React.useCallback(async () => {
		if (!anonymousMode) {
			dispatch(
				messagesActions.sendTypingUser({
					clanId: getClanId || '',
					channelId: channelIdOrDirectId ?? '',
					mode,
					isPublic,
					username: priorityNameToShow || '',
					topicId: fromTopic ? currentTopicId || '' : ''
				})
			);
		}
	}, [anonymousMode, dispatch, getClanId, channelIdOrDirectId, mode, isPublic, priorityNameToShow, fromTopic, currentTopicId]);

	// Move this function to to a new action of messages slice
	const editSendMessage = React.useCallback(
		async (
			content: IMessageSendPayload,
			messageId: string,
			mentions: ApiMessageMention[],
			attachments?: ApiMessageAttachment[],
			hide_editted?: boolean,
			topic_id?: string,
			isTopic?: boolean,
			oldMentions?: string
		) => {
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;
			if (!client || !session || !socket || !channelOrDirect) {
				throw new Error('Client is not initialized');
			}
			const trimContent: IMessageSendPayload = {
				...content,
				t: content.t?.trim()
			};

			await socket.updateChatMessage(
				getClanId || '',
				channelIdOrDirectId ?? '',
				mode,
				isPublic,
				messageId,
				trimContent,
				mentions,
				attachments,
				hide_editted,
				topic_id,
				!!isTopic,
				oldMentions
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
