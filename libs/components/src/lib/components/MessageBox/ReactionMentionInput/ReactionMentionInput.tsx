import { useEmojiSuggestionContext, useGifsStickersEmoji, useReference } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import {
	channelMembersActions,
	emojiSuggestionActions,
	getStore,
	quickMenuActions,
	referencesActions,
	selectAddEmojiState,
	selectAllAccount,
	selectAllRolesClan,
	selectAnonymousMode,
	selectAttachmentByChannelId,
	selectCloseMenu,
	selectCurrentTopicId,
	selectDataMentions,
	selectDataReferences,
	selectEmojiObjSuggestion,
	selectIdMessageRefEdit,
	selectMemberIdsByChannelId,
	selectOpenEditMessageState,
	selectOpenThreadMessageState,
	selectQuickMenuByChannelId,
	selectReactionRightState,
	selectStatusMenu,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type {
	ChannelMembersEntity,
	IEmojiOnMessage,
	IHashtagOnMessage,
	ILongPressType,
	IMarkdownOnMessage,
	IMentionOnMessage,
	IMessageWithUser,
	MentionReactInputProps,
	RequestInput
} from '@mezon/utils';
import {
	CHANNEL_INPUT_ID,
	CREATING_TOPIC,
	ID_MENTION_HERE,
	IS_SAFARI,
	MIN_THRESHOLD_CHARS,
	QUICK_MENU_TYPE,
	RECENT_EMOJI_CATEGORY,
	SubPanelName,
	THREAD_ARCHIVE_DURATION_SECONDS,
	TITLE_MENTION_HERE,
	ThreadStatus,
	blankReferenceObj,
	checkIsThread,
	extractCanvasIdsFromText,
	filterEmptyArrays,
	processEntitiesDirectly,
	searchMentionsHashtag
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import type { ReactElement, RefObject } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Mention, { type MentionData } from './Mention';
import MentionsInput, { type FormattedText, type MentionsInputHandle } from './MentionsInput';
import SuggestItem from './SuggestItem';
import { ChatBoxToolbarWrapper } from './components';
import { useClickUpToEditMessage, useEmojiPicker, useFocusEditor, useFocusManager, useKeyboardHandler } from './hooks';
import parseHtmlAsFormattedText, { ApiMessageEntityTypes } from './parseHtmlAsFormattedText';
import { getCanvasTitles } from './utils/canvas';

interface SlashCommand extends MentionData {
	description: string;
	action_msg?: string;
}

// This needs to be a function that accepts t function to be dynamic
const createSlashCommands = (t: (key: string) => string): SlashCommand[] => [
	{
		id: 'ephemeral',
		display: 'ephemeral',
		description: t('slashCommands.ephemeral.description')
	}
];

/**
 * Custom hook to search and filter emojis based on user input
 */

interface EntityWithMention {
	type: string;
	offset: number;
	length: number;
	userId?: string;
}

export interface MentionReactBaseProps extends MentionReactInputProps {
	mentionWidth: string;
	handleSearchHashtag?: (search: string, callback: (data: MentionData[]) => void) => void;
	addMemberToThread?: (channel: ChannelsEntity, users: string[]) => void;
	joinningToThread?: (channel: ChannelsEntity, users: string[]) => void;
	threadCurrentChannel?: ChannelsEntity;
	currentChannel?: ChannelsEntity;
	setOpenThreadMessageState?: (state: boolean) => void;
	checkAttachment?: boolean;
	draftRequest?: RequestInput | null;
	updateDraft?: (request: RequestInput) => void;
	openThreadMessageState?: boolean;
	isShowCreateThread?: boolean;
	nameValueThread: string;
	valueThread?: IMessageWithUser | null;
	isPrivate: number;
	membersOfChild?: ChannelMembersEntity[] | null;
	membersOfParent?: ChannelMembersEntity[] | null;
	dataReferences?: ApiMessageRef;
	dataReferencesTopic?: ApiMessageRef;
	currentDmGroupId?: string;
}

export const MentionReactBase = memo((props: MentionReactBaseProps): ReactElement => {
	const { t } = useTranslation('messageBox');
	const editorRef = useRef<MentionsInputHandle | null>(null);
	const editorElementRef = useRef<HTMLDivElement | null>(null); // For legacy hooks compatibility
	const containerRef = useRef<HTMLDivElement | null>(null);
	const {
		currentChannel,
		addMemberToThread,
		joinningToThread,
		threadCurrentChannel,
		isPrivate,
		nameValueThread,
		valueThread,
		draftRequest,
		updateDraft
	} = props;

	const dispatch = useAppDispatch();
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const anonymousMode = useSelector((state) => selectAnonymousMode(state, currentChannel?.clan_id as string));
	const [mentionEveryone, setMentionEveryone] = useState(false);
	const addEmojiState = useSelector(selectAddEmojiState);
	const emojiPicked = useSelector(selectEmojiObjSuggestion);

	const { emojis } = useEmojiSuggestionContext();

	const queryEmojis = useCallback(
		(query: string) => {
			if (!query || emojis.length === 0) return [];
			const q = query.toLowerCase();
			const matches: { id: string; display: string; src?: string }[] = [];

			for (const { id, shortname, category, src } of emojis) {
				if (category === RECENT_EMOJI_CATEGORY || !shortname || !shortname.includes(q)) continue;
				if (!id) continue;
				matches.push({ id, display: shortname, src });
				if (matches.length === 20) break;
			}

			return matches;
		},
		[emojis]
	);

	const [isEphemeralMode, setIsEphemeralMode] = useState(false);
	const [ephemeralTargetUserId, setEphemeralTargetUserId] = useState<string | null>(null);
	const [ephemeralTargetUserDisplay, setEphemeralTargetUserDisplay] = useState<string | null>(null);

	const reactionRightState = useSelector(selectReactionRightState);
	const isShowEmojiPicker = !props.isThread;

	const currTopicId = useSelector(selectCurrentTopicId);
	const dataReferences = useAppSelector((state) => selectDataReferences(state, props.currentChannelId ?? ''));
	const dataReferencesTopic = useAppSelector((state) => selectDataReferences(state, currTopicId ?? ''));

	const scopeId = props.isTopic ? currTopicId || CREATING_TOPIC : props.currentChannelId!;

	const attachmentFiltered = useAppSelector((state) => selectAttachmentByChannelId(state, scopeId || ''));
	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM || props.mode === ChannelStreamMode.STREAM_MODE_GROUP;

	const userProfile = useSelector(selectAllAccount);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
	const allChannels = useAppSelector((state) => selectDataMentions(state, isDm));
	const { setOpenThreadMessageState, checkAttachment } = useReference(scopeId || '');
	const [mentionData, setMentionData] = useState<ApiMessageMention[]>([]);
	const [displayPlaintext, setDisplayPlaintext] = useState<string>('');
	const [displayMarkup, setDisplayMarkup] = useState<string>('');
	const [mentionUpdated, setMentionUpdated] = useState<IMentionOnMessage[]>([]);
	const [isPasteMulti, setIsPasteMulti] = useState<boolean>(false);

	useEffect(() => {
		if (editorRef.current) {
			editorElementRef.current = editorRef.current.getElement();
		}
	}, [editorRef.current]);

	useFocusEditor({
		editorRef: editorElementRef,
		isTopic: props.isTopic
	});

	const { setSubPanelActive } = useGifsStickersEmoji();

	useFocusManager({
		editorRef: editorElementRef as RefObject<HTMLDivElement>,
		isTopic: props.isTopic || false,
		isMenuClosed: useSelector(selectCloseMenu),
		isStatusMenuOpen: useSelector(selectStatusMenu),
		messageRefId: dataReferences.message_ref_id,
		isEmojiPickerActive: !!emojiPicked?.shortName,
		isReactionRightActive: reactionRightState,
		isEditMessageOpen: useSelector(selectOpenEditMessageState),
		editMessageId: idMessageRefEdit,
		currentChannelId: props.currentChannelId,
		currentDmGroupId: props.currentDmGroupId,
		hasAttachments: attachmentFiltered?.files?.length > 0
	});

	const handleSendWithFormattedText = useCallback(
		(formattedText: FormattedText, anonymousMessage?: boolean) => {
			const checkedRequest: RequestInput = {
				content: formattedText.text,
				valueTextInput: formattedText.text,
				entities: formattedText.entities || []
			};

			return handleSendInternal(checkedRequest, anonymousMessage);
		},
		[
			props,
			nameValueThread,
			threadCurrentChannel,
			dataReferences,
			dispatch,
			isPrivate,
			mentionEveryone,
			addMemberToThread,
			currentChannel,
			setOpenThreadMessageState,
			updateDraft,
			setSubPanelActive
		]
	);

	const handleThreadActivation = useCallback(
		async (channel: ChannelsEntity | null | undefined) => {
			if (!checkIsThread(channel as ChannelsEntity) || !channel) {
				return;
			}

			const currentTime = Math.floor(Date.now() / 1000);
			const lastMessageTimestamp = channel.last_sent_message?.timestamp_seconds;
			const isArchived = lastMessageTimestamp && currentTime - Number(lastMessageTimestamp) > THREAD_ARCHIVE_DURATION_SECONDS;

			const store = getStore();
			const userIds = selectMemberIdsByChannelId(store.getState(), channel.id as string);
			const needsJoin = !userProfile?.user?.id ? false : !userIds?.includes(userProfile?.user?.id);

			if (isArchived) {
				await dispatch(
					threadsActions.writeActiveArchivedThread({
						clanId: channel.clan_id ?? '',
						channelId: channel.channel_id ?? ''
					})
				);
			}
			if (needsJoin && joinningToThread) {
				dispatch(threadsActions.updateActiveCodeThread({ channelId: channel.id, activeCode: ThreadStatus.joined }));
				joinningToThread(channel, [userProfile?.user?.id ?? '']);
			}
		},
		[dispatch, joinningToThread, userProfile?.user?.id]
	);

	const handleSendInternal = useCallback(
		async (checkedRequest: RequestInput, anonymousMessage?: boolean) => {
			//TODO: break logic send width thread box, channel, topic box, dm
			if (props.isThread && !nameValueThread?.trim() && !props.isTopic && !threadCurrentChannel) {
				dispatch(threadsActions.setNameThreadError(t('channelTopbar:createThread.validation.threadNameRequired')));
				updateDraft?.({
					valueTextInput: '',
					content: '',
					mentionRaw: [],
					entities: []
				});

				return;
			}

			if (props.isThread && !threadCurrentChannel) {
				const hasContent = checkedRequest.content?.trim() || checkedRequest.valueTextInput?.trim();
				if (!hasContent && !checkAttachment) {
					dispatch(threadsActions.setMessageThreadError(t('channelTopbar:createThread.validation.starterMessageRequired')));
					return;
				}
			}

			const store = getStore();
			const rolesClan = selectAllRolesClan(store.getState());
			if (checkedRequest.entities && checkedRequest.entities.length > 0) {
				const {
					mentions: mentionList,
					hashtags: hashtagList,
					emojis: emojiList,
					markdown: markdownList
				} = processEntitiesDirectly(checkedRequest.entities, checkedRequest.content, rolesClan);

				const usersNotExistingInThreadSet = new Set<string>();
				// add member to thread
				if (props.membersOfChild && props.membersOfParent) {
					mentionList.forEach((mention) => {
						if (mention.user_id) {
							const existsInChild = props.membersOfChild?.some((member) => member.user?.id === mention.user_id);
							const existsInParent = props.membersOfParent?.some((member) => member.user?.id === mention.user_id);

							if ((!existsInChild || props.isThreadbox) && existsInParent && mention?.user_id) {
								usersNotExistingInThreadSet.add(mention.user_id);
							}
						} else if (mention?.role_id) {
							const role = rolesClan?.find((r) => r.id === mention.role_id);
							if (role?.role_user_list?.role_users) {
								role.role_user_list.role_users.forEach((roleUser: any) => {
									if (roleUser?.id) {
										const existsInChild = props.membersOfChild?.some((member) => member.user?.id === roleUser.id);
										const existsInParent = props.membersOfParent?.some((member) => member.user?.id === roleUser.id);
										if (!existsInChild && existsInParent && roleUser.id) {
											usersNotExistingInThreadSet.add(roleUser.id);
										}
									}
								});
							}
						}
					});
				}

				const usersNotExistingInThread = Array.from(usersNotExistingInThreadSet);

				const text = checkedRequest.content;

				const payload: {
					t: string;
					hg: IHashtagOnMessage[];
					ej: IEmojiOnMessage[];
					mk: IMarkdownOnMessage[];
					cvtt?: Record<string, string>;
				} = {
					t: text,
					hg: hashtagList as IHashtagOnMessage[],
					ej: emojiList as IEmojiOnMessage[],
					mk: markdownList
				};

				const canvasLinks = extractCanvasIdsFromText(text || '');
				const canvasTitles = getCanvasTitles(canvasLinks);
				if (Object.keys(canvasTitles).length > 0) {
					payload.cvtt = canvasTitles;
				}

				const removeEmptyOnPayload = filterEmptyArrays([]);

				const encoder = new TextEncoder();
				const payloadJson = JSON.stringify(removeEmptyOnPayload);
				const utf8Bytes = encoder.encode(payloadJson);

				if (utf8Bytes.length > MIN_THRESHOLD_CHARS && props.handleConvertToFile) {
					setIsPasteMulti(true);
					props.handleConvertToFile(payload.t ?? '');
					updateDraft?.({
						valueTextInput: '',
						content: '',
						mentionRaw: [],
						entities: []
					});
					return;
				}

				const attachmentData = attachmentFiltered?.files || [];

				if (checkIsThread(currentChannel as ChannelsEntity) && usersNotExistingInThread.length > 0 && addMemberToThread) {
					await addMemberToThread(currentChannel!, usersNotExistingInThread);
				}

				handleThreadActivation(currentChannel);

				if (isReplyOnChannel) {
					props.onSend(
						filterEmptyArrays(payload),
						mentionList,
						attachmentData,
						[dataReferences],
						{ nameValueThread, isPrivate },
						anonymousMessage,
						mentionEveryone,
						undefined,
						undefined,
						ephemeralTargetUserId || undefined,
						usersNotExistingInThread
					);
					setMentionEveryone(false);
					dispatch(referencesActions.resetAfterReply(props.currentChannelId ?? ''));
				} else if (isSendMessageOnThreadBox) {
					props.onSend(
						{ t: valueThread?.content.t || '' },
						valueThread?.mentions,
						valueThread?.attachments,
						valueThread?.references,
						{ nameValueThread: nameValueThread ?? valueThread?.content.t, isPrivate },
						anonymousMessage,
						mentionEveryone,
						undefined,
						undefined,
						ephemeralTargetUserId || undefined,
						usersNotExistingInThread
					);
				} else if (isReplyOnTopic) {
					props.onSend(
						filterEmptyArrays(payload),
						mentionList,
						attachmentData,
						[dataReferencesTopic],
						{ nameValueThread, isPrivate },
						anonymousMessage,
						mentionEveryone,
						undefined,
						undefined,
						ephemeralTargetUserId || undefined,
						usersNotExistingInThread
					);
					setMentionEveryone(false);
					dispatch(
						referencesActions.setDataReferences({
							channelId: currTopicId ?? '',
							dataReferences: blankReferenceObj
						})
					);
				} else {
					props.onSend(
						filterEmptyArrays(payload),
						mentionList,
						attachmentData,
						undefined,
						{ nameValueThread, isPrivate },
						anonymousMessage,
						mentionEveryone,
						undefined,
						undefined,
						ephemeralTargetUserId || undefined,
						usersNotExistingInThread
					);
					setMentionEveryone(false);
				}

				updateDraft?.({
					valueTextInput: '',
					content: '',
					mentionRaw: [],
					entities: []
				});

				dispatch(
					emojiSuggestionActions.setSuggestionEmojiObjPicked({
						shortName: '',
						id: '',
						isReset: true
					})
				);

				dispatch(
					referencesActions.setAtachmentAfterUpload({
						channelId: props.currentChannelId ?? '',
						files: []
					})
				);

				setMentionUpdated([]);
				setDisplayPlaintext('');
				setDisplayMarkup('');
				setIsPasteMulti(false);
				setSubPanelActive(SubPanelName.NONE);

				if (ephemeralTargetUserId) {
					setEphemeralTargetUserId(null);
					setEphemeralTargetUserDisplay(null);
				}

				return;
			}

			const { content: text } = checkedRequest;
			const payload: {
				t: string;
				hg: IHashtagOnMessage[];
				ej: IEmojiOnMessage[];
				mk: IMarkdownOnMessage[];
				cvtt?: Record<string, string>;
			} = {
				t: text,
				hg: [],
				ej: [],
				mk: []
			};

			const canvasLinks = extractCanvasIdsFromText(text || '');
			const canvasTitles = getCanvasTitles(canvasLinks);
			if (Object.keys(canvasTitles).length > 0) {
				payload.cvtt = canvasTitles;
			}

			const removeEmptyOnPayload = filterEmptyArrays([]);
			const encoder = new TextEncoder();
			const payloadJson = JSON.stringify(removeEmptyOnPayload);
			const utf8Bytes = encoder.encode(payloadJson);

			if (utf8Bytes.length > MIN_THRESHOLD_CHARS && props.handleConvertToFile) {
				setIsPasteMulti(true);
				props.handleConvertToFile(payload.t ?? '');
				updateDraft?.({
					valueTextInput: displayMarkup,
					content: displayPlaintext,
					mentionRaw: [],
					entities: []
				});

				return;
			}

			if ((!text && !checkAttachment) || ((draftRequest?.valueTextInput || '').trim() === '' && !checkAttachment)) {
				return;
			}
			if (props.isTopic && !text && checkAttachment) {
				payload.t = '';
			}
			if (
				draftRequest?.valueTextInput &&
				typeof draftRequest?.valueTextInput === 'string' &&
				!(draftRequest?.valueTextInput || '').trim() &&
				!checkAttachment &&
				mentionData?.length === 0
			) {
				if (!nameValueThread?.trim() && props.isThread && !threadCurrentChannel) {
					dispatch(threadsActions.setMessageThreadError(t('channelTopbar:createThread.validation.starterMessageRequired')));
					dispatch(threadsActions.setNameThreadError(t('channelTopbar:createThread.validation.threadNameRequired')));
					return;
				}
				if (props.isThread && !threadCurrentChannel) {
					dispatch(threadsActions.setMessageThreadError(t('channelTopbar:createThread.validation.starterMessageRequired')));
				}
				return;
			}
			if (!nameValueThread?.trim() && props.isThread && !props.isTopic && !threadCurrentChannel && !openThreadMessageState) {
				dispatch(threadsActions.setNameThreadError(t('channelTopbar:createThread.validation.threadNameRequired')));
				return;
			}

			handleThreadActivation(currentChannel);

			if (isReplyOnChannel) {
				props.onSend(
					filterEmptyArrays(payload),
					isPasteMulti ? mentionUpdated : [],
					attachmentData,
					[dataReferences],
					{ nameValueThread, isPrivate },
					anonymousMessage,
					mentionEveryone,
					undefined,
					undefined,
					ephemeralTargetUserId || undefined
				);

				setMentionEveryone(false);
				dispatch(referencesActions.resetAfterReply(props.currentChannelId ?? ''));
				dispatch(threadsActions.setNameValueThread({ channelId: props.currentChannelId as string, nameValue: '' }));
				setMentionData([]);
				dispatch(threadsActions.setIsPrivate(0));
			} else if (isSendMessageOnThreadBox) {
				props.onSend(
					{ t: valueThread?.content.t || '' },
					valueThread?.mentions,
					valueThread?.attachments,
					valueThread?.references,
					{ nameValueThread: nameValueThread ?? valueThread?.content.t, isPrivate },
					anonymousMessage,
					mentionEveryone,
					undefined,
					undefined,
					ephemeralTargetUserId || undefined
				);
				dispatch(
					referencesActions.setAtachmentAfterUpload({
						channelId: props.currentChannelId ?? '',
						files: []
					})
				);
				updateDraft?.({
					valueTextInput: '',
					content: '',
					mentionRaw: [],
					entities: []
				});
				setOpenThreadMessageState(false);
			} else if (isReplyOnTopic) {
				props.onSend(
					filterEmptyArrays(payload),
					[],
					attachmentData,
					[dataReferencesTopic],
					{ nameValueThread, isPrivate },
					anonymousMessage,
					mentionEveryone,
					undefined,
					undefined,
					ephemeralTargetUserId || undefined
				);
				setMentionEveryone(false);
				dispatch(
					referencesActions.setDataReferences({
						channelId: currTopicId ?? '',
						dataReferences: blankReferenceObj
					})
				);
				dispatch(threadsActions.setNameValueThread({ channelId: currTopicId as string, nameValue: '' }));
				setMentionData([]);
				dispatch(threadsActions.setIsPrivate(0));
			} else {
				props.onSend(
					filterEmptyArrays(payload),
					isPasteMulti ? mentionUpdated : [],
					attachmentData,
					undefined,
					{ nameValueThread, isPrivate },
					anonymousMessage,
					mentionEveryone,
					undefined,
					undefined,
					ephemeralTargetUserId || undefined
				);
				setMentionEveryone(false);
				dispatch(threadsActions.setNameValueThread({ channelId: props.currentChannelId as string, nameValue: '' }));
				setMentionData([]);
				dispatch(threadsActions.setIsPrivate(0));
			}

			if (ephemeralTargetUserId) {
				setEphemeralTargetUserId(null);
				setEphemeralTargetUserDisplay(null);
			}

			updateDraft?.({
				valueTextInput: '',
				content: '',
				mentionRaw: [],
				entities: []
			});

			dispatch(
				emojiSuggestionActions.setSuggestionEmojiObjPicked({
					shortName: '',
					id: '',
					isReset: true
				})
			);
			dispatch(
				referencesActions.setAtachmentAfterUpload({
					channelId: props.currentChannelId ?? '',
					files: []
				})
			);
			setMentionUpdated([]);
			setDisplayPlaintext('');
			setIsPasteMulti(false);
			setSubPanelActive(SubPanelName.NONE);
		},
		[
			mentionData,
			nameValueThread,
			props,
			threadCurrentChannel,
			openThreadMessageState,
			dataReferences,
			dispatch,
			isPrivate,
			mentionEveryone,
			addMemberToThread,
			currentChannel,
			setOpenThreadMessageState,
			updateDraft,
			setSubPanelActive,
			handleThreadActivation
		]
	);

	const { onKeyDown } = useKeyboardHandler({
		editorRef: editorElementRef as RefObject<HTMLDivElement>,
		updateDraft:
			updateDraft ||
			(() => {
				/* no-op */
			}),
		anonymousMode,
		isEphemeralMode,
		setIsEphemeralMode,
		setEphemeralTargetUserId,
		setEphemeralTargetUserDisplay,
		ephemeralTargetUserId
	});

	const attachmentData = useMemo(() => {
		if (!attachmentFiltered) {
			return [];
		} else {
			return attachmentFiltered.files;
		}
	}, [attachmentFiltered?.files]);

	const hashtagData = useMemo(() => {
		return allChannels.reduce<Array<{ id: string; display: string; subText: string }>>((acc, item) => {
			const id = item?.channel_id ?? '';
			const display = item?.channel_label ?? '';
			const subText = ((item as ChannelsEntity)?.category_name || item?.clan_name) ?? '';

			if (id || display || subText) {
				acc.push({ id, display, subText });
			}

			return acc;
		}, []);
	}, [props.mode, allChannels]);

	const isReplyOnChannel = dataReferences.message_ref_id && !props.isTopic ? true : false;
	const isReplyOnTopic = dataReferencesTopic.message_ref_id && props.isTopic ? true : false;
	const isSendMessageOnThreadBox = openThreadMessageState && !props.isTopic ? true : false;

	const [pastedContent, setPastedContent] = useState<string>('');
	const prevValueRef = useRef('');
	const prevPlainTextRef = useRef('');

	useEffect(() => {
		if (draftRequest?.valueTextInput !== undefined) {
			prevValueRef.current = draftRequest.valueTextInput;
		}
	}, [draftRequest?.valueTextInput]);

	useEffect(() => {
		if (draftRequest?.content !== undefined) {
			prevPlainTextRef.current = draftRequest.content;
		}
	}, [draftRequest?.content]);

	const onChangeMentionInput = (html: string) => {
		const { text: newPlainTextValue, entities } = parseHtmlAsFormattedText(html);
		const newValue = html;
		const previousValue = prevValueRef.current;
		const previousPlainText = prevPlainTextRef.current;
		const newMentions = entities?.filter((item) => item.type === ApiMessageEntityTypes.MentionName) || [];

		if (isEphemeralMode && newMentions.length > 0) {
			const selectedUser = newMentions[0] as { userId?: string; offset: number; length: number };
			if (selectedUser) {
				const displayName = newPlainTextValue.substring(selectedUser.offset, selectedUser.offset + selectedUser.length);
				setEphemeralTargetUserId(String(selectedUser?.userId));
				setEphemeralTargetUserDisplay(displayName);
				setIsEphemeralMode(false);
				updateDraft?.({
					valueTextInput: '',
					content: '',
					mentionRaw: [],
					entities: []
				});
				return;
			}
		}

		updateDraft?.({
			valueTextInput: newValue,
			content: newPlainTextValue,
			entities: entities || []
		});

		if (newMentions?.some((mention) => (mention as { userId?: string }).userId === ID_MENTION_HERE)) {
			setMentionEveryone(true);
		} else {
			setMentionEveryone(false);
		}
		if (typeof props.onTyping === 'function') {
			props.onTyping();
		}
		setMentionUpdated(mentionUpdated);

		if (!isPasteMulti) {
			setMentionUpdated(mentionUpdated);
		} else {
			setDisplayPlaintext(newPlainTextValue);
			setDisplayMarkup(newValue);
			updateDraft?.({
				valueTextInput: newValue,
				content: newPlainTextValue,
				mentionRaw: (newMentions as any[]) || [],
				entities: entities || []
			});
			setIsPasteMulti(false);
		}

		if (
			props.handleConvertToFile !== undefined &&
			newPlainTextValue?.length > MIN_THRESHOLD_CHARS &&
			pastedContent?.length > MIN_THRESHOLD_CHARS
		) {
			props.handleConvertToFile(pastedContent);
			updateDraft?.({
				valueTextInput: previousValue || '',
				content: previousPlainText || '',
				entities: draftRequest?.entities || []
			});
			setPastedContent('');
		}
	};

	const { insertEmojiDirectly } = useEmojiPicker({
		editorRef,
		emojiPicked,
		addEmojiState,
		dispatch,
		focusEditorIfMatch: (_element: HTMLElement | null, _targetInputId?: string) => {
			editorRef.current?.focus();
		},
		onDirectEmojiInsert: (_emojiId, _emojiShortname) => {}
	});

	const handleSearchUserMention = useCallback(
		async (search: string): Promise<MentionData[]> => {
			if (!props.listMentions?.length && props.currentClanId && props.currentClanId !== '0') {
				dispatch(
					channelMembersActions.fetchChannelMembers({
						clanId: props.currentClanId as string,
						channelId: props.currentChannelId as string,
						channelType: ChannelType.CHANNEL_TYPE_CHANNEL
					})
				);
			}

			const filteredMentions = !isEphemeralMode
				? props.listMentions || []
				: props.listMentions?.filter((item) => item.display !== TITLE_MENTION_HERE && item.id !== userProfile?.user?.id) || [];

			return searchMentionsHashtag(search, filteredMentions) as MentionData[];
		},
		[props.listMentions, isEphemeralMode, props.currentClanId, props.currentChannelId, dispatch, userProfile?.user?.id]
	);

	const generateCommandsList = useCallback(
		(search: string): SlashCommand[] => {
			const store = getStore();
			const channelQuickMenuItems = selectQuickMenuByChannelId(store.getState(), props.currentChannelId || '');
			const builtInCommands = createSlashCommands(t).filter((cmd) => cmd.display.toLowerCase().includes(search.toLowerCase()));

			const quickMenuCommands: SlashCommand[] = channelQuickMenuItems
				.filter((item) => item.menu_name?.toLowerCase().includes(search.toLowerCase()) && item.menu_type === QUICK_MENU_TYPE.FLASH_MESSAGE)
				.map((item) => ({
					id: `quick_menu_${item.id}`,
					display: item.menu_name || '',
					description: item.action_msg || '',
					action_msg: item.action_msg || ''
				}));

			return [...builtInCommands, ...quickMenuCommands];
		},
		[props.currentChannelId]
	);

	const handleSearchSlashCommands = useCallback(
		async (search: string): Promise<SlashCommand[]> => {
			const store = getStore();
			const channelQuickMenuItems = selectQuickMenuByChannelId(store.getState(), props.currentChannelId || '');
			const hasExistingData = channelQuickMenuItems && channelQuickMenuItems.length > 0;

			if (hasExistingData) {
				const commands = generateCommandsList(search);
				if (props.currentChannelId) {
					try {
						await dispatch(
							quickMenuActions.listQuickMenuAccess({ channelId: props.currentChannelId, menuType: QUICK_MENU_TYPE.FLASH_MESSAGE })
						);
						return generateCommandsList(search);
					} catch (error) {
						console.error('Error fetching fresh commands:', error);
						return commands;
					}
				}
				return commands;
			} else {
				try {
					if (props.currentChannelId) {
						await dispatch(
							quickMenuActions.listQuickMenuAccess({ channelId: props.currentChannelId, menuType: QUICK_MENU_TYPE.FLASH_MESSAGE })
						);
					}
					return generateCommandsList(search);
				} catch (error) {
					console.error('Error fetching commands:', error);
					const builtInCommands = createSlashCommands(t).filter((cmd) => cmd.display.toLowerCase().includes(search.toLowerCase()));
					return builtInCommands;
				}
			}
		},
		[props.currentChannelId, generateCommandsList, dispatch, t]
	);

	const handleSlashCommandSelect = useCallback(
		(commandId: string, _suggestion?: any) => {
			if (commandId === 'ephemeral') {
				setIsEphemeralMode(true);
				editorRef.current?.insertMentionCommand('@', true);
			} else if (commandId.startsWith('quick_menu_')) {
				const quickMenuItemId = commandId.replace('quick_menu_', '');
				const store = getStore();

				const channelQuickMenuItems = selectQuickMenuByChannelId(store.getState(), props.currentChannelId || '');

				const quickMenuItem = channelQuickMenuItems.find((item) => item.id === quickMenuItemId);

				if (quickMenuItem && quickMenuItem.action_msg) {
					editorRef.current?.insertMentionCommand(quickMenuItem.action_msg, true);
				}
			}
		},
		[props.currentChannelId]
	);

	const { handlePaste: originalHandlePaste, handleConvertToFile } = props;

	const handlePasteWithCharacterLimit = useCallback(
		(event: React.ClipboardEvent<HTMLDivElement>) => {
			if (!event.clipboardData) {
				return;
			}

			const plainText = event.clipboardData.getData('text/plain');
			const htmlContent = event.clipboardData.getData('text/html');

			const items = event.clipboardData.items;
			let hasImageFiles = false;

			if (items) {
				for (let i = 0; i < items.length; i++) {
					if (items[i].type.indexOf('image') !== -1) {
						hasImageFiles = true;
						break;
					}
				}
			}

			if (hasImageFiles) {
				if (originalHandlePaste) {
					originalHandlePaste(event);
				}
				return;
			}

			const contentToCheck = plainText || htmlContent;
			const currentValue = draftRequest?.content || '';
			const newTotalLength = currentValue.length + contentToCheck.length;

			if (handleConvertToFile && contentToCheck?.length && JSON.stringify(contentToCheck)?.length > MIN_THRESHOLD_CHARS) {
				event.preventDefault();
				handleConvertToFile(contentToCheck);
				return;
			}

			const combinedContent = currentValue + contentToCheck;
			const combinedContentSize = contentToCheck?.length && JSON.stringify(combinedContent)?.length || 0;

			if (handleConvertToFile && combinedContentSize > MIN_THRESHOLD_CHARS) {
				event.preventDefault();
				handleConvertToFile(combinedContent);

				updateDraft?.({
					valueTextInput: '',
					content: '',
					mentionRaw: [],
					entities: []
				});
				return;
			}
		},
		[originalHandlePaste, handleConvertToFile, draftRequest?.content, updateDraft]
	);

	useClickUpToEditMessage({
		editorRef: editorElementRef as RefObject<HTMLDivElement>,
		currentChannelId: props.currentChannelId,
		userId: userProfile?.user?.id,
		draftRequest,
		dispatch
	});

	return (
		<div className={`contain-layout relative bg-theme-surface rounded-lg ${props?.isThread && 'border-theme-primary'}`} ref={containerRef}>
			<div className="relative">
				<span
					className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-theme-primary pointer-events-none z-10 truncate transition-opacity duration-300 ${
						draftRequest?.valueTextInput ? 'hidden' : 'opacity-100'
					} sm:opacity-100 max-sm:opacity-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[calc(100%-120px)] pr-2`}
				>
					{ephemeralTargetUserId ? t('ephemeralMessage', { username: ephemeralTargetUserDisplay }) : t('placeholder')}
				</span>
				<MentionsInput
					id={CHANNEL_INPUT_ID}
					ref={editorRef}
					value={draftRequest?.valueTextInput ?? ''}
					onChange={onChangeMentionInput}
					onKeyDown={onKeyDown}
					placeholder={ephemeralTargetUserId ? t('ephemeralMessage', { username: ephemeralTargetUserDisplay }) : t('placeholder')}
					className={`mentions min-h-11 text-theme-message rounded-lg border-none max-h-[350px] overflow-auto ${
						IS_SAFARI ? '' : 'thread-scroll '
					}${props.isThread && !threadCurrentChannel ? 'p-2.5' : 'py-[9px] pr-[120px] pl-[9px]'}`}
					onSend={(formattedText: FormattedText) => {
						handleSendWithFormattedText(formattedText, anonymousMode);
					}}
					onHandlePaste={handlePasteWithCharacterLimit}
					enableUndoRedo={true}
					maxHistorySize={50}
					hasFilesToSend={attachmentData.length > 0}
					currentChannelId={props.currentChannelId}
					allowEmptySend={props.allowEmptySend}
				>
					<Mention
						trigger="@"
						title={t('mentionCategories.members')}
						data={handleSearchUserMention}
						allowSpaceInQuery={true}
						allowedCharacters="._-"
						renderSuggestion={(
							suggestion: any,
							search: string,
							_highlightedDisplay: React.ReactNode,
							_index: number,
							focused: boolean
						) => {
							return (
								<div
									className={`bg-item-theme-hover flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-item-theme text-white' : ''
									}`}
								>
									<SuggestItem
										avatarUrl={suggestion.avatarUrl}
										valueHightLight={search}
										wrapSuggestItemStyle="justify-between w-full"
										subText={
											suggestion.display === TITLE_MENTION_HERE ? t('suggestions.notifyEveryone') : (suggestion.username ?? '')
										}
										subTextStyle={`${suggestion.display === TITLE_MENTION_HERE ? 'normal-case' : 'lowercase'} text-xs`}
										showAvatar={suggestion.display !== TITLE_MENTION_HERE}
										display={suggestion.display}
										color={suggestion.color}
									/>
								</div>
							);
						}}
						markup="@[__display__](__id__)"
						displayPrefix="@"
					/>
					<Mention
						trigger="#"
						title={t('mentionCategories.textChannels')}
						displayPrefix="#"
						data={hashtagData}
						allowSpaceInQuery={true}
						allowedCharacters="._-"
						renderSuggestion={(suggestion, search, _highlightedDisplay, _index, focused) => (
							<div
								key={suggestion.id}
								className={`bg-item-theme-hover flex items-center px-3 py-2 cursor-pointer rounded-lg ${
									focused ? 'bg-item-theme text-white' : ''
								}`}
							>
								<SuggestItem
									valueHightLight={search}
									display={suggestion.display}
									symbol="#"
									subText={suggestion.subText as string}
									channelId={suggestion.id}
								/>
							</div>
						)}
						markup="#[__display__](__id__)"
					/>
					<Mention
						title={t('mentionCategories.emojiMatching')}
						trigger=":"
						markup="::[__display__](__id__)"
						data={queryEmojis}
						allowSpaceInQuery={false}
						allowedCharacters="?!+_-"
						displayTransform={(_id: any, display: any) => {
							return `${display}`;
						}}
						renderSuggestion={(
							suggestion: any,
							search: string,
							_highlightedDisplay: React.ReactNode,
							_index: number,
							focused: boolean
						) => {
							return (
								<div
									className={`bg-item-theme-hover flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-item-theme text-white' : ''
									}`}
								>
									<SuggestItem
										emojiId={suggestion.id}
										display={suggestion.display}
										valueHightLight={search}
										symbol={(suggestion as any).emoji}
									/>
								</div>
							);
						}}
						appendSpaceOnAdd={true}
					/>
					<Mention
						trigger="/"
						title={t('mentionCategories.commands')}
						data={handleSearchSlashCommands}
						allowSpaceInQuery={true}
						displayTransform={(_id: any, display: any) => {
							return `/${display}`;
						}}
						onAdd={(id: string, _display: string, _startPos: number, _endPos: number) => {
							handleSlashCommandSelect(id);
						}}
						renderSuggestion={(
							suggestion: any,
							search: string,
							_highlightedDisplay: React.ReactNode,
							_index: number,
							focused: boolean
						) => {
							if (suggestion.isLoading || suggestion.display === 'loading') {
								return (
									<div className="flex items-center gap-2 p-3 text-gray-400">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
											<circle
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="2"
												strokeDasharray="30"
												strokeDashoffset="30"
											/>
										</svg>
										<span>{t('suggestions.loadingCommands')}</span>
									</div>
								);
							}
							return (
								<div
									key={suggestion.id}
									className={`bg-item-theme-hover flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-item-theme text-white' : ''
									}`}
								>
									<SuggestItem display={suggestion.display} subText={suggestion.description} symbol="/" valueHightLight={search} />
								</div>
							);
						}}
						appendSpaceOnAdd={false}
					/>
				</MentionsInput>
			</div>
			<ChatBoxToolbarWrapper
				isShowEmojiPicker={isShowEmojiPicker}
				hasPermissionEdit={props.hasPermissionEdit || true}
				voiceLongPress={props.voiceLongPress || ({} as ILongPressType)}
				isRecording={!!props.isRecording}
				mode={props.mode || ChannelStreamMode.STREAM_MODE_CHANNEL}
				isTopic={props.isTopic || false}
				isThreadbox={props.isThreadbox || false}
				onEmojiSelect={insertEmojiDirectly}
			/>
			{draftRequest?.content && draftRequest.content.length > MIN_THRESHOLD_CHARS && (
				<div className="w-16 text-red-300 bottom-0 right-0 absolute">{MIN_THRESHOLD_CHARS - draftRequest.content.length}</div>
			)}
		</div>
	);
});

MentionReactBase.displayName = 'MentionReactBase';
