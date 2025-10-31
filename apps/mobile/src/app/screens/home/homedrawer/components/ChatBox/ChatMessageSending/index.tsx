/* eslint-disable @typescript-eslint/no-explicit-any */
import { useChannelMembers, useChatSending } from '@mezon/core';
import type { IRoleMention } from '@mezon/mobile-components';
import { ActionEmitEvent, ID_MENTION_HERE, STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import {
	emojiSuggestionActions,
	getStore,
	referencesActions,
	selectAllAccount,
	selectAllRolesClan,
	selectAttachmentByChannelId,
	selectChannelById,
	selectDmGroupCurrent,
	selectIsShowCreateTopic,
	selectMemberClanByUserId,
	sendEphemeralMessage,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import type {
	IEmojiOnMessage,
	IHashtagOnMessage,
	ILinkOnMessage,
	ILinkVoiceRoomOnMessage,
	IMarkdownOnMessage,
	IMentionOnMessage,
	IMessageSendPayload
} from '@mezon/utils';
import { ThreadStatus, checkIsThread, filterEmptyArrays, uniqueUsers } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import type { MutableRefObject } from 'react';
import React, { memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { EMessageActionType } from '../../../enums';
import type { IMessageActionNeedToResolve, IPayloadThreadSendMessage } from '../../../types';
import { style } from '../ChatBoxBottomBar/style';
import { RecordMessageSending } from './RecordMessageSending';
import { styles as localStyles } from './styles';

interface IChatMessageSendingProps {
	isAvailableSending: boolean;
	valueInputRef: any;
	mode: ChannelStreamMode;
	channelId: string;
	messageActionNeedToResolve: IMessageActionNeedToResolve | null;
	messageAction: EMessageActionType;
	clearInputAfterSendMessage: () => void;
	mentionsOnMessage?: MutableRefObject<IMentionOnMessage[]>;
	hashtagsOnMessage?: MutableRefObject<IHashtagOnMessage[]>;
	emojisOnMessage?: MutableRefObject<IEmojiOnMessage[]>;
	linksOnMessage?: MutableRefObject<ILinkOnMessage[]>;
	boldsOnMessage?: MutableRefObject<ILinkOnMessage[]>;
	markdownsOnMessage?: MutableRefObject<IMarkdownOnMessage[]>;
	voiceLinkRoomOnMessage?: MutableRefObject<ILinkVoiceRoomOnMessage[]>;
	anonymousMode?: boolean;
	ephemeralTargetUserId?: string;
	currentTopicId?: string;
}
const isPayloadEmpty = (payload: IMessageSendPayload): boolean => {
	return (
		(!payload.t || payload?.t?.trim() === '') && // Check if text is empty
		(!payload?.hg || payload?.hg?.length === 0) && // Check if hashtags array is empty
		(!payload?.ej || payload?.ej?.length === 0) && // Check if emojis array is empty
		(!payload?.mk || payload?.mk?.length === 0) && // Check if markdown array is empty
		!payload?.cid &&
		!payload?.tp
	);
};

export const ChatMessageSending = memo(
	({
		isAvailableSending,
		valueInputRef,
		channelId,
		mode,
		messageActionNeedToResolve,
		messageAction,
		clearInputAfterSendMessage,
		mentionsOnMessage,
		hashtagsOnMessage,
		emojisOnMessage,
		linksOnMessage,
		boldsOnMessage,
		markdownsOnMessage,
		voiceLinkRoomOnMessage,
		anonymousMode = false,
		ephemeralTargetUserId,
		currentTopicId = ''
	}: IChatMessageSendingProps) => {
		const { themeValue } = useTheme();
		const dispatch = useAppDispatch();
		const styles = style(themeValue);
		const store = getStore();
		const attachmentFilteredByChannelId = useAppSelector((state) => selectAttachmentByChannelId(state, currentTopicId || channelId));
		const currentChannel = useAppSelector((state) => selectChannelById(state, channelId || ''));
		const currentDmGroup = useSelector(selectDmGroupCurrent(channelId));
		const { membersOfChild, membersOfParent, addMemberToThread, joinningToThread } = useChannelMembers({
			channelId,
			mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0
		});
		const userId = useMemo(() => {
			return load(STORAGE_MY_USER_ID);
		}, []);
		const isCreateTopic = useSelector(selectIsShowCreateTopic);
		const channelOrDirect =
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup;
		const isPublic = !channelOrDirect?.channel_private;
		const { editSendMessage, sendMessage } = useChatSending({
			mode,
			channelOrDirect,
			fromTopic: isCreateTopic || !!currentTopicId
		});

		const attachmentDataRef = useMemo(() => {
			return attachmentFilteredByChannelId?.files || [];
		}, [attachmentFilteredByChannelId]);

		const roleList = useMemo(() => {
			const rolesInClan = selectAllRolesClan(store.getState() as any);
			return rolesInClan?.map((item) => ({
				roleId: item.id ?? '',
				roleName: item?.title ?? ''
			}));
		}, []);

		const removeTags = (text: string) => {
			if (!text) return '';
			return text
				?.replace?.(/@\[(.*?)\]/g, '@$1')
				?.replace?.(/<#(.*?)>/g, '#$1')
				?.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
		};

		const onEditMessage = useCallback(
			async (editMessage: IMessageSendPayload, messageId: string, mentions: ApiMessageMention[]) => {
				if (editMessage?.t === messageActionNeedToResolve?.targetMessage?.content?.t) return;
				const { attachments } = messageActionNeedToResolve.targetMessage;
				await editSendMessage(editMessage, messageId, mentions, attachments, false, currentTopicId, !!currentTopicId);
			},
			[currentTopicId, editSendMessage, messageActionNeedToResolve]
		);

		const doesIdRoleExist = (id: string, roles: IRoleMention[]): boolean => {
			return roles?.some((role) => role?.roleId === id);
		};

		const getUsersNotExistingInThread = (mentions) => {
			const rolesInClan = selectAllRolesClan(store.getState() as any);
			const userIds = uniqueUsers(mentions, membersOfChild, rolesInClan, [messageActionNeedToResolve?.targetMessage?.sender_id || '']);
			const usersNotExistingInThread = userIds?.filter((userId) => membersOfParent?.some((member) => member?.id === userId)) as string[];

			return usersNotExistingInThread || [];
		};

		const handleSendMessage = async () => {
			const simplifiedMentionList = !mentionsOnMessage?.current
				? []
				: mentionsOnMessage?.current?.map?.((mention) => {
						const isRole = doesIdRoleExist(mention?.user_id ?? '', roleList ?? []);
						if (isRole) {
							const role = roleList?.find((role) => role.roleId === mention.user_id);
							return {
								role_id: role?.roleId,
								s: mention.s,
								e: mention.e
							};
						} else {
							return {
								user_id: mention.user_id,
								s: mention.s,
								e: mention.e
							};
						}
					});
			const usersNotExistingInThread = getUsersNotExistingInThread(simplifiedMentionList);
			if (checkIsThread(currentChannel as ChannelsEntity) && usersNotExistingInThread.length > 0) {
				await addMemberToThread(currentChannel, usersNotExistingInThread);
			}

			if (currentChannel?.parent_id !== '0' && currentChannel?.active === ThreadStatus.activePublic) {
				await dispatch(
					threadsActions.updateActiveCodeThread({ channelId: currentChannel.channel_id ?? '', activeCode: ThreadStatus.joined })
				);
				joinningToThread(currentChannel, [userId ?? '']);
			}
			const payloadSendMessage: IMessageSendPayload = {
				t: removeTags(valueInputRef?.current),
				hg: hashtagsOnMessage?.current || [],
				ej: emojisOnMessage?.current || [],
				mk: [
					...(linksOnMessage?.current || []),
					...(voiceLinkRoomOnMessage?.current || []),
					...(markdownsOnMessage?.current || []),
					...(boldsOnMessage?.current || [])
				],
				cid: messageActionNeedToResolve?.targetMessage?.content?.cid,
				tp: messageActionNeedToResolve?.targetMessage?.content?.tp
			};
			const isEmpty = isPayloadEmpty(payloadSendMessage);
			if (isEmpty && !attachmentDataRef?.length) {
				console.error('Message is empty, not sending');
				return;
			}
			if (ephemeralTargetUserId) {
				const userProfile = selectAllAccount(store.getState());
				const profileInTheClan = selectMemberClanByUserId(store.getState(), userProfile?.user?.id ?? '');
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
				const payloadEphemeral = {
					receiverId: ephemeralTargetUserId,
					channelId: currentTopicId || channelId,
					clanId: currentChannel?.clan_id || '',
					mode,
					isPublic,
					content: payloadSendMessage,
					mentions: simplifiedMentionList,
					attachments: attachmentDataRef,
					references: messageActionNeedToResolve?.targetMessage?.references || [],
					senderId: userId,
					avatar: priorityAvatar,
					username: priorityNameToShow
				};

				await dispatch(sendEphemeralMessage(payloadEphemeral));
				clearInputAfterSendMessage();
				return;
			}
			const { targetMessage, type } = messageActionNeedToResolve || {};
			const reference = targetMessage
				? ([
						{
							message_id: '',
							message_ref_id: targetMessage.id,
							ref_type: 0,
							message_sender_id: targetMessage?.sender_id,
							message_sender_username: targetMessage?.username,
							mesages_sender_avatar: targetMessage.clan_avatar ? targetMessage.clan_avatar : targetMessage.avatar,
							message_sender_clan_nick: targetMessage?.clan_nick,
							message_sender_display_name: targetMessage?.display_name,
							content: JSON.stringify(targetMessage.content),
							has_attachment: Boolean(targetMessage?.attachments?.length),
							channel_id: targetMessage.channel_id ?? '',
							mode: targetMessage.mode ?? 0,
							channel_label: targetMessage.channel_label
						}
					] as Array<ApiMessageRef>)
				: undefined;
			dispatch(emojiSuggestionActions.setSuggestionEmojiPicked(''));
			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentTopicId || channelId,
					files: []
				})
			);
			clearInputAfterSendMessage();

			const sendMessageAsync = async () => {
				if ([EMessageActionType.CreateThread].includes(messageAction)) {
					const payloadThreadSendMessage: IPayloadThreadSendMessage = {
						content: payloadSendMessage,
						mentions: simplifiedMentionList,
						attachments: attachmentDataRef || [],
						references: []
					};
					DeviceEventEmitter.emit(ActionEmitEvent.SEND_MESSAGE, payloadThreadSendMessage);
				} else {
					if (type === EMessageActionType.EditMessage) {
						await onEditMessage(
							filterEmptyArrays(payloadSendMessage),
							messageActionNeedToResolve?.targetMessage?.id,
							simplifiedMentionList || []
						);
					} else {
						const isMentionEveryOne = mentionsOnMessage?.current?.some?.((mention) => mention.user_id === ID_MENTION_HERE);
						await sendMessage(
							filterEmptyArrays(payloadSendMessage),
							simplifiedMentionList || [],
							attachmentDataRef || [],
							reference,
							anonymousMode && !currentDmGroup && !currentTopicId,
							isMentionEveryOne,
							true
						);
					}
					DeviceEventEmitter.emit(ActionEmitEvent.SCROLL_TO_BOTTOM_CHAT);
				}
			};
			requestAnimationFrame(async () => {
				sendMessageAsync().catch((error) => {});
			});
		};

		return (
			<View style={localStyles.sendingContainer}>
				{isAvailableSending || !!attachmentDataRef?.length ? (
					<Pressable
						android_ripple={{
							color: themeValue.secondaryLight
						}}
						onPress={handleSendMessage}
						style={[styles.btnIcon, styles.iconSend]}
					>
						<MezonIconCDN icon={IconCDN.sendMessageIcon} width={size.s_18} height={size.s_18} color={baseColor.white} />
					</Pressable>
				) : (
					<RecordMessageSending channelId={channelId} mode={mode} currentTopicId={currentTopicId} />
				)}
			</View>
		);
	}
);
