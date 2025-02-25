import { MentionReactInput, ReplyMessageBox, UserMentionList } from '@mezon/components';
import { useAuth, useTopics } from '@mezon/core';
import {
	fetchMessages,
	messagesActions,
	selectAllChannelMemberIds,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDataReferences,
	selectFirstMessageOfCurrentTopic,
	selectSession,
	topicsActions,
	useAppDispatch,
	useAppSelector
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
	const allUserIdsInChannel = useAppSelector((state) => selectAllChannelMemberIds(state, currentChannelId, false));
	const { currentTopicInitMessage } = useTopics();
	const sessionUser = useSelector(selectSession);
	const { clientRef, sessionRef, socketRef } = useMezon();
	const currentTopicId = useSelector(selectCurrentTopicId);
	const [isFetchMessageDone, setIsFetchMessageDone] = useState(false);
	const { userProfile } = useAuth();
	const dataReferences = useSelector(selectDataReferences(currentTopicId ?? ''));

	useEffect(() => {
		const fetchCurrentTopicMessages = async () => {
			await dispatch(fetchMessages({ channelId: currentChannelId as string, clanId: currentClanId as string, topicId: currentTopicId || '' }));
			setIsFetchMessageDone(true);
		};
		if (currentTopicId !== '') {
			fetchCurrentTopicMessages();
		}
	}, [currentClanId, currentTopicId]);

	const createTopic = useCallback(async () => {
		const body: ApiSdTopicRequest = {
			clan_id: currentClanId?.toString(),
			channel_id: currentChannelId as string,
			message_id: currentTopicInitMessage?.id
		};

		const topic = (await dispatch(topicsActions.createTopic(body))).payload as ApiSdTopic;
		dispatch(topicsActions.setCurrentTopicId(topic.id || ''));
		return topic;
	}, [currentChannelId, currentClanId, dispatch, currentTopicInitMessage?.id]);

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
				mode,
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
							messageId: currentTopicInitMessage?.id as string,
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
				<div className={isElectron() ? 'h-[calc(100%_-_60px_-_30px)]' : 'h-full'}>
					<MemoizedChannelMessages
						isPrivate={currentChannel?.channel_private}
						channelId={currentTopicId as string}
						clanId={currentClanId as string}
						type={ChannelType.CHANNEL_TYPE_CHANNEL}
						mode={mode}
						isTopicBox
						userIdsFromTopicBox={allUserIdsInChannel}
						topicId={currentTopicId}
					/>
				</div>
			)}
			{dataReferences.message_ref_id && (
				<div className="relative z-1 pb-[4px] w-[450px] ml-3">
					<ReplyMessageBox channelId={currentTopicId ?? ''} dataReferences={dataReferences} className="pb-[15px]" />
				</div>
			)}
			<div className="flex flex-col flex-1">
				<div className="flex-shrink-0 flex flex-col pb-[26px] px-4 dark:bg-bgPrimary bg-bgLightPrimary h-auto relative">
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
