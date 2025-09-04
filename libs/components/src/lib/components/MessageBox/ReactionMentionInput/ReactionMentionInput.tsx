import { useEmojiSuggestionContext, useGifsStickersEmoji, useReference } from '@mezon/core';
import {
  ChannelsEntity,
  channelMembersActions,
  emojiSuggestionActions,
  getStore,
  quickMenuActions,
  referencesActions,
  selectAddEmojiState,
  selectAllAccount,
  selectAllChannels,
  selectAllHashtagDm,
  selectAllRolesClan,
  selectAnonymousMode,
  selectAttachmentByChannelId,
  selectCloseMenu,
  selectCurrentTopicId,
  selectDataReferences,
  selectEmojiObjSuggestion,
  selectIdMessageRefEdit,
  selectOpenEditMessageState,
  selectOpenThreadMessageState,
  selectQuickMenuByChannelId,
  selectReactionRightState,
  selectStatusMenu,
  threadsActions,
  useAppDispatch,
  useAppSelector
} from '@mezon/store';
import {
  CHANNEL_INPUT_ID,
  CREATING_TOPIC,
  ChannelMembersEntity,
  ID_MENTION_HERE,
  IEmojiOnMessage,
  IHashtagOnMessage,
  ILongPressType,
  IMarkdownOnMessage,
  IMentionOnMessage,
  IMessageWithUser,
  MIN_THRESHOLD_CHARS,
  MentionReactInputProps,
  QUICK_MENU_TYPE,
  RECENT_EMOJI_CATEGORY,
  RequestInput,
  SubPanelName,
  TITLE_MENTION_HERE,
  ThreadStatus,
  addMention,
  adjustPos,
  blankReferenceObj,
  checkIsThread,
  extractCanvasIdsFromText,
  filterEmptyArrays,
  generateE2eId,
  processBoldEntities,
  processEntitiesDirectly,
  processMarkdownEntities,
  searchMentionsHashtag,
  threadError
} from '@mezon/utils';
import { EmojiActionToolbarE2E } from 'libs/components/src/lib/components/MessageBox/ReactionMentionInput/components/ChatBoxToolbarWrapper';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { ReactElement, RefObject, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Mention, { type MentionData } from './Mention';
import MentionsInput, { type FormattedText, type MentionsInputHandle } from './MentionsInput';
import SuggestItem from './SuggestItem';
import { ChatBoxToolbarWrapper } from './components';
import { useClickUpToEditMessage, useEmojiPicker, useFocusEditor, useFocusManager, useKeyboardHandler } from './hooks';
import parseHtmlAsFormattedText, { ApiMessageEntityTypes } from './parseHtmlAsFormattedText';
import processMention from './processMention';
import { getCanvasTitles } from './utils/canvas';

interface SlashCommand extends MentionData {
	description: string;
	action_msg?: string;
}

const slashCommands: SlashCommand[] = [
	{
		id: 'ephemeral',
		display: 'ephemeral',
		description: 'Send an ephemeral message (only visible to selected user)'
	}
];

const EMOJI_ACTION_TOOLBAR_E2E: EmojiActionToolbarE2E = {
	gif: 'chat.mention.gif',
	sticker: 'chat.mention.sticker',
	emoji: 'chat.mention.emoji',
	mic: 'chat.mention.voice'
};

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
	dataE2E?: string;
}

export const MentionReactBase = memo((props: MentionReactBaseProps): ReactElement => {
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
		updateDraft,
		dataE2E
	} = props;

	const dispatch = useAppDispatch();
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const anonymousMode = useSelector(selectAnonymousMode);
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

	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;

	const userProfile = useSelector(selectAllAccount);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
	const allChannels = useAppSelector(selectAllChannels);
	const allHashtagDm = useAppSelector(selectAllHashtagDm);
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

	const handleSendInternal = useCallback(
		(checkedRequest: RequestInput, anonymousMessage?: boolean) => {
			//TODO: break logic send width thread box, channel, topic box, dm
			if (props.isThread && !nameValueThread?.trim() && !props.isTopic && !threadCurrentChannel) {
				dispatch(threadsActions.setNameThreadError(threadError.name));
				return;
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

				const usersNotExistingInThread: string[] = [];
				if (props.membersOfChild && props.membersOfParent) {
					mentionList.forEach((mention) => {
						if (mention.user_id) {
							const existsInChild = props.membersOfChild?.some((member) => member.user?.id === mention.user_id);
							const existsInParent = props.membersOfParent?.some((member) => member.user?.id === mention.user_id);

							if (!existsInChild && existsInParent) {
								usersNotExistingInThread.push(mention.user_id);
							}
						}
					});
				}

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

				const addMentionToPayload = addMention(payload, mentionList);
				const removeEmptyOnPayload = filterEmptyArrays(addMentionToPayload);

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
					addMemberToThread(currentChannel!, usersNotExistingInThread);
				}

				if (checkIsThread(currentChannel as ChannelsEntity) && currentChannel?.active === ThreadStatus.activePublic && joinningToThread) {
					dispatch(threadsActions.updateActiveCodeThread({ channelId: currentChannel.channel_id ?? '', activeCode: ThreadStatus.joined }));
					joinningToThread(currentChannel, [userProfile?.user?.id ?? '']);
				}

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
						ephemeralTargetUserId || undefined
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
						ephemeralTargetUserId || undefined
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
						ephemeralTargetUserId || undefined
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
						ephemeralTargetUserId || undefined
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

			const mentionsFromEntities = (checkedRequest.entities || [])
				.filter((entity: EntityWithMention) => entity.type === 'MessageEntityMentionName')
				.map((entity: EntityWithMention) => {
					const mentionText = checkedRequest.content.substring(entity.offset, entity.offset + entity.length);
					return {
						id: entity.userId || '',
						display: mentionText,
						plainTextIndex: entity.offset,
						index: entity.offset,
						childIndex: 0,
						length: entity.length
					};
				});

			const mentionsToProcess = mentionsFromEntities.length > 0 ? mentionsFromEntities : [];

			const { mentionList, hashtagList, emojiList, usersNotExistingInThread } = processMention(
				mentionsToProcess,
				rolesClan,
				props.membersOfChild as ChannelMembersEntity[],
				props.membersOfParent as ChannelMembersEntity[],
				dataReferences?.message_sender_id || ''
			);

			const { content: text, entities } = checkedRequest;
			const mk: IMarkdownOnMessage[] = processMarkdownEntities(text, entities);

			const boldMarkdownArr = processBoldEntities(mentionsToProcess, mk);

			const { adjustedMentionsPos, adjustedHashtagPos, adjustedEmojiPos } = adjustPos(mk, mentionList, hashtagList, emojiList, text);
			const payload: {
				t: string;
				hg: IHashtagOnMessage[];
				ej: IEmojiOnMessage[];
				mk: IMarkdownOnMessage[];
				cvtt?: Record<string, string>;
			} = {
				t: text,
				hg: adjustedHashtagPos as IHashtagOnMessage[],
				ej: adjustedEmojiPos as IEmojiOnMessage[],
				mk: [...mk, ...boldMarkdownArr]
			};

			const canvasLinks = extractCanvasIdsFromText(text || '');
			const canvasTitles = getCanvasTitles(canvasLinks);
			if (Object.keys(canvasTitles).length > 0) {
				payload.cvtt = canvasTitles;
			}

			const addMentionToPayload = addMention(payload, adjustedMentionsPos);
			const removeEmptyOnPayload = filterEmptyArrays(addMentionToPayload);
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
					dispatch(threadsActions.setMessageThreadError(threadError.message));
					dispatch(threadsActions.setNameThreadError(threadError.name));
					return;
				}
				if (props.isThread && !threadCurrentChannel) {
					dispatch(threadsActions.setMessageThreadError(threadError.message));
				}
				return;
			}
			if (!nameValueThread?.trim() && props.isThread && !props.isTopic && !threadCurrentChannel && !openThreadMessageState) {
				dispatch(threadsActions.setNameThreadError(threadError.name));
				return;
			}
			if (checkIsThread(currentChannel as ChannelsEntity) && usersNotExistingInThread.length > 0 && addMemberToThread) {
				addMemberToThread(currentChannel!, usersNotExistingInThread);
			}

			if (checkIsThread(currentChannel as ChannelsEntity) && currentChannel?.active === ThreadStatus.activePublic && joinningToThread) {
				dispatch(threadsActions.updateActiveCodeThread({ channelId: currentChannel.channel_id ?? '', activeCode: ThreadStatus.joined }));
				joinningToThread(currentChannel, [userProfile?.user?.id ?? '']);
			}

			if (isReplyOnChannel) {
				props.onSend(
					filterEmptyArrays(payload),
					isPasteMulti ? mentionUpdated : adjustedMentionsPos,
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
					adjustedMentionsPos,
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
					isPasteMulti ? mentionUpdated : adjustedMentionsPos,
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
			setSubPanelActive
		]
	);

	const { onKeyDown } = useKeyboardHandler({
		editorRef: editorElementRef as RefObject<HTMLDivElement>,
		updateDraft: updateDraft || (() => { /* no-op */ }),
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
		if (isDm) {
			return allHashtagDm
				.map((item) => ({
					id: item?.channel_id ?? '',
					display: item?.channel_label ?? '',
					subText: item?.clan_name ?? ''
				}))
				.filter((mention) => mention.id || mention.display || mention.subText);
		} else {
			return allChannels
				.map((item) => ({
					id: item?.channel_id ?? '',
					display: item?.channel_label ?? '',
					subText: item?.category_name ?? ''
				}))
				.filter((mention) => mention.id || mention.display || mention.subText);
		}
	}, [isDm, allHashtagDm, allChannels]);

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

		dispatch(threadsActions.setMessageThreadError(''));
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
		// const onlyMention = filterMentionsWithAtSign(newMentions);
		// const convertToMarkUpString = formatMentionsToString(onlyMention);
		// const convertToPlainTextString = getDisplayMention(onlyMention);
		// const rolesClan = selectAllRolesClan(store.getState());

		// const mentionUpdated = convertMentionOnfile(rolesClan, convertToPlainTextString, onlyMention as MentionItem[]);
		// setDisplayPlaintext(convertToPlainTextString);
		// setDisplayMarkup(convertToMarkUpString);
		setMentionUpdated(mentionUpdated);

		if (!isPasteMulti) {
			// setDisplayPlaintext(convertToPlainTextString);
			// setDisplayMarkup(convertToMarkUpString);
			setMentionUpdated(mentionUpdated);
		} else {
			setDisplayPlaintext(newPlainTextValue);
			setDisplayMarkup(newValue);
			// const { mentionList } = processMention(
			// 	[...(draftRequest?.mentionRaw || [])],
			// 	rolesClan,
			// 	props.membersOfChild as ChannelMembersEntity[],
			// 	props.membersOfParent as ChannelMembersEntity[],
			// 	''
			// );

			// setMentionUpdated(mentionList);
			updateDraft?.({
				valueTextInput: newValue,
				content: newPlainTextValue,
				mentionRaw: newMentions as any[] || [],
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
			const builtInCommands = slashCommands.filter((cmd) => cmd.display.toLowerCase().includes(search.toLowerCase()));

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
					const builtInCommands = slashCommands.filter((cmd) => cmd.display.toLowerCase().includes(search.toLowerCase()));
					return builtInCommands;
				}
			}
		},
		[props.currentChannelId, generateCommandsList, dispatch]
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
					className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-theme-primary   pointer-events-none z-10 truncate transition-opacity duration-300 ${
						draftRequest?.valueTextInput ? 'hidden' : 'opacity-100'
					} sm:opacity-100 max-sm:opacity-100`}
					style={{
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						maxWidth: 'calc(100% - 120px)',
						paddingRight: '8px'
					}}
				>
					{ephemeralTargetUserId ? `Ephemeral message to ${ephemeralTargetUserDisplay}...` : 'Write your thoughts here...'}
				</span>
				<MentionsInput
					id={CHANNEL_INPUT_ID}
					ref={editorRef}
					value={draftRequest?.valueTextInput ?? ''}
					onChange={onChangeMentionInput}
					onKeyDown={onKeyDown}
					placeholder={ephemeralTargetUserId ? `Ephemeral message to ${ephemeralTargetUserDisplay}...` : 'Write your thoughts here...'}
					className={`mentions min-h-11 text-theme-message rounded-lg`}
					style={{
						padding: props.isThread && !threadCurrentChannel ? '10px' : '9px 120px 9px 9px',
						border: 'none',
						maxHeight: '350px',
						overflow: 'auto',
						borderRadius: '8px'
					}}
					onSend={(formattedText: FormattedText) => {
						handleSendWithFormattedText(formattedText, anonymousMode);
					}}
					onHandlePaste={props.handlePaste}
					enableUndoRedo={true}
					maxHistorySize={50}
					hasFilesToSend={attachmentData.length > 0}
					currentChannelId={props.currentChannelId}
					dataE2E={generateE2eId('chat.mention.input', dataE2E)}
				>
					<Mention
						trigger="@"
						title="MEMBERS"
						data={handleSearchUserMention}
						renderSuggestion={(
							suggestion: any,
							search: string,
							_highlightedDisplay: React.ReactNode,
							_index: number,
							focused: boolean
						) => {
							return (
								<div
									className={`bg-ping-member mention-item flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-[var(--bg-item-hover)] text-white' : ''
									}`}
								>
									<SuggestItem
										avatarUrl={suggestion.avatarUrl}
										valueHightLight={search}
										wrapSuggestItemStyle="justify-between w-full"
										subText={
											suggestion.display === TITLE_MENTION_HERE
												? 'Notify everyone who has permission to see this channel'
												: (suggestion.username ?? '')
										}
										subTextStyle={(suggestion.display === TITLE_MENTION_HERE ? 'normal-case' : 'lowercase') + ' text-xs'}
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
						title="TEXT CHANNELS"
						displayPrefix="#"
						data={hashtagData}
						renderSuggestion={(suggestion, search, _highlightedDisplay, _index, focused) => (
							<div
								key={suggestion.id}
								className={`bg-ping-member mention-item flex items-center px-3 py-2 cursor-pointer rounded-lg ${
									focused ? 'bg-[var(--bg-item-hover)] text-white' : ''
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
						title="EMOJI MATCHING"
						trigger=":"
						markup="::[__display__](__id__)"
						data={queryEmojis}
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
									className={`bg-ping-member mention-item flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-[var(--bg-item-hover)] text-white' : ''
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
						title="COMMANDS"
						data={handleSearchSlashCommands}
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
										<span>Loading commands...</span>
									</div>
								);
							}
							return (
								<div
									key={suggestion.id}
									className={`bg-ping-member mention-item flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-[var(--bg-item-hover)] text-white' : ''
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
				dataE2E={EMOJI_ACTION_TOOLBAR_E2E}
			/>
			{draftRequest?.content && draftRequest.content.length > MIN_THRESHOLD_CHARS && (
				<div className="w-16 text-red-300 bottom-0 right-0 absolute">{MIN_THRESHOLD_CHARS - draftRequest.content.length}</div>
			)}
		</div>
	);
});

MentionReactBase.displayName = 'MentionReactBase';
