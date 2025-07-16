/* eslint-disable @typescript-eslint/no-explicit-any */
import { useChannelMembers, useChatSending } from '@mezon/core';
import { ActionEmitEvent, ID_MENTION_HERE, IRoleMention, STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	emojiSuggestionActions,
	getStore,
	messagesActions,
	referencesActions,
	selectAllAccount,
	selectAllRolesClan,
	selectAttachmentByChannelId,
	selectChannelById,
	selectCurrentTopicInitMessage,
	selectDmGroupCurrent,
	selectIsShowCreateTopic,
	selectMemberClanByUserId2,
	sendEphemeralMessage,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import {
	IEmojiOnMessage,
	IHashtagOnMessage,
	ILinkOnMessage,
	ILinkVoiceRoomOnMessage,
	IMarkdownOnMessage,
	IMentionOnMessage,
	IMessageSendPayload,
	ThreadStatus,
	checkIsThread,
	filterEmptyArrays,
	getMobileUploadedAttachments,
	sleep,
	uniqueUsers
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiSdTopic, ApiSdTopicRequest } from 'mezon-js/api.gen';
import React, { MutableRefObject, memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, Keyboard, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { EMessageActionType } from '../../../enums';
import { IMessageActionNeedToResolve, IPayloadThreadSendMessage } from '../../../types';
import { style } from '../ChatBoxBottomBar/style';
import { BaseRecordAudioMessage } from '../RecordAudioMessage';

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
			channelId: channelId,
			mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0
		});
		const { clientRef, sessionRef, socketRef } = useMezon();
		const userId = useMemo(() => {
			return load(STORAGE_MY_USER_ID);
		}, []);
		const valueTopic = useSelector(selectCurrentTopicInitMessage);
		const isCreateTopic = useSelector(selectIsShowCreateTopic);
		const channelOrDirect =
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup;
		const isPublic = !channelOrDirect?.channel_private;
		const { editSendMessage, sendMessage } = useChatSending({
			mode,
			channelOrDirect: channelOrDirect
		});

		const attachmentDataRef = useMemo(() => {
			return attachmentFilteredByChannelId?.files || [];
		}, [attachmentFilteredByChannelId]);

		const roleList = useMemo(() => {
			const rolesInClan = selectAllRolesClan(store.getState());
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
				?.replace?.(/\*\*(.*?)\*\*/g, '$1');
		};

		const onEditMessage = useCallback(
			async (editMessage: IMessageSendPayload, messageId: string, mentions: ApiMessageMention[]) => {
				if (editMessage?.t === messageActionNeedToResolve?.targetMessage?.content?.t) return;
				const { attachments } = messageActionNeedToResolve.targetMessage;
				await editSendMessage(editMessage, messageId, mentions, attachments, false);
			},
			[editSendMessage, messageActionNeedToResolve]
		);

		const doesIdRoleExist = (id: string, roles: IRoleMention[]): boolean => {
			return roles?.some((role) => role?.roleId === id);
		};

		const getUsersNotExistingInThread = (mentions) => {
			const rolesInClan = selectAllRolesClan(store.getState());
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
				const profileInTheClan = selectMemberClanByUserId2(store.getState(), userProfile?.user?.id ?? '');
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
					mode: mode,
					isPublic: isPublic,
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
			const isCanSendReference = currentDmGroup
				? currentDmGroup?.user_id?.includes?.(targetMessage?.sender_id) || targetMessage?.sender_id === userId
				: true;
			const reference =
				targetMessage && isCanSendReference
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
						if (isCreateTopic) {
							await handleSendAndCreateTopic(
								filterEmptyArrays(payloadSendMessage),
								simplifiedMentionList || [],
								attachmentDataRef || [],
								reference
							);
						} else {
							await sendMessage(
								filterEmptyArrays(payloadSendMessage),
								simplifiedMentionList || [],
								attachmentDataRef || [],
								reference,
								anonymousMode && !currentDmGroup,
								isMentionEveryOne,
								true
							);
						}
					}
					DeviceEventEmitter.emit(ActionEmitEvent.SCROLL_TO_BOTTOM_CHAT);
				}
			};
			requestAnimationFrame(async () => {
				sendMessageAsync().catch((error) => {});
			});
			// comment todo check performance
			// InteractionManager.runAfterInteractions(() => {
			// 	setTimeout(() => {
			// 		sendMessageAsync().catch((error) => {
			// 			console.log('Error sending message:', error);
			// 		});
			// 	}, 0);
			// });
		};
		const sendMessageTopic = useCallback(
			async (
				content: IMessageSendPayload,
				mentions?: Array<ApiMessageMention>,
				attachments?: Array<ApiMessageAttachment>,
				references?: Array<ApiMessageRef>,
				topicId?: string
			) => {
				const session = sessionRef?.current;
				const client = clientRef?.current;
				const socket = socketRef?.current;

				if (!client || !session || !socket || !channelOrDirect?.channel_id) {
					throw new Error('Client is not initialized');
				}

				const uploadedFiles = await getMobileUploadedAttachments({
					attachments,
					channelId,
					clanId: channelOrDirect?.clan_id || '',
					client,
					session
				});

				await socket.writeChatMessage(
					channelOrDirect?.clan_id || '',
					channelOrDirect?.channel_id as string,
					mode,
					isPublic,
					content,
					mentions,
					uploadedFiles,
					references,
					false,
					false,
					'',
					0,
					topicId?.toString()
				);
			},
			[sessionRef, clientRef, socketRef, channelOrDirect?.channel_id, channelOrDirect?.clan_id, mode, isPublic]
		);

		const handleSendAndCreateTopic = useCallback(
			async (
				content: IMessageSendPayload,
				mentions?: Array<ApiMessageMention>,
				attachments?: Array<ApiMessageAttachment>,
				references?: Array<ApiMessageRef>
			) => {
				if (currentTopicId !== '') {
					await sendMessageTopic(content, mentions, attachments, references, currentTopicId || '');
				} else {
					const body: ApiSdTopicRequest = {
						clan_id: currentChannel?.clan_id,
						channel_id: currentChannel?.channel_id as string,
						message_id: valueTopic?.id
					};

					const topic = (await dispatch(topicsActions.createTopic(body))).payload as ApiSdTopic;
					dispatch(topicsActions.setCurrentTopicId(topic?.id || ''));

					if (topic) {
						await dispatch(
							messagesActions.updateToBeTopicMessage({
								channelId: currentChannel?.channel_id as string,
								messageId: valueTopic?.id as string,
								topicId: topic.id as string,
								creatorId: userId as string
							})
						);

						await sleep(10);
						await sendMessageTopic(content, mentions, attachments, references, topic.id || '');
						await dispatch(
							messagesActions.fetchMessages({
								channelId: currentChannel?.channel_id,
								clanId: currentChannel?.clan_id,
								topicId: topic.id || '',
								noCache: true
							})
						);
					}
				}
			},
			[currentChannel?.channel_id, currentChannel?.clan_id, currentTopicId, dispatch, sendMessageTopic, valueTopic?.id, userId]
		);

		const startRecording = async () => {
			const data = {
				snapPoints: ['50%'],
				children: <BaseRecordAudioMessage channelId={channelId} mode={mode} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			Keyboard.dismiss();
		};

		return (
			<View
				style={{
					alignItems: 'center',
					justifyContent: 'center'
				}}
			>
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
					<Pressable onLongPress={startRecording} style={[styles.btnIcon, styles.iconVoice]}>
						<MezonIconCDN icon={IconCDN.microphoneIcon} width={size.s_18} height={size.s_18} color={themeValue.textStrong} />
					</Pressable>
				)}
			</View>
		);
	}
);
