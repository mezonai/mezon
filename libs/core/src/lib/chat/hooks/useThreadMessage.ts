import type { ChannelsEntity } from '@mezon/store';
import {
	channelMetaActions,
	getStore,
	messagesActions,
	referencesActions,
	selectAllChannelMembers,
	selectAllRolesClan,
	selectChannelById,
	selectCurrentClanId,
	selectLatestMessageId,
	selectOgpData,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload } from '@mezon/utils';
import {
	CREATING_THREAD,
	EBacktickType,
	generatePathAttachments,
	getWebUploadedAttachments,
	isFacebookLink,
	isTikTokLink,
	isYouTubeLink,
	uniqueUsers
} from '@mezon/utils';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useChannelMembers } from './useChannelMembers';

export type UseThreadMessage = {
	channelId: string;
	mode: number;
	username?: string;
};

export function useThreadMessage({ channelId, mode, username }: UseThreadMessage) {
	mode = ChannelStreamMode.STREAM_MODE_THREAD;
	const { t } = useTranslation('linkMessageInvite');

	const currentClanId = useSelector(selectCurrentClanId);
	const thread = useAppSelector((state) => selectChannelById(state, channelId)) || {};
	const dispatch = useAppDispatch();

	const { clientRef, sessionRef } = useMezon();
	const { addMemberToThread } = useChannelMembers({
		channelId,
		mode: ChannelStreamMode.STREAM_MODE_THREAD
	});

	const membersOfChild = useAppSelector((state) => (channelId ? selectAllChannelMembers(state, channelId) : null));
	const rolesClan = useSelector(selectAllRolesClan);

	const mapToMemberIds = useMemo(() => {
		return membersOfChild?.map((item) => item.id) || [];
	}, [membersOfChild]);

	const sendMessageThread = React.useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			thread?: ApiChannelDescription,
			isMobile = false
		) => {
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!client || !session || !thread || !currentClanId) {
				throw new Error('Client is not initialized');
			}

			// Check if there are attachments
			if (attachments && attachments.length > 0) {
				const attachmentsPath = await generatePathAttachments(client, session, attachments);
				await getWebUploadedAttachments({ attachments: attachmentsPath });
			}

			let threadContent = content;
			const store = getStore();
			const ogpData = selectOgpData(store.getState());
			const isSocialMediaLink = ogpData?.url && (isYouTubeLink(ogpData.url) || isFacebookLink(ogpData.url) || isTikTokLink(ogpData.url));
			const isOgpFromThreadBox =
				ogpData &&
				(ogpData.channel_id === thread.channel_id || ogpData.channel_id === CREATING_THREAD) &&
				threadContent?.mk &&
				threadContent?.mk?.length > 0 &&
				!isSocialMediaLink;

			if (isOgpFromThreadBox) {
				const mk = [...(threadContent.mk ?? [])];
				mk.push({
					description: ogpData?.description || '',
					image: ogpData?.image || '',
					title: ogpData?.title || '',
					s: threadContent.t?.length || 0,
					e: (threadContent.t?.length || 0) + 1,
					type: EBacktickType.OGP_PREVIEW,
					index: ogpData.index
				});
				threadContent = {
					...threadContent,
					mk
				};
			}
			await client.writeChatMessage(
				session,
				currentClanId,
				thread.channel_id as string,
				ChannelStreamMode.STREAM_MODE_THREAD,
				thread.channel_private === 0,
				threadContent,
				mentions,
				attachments,
				references
			);
			dispatch(referencesActions.clearOgpData());

			const userIds = uniqueUsers(mentions as ApiMessageMention[], mapToMemberIds, rolesClan, []);
			if (userIds.length) {
				addMemberToThread(thread as ChannelsEntity, userIds as string[]);
			}

			const timestamp = Date.now() / 1000;
			const lastMessageId = store ? selectLatestMessageId(store.getState(), channelId) : '';
			dispatch(
				channelMetaActions.setChannelLastSeenTimestamp({
					channelId,
					timestamp,
					messageId: lastMessageId || undefined,
					clanId: currentClanId
				})
			);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sessionRef, clientRef, currentClanId, mode, dispatch, channelId, t]
	);

	const sendMessageTyping = React.useCallback(async () => {
		if (channelId) {
			dispatch(
				messagesActions.sendTypingUser({
					clanId: currentClanId || '',
					channelId,
					mode: ChannelStreamMode.STREAM_MODE_THREAD,
					isPublic: false,
					username: username || ''
				})
			);
		}
	}, [channelId, dispatch, currentClanId, mode, username]);

	const editSendMessage = React.useCallback(
		async (content: string, messageId: string) => {
			const editMessage: IMessageSendPayload = {
				t: content
			};
			const session = sessionRef.current;
			const client = clientRef.current;

			if (!client || !session || !currentClanId) {
				throw new Error('Client is not initialized');
			}
			await client.updateChatMessage(
				session,
				currentClanId,
				channelId,
				ChannelStreamMode.STREAM_MODE_THREAD,
				thread ? !thread.channel_private : false,
				messageId,
				editMessage
			);
		},
		[sessionRef, clientRef, currentClanId, channelId, mode, thread]
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
