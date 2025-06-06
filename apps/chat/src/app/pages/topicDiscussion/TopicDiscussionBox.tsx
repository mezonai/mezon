import { AttachmentPreviewThumbnail, MentionReactInput, ReplyMessageBox, UserMentionList } from '@mezon/components';
import { useChatSending, useDragAndDrop, useReference } from '@mezon/core';
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
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { CREATING_TOPIC, IMessageSendPayload, MAX_FILE_ATTACHMENTS, UploadLimitReason, processFile } from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
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
	const sessionUser = useSelector(selectSession);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const [isFetchMessageDone, setIsFetchMessageDone] = useState(false);
	const dataReferences = useAppSelector((state) => selectDataReferences(state, currentTopicId ?? ''));
	const currentInputChannelId = currentTopicId || CREATING_TOPIC;
	const { removeAttachmentByIndex, checkAttachment, attachmentFilteredByChannelId } = useReference(currentInputChannelId);
	const { setOverUploadingState } = useDragAndDrop();

	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect: currentChannel
			? {
					channel_id: currentChannel.channel_id,
					clan_id: currentChannel.clan_id,
					channel_private: currentChannel.channel_private
				}
			: undefined,
		fromTopic: true
	});

	useEffect(() => {
		const fetchCurrentTopicMessages = async () => {
			await dispatch(fetchMessages({ channelId: currentChannelId as string, clanId: currentClanId as string, topicId: currentTopicId || '' }));
			setIsFetchMessageDone(true);
		};
		if (currentTopicId !== '') {
			fetchCurrentTopicMessages();
		}
	}, [currentClanId, currentChannelId, currentTopicId, dispatch]);

	const handleSend = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			if (!sessionUser) return;
			await sendMessage(content, mentions, attachments, references, false, false, false, 0);
		},
		[sendMessage, sessionUser]
	);

	const handleTyping = useCallback(() => {
		// sendMessageTyping();
	}, []);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

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
		[currentInputChannelId, attachmentFilteredByChannelId?.files?.length, dispatch, setOverUploadingState]
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
