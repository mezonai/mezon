import type { ChannelsEntity } from '@mezon/store';
import {
	channelMetaActions,
	getStore,
	inviteActions,
	messagesActions,
	referencesActions,
	selectAllChannelMembers,
	selectAllRolesClan,
	selectChannelById,
	selectCurrentClanId,
	selectInviteById,
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
	getMobileUploadedAttachments,
	getWebUploadedAttachments,
	isFacebookLink,
	isTikTokLink,
	isYouTubeLink,
	uniqueUsers
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
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

	const { clientRef, sessionRef, socketRef } = useMezon();
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
			const socket = socketRef.current;

			if (!client || !session || !socket || !thread || !currentClanId) {
				throw new Error('Client is not initialized');
			}

			let uploadedFiles: ApiMessageAttachment[] = [];
			// Check if there are attachments
			if (attachments && attachments.length > 0) {
				if (isMobile) {
					try {
						uploadedFiles = await getMobileUploadedAttachments({ attachments, client, session });
					} catch (error: any) {
						console.error('Error uploading attachments:', error);
						if (error?.code === 'ENOENT') {
							uploadedFiles = attachments;
						}
					}
				} else {
					uploadedFiles = await getWebUploadedAttachments({ attachments, client, session });
				}
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
			} else if (threadContent?.t) {
				const inviteUrlRegex = /https?:\/\/[^\s]+\/invite\/([A-Za-z0-9_-]+)/i;
				const inviteExec = inviteUrlRegex.exec(threadContent.t);
				const inviteId = inviteExec?.[1] || '';
				const inviteIndex = inviteExec?.index ?? 0;

				if (inviteId) {
					let inviteInfo = selectInviteById(inviteId)(store.getState());
					if (!inviteInfo) {
						try {
							inviteInfo = await dispatch(inviteActions.getLinkInvite({ inviteId }) as any).unwrap();
						} catch {
							inviteInfo = undefined;
						}
					}

					const mk = [...(threadContent.mk ?? [])];
					const hasOgp = mk.some((item) => item.type === EBacktickType.OGP_PREVIEW);
					if (!hasOgp) {
						const memberCount = Number(inviteInfo?.member_count || 0);
						mk.push({
							type: EBacktickType.OGP_PREVIEW,
							s: threadContent.t.length,
							e: threadContent.t.length + 1,
							index: inviteIndex,
							title: inviteInfo?.clan_name || t('unknownClan'),
							description: inviteInfo ? t('memberCount', { count: memberCount }) : '',
							image: inviteInfo?.clan_logo || ''
						});
						threadContent = {
							...threadContent,
							mk
						};
					}
				}
			}

			await socket.writeChatMessage(
				currentClanId,
				thread.channel_id as string,
				ChannelStreamMode.STREAM_MODE_THREAD,
				thread.channel_private === 0,
				threadContent,
				mentions,
				uploadedFiles,
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
					messageId: lastMessageId || undefined
				})
			);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sessionRef, clientRef, socketRef, currentClanId, mode, dispatch, channelId, t]
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
