import {
	messagesActions,
	selectAllAccount,
	selectAnonymousMode,
	selectCurrentTopicId,
	selectIsFocusOnChannelInput,
	selectIsShowCreateTopic,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import {
	IBoldTextOnMessage,
	IEmojiOnMessage,
	IHashtagOnMessage,
	ILinkOnMessage,
	ILinkVoiceRoomOnMessage,
	IMarkdownOnMessage,
	IMentionOnMessage,
	IMessageSendPayload,
	checkTokenOnMarkdown
} from '@mezon/utils';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';
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
	const isShowCreateTopic = useSelector((state) => selectIsShowCreateTopic(state, channelIdOrDirectId as string));
	const isFocusOnChannelInput = useSelector(selectIsFocusOnChannelInput);
	const userProfile = useSelector(selectAllAccount);
	const currentUserId = userProfile?.user?.id || '';
	const anonymousMode = useSelector(selectAnonymousMode);
	const { clientRef, sessionRef, socketRef } = useMezon();

	function getToken(t: string, token: (IHashtagOnMessage | IEmojiOnMessage | IMentionOnMessage)[]): string[] {
		return token?.map(({ s = 0, e = 0 }) => t?.substring(s, e));
	}
	function removeSyntax(t: string, mk: IMarkdownOnMessage[], b: IBoldTextOnMessage[]) {
		const mkContent = getToken(t, mk);
		const bContent = getToken(t, b);

		const cleanMkContent = mkContent?.map((content) => {
			if (content.startsWith('```')) {
				return content.slice(3, content.length - 3);
			} else if (content.startsWith('`')) {
				return content.slice(1, content.length - 1);
			}
			return content;
		});
		const cleanBContent = bContent?.map((content) => content.slice(2, content.length - 2));
		let result = t;
		mkContent?.forEach((content, index) => {
			result = result.replace(content, cleanMkContent[index]);
		});

		bContent?.forEach((content, index) => {
			result = result.replace(content, cleanBContent[index]);
		});
		return result;
	}

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
			const oldContentT = content.t;
			const oldHgLabel = getToken(oldContentT as string, content?.hg as IHashtagOnMessage[]);
			// console.log('oldHgLabel: ', oldHgLabel);
			const oldMentionName = getToken(oldContentT as string, mentions as IMentionOnMessage[]);
			// console.log('oldMentionName: ', oldMentionName);
			const oldEmojiName = getToken(oldContentT as string, content?.ej as IEmojiOnMessage[]);
			// console.log('oldEmojiName: ', oldEmojiName);
			const oldLink = getToken(oldContentT as string, content?.lk as ILinkOnMessage[]);
			// console.log('oldLink: ', oldLink);
			const oldVoiceRoom = getToken(oldContentT as string, content?.vk as ILinkVoiceRoomOnMessage[]);
			// console.log('oldVoiceRoom: ', oldVoiceRoom);
			const oldBoldText = getToken(oldContentT as string, content?.b as IBoldTextOnMessage[]);
			// console.log('oldBoldText: ', oldBoldText);
			const oldBacktick = getToken(oldContentT as string, content?.mk as IMarkdownOnMessage[]);
			// console.log('oldBacktick: ', oldBacktick);

			const newContentT = removeSyntax(oldContentT as string, content.mk as IMarkdownOnMessage[], content.b as IBoldTextOnMessage[]);

			// console.log('newContentT: ', newContentT);

			// eslint-disable-next-line react-hooks/rules-of-hooks
			const { validHashtagList, validMentionList, validEmojiList } = checkTokenOnMarkdown(
				content.mk ?? [],
				content.hg ?? [],
				mentions ?? [],
				content.ej ?? []
			);
			const validatedContent = {
				...content,
				hg: validHashtagList,
				ej: validEmojiList
			};
			if (!isFocusOnChannelInput && isShowCreateTopic) {
				dispatch(
					topicsActions.handleSendTopic({
						clanId: getClanId as string,
						channelId: channelIdOrDirectId as string,
						mode: mode,
						anonymous: false,
						attachments: attachments,
						code: 0,
						content: validatedContent,
						isMobile: isMobile,
						isPublic: isPublic,
						mentionEveryone: mentionEveryone,
						mentions: validMentionList,
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
					content: validatedContent,
					mentions: validMentionList,
					attachments,
					references,
					anonymous,
					mentionEveryone,
					senderId: currentUserId,
					avatar: userProfile?.user?.avatar_url,
					isMobile,
					username: userProfile?.user?.display_name,
					code: code
				})
			);
		},
		[dispatch, channelIdOrDirectId, getClanId, mode, isPublic, currentUserId]
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
			topic_id?: string
		) => {
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;
			if (!client || !session || !socket || !channelOrDirect) {
				throw new Error('Client is not initialized');
			}
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const { validHashtagList, validMentionList, validEmojiList } = checkTokenOnMarkdown(
				content.mk ?? [],
				content.hg ?? [],
				mentions ?? [],
				content.ej ?? []
			);
			const validatedContent = {
				...content,
				hg: validHashtagList,
				ej: validEmojiList
			};
			await socket.updateChatMessage(
				getClanId || '',
				channelIdOrDirectId ?? '',
				mode,
				isPublic,
				messageId,
				validatedContent,
				validMentionList,
				attachments,
				hide_editted,
				topic_id
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
