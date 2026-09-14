import type { ChannelsEntity } from '@mezon/store';
import {
	getStore,
	messagesActions,
	selectAllAccount,
	selectAllChannelMembers,
	selectAllRolesClan,
	selectChannelById,
	selectCurrentClanId,
	selectOgpData,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IMessageSendPayload } from '@mezon/utils';
import { CREATING_THREAD, EBacktickType, isTikTokLink, isYouTubeLink, uniqueUsers } from '@mezon/utils';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js';
import { ChannelStreamMode } from 'mezon-js';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useChannelMembers } from './useChannelMembers';

export type UseThreadMessage = {
	channelId: string;
	mode: number;
	username?: string;
};

export function useThreadMessage({ channelId, username }: UseThreadMessage) {
	const account = useSelector(selectAllAccount);

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
			_isMobile = false
		) => {
			if (!thread?.channel_id || !currentClanId || !account?.user?.id) {
				throw new Error('Thread or current user is not initialized');
			}

			let threadContent = content;
			const store = getStore();
			const ogpData = selectOgpData(store.getState());
			const isSocialMediaLink = ogpData?.url && (isYouTubeLink(ogpData.url) || isTikTokLink(ogpData.url));
			const isOgpFromThreadBox =
				ogpData && ogpData.channel_id === CREATING_THREAD && threadContent?.mk && threadContent?.mk?.length > 0 && !isSocialMediaLink;

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
			await dispatch(
				messagesActions.sendMessage({
					clanId: currentClanId,
					channelId: thread.channel_id,
					mode: ChannelStreamMode.STREAM_MODE_THREAD,
					isPublic: thread.channel_private === 0,
					content: threadContent,
					mentions,
					attachments,
					references,
					senderId: account.user.id,
					avatar: account.user.avatar_url,
					username: account.user.display_name || username || account.user.username
				})
			).unwrap();

			const userIds = uniqueUsers(mentions ?? [], mapToMemberIds, rolesClan, []);
			if (userIds.length) {
				addMemberToThread(thread as ChannelsEntity, userIds as string[]);
			}
		},
		[account, currentClanId, dispatch, username, mapToMemberIds, rolesClan, addMemberToThread]
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
	}, [channelId, dispatch, currentClanId, username]);

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
		[sessionRef, clientRef, currentClanId, channelId, thread]
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
