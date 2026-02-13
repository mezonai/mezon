import {
	AttachmentPreviewThumbnail,
	ChannelMessageThread,
	FileSelectionButton,
	MentionReactInput,
	PreviewOgp,
	PrivateThread,
	ThreadNameTextField,
	UserMentionList
} from '@mezon/components';
import { useChannelMembers, useDragAndDrop, useMessageValue, useReference, useThreadMessage, useThreads } from '@mezon/core';
import {
	channelsActions,
	checkDuplicateThread,
	createNewChannel,
	messagesActions,
	referencesActions,
	selectAllChannelMembers,
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
	useAppSelector,
	type ChannelsEntity
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IMessageSendPayload, ThreadValue } from '@mezon/utils';
import {
	CHANNEL_INPUT_ID,
	CREATING_THREAD,
	IMAGE_MAX_FILE_SIZE,
	MAX_FILE_ATTACHMENTS,
	MAX_FILE_SIZE,
	UploadLimitReason,
	ValidateSpecialCharacters,
	generateE2eId,
	processFile
} from '@mezon/utils';
import isElectron from 'is-electron';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { Fragment, useCallback, useEffect, useMemo, useRef } from 'react';
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
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { setRequestInput } = useMessageValue();
	const request = useAppSelector((state) => selectComposeInputByChannelId(state, `${currentChannelId}true`));
	const { addMemberToThread } = useChannelMembers({
		channelId: currentChannelId,
		mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0
	});
	const membersOfParent = useAppSelector((state) =>
		threadCurrentChannel?.parent_id ? selectAllChannelMembers(state, threadCurrentChannel?.parent_id as string) : null
	);
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const attachmentData = useMemo(() => {
		if (attachmentFilteredByChannelId === null) {
			return [];
		} else {
			return attachmentFilteredByChannelId.files;
		}
	}, [attachmentFilteredByChannelId]);

	const { sendMessageThread, sendMessageTyping } = useThreadMessage({
		channelId: threadCurrentChannel?.parent_id || currentChannelId || '',
		mode: ChannelStreamMode.STREAM_MODE_THREAD,
		username: sessionUser?.username
	});

	const mapToMemberIds = useMemo(() => {
		return membersOfParent?.map((item) => item.id);
	}, [membersOfParent]);

	const createThread = useCallback(
		async (value: ThreadValue, messageContent?: IMessageSendPayload, attachments?: Array<ApiMessageAttachment>) => {
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

			const isDuplicate = await dispatch(
				checkDuplicateThread({ thread_name: value.nameValueThread, channel_id: idParent as string, clan_id: currentClanId as string })
			);
			if (isDuplicate?.payload) {
				toast(t('createThread.toast.threadNameExists'));
				return;
			}

			const hasAttachments = (attachments?.length ?? 0) > 0;
			if (!messageContent?.t && !hasAttachments) {
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
		[currentChannelCategoryId, currentChannelParentId, currentChannelId, currentClanId, dispatch, t]
	);

	const handleSend = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue,
			anonymousMessage?: boolean,
			mentionEveryone?: boolean,
			displayName?: string,
			clanNick?: string,
			ephemeralReceiverId?: string,
			usersNotExistingInThread?: string[]
		) => {
			if (sessionUser) {
				if (value?.nameValueThread && !threadCurrentChannel) {
					const shouldSeedStarterFromValueThread = Boolean(valueThread && openThreadMessageState);
					const hasUserMessage = Boolean(content?.t && content.t.trim().length > 0) || (attachments?.length ?? 0) > 0;

					const createThreadMessageContent = hasUserMessage ? content : valueThread?.content;
					const createThreadAttachments = hasUserMessage ? attachments : valueThread?.attachments;

					const thread = (await createThread(value, createThreadMessageContent, createThreadAttachments)) as ApiChannelDescription;
					if (thread) {
						await dispatch(
							channelsActions.joinChat({
								clanId: currentClanId as string,
								channelId: thread.channel_id as string,
								channelType: ChannelType.CHANNEL_TYPE_THREAD,
								isPublic: false
							})
						);

						if (usersNotExistingInThread && usersNotExistingInThread.length > 0) {
							await addMemberToThread(thread as ChannelsEntity, usersNotExistingInThread);
						}

						if (shouldSeedStarterFromValueThread && valueThread) {
							await sendMessageThread(
								valueThread.content,
								valueThread.mentions,
								valueThread.attachments,
								valueThread.references,
								thread
							);
						}

						if (hasUserMessage) {
							await sendMessageThread(content, mentions, attachments, references, thread);
						}
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
					if (usersNotExistingInThread && usersNotExistingInThread.length > 0) {
						await addMemberToThread(threadCurrentChannel as ChannelsEntity, usersNotExistingInThread);
					}
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
			setNameValueThread,
			addMemberToThread,
			valueThread,
			openThreadMessageState
		]
	);
	const handleSendWithLimitCheck = useCallback(
		async (
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>,
			value?: ThreadValue,
			anonymousMessage?: boolean,
			mentionEveryone?: boolean,
			displayName?: string,
			clanNick?: string,
			ephemeralReceiverId?: string,
			usersNotExistingInThread?: string[]
		): Promise<boolean> => {
			if (!threadCurrentChannel && valueThread && openThreadMessageState) {
				if (valueThread.content?.t && valueThread.content.t.length > CONSTANT.LIMIT_CHARACTER_REACTION_INPUT_LENGTH) {
					toast.error(t('createThread.toast.messageTooLong'));
					return false;
				}
				if (content?.t && content.t.length > CONSTANT.LIMIT_CHARACTER_REACTION_INPUT_LENGTH) {
					toast.error(t('createThread.toast.messageTooLong'));
					return false;
				}

				const combinedAttachments = [...(attachments || []), ...attachmentData];
				if (combinedAttachments.length > MAX_FILE_ATTACHMENTS) {
					setOverUploadingState(true, UploadLimitReason.COUNT);
					return false;
				}

				const getLimit = (attachment: ApiMessageAttachment) =>
					attachment?.filetype?.startsWith('image/') ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE;
				const oversizedAttachment = combinedAttachments.find((attachment) => (attachment?.size ?? 0) > getLimit(attachment));
				if (oversizedAttachment) {
					setOverUploadingState(true, UploadLimitReason.SIZE, getLimit(oversizedAttachment));
					return false;
				}

				const hasUserText = Boolean(content?.t && content.t.trim().length > 0);
				const userMentions = hasUserText ? (mentions ?? []) : [];
				await handleSend(
					content,
					userMentions,
					combinedAttachments,
					valueThread?.references,
					{
						nameValueThread: nameValueThread ?? (hasUserText ? content.t : valueThread?.content.t),
						isPrivate
					},
					anonymousMessage,
					mentionEveryone,
					displayName,
					clanNick,
					ephemeralReceiverId,
					usersNotExistingInThread
				);
				return true;
			}

			if (content?.t && content.t.length > CONSTANT.LIMIT_CHARACTER_REACTION_INPUT_LENGTH) {
				toast.error(t('createThread.toast.messageTooLong'));
				return false;
			}

			if ((attachments?.length ?? 0) > MAX_FILE_ATTACHMENTS) {
				setOverUploadingState(true, UploadLimitReason.COUNT);
				return false;
			}

			const getAttachmentLimit = (attachment: ApiMessageAttachment) =>
				attachment?.filetype?.startsWith('image/') ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE;
			const oversizedAttachment = (attachments ?? []).find((attachment) => (attachment?.size ?? 0) > getAttachmentLimit(attachment));
			if (oversizedAttachment) {
				setOverUploadingState(true, UploadLimitReason.SIZE, getAttachmentLimit(oversizedAttachment));
				return false;
			}

			await handleSend(
				content,
				mentions,
				attachments,
				references,
				value,
				anonymousMessage,
				mentionEveryone,
				displayName,
				clanNick,
				ephemeralReceiverId,
				usersNotExistingInThread
			);
			return true;
		},
		[handleSend, t, threadCurrentChannel, valueThread, attachmentData, nameValueThread, isPrivate, openThreadMessageState, setOverUploadingState]
	);

	const handleTyping = useCallback(() => {
		if (messageThreadError) {
			dispatch(threadsActions.setMessageThreadError(''));
		}

		sendMessageTyping();
	}, [dispatch, messageThreadError, sendMessageTyping]);

	const handleTypingDebounced = useThrottledCallback(handleTyping, 1000);

	useEffect(() => {
		dispatch(threadsActions.setMessageThreadError(''));
		dispatch(threadsActions.setNameThreadError(''));
	}, [dispatch]);

	const handleChildContextMenu = (event: React.MouseEvent) => {
		event.stopPropagation();
	};

	const onPastedFiles = useCallback(
		async (event: React.ClipboardEvent<HTMLDivElement>) => {
			const items = Array.from(event.clipboardData?.items || []);
			const files = items
				.filter((item) => item.type.startsWith('image') || item.type.startsWith('video'))
				.map((item) => item.getAsFile())
				.filter((file): file is File => Boolean(file));

			if (!files.length) {
				return;
			}

			const totalFiles = files.length + (attachmentFilteredByChannelId?.files?.length || 0);
			if (totalFiles > MAX_FILE_ATTACHMENTS) {
				setOverUploadingState(true, UploadLimitReason.COUNT);
				return;
			}

			const getLimit = (file: File) => (file.type?.startsWith('image/') ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE);
			const oversizedFile = files.find((file) => file.size > getLimit(file));
			if (oversizedFile) {
				setOverUploadingState(true, UploadLimitReason.SIZE, getLimit(oversizedFile));
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

	const threadBoxRef = useRef<HTMLDivElement | null>(null);

	const handleThreadNameKeyDown = useCallback(
		async (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
			if (event.key !== 'Enter') {
				return;
			}

			event.preventDefault();

			const mentionInput = threadBoxRef.current?.querySelector<HTMLElement>(`#${CHANNEL_INPUT_ID}`);

			if (!mentionInput?.innerHTML) {
				dispatch(threadsActions.setMessageThreadError(t('createThread.validation.starterMessageRequired')));
				return;
			}

			mentionInput.focus();
			mentionInput.dispatchEvent(
				new KeyboardEvent('keydown', {
					key: 'Enter',
					code: 'Enter',
					bubbles: true
				})
			);
		},
		[dispatch, t]
	);

	return (
		<div
			ref={threadBoxRef}
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
							onKeyDown={handleThreadNameKeyDown}
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

			{messageThreadError && !threadCurrentChannel && (
				<div className="mx-4 mb-2">
					<div className="flex items-center gap-2 text-white px-3 py-2 rounded-md">
						<div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" color="#e44141" xmlns="http://www.w3.org/2000/svg">
								<circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
								<path d="M10 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
								<circle cx="10" cy="14" r="1" fill="currentColor" />
							</svg>
						</div>
						<span className="text-sm font-medium text-[#e44141]">{messageThreadError}</span>
					</div>
				</div>
			)}

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
			<PreviewOgp contextId={currentInputChannelId} />
			<div
				className={`flex-shrink-0 flex flex-col ${isElectron() ? 'pb-[36px]' : 'pb-4'} px-3  h-auto relative ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'}`}
			>
				<div
					className={`h-fit w-full bg-transparent shadow-md rounded-lg min-h-[45px] ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'} ${messageThreadError && !threadCurrentChannel ? 'border-[#B91C1C]' : ''}`}
				>
					{!threadCurrentChannel ? (
						<div
							className={`flex flex-inline items-start gap-2 box-content w-full bg-theme-surface rounded-lg relative border-theme-primary ${checkAttachment ? 'rounded-t-none' : 'rounded-t-lg'}`}
							onContextMenu={handleChildContextMenu}
						>
							<FileSelectionButton currentChannelId={currentInputChannelId} />
							<div className="flex-1 min-w-0">
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
									isThreadbox={true}
									allowEmptySend={true}
								/>
							</div>
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
										onSend={handleSendWithLimitCheck}
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
