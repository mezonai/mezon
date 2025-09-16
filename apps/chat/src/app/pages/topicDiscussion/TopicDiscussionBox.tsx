import { AttachmentPreviewThumbnail, FileSelectionButton, MentionReactInput, ReplyMessageBox, UserMentionList } from '@mezon/components';
import { useChatSending, useDragAndDrop, usePermissionChecker, useReference } from '@mezon/core';
import {
	fetchMessages,
	referencesActions,
	selectAllChannelMemberIds,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDataReferences,
	selectFirstMessageOfCurrentTopic,
	selectSession,
	selectStatusMenu,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	CREATING_TOPIC,
	EOverriddenPermission,
	IMAGE_MAX_FILE_SIZE,
	IMessageSendPayload,
	MAX_FILE_ATTACHMENTS,
	MAX_FILE_SIZE,
	UploadLimitReason,
	generateE2eId,
	processFile
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import type { DragEvent } from 'react';
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
	const [topicDraggingState, setTopicDraggingState] = useState(false);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const [canSendMessage] = usePermissionChecker([EOverriddenPermission.sendMessage], currentTopicId ?? '');
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;
	const handleChildContextMenu = (event: React.MouseEvent) => {
		event.stopPropagation();
	};

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

	const handleSend = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			if (!sessionUser) return;

			const safeAttachments = attachments ?? [];
			const isFileOnly = !content?.t && safeAttachments.length > 0;
			if (!content?.t && safeAttachments.length === 0) return;

			await sendMessage(content, mentions, safeAttachments, references, false, false, false, 0);

			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentInputChannelId,
					files: []
				})
			);

			setIsFetchMessageDone(true);
		},
		[sendMessage, sessionUser, dispatch, currentInputChannelId]
	);

	const handleTyping = useCallback(() => {}, []);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	const firstMessageOfThisTopic = useSelector(selectFirstMessageOfCurrentTopic);
	const onConvertToFiles = useCallback(
		async (content: string, anonymousMessage?: boolean) => {
			const fileContent = new Blob([content], { type: 'text/plain' });
			const now = Date.now();
			const filename = now + '.txt';
			const file = new File([fileContent], filename, { type: 'text/plain' });

			if (attachmentFilteredByChannelId?.files?.length + 1 > MAX_FILE_ATTACHMENTS) {
				setOverUploadingState(true, UploadLimitReason.COUNT);
				return;
			}

			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: currentInputChannelId,
					files: [
						{
							filename: file.name,
							filetype: file.type,
							size: file.size,
							url: URL.createObjectURL(file)
						}
					]
				})
			);
		},
		[attachmentFilteredByChannelId?.files?.length, currentInputChannelId, dispatch, setOverUploadingState]
	);

	const onPastedFiles = useCallback(
		async (event: React.ClipboardEvent<HTMLDivElement>) => {
			const items = (event.clipboardData || (window as unknown as { clipboardData?: DataTransfer }).clipboardData)?.items;
			const files: File[] = [];
			if (items) {
				for (let i = 0; i < items.length; i++) {
					if (items[i].type.indexOf('image') !== -1) {
						const file = items[i].getAsFile();
						if (file) {
							files.push(file);
						}
					}
				}

				if (files.length > 0) {
					if (files.length + (attachmentFilteredByChannelId?.files?.length || 0) > MAX_FILE_ATTACHMENTS) {
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
				}
			}
		},
		[attachmentFilteredByChannelId?.files?.length, currentInputChannelId, dispatch, setOverUploadingState]
	);

	const handleDragEnter = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer?.types.includes('Files')) {
			setTopicDraggingState(true);
		}
	};

	const handleDragOver = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragLeave = (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
			setTopicDraggingState(false);
		}
	};

	const handleDrop = async (e: DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setTopicDraggingState(false);

		const files = e.dataTransfer.files;
		const filesArray = Array.from(files);

		if (filesArray.length + (attachmentFilteredByChannelId?.files?.length || 0) > MAX_FILE_ATTACHMENTS) {
			setOverUploadingState(true, UploadLimitReason.COUNT);
			return;
		}

		const getLimit = (file: File) => (file.type?.startsWith('image/') ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE);
		const oversizedFile = filesArray.find((file) => file.size > getLimit(file));
		if (oversizedFile) {
			const limit = getLimit(oversizedFile);
			setOverUploadingState(true, UploadLimitReason.SIZE, limit);
			return;
		}

		const updatedFiles = await Promise.all(filesArray.map(processFile<ApiMessageAttachment>));
		dispatch(
			referencesActions.setAtachmentAfterUpload({
				channelId: currentInputChannelId,
				files: updatedFiles
			})
		);
	};

	useEffect(() => {
		if (currentTopicId) {
			dispatch(
				fetchMessages({
					channelId: currentChannelId as string,
					clanId: currentClanId as string,
					topicId: currentTopicId || ''
				})
			);
			setIsFetchMessageDone(true);
		}
	}, [currentTopicId, currentChannelId, currentClanId, dispatch]);

	return (
		<div
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className="relative flex flex-col h-full"
			data-e2e={generateE2eId('discussion.box.topic')}
		>
			{topicDraggingState && (
				<div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 rounded-lg z-50 flex items-center justify-center">
					<div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
						<p className="text-lg font-semibold">Drop files here to upload to topic</p>
					</div>
				</div>
			)}
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

			<div className="flex flex-col flex-1">
				<div className={`flex-shrink-0  flex flex-col pb-4 px-4 bg-theme-chat h-auto relative ${isElectron() ? 'pb-9' : ' pb-4'}`}>
					{dataReferences.message_ref_id && (
						<div className="w-full ">
							<ReplyMessageBox channelId={currentTopicId ?? ''} dataReferences={dataReferences} />
						</div>
					)}
					{checkAttachment && (
						<div className={`${checkAttachment ? 'px-3  pb-1 pt-5  border-b-[1px] border-color-primary' : ''} bg-item-theme max-h-full`}>
							<div className={`max-h-full flex gap-6 !overflow-y-hidden !overflow-x-auto thread-scroll `}>
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
					<div
						className={`flex flex-inline items-start gap-2 box-content max-sm:mb-0
						bg-theme-surface rounded-lg relative shadow-md border-theme-primary ${checkAttachment || (dataReferences && dataReferences.message_ref_id) ? 'rounded-t-none' : 'rounded-t-lg'}
						${closeMenu && !statusMenu ? 'max-w-wrappBoxChatViewMobile' : 'w-wrappBoxChatView'}`}
					>
						<FileSelectionButton
							currentClanId={currentClanId || ''}
							currentChannelId={currentInputChannelId}
							hasPermissionEdit={canSendMessage}
						/>

						<div className={`w-[calc(100%_-_58px)] bg-theme-surface gap-3 flex items-center rounded-e-md`}>
							<div
								className={`w-full border-none rounded-r-lg gap-3 relative whitespace-pre-wrap`}
								onContextMenu={handleChildContextMenu}
							>
								<MentionReactInput
									handlePaste={onPastedFiles}
									onSend={handleSend}
									onTyping={handleTypingDebounced}
									listMentions={UserMentionList({
										channelID: currentChannel?.channel_id as string,
										channelMode: ChannelStreamMode.STREAM_MODE_CHANNEL
									})}
									isTopic
									handleConvertToFile={onConvertToFiles}
									currentChannelId={currentInputChannelId}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TopicDiscussionBox;
