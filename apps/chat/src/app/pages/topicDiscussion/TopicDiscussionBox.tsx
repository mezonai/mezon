import { AttachmentPreviewThumbnail, MentionReactInput, ReplyMessageBox, UserMentionList } from '@mezon/components';
import { useAuth, useDragAndDrop, useReference, useTopics } from '@mezon/core';
import {
	fetchMessages,
	referencesActions,
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
import {
	CREATING_TOPIC,
	IMessageSendPayload,
	MAX_FILE_ATTACHMENTS,
	UploadLimitReason,
	getWebUploadedAttachments,
	processFile,
	sleep
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import { ApiSdTopic, ApiSdTopicRequest } from 'mezon-js/dist/api.gen';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
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
	const currentInputChannelId = currentTopicId || CREATING_TOPIC;
	const { removeAttachmentByIndex, checkAttachment, attachmentFilteredByChannelId } = useReference(currentInputChannelId);
	const { setOverUploadingState } = useDragAndDrop();

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

			let uploadedFiles: ApiMessageAttachment[] = [];

			if (attachments && attachments.length > 0) {
				uploadedFiles = await getWebUploadedAttachments({
					attachments,
					channelId: topicId || '',
					clanId: currentClanId || '',
					client,
					session
				});
			}

			await socket.writeChatMessage(
				currentClanId,
				currentChannel?.channel_id as string,
				mode,
				currentChannel?.channel_private !== 1,
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

	const onPastedFiles = useCallback(
		async (event: React.ClipboardEvent<HTMLDivElement>) => {
			const items = Array.from(event.clipboardData?.items || []);
			const files = items
				.filter((item) => item.type.startsWith('image'))
				.map((item) => item.getAsFile())
				.filter((file): file is File => Boolean(file));

			if (!files.length) return;

			const totalFiles = files.length + (attachmentFilteredByChannelId?.files?.length || 0);
			if (totalFiles > MAX_FILE_ATTACHMENTS) {
				setOverUploadingState(true, UploadLimitReason.COUNT);
				return;
			}

			const updatedFiles = await Promise.all(files.map(processFile<ApiMessageAttachment>));

			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentInputChannelId,
					files: updatedFiles
				})
			);
		},
		[currentChannelId, currentClanId, attachmentFilteredByChannelId?.files?.length]
	);

	return (
		<>
			{(isFetchMessageDone || firstMessageOfThisTopic) && (
				<div className={`relative ${isElectron() ? 'h-[calc(100%_-_50px_-_30px)]' : 'h-full'}`}>
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
			{checkAttachment && (
				<div
					className={`${
						checkAttachment ? 'px-3 mx-4 pb-1 pt-5 rounded-t-lg border-b-[1px] dark:border-[#42444B] border-borderLightTabs' : ''
					} dark:bg-channelTextarea bg-channelTextareaLight max-h-full`}
				>
					<div className={`max-h-full flex gap-6 overflow-y-hidden overflow-x-auto attachment-scroll `}>
						{attachmentFilteredByChannelId?.files?.map((item: ApiMessageAttachment, index: number) => {
							return (
								<Fragment key={index}>
									<AttachmentPreviewThumbnail
										attachment={item}
										channelId={currentInputChannelId}
										onRemove={removeAttachmentByIndex}
										indexOfItem={index}
									/>
								</Fragment>
							);
						})}
					</div>
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
						handlePaste={onPastedFiles}
						onSend={handleSend}
						onTyping={handleTypingDebounced}
						listMentions={UserMentionList({
							channelID: currentChannel?.channel_id as string,
							channelMode: ChannelStreamMode.STREAM_MODE_CHANNEL
						})}
						isTopic
						currentChannelId={currentInputChannelId}
					/>
				</div>
			</div>
		</>
	);
};

export default TopicDiscussionBox;
