import {
	AttachmentPreviewThumbnail,
	ChannelMessageThread,
	MentionReactInput,
	PrivateThread,
	ThreadNameTextField,
	UserMentionList,
	processMention
} from '@mezon/components';
import { useChannelMembers, useDragAndDrop, useMessageValue, useReference, useThreadMessage, useThreads } from '@mezon/core';
import {
	channelsActions,
	checkDuplicateThread,
	createNewChannel,
	messagesActions,
	referencesActions,
	selectAllChannelMembers,
	selectAllRolesClan,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectOpenThreadMessageState,
	selectSession,
	selectTheme,
	selectThreadCurrentChannel,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	ChannelMembersEntity,
	HistoryItem,
	IEmojiOnMessage,
	IHashtagOnMessage,
	IMarkdownOnMessage,
	IMessageSendPayload,
	MAX_FILE_ATTACHMENTS,
	RequestInput,
	ThreadValue,
	UploadLimitReason,
	adjustPos,
	filterEmptyArrays,
	parseHtmlAsFormattedText,
	processFile,
	processMarkdownEntities
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { Fragment, KeyboardEvent, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useThrottledCallback } from 'use-debounce';
import MemoizedChannelMessages from '../channel/ChannelMessages';

const ThreadBox = () => {
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const sessionUser = useSelector(selectSession);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const { removeAttachmentByIndex, checkAttachment, attachmentFilteredByChannelId } = useReference((currentChannelId || '') + '/createThread');
	const { setOverUploadingState } = useDragAndDrop();
	const appearanceTheme = useSelector(selectTheme);
	const { messageThreadError, isPrivate, nameValueThread, valueThread } = useThreads();
	const [undoHistory, setUndoHistory] = useState<HistoryItem[]>([]);
	const [redoHistory, setRedoHistory] = useState<HistoryItem[]>([]);
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { request, setRequestInput } = useMessageValue(currentChannelId + 'true');
	const rolesClan = useSelector(selectAllRolesClan);
	const { membersOfChild } = useChannelMembers({ channelId: currentChannelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const membersOfParent = useAppSelector((state) =>
		threadCurrentChannel?.parent_id ? selectAllChannelMembers(state, threadCurrentChannel?.parent_id as string) : null
	);
	const { mentionList, hashtagList, emojiList } = useMemo(() => {
		return processMention(request?.mentionRaw, rolesClan, membersOfChild as ChannelMembersEntity[], membersOfParent as ChannelMembersEntity[]);
	}, [request?.mentionRaw, rolesClan, membersOfChild, membersOfParent]);
	const attachmentData = useMemo(() => {
		if (attachmentFilteredByChannelId === null) {
			return [];
		} else {
			return attachmentFilteredByChannelId.files;
		}
	}, [attachmentFilteredByChannelId?.files]);

	const { sendMessageThread, sendMessageTyping } = useThreadMessage({
		channelId: threadCurrentChannel?.id as string,
		mode: ChannelStreamMode.STREAM_MODE_THREAD
	});

	const mapToMemberIds = useMemo(() => {
		return membersOfParent?.map((item) => item.id);
	}, [membersOfParent]);

	const createThread = useCallback(
		async (value: ThreadValue) => {
			if (value.nameValueThread.length <= 3) {
				toast('Thread name must be longer than 3 characters');
				return;
			}
			const isDuplicate = await dispatch(checkDuplicateThread({ thread_name: value.nameValueThread, channel_id: currentChannelId as string }));
			if (isDuplicate?.payload) {
				toast('Thread name already exists');
				return;
			}

			const timestamp = Date.now() / 1000;
			const body: any = {
				clan_id: currentClanId?.toString(),
				channel_label: value.nameValueThread,
				channel_private: value.isPrivate,
				parent_id: currentChannelId as string,
				category_id: currentChannel?.category_id,
				type: ChannelType.CHANNEL_TYPE_THREAD,
				lastSeenTimestamp: timestamp,
				lastSentTimestamp: timestamp
			};

			const thread = await dispatch(createNewChannel(body));
			return thread.payload;
		},
		[currentChannel, currentChannelId, currentClanId, dispatch]
	);

	const handleSend = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue
		) => {
			if (sessionUser) {
				if (value?.nameValueThread && !threadCurrentChannel) {
					const thread = (await createThread(value)) as ApiChannelDescription;
					if (thread) {
						await dispatch(
							channelsActions.joinChat({
								clanId: currentClanId as string,
								channelId: thread.channel_id as string,
								channelType: ChannelType.CHANNEL_TYPE_THREAD,
								isPublic: false
							})
						);
						await sendMessageThread(content, mentions, attachments, references, thread);
						await dispatch(
							messagesActions.fetchMessages({
								clanId: currentClanId || '',
								channelId: thread.channel_id as string,
								isFetchingLatestMessages: true
							})
						);
						dispatch(
							referencesActions.setAtachmentAfterUpload({
								channelId: (currentChannelId ?? '') + '/createThread',
								files: []
							})
						);
						setRequestInput({ ...request, valueTextInput: '', content: '' }, true);
					}
				} else {
					await sendMessageThread(content, mentions, attachments, references, threadCurrentChannel);
				}
			} else {
				console.error('Session is not available');
			}
		},
		[createThread, currentClanId, dispatch, sendMessageThread, threadCurrentChannel, sessionUser]
	);

	const handleTyping = useCallback(() => {
		sendMessageTyping();
	}, [sendMessageTyping]);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

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
					channelId: `${currentChannelId || ''}/createThread`,
					files: updatedFiles
				})
			);
		},
		[currentChannelId, currentClanId, attachmentFilteredByChannelId?.files?.length]
	);

	const handleChangeNameThread = useCallback(
		(nameThread: string) => {
			dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue: nameThread }));
		},
		[currentChannelId]
	);

	const onKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLInputElement>): Promise<void> => {
		const { key, ctrlKey, shiftKey, metaKey } = event;
		const isComposing = event.nativeEvent.isComposing;

		if ((ctrlKey || metaKey) && (key === 'z' || key === 'Z')) {
			event.preventDefault();
			if (undoHistory.length > 0) {
				const { valueTextInput, content, mentionRaw } = undoHistory[undoHistory.length - 1];

				setRedoHistory((prevRedoHistory) => [
					{ valueTextInput: request.valueTextInput, content: request.content, mentionRaw: request.mentionRaw },
					...prevRedoHistory
				]);

				setUndoHistory((prevUndoHistory) => prevUndoHistory.slice(0, prevUndoHistory.length - 1));

				setRequestInput(
					{
						...request,
						valueTextInput: valueTextInput,
						content: content,
						mentionRaw: mentionRaw
					},
					true
				);
			}
		} else if ((ctrlKey || metaKey) && (key === 'y' || key === 'Y')) {
			event.preventDefault();
			if (redoHistory.length > 0) {
				const { valueTextInput, content, mentionRaw } = redoHistory[0];

				setUndoHistory((prevUndoHistory) => [
					...prevUndoHistory,
					{ valueTextInput: request.valueTextInput, content: request.content, mentionRaw: request.mentionRaw }
				]);

				setRedoHistory((prevRedoHistory) => prevRedoHistory.slice(1));

				setRequestInput(
					{
						...request,
						valueTextInput: valueTextInput,
						content: content,
						mentionRaw: mentionRaw
					},
					true
				);
			}
		}

		switch (key) {
			case 'Enter': {
				if (shiftKey || isComposing) {
					return;
				} else {
					const hasToken = request?.mentionRaw?.length > 0;

					const emptyRequest: RequestInput = {
						content: '',
						valueTextInput: '',
						mentionRaw: []
					};
					const checkedRequest = request ? request : emptyRequest;
					const { text, entities } = parseHtmlAsFormattedText(hasToken ? checkedRequest.content : checkedRequest.content.trim());
					const mk: IMarkdownOnMessage[] = processMarkdownEntities(text, entities);
					const { adjustedHashtagPos, adjustedEmojiPos } = adjustPos(mk, mentionList, hashtagList, emojiList, text);
					const payload = {
						t: text,
						hg: adjustedHashtagPos as IHashtagOnMessage[],
						ej: adjustedEmojiPos as IEmojiOnMessage[],
						mk
					};
					event.preventDefault();
					await handleSend(filterEmptyArrays(payload), request?.mentionRaw || [], attachmentData, valueThread?.references, {
						nameValueThread: nameValueThread ?? valueThread?.content.t,
						isPrivate
					});
					return;
				}
			}
			default: {
				return;
			}
		}
	};

	return (
		<div className="flex flex-col flex-1 justify-end border-l dark:border-borderDivider border-bgLightTertiary pt-4">
			{threadCurrentChannel && (
				<div className={`overflow-y-auto bg-[#1E1E1E] max-w-widthMessageViewChat overflow-x-hidden flex-1`}>
					<MemoizedChannelMessages
						isThreadBox={true}
						userIdsFromThreadBox={mapToMemberIds}
						key={threadCurrentChannel.channel_id}
						clanId={currentClanId || ''}
						channelId={threadCurrentChannel.channel_id as string}
						channelLabel={threadCurrentChannel.channel_label}
						type={ChannelType.CHANNEL_TYPE_THREAD}
						mode={ChannelStreamMode.STREAM_MODE_THREAD}
						isPrivate={threadCurrentChannel.channel_private}
					/>
				</div>
			)}
			{!threadCurrentChannel && (
				<div className={`flex flex-col overflow-y-auto ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''} ww-full px-4`}>
					<div className="flex flex-col justify-end flex-grow">
						{!threadCurrentChannel && (
							<div className="relative flex items-center justify-center mx-4 mt-4 w-16 h-16 dark:bg-bgInputDark bg-bgTextarea rounded-full pointer-events-none">
								<Icons.ThreadIcon defaultSize="w-7 h-7" />
								{isPrivate === 1 && (
									<div className="absolute right-4 bottom-4">
										<Icons.Locked />
									</div>
								)}
							</div>
						)}
						<ThreadNameTextField
							onChange={handleChangeNameThread}
							onKeyDown={onKeyDown}
							value={nameValueThread ?? ''}
							label="Thread Name"
							placeholder={openThreadMessageState && valueThread?.content.t !== '' ? valueThread?.content.t : 'Enter Thread Name'}
							className="h-10 p-[10px] dark:bg-bgTertiary bg-bgTextarea dark:text-white text-colorTextLightMode text-base outline-none rounded-md placeholder:text-sm"
						/>
						{!openThreadMessageState && <PrivateThread title="Private Thread" label="Only people you invite and moderators can see" />}
						{valueThread && openThreadMessageState && <ChannelMessageThread message={valueThread} />}
					</div>
				</div>
			)}

			{messageThreadError && !threadCurrentChannel && <span className="text-xs text-[#B91C1C] mt-1 ml-1">{messageThreadError}</span>}

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
										channelId={(currentChannelId || '') + '/createThread'}
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
				className={`flex-shrink-0 flex flex-col ${isElectron() ? 'pb-[46px]' : 'pb-[26px]'} px-4 dark:bg-bgPrimary bg-bgLightPrimary h-auto relative ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'}`}
			>
				<div
					className={`h-fit w-full dark:bg-channelTextarea bg-channelTextareaLight rounded-lg ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'}`}
				>
					<MentionReactInput
						currentChannelId={(currentChannelId || '') + '/createThread'}
						handlePaste={onPastedFiles}
						onSend={handleSend}
						onTyping={handleTypingDebounced}
						listMentions={UserMentionList({
							channelID: currentChannel?.channel_id as string,
							channelMode: ChannelStreamMode.STREAM_MODE_CHANNEL
						})}
						isThread
					/>
				</div>
			</div>
		</div>
	);
};

export default ThreadBox;
