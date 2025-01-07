import { MentionReactInput, MessageContextMenuProvider, UserMentionList } from '@mezon/components';
import { useAuth, useTopics } from '@mezon/core';
import {
	RootState,
	fetchMessages,
	messagesActions,
	selectAllRoleIds,
	selectAllUserIdChannels,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectFirstMessageOfCurrentTopic,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { IMessageSendPayload, sleep } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { ApiSdTopic, ApiSdTopicRequest } from 'mezon-js/dist/api.gen';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import MemoizedChannelMessages from '../channel/ChannelMessages';

const TopicDiscussionBox = () => {
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const allUserIdsInChannel = useSelector(selectAllUserIdChannels);
	const allRolesIdsInClan = useSelector(selectAllRoleIds);
	const { valueTopic } = useTopics();
	const sessionUser = useSelector((state: RootState) => state.auth.session);
	const { clientRef, sessionRef, socketRef } = useMezon();
	const currentTopicId = useSelector(selectCurrentTopicId);
	const [isFetchMessageDone, setIsFetchMessageDone] = useState(false);
	const { userProfile } = useAuth();
	useEffect(() => {
		const fetchMsgResult = async () => {
			await dispatch(fetchMessages({ channelId: currentChannelId as string, clanId: currentClanId as string, topicId: currentTopicId || '' }));
			setIsFetchMessageDone(true);
		};
		if (currentTopicId !== '') {
			fetchMsgResult();
		}
	}, [currentClanId, currentTopicId]);

	const createTopic = useCallback(async () => {
		const body: ApiSdTopicRequest = {
			clan_id: currentClanId?.toString(),
			channel_id: currentChannelId as string,
			message_id: valueTopic?.id
		};

		const topic = (await dispatch(topicsActions.createTopic(body))).payload as ApiSdTopic;
		dispatch(topicsActions.setCurrentTopicId(topic.id || ''));
		return topic;
	}, [currentChannelId, currentClanId, dispatch, valueTopic?.id]);

	const sendMessageTopic = React.useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			topicId?: string
		) => {
			const session = sessionRef.current;
			const client = clientRef.current;
			const socket = socketRef.current;

			if (!client || !session || !socket || !currentClanId) {
				throw new Error('Client is not initialized');
			}

			await socket.writeChatMessage(
				currentClanId,
				currentChannel?.channel_id as string,
				ChannelStreamMode.STREAM_MODE_CHANNEL,
				currentChannel?.channel_private !== 1,
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sessionRef, clientRef, socketRef, currentClanId, dispatch]
	);

	const handleSend = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			if (!sessionUser) return;
			if (currentTopicId !== '') {
				await sendMessageTopic(content, mentions, attachments, references, currentTopicId || '');
			} else {
				const topic = (await createTopic()) as ApiSdTopic;
				if (topic) {
					dispatch(
						messagesActions.updateToBeTopicMessage({
							channelId: currentChannelId as string,
							messageId: valueTopic?.id as string,
							topicId: topic.id as string,
							creatorId: userProfile?.user?.id as string
						})
					);
					await sleep(10);
					await sendMessageTopic(content, mentions, attachments, references, topic.id || '');
				}
			}
		},
		[createTopic, currentTopicId, currentTopicId, sendMessageTopic, sessionUser, userProfile]
	);

	const handleTyping = useCallback(() => {
		// sendMessageTyping();
	}, []);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;

	const firstMessageOfThisTopic = useSelector(selectFirstMessageOfCurrentTopic);

	return (
		<>
			{(isFetchMessageDone || firstMessageOfThisTopic) && (
				<div className={isElectron() ? 'h-[calc(100%_-_60px_-_80px)]' : 'h-full'}>
					<MessageContextMenuProvider
						channelId={currentChannelId as string}
						allUserIdsInChannel={allUserIdsInChannel as string[]}
						allRolesInClan={allRolesIdsInClan}
					>
						<MemoizedChannelMessages
							channelId={currentTopicId as string}
							clanId={currentClanId as string}
							type={ChannelType.CHANNEL_TYPE_TEXT}
							mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
							isTopicBox
							topicId={currentTopicId}
						/>
					</MessageContextMenuProvider>
				</div>
			)}
			<div className="flex flex-col flex-1">
				<div className="flex-shrink-0 flex flex-col pb-4 px-4 dark:bg-bgPrimary bg-bgLightPrimary h-auto relative">
					<MentionReactInput
						onSend={handleSend}
						onTyping={handleTypingDebounced}
						listMentions={UserMentionList({
							channelID: currentChannel?.channel_id as string,
							channelMode: ChannelStreamMode.STREAM_MODE_CHANNEL
						})}
						isTopic
					/>
				</div>
			</div>
		</>
	);
};

export default TopicDiscussionBox;
