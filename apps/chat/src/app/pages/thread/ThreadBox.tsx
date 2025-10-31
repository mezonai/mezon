import {
	AttachmentPreviewThumbnail,
	ChannelMessageThread,
	FileSelectionButton,
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
	selectCloseMenu,
	selectComposeInputByChannelId,
	selectCurrentChannelCategoryId,
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectCurrentClanId,
	selectMemberClanByUserId,
	selectOpenThreadMessageState,
	selectSession,
	selectStatusMenu,
	selectThreadCurrentChannel,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type {
	ChannelMembersEntity,
	HistoryItem,
	IEmojiOnMessage,
	IHashtagOnMessage,
	IMarkdownOnMessage,
	IMessageSendPayload,
	RequestInput,
	ThreadValue
} from '@mezon/utils';
import {
	CREATING_THREAD,
	MAX_FILE_ATTACHMENTS,
	UploadLimitReason,
	ValidateSpecialCharacters,
	adjustPos,
	filterEmptyArrays,
	generateE2eId,
	parseHtmlAsFormattedText,
	processFile,
	processMarkdownEntities
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import type { KeyboardEvent } from 'react';
import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useThrottledCallback } from 'use-debounce';
import MemoizedChannelMessages from '../channel/ChannelMessages';
import { CONSTANT } from './constant';

const ThreadBox = () => {
	const { t } = useTranslation('channelTopbar');
	const dispatch = useAppDispatch();
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentChannelCategoryId = useSelector(selectCurrentChannelCategoryId);
	const currentClanId = useSelector(selectCurrentClanId);
	const sessionUser = useSelector(selectSession);
	const currentClanUser = useAppSelector((state) => selectMemberClanByUserId(state, sessionUser?.user_id as string));
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const currentInputChannelId = threadCurrentChannel?.channel_id || CREATING_THREAD;
	const { removeAttachmentByIndex, checkAttachment, attachmentFilteredByChannelId } = useReference(currentInputChannelId);
	const { setOverUploadingState } = useDragAndDrop();
	const { messageThreadError, isPrivate, nameValueThread, valueThread, setNameValueThread } = useThreads();
	const [undoHistory, setUndoHistory] = useState<HistoryItem[]>([]);
	const [redoHistory, setRedoHistory] = useState<HistoryItem[]>([]);
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { setRequestInput } = useMessageValue();
	const request = useAppSelector((state) => selectComposeInputByChannelId(state, `${currentChannelId}true`));
	const rolesClan = useSelector(selectAllRolesClan);
	const { membersOfChild } = useChannelMembers({ channelId: currentChannelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const membersOfParent = useAppSelector((state) =>
		threadCurrentChannel?.parent_id ? selectAllChannelMembers(state, threadCurrentChannel?.parent_id as string) : null
	);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const { mentionList, hashtagList, emojiList } = useMemo(() => {
		return processMention(request?.mentionRaw, rolesClan, membersOfChild as ChannelMembersEntity[], membersOfParent as ChannelMembersEntity[]);
	}, [request?.mentionRaw, rolesClan, membersOfChild, membersOfParent]);
	const attachmentData = useMemo(() => {
		if (attachmentFilteredByChannelId === null) {
			return [];
		} else {
			return attachmentFilteredByChannelId.files;
		}
	}, [attachmentFilteredByChannelId]);

	const { sendMessageThread, sendMessageTyping } = useThreadMessage({
		channelId: threadCurrentChannel?.id as string,
		mode: ChannelStreamMode.STREAM_MODE_THREAD,
		username: sessionUser?.username
	});

	const mapToMemberIds = useMemo(() => {
		return membersOfParent?.map((item) => item.id);
	}, [membersOfParent]);

	const createThread = useCallback(
		async (value: ThreadValue, messageContent?: IMessageSendPayload) => {
			const idParent = currentChannelParentId !== '0' ? currentChannelParentId : (currentChannelId as string);

			if (!value.nameValueThread || !value.nameValueThread.trim()) {
				return;
			}
			if (value.nameValueThread.length <= CONSTANT.MINIMUM_CHAT_NAME_LENGTH) {
				toast(t('createThread.toast.threadNameTooShort'));
				return;
			}

			const regex = ValidateSpecialCharacters().test(value.nameValueThread);
			if (!regex) {
				return;
			}

			const isDuplicate = await dispatch(checkDuplicateThread({ thread_name: value.nameValueThread, channel_id: idParent as string }));
			if (isDuplicate?.payload) {
				toast(t('createThread.toast.threadNameExists'));
				return;
			}

			if (!messageContent?.t && !checkAttachment) {
				toast.warning(t('createThread.toast.initialMessageRequired'));
				return;
			}

			const timestamp = Date.now() / 1000;
			const body: Record<string, unknown> = {
				clan_id: currentClanId?.toString(),
				channel_label: value.nameValueThread,
				channel_private: value.isPrivate,
				parent_id: idParent,
				category_id: currentChannelCategoryId,
				type: ChannelType.CHANNEL_TYPE_THREAD,
				lastSeenTimestamp: timestamp,
				lastSentTimestamp: timestamp
			};

			const thread = await dispatch(createNewChannel(body));
			return thread.payload;
		},
		[checkAttachment, currentChannelCategoryId, currentChannelParentId, currentChannelId, currentClanId, dispatch, t]
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
					const thread = (await createThread(value, content)) as ApiChannelDescription;
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
								channelId: currentInputChannelId,
								files: []
							})
						);
						setRequestInput({ ...request, valueTextInput: '', content: '' }, true);
						setNameValueThread('');
					}
				} else {
					await sendMessageThread(content, mentions, attachments, references, threadCurrentChannel);
				}
			} else {
				console.error('Session is not available');
			}
		},
		[
			createThread,
			currentClanId,
			dispatch,
			sendMessageThread,
			threadCurrentChannel,
			sessionUser,
			setRequestInput,
			currentInputChannelId,
			request,
			setNameValueThread
		]
	);
	const handleSendWithLimitCheck = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue
		): Promise<boolean> => {
			if (!threadCurrentChannel && valueThread) {
				if (valueThread.content?.t && valueThread.content.t.length > CONSTANT.LIMIT_CHARACTER_REACTION_INPUT_LENGTH) {
					toast.error(t('createThread.toast.messageTooLong'));
					return false;
				}
				await handleSend(valueThread.content, valueThread.mentions || [], attachmentData, valueThread?.references, {
					nameValueThread: nameValueThread ?? valueThread?.content.t,
					isPrivate
				});
				return true;
			}

			if (content?.t && content.t.length > CONSTANT.LIMIT_CHARACTER_REACTION_INPUT_LENGTH) {
				toast.error(t('createThread.toast.messageTooLong'));
				return false;
			}
			await handleSend(content, mentions, attachments, references, value);
			return true;
		},
		[handleSend, t, threadCurrentChannel, valueThread, attachmentData, nameValueThread, isPrivate]
	);

	const handleTyping = useCallback(() => {
		sendMessageTyping();
	}, [sendMessageTyping]);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	const handleChildContextMenu = (event: React.MouseEvent) => {
		event.stopPropagation();
	};

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
		[attachmentFilteredByChannelId?.files?.length, currentInputChannelId, dispatch, setOverUploadingState]
	);

	const handleChangeNameThread = useCallback(
		(nameThread: string) => {
			dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue: nameThread }));
		},
		[currentChannelId, dispatch]
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
						valueTextInput,
						content,
						mentionRaw
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
					{ valueTextInput: request.valueTextInput, content: request.content, mentionRaw: request?.mentionRaw }
				]);

				setRedoHistory((prevRedoHistory) => prevRedoHistory.slice(1));

				setRequestInput(
					{
						...request,
						valueTextInput,
						content,
						mentionRaw
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
					if (!threadCurrentChannel && valueThread) {
						event.preventDefault();
						await handleSend(valueThread.content, valueThread.mentions || [], attachmentData, valueThread?.references, {
							nameValueThread: nameValueThread ?? valueThread?.content.t,
							isPrivate
						});
						return;
					}

					const hasToken = request?.mentionRaw && request?.mentionRaw?.length > 0;

					const emptyRequest: RequestInput = {
						content: '',
						valueTextInput: '',
						mentionRaw: []
					};
					const checkedRequest = request ? request : emptyRequest;
					if (checkedRequest.content.length > CONSTANT.LIMIT_CHARACTER_REACTION_INPUT_LENGTH) {
						toast.error(t('createThread.toast.messageLimitExceeded', { limit: CONSTANT.LIMIT_CHARACTER_REACTION_INPUT_LENGTH }));
						event.preventDefault();
						return;
					}
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
		<div
			className="flex flex-col flex-1 justify-end border-l border-color-primary bg-theme-chat pt-4"
			data-e2e={generateE2eId('discussion.box.thread')}
		>
			{threadCurrentChannel && (
				<div className={`overflow-y-auto  max-w-widthMessageViewChat overflow-x-hidden flex-1`}>
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
				<div className={`flex flex-col overflow-y-auto w-full  px-3`} onPaste={onPastedFiles}>
					<div className="flex flex-col justify-end flex-grow">
						{!threadCurrentChannel && (
							<div className="relative flex text-theme-primary-active items-center justify-center mx-4 mt-4 w-16 h-16 bg-item-theme rounded-full pointer-events-none">
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
							label={t('createThread.threadName')}
							placeholder={
								openThreadMessageState && valueThread?.content.t !== '' ? valueThread?.content.t : t('createThread.enterThreadName')
							}
							className="h-10 p-[10px] bg-item-theme text-theme-message border-theme-primary text-base outline-none rounded-lg placeholder:text-sm"
						/>
						{!openThreadMessageState && !valueThread && (
							<PrivateThread title={t('createThread.privateThread')} label={t('createThread.privateThreadDescription')} />
						)}
						{valueThread && (
							<div className="max-h-[60vh] overflow-y-auto overflow-x-hidden  thread-scroll ">
								<div className="px-3">
									<ChannelMessageThread user={currentClanUser} message={valueThread} />
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{messageThreadError && !threadCurrentChannel && <span className="text-xs text-[#B91C1C] mt-1 ml-1">{messageThreadError}</span>}

			{checkAttachment && (
				<div
					className={`${
						checkAttachment ? 'px-3 mx-4 pb-1 pt-5 rounded-t-lg border-b-[1px] border-color-primary' : ''
					} bg-item-theme max-h-full`}
				>
					<div className={`max-h-full flex gap-6 overflow-y-hidden overflow-x-auto thread-scroll`}>
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
				className={`flex-shrink-0 flex flex-col ${isElectron() ? 'pb-[36px]' : 'pb-4'} px-3  h-auto relative ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'}`}
			>
				<div
					className={`h-fit w-full bg-transparent shadow-md rounded-lg min-h-[45px] ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'}`}
				>
					{!threadCurrentChannel ? (
						<div className={`w-full border-none rounded-r-lg gap-3 relative whitespace-pre-wrap`} onContextMenu={handleChildContextMenu}>
							<MentionReactInput
								currentChannelId={currentInputChannelId}
								handlePaste={onPastedFiles}
								onSend={handleSendWithLimitCheck}
								onTyping={handleTypingDebounced}
								listMentions={UserMentionList({
									channelID: currentChannelId as string,
									channelMode: ChannelStreamMode.STREAM_MODE_CHANNEL
								})}
								isThread={true}
							/>
						</div>
					) : (
						<div
							className={`flex flex-inline items-start gap-2 box-content max-sm:mb-0 bg-theme-surface rounded-lg relative shadow-md border-theme-primary ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'}
						${closeMenu && !statusMenu ? 'max-w-wrappBoxChatViewMobile' : 'w-wrappBoxChatView'}`}
						>
							<FileSelectionButton currentChannelId={currentInputChannelId} />
							<div className={`w-[calc(100%_-_58px)] bg-transparent gap-3 flex items-center rounded-e-md`}>
								<div
									className={`w-full border-none rounded-r-lg gap-3 relative whitespace-pre-wrap`}
									onContextMenu={handleChildContextMenu}
								>
									<MentionReactInput
										currentChannelId={currentInputChannelId}
										handlePaste={onPastedFiles}
										onSend={handleSend}
										onTyping={handleTypingDebounced}
										listMentions={UserMentionList({
											channelID: currentChannelId as string,
											channelMode: ChannelStreamMode.STREAM_MODE_CHANNEL
										})}
										isThreadbox
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ThreadBox;
