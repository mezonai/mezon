/* eslint-disable @typescript-eslint/no-explicit-any */
import { useChannelMembers, useChatSending } from '@mezon/core';
import { ActionEmitEvent, ID_MENTION_HERE, IRoleMention, Icons, STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	emojiSuggestionActions,
	messagesActions,
	referencesActions,
	selectAllRolesClan,
	selectAttachmentByChannelId,
	selectChannelById,
	selectCurrentTopicId,
	selectCurrentTopicInitMessage,
	selectDmGroupCurrent,
	selectIsShowCreateTopic,
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
	sleep,
	uniqueUsers
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef, ApiSdTopic, ApiSdTopicRequest } from 'mezon-js/api.gen';
import { MutableRefObject, memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { EMessageActionType } from '../../../enums';
import { IMessageActionNeedToResolve, IPayloadThreadSendMessage } from '../../../types';
import { style } from '../ChatBoxBottomBar/style';

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
}

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
		voiceLinkRoomOnMessage
	}: IChatMessageSendingProps) => {
		const { themeValue } = useTheme();
		const dispatch = useAppDispatch();
		const styles = style(themeValue);
		const attachmentFilteredByChannelId = useSelector(selectAttachmentByChannelId(channelId ?? ''));
		const rolesInClan = useSelector(selectAllRolesClan);
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
		const currentTopicId = useSelector(selectCurrentTopicId);
		const valueTopic = useSelector(selectCurrentTopicInitMessage);
		const isCreateTopic = useSelector(selectIsShowCreateTopic);
		const { editSendMessage, sendMessage } = useChatSending({
			mode,
			channelOrDirect:
				mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup
		});

		const attachmentDataRef = useMemo(() => {
			return attachmentFilteredByChannelId?.files || [];
		}, [attachmentFilteredByChannelId]);

		const roleList = useMemo(() => {
			return rolesInClan?.map((item) => ({
				roleId: item.id ?? '',
				roleName: item?.title ?? ''
			}));
		}, [rolesInClan]);

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

			if (currentChannel?.parrent_id !== '0' && currentChannel?.active === ThreadStatus.activePublic) {
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

			const payloadThreadSendMessage: IPayloadThreadSendMessage = {
				content: payloadSendMessage,
				mentions: simplifiedMentionList,
				attachments: [],
				references: []
			};
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
					channelId,
					files: []
				})
			);
			clearInputAfterSendMessage();

			const sendMessageAsync = async () => {
				if ([EMessageActionType.CreateThread].includes(messageAction)) {
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
								false,
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
				const channelOrDirect =
					mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup;
				const isPublic = !channelOrDirect?.channel_private;

				if (!client || !session || !socket || !channelOrDirect?.channel_id) {
					throw new Error('Client is not initialized');
				}

				await socket.writeChatMessage(
					channelOrDirect?.clan_id || '',
					channelOrDirect?.channel_id as string,
					mode,
					isPublic,
					content,
					mentions,
					attachments,
					references,
					false,
					false,
					'',
					0,
					topicId?.toString()
				);
			},
			[sessionRef, clientRef, socketRef, mode, currentChannel, currentDmGroup]
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
			DeviceEventEmitter.emit(ActionEmitEvent.ON_START_RECORD_MESSAGE);
		};

		const stopRecording = async () => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_STOP_RECORD_MESSAGE);
		};

		return (
			<View
				style={{
					alignItems: 'center',
					justifyContent: 'center'
				}}
			>
				{isAvailableSending || !!attachmentDataRef?.length ? (
					<TouchableOpacity activeOpacity={0.8} onPress={handleSendMessage} style={[styles.btnIcon, styles.iconSend]}>
						<Icons.SendMessageIcon width={size.s_18} height={size.s_18} color={baseColor.white} />
					</TouchableOpacity>
				) : (
					<TouchableOpacity onLongPress={startRecording} onPressOut={stopRecording} style={[styles.btnIcon, styles.iconVoice]}>
						<Icons.MicrophoneIcon width={size.s_18} height={size.s_18} color={themeValue.textStrong} />
					</TouchableOpacity>
				)}
			</View>
		);
	}
);
