import type { AppDispatch, RootState } from '@mezon/store';
import {
	cdnSignatureActions,
	getStore,
	selectCdnSignatureByChannelId,
	selectChannelById,
	selectCurrentClanId,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import { uploadFileToPath, useMezon } from '@mezon/transport';
import type { IMessageSendPayload, IMessageWithUser } from '@mezon/utils';
import { ChannelStatusEnum, MAX_FORWARD_MESSAGE_LENGTH, appendCdnSignature, generatePathAttachments, getCdnSignatureChannelId } from '@mezon/utils';
import {
	ChannelStreamMode,
	ChannelType,
	safeJSONParse,
	type ApiMessageAttachment,
	type ApiMessageMention,
	type ApiSession,
	type Client
} from 'mezon-js';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const CLAN_CHANNEL_LISTING_LIMIT = 500;
const CLAN_CHANNEL_LISTING_STATE = 1;
const FORWARD_SOCKET_PAYLOAD_MAX_BYTES = 4 * 1024;

function forwardPayloadBytes(content: IMessageSendPayload, attachments: ApiMessageAttachment[], mentions: ApiMessageMention[]): number {
	return new TextEncoder().encode(JSON.stringify({ content, attachments, mentions })).length;
}

function isFiledOutOfReach(url: string | undefined, channelId: string, clanId: string): url is string {
	const folderChannelId = getCdnSignatureChannelId(url);
	if (!folderChannelId || folderChannelId === channelId) return false;
	const folderChannel = selectChannelById(getStore().getState() as RootState, folderChannelId);
	return !folderChannel || folderChannel.channel_private === ChannelStatusEnum.isPrivate || folderChannel.clan_id !== clanId;
}

async function downloadCdnFile(dispatch: AppDispatch, url: string): Promise<Blob> {
	const channelId = getCdnSignatureChannelId(url) as string;
	await dispatch(cdnSignatureActions.fetchCdnSignature({ channelId }));
	const response = await fetch(appendCdnSignature(url, selectCdnSignatureByChannelId(getStore().getState() as RootState, channelId)));
	if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
	return response.blob();
}

async function copyIntoChannel(
	dispatch: AppDispatch,
	client: Client,
	session: ApiSession,
	attachment: ApiMessageAttachment,
	channelId: string,
	clanId: string
): Promise<ApiMessageAttachment> {
	if (!isFiledOutOfReach(attachment.url, channelId, clanId)) return attachment;
	try {
		const file = await downloadCdnFile(dispatch, attachment.url);
		const copyThumbnail = isFiledOutOfReach(attachment.thumbnail, channelId, clanId);
		const thumbnailBlob = copyThumbnail ? await downloadCdnFile(dispatch, attachment.thumbnail as string).catch(() => undefined) : undefined;
		const [prepared] = await generatePathAttachments(
			client,
			session,
			[{ ...attachment, url: '', size: file.size, _thumbnailBlob: thumbnailBlob } as ApiMessageAttachment],
			channelId
		);
		if (!prepared?.uploadPath || !(await uploadFileToPath(prepared.uploadPath, file, file.size))) throw new Error('Upload failed');
		return { ...attachment, url: prepared.url, thumbnail: prepared.thumbnail ?? (copyThumbnail ? undefined : attachment.thumbnail) };
	} catch (error) {
		console.warn('[forward] media copy failed, forwarding the original url', error);
		return attachment;
	}
}

export function useSendForwardMessage() {
	const { t } = useTranslation('forwardMessage');
	const { clientRef, sessionRef } = useMezon();

	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const joinedClansRef = useRef(new Set<string>());

	const client = clientRef.current;

	const joinClanBeforePublicChannel = React.useCallback(
		async (clanId: string) => {
			const joinedThisSession = (getStore()?.getState() as RootState | undefined)?.clans?.checkJoinList?.[clanId];
			if (joinedThisSession || joinedClansRef.current.has(clanId)) {
				return;
			}
			const session = sessionRef.current;
			const client = clientRef.current;
			if (!client || !session) {
				return;
			}
			try {
				await client.listChannelDescs(
					session,
					CLAN_CHANNEL_LISTING_LIMIT,
					CLAN_CHANNEL_LISTING_STATE,
					0,
					clanId,
					ChannelType.CHANNEL_TYPE_CHANNEL
				);
				await client.joinClanChat(session, clanId);
				joinedClansRef.current.add(clanId);
			} catch (error) {
				console.warn('[forward] clan join before channel join failed', error);
			}
		},
		[clientRef, sessionRef]
	);

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

				const { presign_finish: _presignFinish, ...forwardedContent } = parsedContent;
				const validatedContent = {
					...forwardedContent,
					fwd: true
				};

				const attachmentsMessage: ApiMessageAttachment[] = await Promise.all(
					(message.attachments ?? []).map((attach) =>
						copyIntoChannel(
							dispatch,
							client,
							session,
							{
								filename: attach.filename,
								filetype: attach.filetype,
								size: attach.size,
								duration: attach.duration,
								url: attach.url,
								thumbnail: attach.thumbnail,
								height: attach.height,
								width: attach.width
							},
							channel_id,
							clanid
						)
					)
				);

				const mentions = sanitizedMentions;

				if (forwardPayloadBytes(validatedContent, attachmentsMessage, mentions) > FORWARD_SOCKET_PAYLOAD_MAX_BYTES) {
					dispatch(
						toastActions.addToast({
							type: 'error',
							message: t('payloadTooLarge')
						})
					);
					return;
				}

				if (mode === ChannelStreamMode.STREAM_MODE_CHANNEL && isPublic && clanid && clanid !== '0' && clanid !== currentClanId) {
					await joinClanBeforePublicChannel(clanid);
				}

				await client.joinChat(session, clanid || '0', channel_id, type, isPublic);

				await client.writeChatMessage(session, clanid || '0', channel_id, mode, isPublic, validatedContent, mentions, attachmentsMessage);

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
		[sessionRef, clientRef, dispatch, t, currentClanId, joinClanBeforePublicChannel]
	);

	return useMemo(
		() => ({
			client,
			sendForwardMessage
		}),
		[client, sendForwardMessage]
	);
}
