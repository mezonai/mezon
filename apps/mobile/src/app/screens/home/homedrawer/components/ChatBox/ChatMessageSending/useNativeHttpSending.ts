import type { UseChatSendingOptions } from '@mezon/core';
import { useChatSending } from '@mezon/core';
import {
	messagesActions,
	selectAllAccount,
	selectAnonymousMode,
	selectCurrentTopicId,
	selectInitTopicMessageId,
	selectMemberClanByUserId,
	selectOgpData,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { EBacktickType, type IMessageSendPayload } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiSdTopic, ApiSdTopicRequest } from 'mezon-js/api.gen';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useNativeHttpSending(options: UseChatSendingOptions) {
	const { mode, channelOrDirect, fromTopic = false } = options;
	const originalHook = useChatSending(options);
	const dispatch = useAppDispatch();

	const getClanId = channelOrDirect?.clan_id;
	const isPublic = !channelOrDirect?.channel_private;
	const channelIdOrDirectId = channelOrDirect?.channel_id;
	const currentTopicId = useSelector(selectCurrentTopicId);

	const userProfile = useSelector(selectAllAccount);
	const profileInTheClan = useAppSelector((state) => selectMemberClanByUserId(state, userProfile?.user?.id ?? ''));
	const ogpData = useAppSelector(selectOgpData);

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
	const initTopicMessageId = useSelector(selectInitTopicMessageId);

	const createTopic = useCallback(async () => {
		const body: ApiSdTopicRequest = {
			clan_id: getClanId || '0',
			channel_id: channelIdOrDirectId || '0',
			message_id: initTopicMessageId || '0'
		};

		return (await dispatch(topicsActions.createTopic(body))).payload as ApiSdTopic;
	}, [channelIdOrDirectId, dispatch, getClanId, initTopicMessageId]);

	const sendMessageViaHttp = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: ApiMessageMention[],
			attachments?: ApiMessageAttachment[],
			references?: ApiMessageRef[],
			anonymous?: boolean,
			mentionEveryone?: boolean,
			isMobile?: boolean,
			code?: number
		) => {
			const contentMessage = content;
			if (content?.mk?.some((item) => item.type === EBacktickType.LINK)) {
				if (ogpData) {
					const messageMarkdown = content?.mk;
					const indexOgp = content?.t?.indexOf(ogpData?.url);

					const ogp = {
						title: ogpData?.title,
						description: ogpData?.description,
						image: ogpData?.image,
						s: content?.t?.length ?? 0,
						e: (content?.t?.length ?? 0) + 1,
						type: EBacktickType.OGP_PREVIEW,
						index: indexOgp || 0
					};

					messageMarkdown.push(ogp);
					contentMessage.mk = messageMarkdown;
				}
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
							content: contentMessage,
							isMobile: true,
							isPublic,
							mentionEveryone,
							mentions,
							references,
							topicId: topic?.id as string,
							senderId: currentUserId,
							avatar: priorityAvatar,
							username: priorityNameToShow
						})
					);
					return dispatch(topicsActions.setCurrentTopicId(topic?.id as string));
				}

				await dispatch(
					topicsActions.handleSendTopic({
						clanId: getClanId as string,
						channelId: channelIdOrDirectId as string,
						mode,
						anonymous,
						attachments,
						code: 0,
						content: contentMessage,
						isMobile: true,
						isPublic,
						mentionEveryone,
						mentions,
						references,
						topicId: currentTopicId as string,
						senderId: currentUserId,
						avatar: priorityAvatar,
						username: priorityNameToShow
					})
				);
				return;
			}

			try {
				await dispatch(
					messagesActions.sendMessageViaApi({
						channelId: channelIdOrDirectId ?? '',
						clanId: getClanId || '',
						mode,
						isPublic,
						content: contentMessage,
						mentions,
						attachments,
						references,
						anonymous: getClanId !== '0' ? anonymousMode : false,
						mentionEveryone,
						senderId: currentUserId,
						avatar: priorityAvatar,
						isMobile: true,
						username: priorityNameToShow,
						code
					})
				).unwrap();
			} catch (error) {
				await originalHook.sendMessage(contentMessage, mentions, attachments, references, anonymous, mentionEveryone, isMobile, code);
			}
		},
		[
			dispatch,
			channelIdOrDirectId,
			getClanId,
			mode,
			isPublic,
			anonymousMode,
			currentUserId,
			priorityAvatar,
			priorityNameToShow,
			originalHook,
			fromTopic,
			currentTopicId,
			ogpData,
			createTopic
		]
	);

	const editSendMessageViaHttp = useCallback(
		async (
			content: IMessageSendPayload,
			messageId: string,
			mentions: ApiMessageMention[],
			attachments?: ApiMessageAttachment[],
			hideEditted?: boolean,
			topicId?: string,
			isTopic?: boolean
		) => {
			try {
				await dispatch(
					messagesActions.editMessageViaApi({
						channelId: channelIdOrDirectId ?? '',
						clanId: getClanId || '',
						mode,
						isPublic,
						messageId,
						content,
						mentions,
						attachments,
						hideEditted,
						topicId,
						isTopic
					})
				).unwrap();
			} catch (error) {
				await originalHook.editSendMessage(content, messageId, mentions, attachments, hideEditted, topicId, isTopic);
			}
		},
		[dispatch, channelIdOrDirectId, getClanId, mode, isPublic, originalHook]
	);

	return useMemo(
		() => ({
			sendMessage: sendMessageViaHttp,
			editSendMessage: editSendMessageViaHttp,
			sendMessageTyping: originalHook.sendMessageTyping
		}),
		[sendMessageViaHttp, editSendMessageViaHttp, originalHook.sendMessageTyping]
	);
}
