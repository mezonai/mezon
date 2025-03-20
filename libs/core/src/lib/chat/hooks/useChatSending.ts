import {
	messagesActions,
	selectAllAccount,
	selectAnonymousMode,
	selectCurrentTopicId,
	selectCurrentTopicInitMessage,
	selectIsFocusOnChannelInput,
	selectIsShowCreateTopic,
	selectMemberClanByUserId2,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { IMessageSendPayload } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiSdTopic, ApiSdTopicRequest } from 'mezon-js/api.gen';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export type UseChatSendingOptions = {
	mode: number;
	channelOrDirect: ApiChannelDescription | undefined;
};

// TODO: separate this hook into 2 hooks for send and edit message
export function useChatSending({ mode, channelOrDirect }: UseChatSendingOptions) {
	const dispatch = useAppDispatch();
	const getClanId = channelOrDirect?.clan_id;
	const isPublic = !channelOrDirect?.channel_private;
	const channelIdOrDirectId = channelOrDirect?.channel_id;
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isShowCreateTopic = useSelector(selectIsShowCreateTopic);
	const isFocusOnChannelInput = useSelector(selectIsFocusOnChannelInput);
	const userProfile = useSelector(selectAllAccount);

	const profileInTheClan = useAppSelector((state) => selectMemberClanByUserId2(state, userProfile?.user?.id ?? ''));
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
	const anonymousMode = useSelector(selectAnonymousMode);
	const initMessageOfTopic = useSelector(selectCurrentTopicInitMessage);
	const { clientRef, sessionRef, socketRef } = useMezon();

	const createTopic = useCallback(async () => {
		const body: ApiSdTopicRequest = {
			clan_id: getClanId as string,
			channel_id: channelIdOrDirectId as string,
			message_id: initMessageOfTopic?.id as string
		};

		const topic = (await dispatch(topicsActions.createTopic(body))).payload as ApiSdTopic;
		dispatch(topicsActions.setCurrentTopicId(topic.id || ''));
		return topic;
	}, [channelIdOrDirectId, dispatch, getClanId, initMessageOfTopic?.id]);

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
			if (!isFocusOnChannelInput && isShowCreateTopic) {
				if (!currentTopicId) {
					const topic = (await createTopic()) as ApiSdTopic;
					if (topic) {
						dispatch(
							topicsActions.handleSendTopic({
								clanId: getClanId as string,
								channelId: channelIdOrDirectId as string,
								mode: mode,
								anonymous: false,
								attachments: attachments,
								code: 0,
								content: content,
								isMobile: isMobile,
								isPublic: isPublic,
								mentionEveryone: mentionEveryone,
								mentions: mentions,
								references: references,
								topicId: topic?.id as string
							})
						);
						return;
					}
				}

				dispatch(
					topicsActions.handleSendTopic({
						clanId: getClanId as string,
						channelId: channelIdOrDirectId as string,
						mode: mode,
						anonymous: false,
						attachments: attachments,
						code: 0,
						content: content,
						isMobile: isMobile,
						isPublic: isPublic,
						mentionEveryone: mentionEveryone,
						mentions: mentions,
						references: references,
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
					isPublic: isPublic,
					content: content,
					mentions: mentions,
					attachments,
					references,
					anonymous,
					mentionEveryone,
					senderId: currentUserId,
					avatar: priorityAvatar,
					isMobile,
					username: priorityNameToShow,
					code: code
				})
			);
		},
		[
			isFocusOnChannelInput,
			isShowCreateTopic,
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
			initMessageOfTopic?.id,
			userProfile?.user?.id
		]
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
			topic_id?: string,
			isTopic?: boolean
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
				topic_id,
				!!isTopic
			);
			if (topic_id && !isTopic) {
				dispatch(topicsActions.updateInitMessage({ content: content, mentions: mentions }));
			}
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
