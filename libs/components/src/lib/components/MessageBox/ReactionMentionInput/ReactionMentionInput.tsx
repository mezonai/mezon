import {
	useChannelMembers,
	useClickUpToEdit,
	useCurrentChat,
	useEmojiSuggestionContext,
	useGifsStickersEmoji,
	useHandlePopupQuickMess,
	useMessageValue,
	useReference,
	useThreads,
	useTopics
} from '@mezon/core';
import {
	ChannelsEntity,
	RootState,
	appActions,
	e2eeActions,
	emojiSuggestionActions,
	messagesActions,
	referencesActions,
	selectAllAccount,
	selectAllChannels,
	selectAllHashtagDm,
	selectAllRolesClan,
	selectAllUserClans,
	selectAnonymousMode,
	selectAttachmentByChannelId,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentTopicId,
	selectDataReferences,
	selectDirectById,
	selectDmGroupCurrentId,
	selectHasKeyE2ee,
	selectIdMessageRefEdit,
	selectIsFocusOnChannelInput,
	selectIsFocused,
	selectIsSearchMessage,
	selectIsShowMemberList,
	selectIsShowMemberListDM,
	selectIsShowPopupQuickMess,
	selectIsUseProfileDM,
	selectLassSendMessageEntityBySenderId,
	selectOpenEditMessageState,
	selectOpenThreadMessageState,
	selectOpenTopicMessageState,
	selectReactionRightState,
	selectRolesClanEntities,
	selectStatusMenu,
	selectTheme,
	selectThreadCurrentChannel,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	CHANNEL_INPUT_ID,
	ChannelMembersEntity,
	GENERAL_INPUT_ID,
	HistoryItem,
	IEmojiOnMessage,
	IHashtagOnMessage,
	IMarkdownOnMessage,
	IMentionOnMessage,
	MEZON_MENTIONS_COPY_KEY,
	MIN_THRESHOLD_CHARS,
	MentionDataProps,
	MentionReactInputProps,
	RequestInput,
	SubPanelName,
	TITLE_MENTION_HERE,
	ThreadStatus,
	addMention,
	adjustPos,
	blankReferenceObj,
	checkIsThread,
	convertMentionOnfile,
	filterEmptyArrays,
	filterMentionsWithAtSign,
	focusToElement,
	formatMentionsToString,
	generateMentionItems,
	getDisplayMention,
	getMarkupInsertIndex,
	insertStringAt,
	parseHtmlAsFormattedText,
	parsePastedMentionData,
	processMarkdownEntities,
	searchMentionsHashtag,
	threadError,
	transformTextWithMentions,
	updateMentionPositions
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageMention } from 'mezon-js/api.gen';
import React, { KeyboardEvent, ReactElement, RefObject, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mention, MentionItem, MentionsInput, OnChangeHandlerFunc } from 'react-mentions';
import { useSelector, useStore } from 'react-redux';
import textFieldEdit from 'text-field-edit';
import GifStickerEmojiButtons from '../GifsStickerEmojiButtons';
import CustomModalMentions from './CustomModalMentions';
import {
	defaultMaxWidth,
	maxWidthWithChatThread,
	maxWidthWithDmGroupMemberList,
	maxWidthWithDmUserProfile,
	maxWidthWithMemberList,
	maxWidthWithSearchMessage,
	widthDmGroupMemberList,
	widthDmUserProfile,
	widthMessageViewChat,
	widthMessageViewChatThread,
	widthSearchMessage,
	widthThumbnailAttachment
} from './CustomWidth';
import lightMentionsInputStyle from './LightRmentionInputStyle';
import darkMentionsInputStyle from './RmentionInputStyle';
import mentionStyle from './RmentionStyle';
import SuggestItem from './SuggestItem';
import processMention from './processMention';

type ChannelsMentionProps = {
	id: string;
	display: string;
	subText: string;
};

export const MentionReactInput = memo((props: MentionReactInputProps): ReactElement => {
	const appStore = useStore();
	const channels = useSelector(selectAllChannels);
	const rolesClan = useSelector(selectAllRolesClan);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const { addMemberToThread, joinningToThread } = useChannelMembers({ channelId: currentChannelId, mode: props.mode ?? 0 });
	const dispatch = useAppDispatch();
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const openTopicMessageState = useSelector(selectOpenTopicMessageState);
	const { setSubPanelActive } = useGifsStickersEmoji();
	const commonChannelDms = useSelector(selectAllHashtagDm);
	const [mentionData, setMentionData] = useState<ApiMessageMention[]>([]);
	const anonymousMode = useSelector(selectAnonymousMode);
	const [mentionEveryone, setMentionEveryone] = useState(false);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const { messageThreadError, isPrivate, nameValueThread, valueThread, isShowCreateThread } = useThreads();
	const { currentTopicInitMessage } = useTopics();
	const currentChannel = useSelector(selectCurrentChannel);
	const usersClan = useSelector(selectAllUserClans);
	const { emojis, emojiPicked, addEmojiState } = useEmojiSuggestionContext();
	const currentTopicId = useSelector(selectCurrentTopicId);
	const reactionRightState = useSelector(selectReactionRightState);
	const isFocused = useSelector(selectIsFocused);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const isShowDMUserProfile = useSelector(selectIsUseProfileDM);
	const isFocusOnChannelInput = useSelector(selectIsFocusOnChannelInput);
	const { currentChatUsersEntities } = useCurrentChat();
	const isNotChannel = props.isThread || props.isTopic;
	const inputElementId = isNotChannel ? GENERAL_INPUT_ID : CHANNEL_INPUT_ID;
	const isShowEmojiPicker = !props.isThread;

	const [undoHistory, setUndoHistory] = useState<HistoryItem[]>([]);
	const [redoHistory, setRedoHistory] = useState<HistoryItem[]>([]);

	const currTopicId = useSelector(selectCurrentTopicId);
	const dataReferences = useSelector(selectDataReferences(props.currentChannelId ?? ''));
	const dataReferencesTopic = useSelector(selectDataReferences(currTopicId ?? ''));

	const { request, setRequestInput } = useMessageValue(isNotChannel ? currentChannelId + String(isNotChannel) : (currentChannelId as string));

	const { membersOfChild, membersOfParent } = useChannelMembers({ channelId: currentChannelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });

	const { mentionList, hashtagList, emojiList, usersNotExistingInThread } = useMemo(() => {
		return processMention(
			request?.mentionRaw,
			rolesClan,
			membersOfChild as ChannelMembersEntity[],
			membersOfParent as ChannelMembersEntity[],
			dataReferences?.message_sender_id || ''
		);
	}, [request?.mentionRaw, rolesClan, membersOfChild, membersOfParent, dataReferences?.message_sender_id]);

	const attachmentFilteredByChannelId = useSelector(selectAttachmentByChannelId(props.currentChannelId ?? ''));

	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;
	const isGr = props.mode === ChannelStreamMode.STREAM_MODE_GROUP;

	const userProfile = useSelector(selectAllAccount);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
	const isSearchMessage = useAppSelector((state) => selectIsSearchMessage(state, props.currentChannelId));
	const lastMessageByUserId = useSelector((state) => selectLassSendMessageEntityBySenderId(state, props.currentChannelId, userProfile?.user?.id));
	const { setOpenThreadMessageState, checkAttachment } = useReference(props.currentChannelId || '');
	const [valueHighlight, setValueHightlight] = useState<string>('');
	const [titleModalMention, setTitleModalMention] = useState('');
	const [displayPlaintext, setDisplayPlaintext] = useState<string>('');
	const [displayMarkup, setDisplayMarkup] = useState<string>('');
	const [mentionUpdated, setMentionUpdated] = useState<IMentionOnMessage[]>([]);
	const [isPasteMulti, setIsPasteMulti] = useState<boolean>(false);
	const directMessage = useAppSelector((state) => selectDirectById(state, props.currentChannelId));
	const hasKeyE2ee = useSelector(selectHasKeyE2ee);

	const queryEmojis = (query: string, callback: (data: any[]) => void) => {
		if (query.length === 0) return;
		const seenIds = new Set();
		const matches = emojis
			.filter((emoji) => emoji.shortname && emoji.shortname.toLowerCase().indexOf(query.toLowerCase()) > -1)
			.filter((emoji) => {
				if (emoji.id && !seenIds.has(emoji.id)) {
					seenIds.add(emoji.id);
					return true;
				}
				return false;
			})
			.slice(0, 20)
			.map((emojiDisplay) => ({ id: emojiDisplay?.id, display: emojiDisplay?.shortname }));

		callback(matches);
	};

	const { trackEnterPress } = useEnterPressTracker();
	const isShowPopupQuickMess = useSelector(selectIsShowPopupQuickMess);
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
					isNotChannel
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
					isNotChannel
				);
			}
		}

		switch (key) {
			case 'Enter': {
				if (shiftKey || isComposing) {
					return;
				} else {
					event.preventDefault();
					trackEnterPress();
					handleSend(anonymousMode);
					return;
				}
			}
			default: {
				return;
			}
		}
	};

	const editorRef = useRef<HTMLInputElement | null>(null);
	const openEditMessageState = useSelector(selectOpenEditMessageState);

	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);

	const attachmentData = useMemo(() => {
		if (attachmentFilteredByChannelId === null) {
			return [];
		} else {
			return attachmentFilteredByChannelId.files;
		}
	}, [attachmentFilteredByChannelId?.files]);

	const isReplyOnChannel = dataReferences.message_ref_id && !props.isTopic ? true : false;
	const isReplyOnTopic = dataReferencesTopic.message_ref_id && props.isTopic ? true : false;
	const isSendMessageOnThreadBox = openThreadMessageState && !props.isTopic ? true : false;

	const hasToken = mentionList.length > 0 || hashtagList.length > 0 || emojiList.length > 0; // no remove trim() if message has token

	const handleSend = useCallback(
		(anonymousMessage?: boolean) => {
			const emptyRequest: RequestInput = {
				content: '',
				valueTextInput: '',
				mentionRaw: []
			};
			const checkedRequest = request ? request : emptyRequest;
			const { text, entities } = parseHtmlAsFormattedText(hasToken ? checkedRequest.content : checkedRequest.content.trim());
			const mk: IMarkdownOnMessage[] = processMarkdownEntities(text, entities);
			const { adjustedMentionsPos, adjustedHashtagPos, adjustedEmojiPos } = adjustPos(mk, mentionList, hashtagList, emojiList, text);
			const payload = {
				t: text,
				hg: adjustedHashtagPos as IHashtagOnMessage[],
				ej: adjustedEmojiPos as IEmojiOnMessage[],
				mk
			};

			const addMentionToPayload = addMention(payload, adjustedMentionsPos);
			const removeEmptyOnPayload = filterEmptyArrays(addMentionToPayload);
			const encoder = new TextEncoder();
			const payloadJson = JSON.stringify(removeEmptyOnPayload);
			const utf8Bytes = encoder.encode(payloadJson);

			if (utf8Bytes.length > MIN_THRESHOLD_CHARS && props.handleConvertToFile) {
				setIsPasteMulti(true);
				props.handleConvertToFile(payload.t ?? '');
				setRequestInput(
					{
						...checkedRequest,
						valueTextInput: displayMarkup,
						content: displayPlaintext
					},
					isNotChannel
				);

				return;
			}

			if ((!text && !checkAttachment) || ((request?.valueTextInput || '').trim() === '' && !checkAttachment)) {
				return;
			}

			if (
				request?.valueTextInput &&
				typeof request?.valueTextInput === 'string' &&
				!(request?.valueTextInput || '').trim() &&
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
			if (checkIsThread(currentChannel as ChannelsEntity) && usersNotExistingInThread.length > 0) {
				addMemberToThread(currentChannel, usersNotExistingInThread);
			}

			if (checkIsThread(currentChannel as ChannelsEntity) && currentChannel?.active === ThreadStatus.activePublic) {
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
					mentionEveryone
				);

				setMentionEveryone(false);
				dispatch(
					referencesActions.setDataReferences({
						channelId: props.currentChannelId ?? '',
						dataReferences: blankReferenceObj
					})
				);
				dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue: '' }));
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
					mentionEveryone
				);
				dispatch(
					referencesActions.setAtachmentAfterUpload({
						channelId: props.currentChannelId ?? '',
						files: []
					})
				);
				setRequestInput({ ...request, valueTextInput: '', content: '' }, true);
				setOpenThreadMessageState(false);
			} else if (isReplyOnTopic) {
				props.onSend(
					filterEmptyArrays(payload),
					adjustedMentionsPos,
					attachmentData,
					[dataReferencesTopic],
					{ nameValueThread, isPrivate },
					anonymousMessage,
					mentionEveryone
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
					mentionEveryone
				);

				setMentionEveryone(false);
				dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue: '' }));
				setMentionData([]);
				dispatch(threadsActions.setIsPrivate(0));
			}
			setRequestInput({ ...request, valueTextInput: '', content: '' }, isNotChannel);
			setSubPanelActive(SubPanelName.NONE);
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
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			request,
			hashtagList,
			emojiList,
			mentionData,
			nameValueThread,
			props,
			threadCurrentChannel,
			openThreadMessageState,
			dataReferences,
			dispatch,
			setSubPanelActive,
			isPrivate,
			mentionEveryone,
			addMemberToThread,
			currentChannel,
			usersClan,
			currentChannelId,
			valueThread?.content.t,
			valueThread?.mentions,
			valueThread?.attachments,
			valueThread?.references,
			setOpenThreadMessageState,
			setRequestInput
		]
	);

	const listChannelsMention: ChannelsMentionProps[] = useMemo(() => {
		if (!isGr && !isDm) {
			return channels
				.map((item) => ({
					id: item?.channel_id ?? '',
					display: item?.channel_label ?? '',
					subText: item?.category_name ?? ''
				}))
				.filter((mention) => mention.id || mention.display || mention.subText) as ChannelsMentionProps[];
		}
		return [];
	}, [props.mode, channels]);

	const commonChannelsMention: ChannelsMentionProps[] = useMemo(() => {
		if (isDm) {
			return commonChannelDms
				.map((item) => ({
					id: item?.channel_id ?? '',
					display: item?.channel_label ?? '',
					subText: item?.clan_name ?? ''
				}))
				.filter((mention) => mention.id || mention.display || mention.subText) as ChannelsMentionProps[];
		}
		return [];
	}, [props.mode, commonChannelDms]);

	const [pastedContent, setPastedContent] = useState<string>('');
	const prevValueRef = useRef('');
	const prevPlainTextRef = useRef('');

	useEffect(() => {
		prevValueRef.current = request?.valueTextInput;
	}, [request?.valueTextInput]);

	useEffect(() => {
		prevPlainTextRef.current = request?.content;
	}, [request?.content]);

	const onChangeMentionInput: OnChangeHandlerFunc = (event, newValue, newPlainTextValue, mentions) => {
		const previousValue = prevValueRef.current;
		const previousPlainText = prevPlainTextRef.current;
		const newMentions = updateMentionPositions(mentions, newValue, newPlainTextValue);
		dispatch(threadsActions.setMessageThreadError(''));
		setUndoHistory((prevUndoHistory) => [
			...prevUndoHistory,
			{
				valueTextInput: request?.valueTextInput || '',
				content: request?.content || '',
				mentionRaw: request?.mentionRaw || []
			}
		]);
		setRedoHistory([]);
		setRequestInput(
			{
				...request,
				valueTextInput: newValue,
				content: newPlainTextValue,
				mentionRaw: newMentions
			},
			isNotChannel
		);
		if (newMentions?.some((mention) => mention.display === TITLE_MENTION_HERE)) {
			setMentionEveryone(true);
		} else {
			setMentionEveryone(false);
		}
		if (typeof props.onTyping === 'function') {
			props.onTyping();
		}

		const onlyMention = filterMentionsWithAtSign(newMentions);
		const convertToMarkUpString = formatMentionsToString(onlyMention);
		const convertToPlainTextString = getDisplayMention(onlyMention);
		const mentionUpdated = convertMentionOnfile(rolesClan, convertToPlainTextString, onlyMention as MentionItem[]);
		setDisplayPlaintext(convertToPlainTextString);
		setDisplayMarkup(convertToMarkUpString);
		setMentionUpdated(mentionUpdated);
		if (!isPasteMulti) {
			setDisplayPlaintext(convertToPlainTextString);
			setDisplayMarkup(convertToMarkUpString);
			setMentionUpdated(mentionUpdated);
		} else {
			setDisplayPlaintext(newPlainTextValue);
			setDisplayMarkup(newValue);
			setMentionUpdated(mentionList);
			setRequestInput(
				{
					...request,
					valueTextInput: newValue,
					content: newPlainTextValue
				},
				isNotChannel
			);
			setIsPasteMulti(false);
		}

		if (
			props.handleConvertToFile !== undefined &&
			newPlainTextValue?.length > MIN_THRESHOLD_CHARS &&
			pastedContent?.length > MIN_THRESHOLD_CHARS
		) {
			props.handleConvertToFile(pastedContent);
			setRequestInput(
				{
					...request,
					valueTextInput: previousValue,
					content: previousPlainText
				},
				isNotChannel
			);
			setPastedContent('');
		}

		if (newPlainTextValue.endsWith('@')) {
			setTitleModalMention('Members');
		} else if (newPlainTextValue.endsWith('#')) {
			setTitleModalMention('Text channels');
		} else if (newPlainTextValue.endsWith(':')) {
			setTitleModalMention('Emoji matching');
		}
	};

	function handleEventAfterEmojiPicked() {
		const isEmptyEmojiPicked = emojiPicked && Object.keys(emojiPicked).length === 1 && emojiPicked[''] === '';

		if (isEmptyEmojiPicked || !editorRef?.current) {
			return;
		}
		if (emojiPicked) {
			for (const [emojiKey, emojiValue] of Object.entries(emojiPicked)) {
				const targetInputId = isFocusOnChannelInput ? CHANNEL_INPUT_ID : GENERAL_INPUT_ID;

				if (editorRef.current?.id === targetInputId) {
					textFieldEdit.insert(editorRef.current, `::[${emojiKey}](${emojiValue})${' '}`);
					dispatch(
						emojiSuggestionActions.setSuggestionEmojiObjPicked({
							shortName: '',
							id: '',
							isReset: true
						})
					);
				}
			}
		}
	}

	const clickUpToEditMessage = useCallback(() => {
		const idRefMessage = lastMessageByUserId?.id;
		if (idRefMessage && !request?.valueTextInput) {
			dispatch(referencesActions.setOpenEditMessageState(true));
			dispatch(referencesActions.setIdReferenceMessageEdit(lastMessageByUserId));
			dispatch(referencesActions.setIdReferenceMessageEdit(idRefMessage));
			dispatch(
				messagesActions.setChannelDraftMessage({
					channelId: props.currentChannelId as string,
					channelDraftMessage: {
						message_id: idRefMessage,
						draftContent: lastMessageByUserId?.content,
						draftMention: lastMessageByUserId.mentions ?? [],
						draftAttachment: lastMessageByUserId.attachments ?? [],
						draftTopicId: lastMessageByUserId.content.tp as string
					}
				})
			);
		}
	}, [lastMessageByUserId, props.currentChannelId, request]);

	const appearanceTheme = useSelector(selectTheme);

	const handleSearchUserMention = (search: string, callback: any) => {
		setValueHightlight(search);
		callback(searchMentionsHashtag(search, props.listMentions ?? []));
	};

	const handleSearchHashtag = (search: string, callback: any) => {
		setValueHightlight(search);
		if (isDm) {
			callback(searchMentionsHashtag(search, commonChannelsMention ?? []));
		} else {
			callback(searchMentionsHashtag(search, listChannelsMention ?? []));
		}
	};

	const handleFocusInput = useCallback(() => {
		dispatch(appActions.setIsFocusOnChannelInput(!isNotChannel));
	}, [isNotChannel]);

	useClickUpToEdit(editorRef, request?.valueTextInput, clickUpToEditMessage);

	const handleFocusOnEditorElement = (
		isFocusOnChannelInput: boolean,
		editorRef: RefObject<HTMLInputElement | HTMLDivElement | HTMLUListElement>
	) => {
		const targetEditorId = isFocusOnChannelInput ? CHANNEL_INPUT_ID : GENERAL_INPUT_ID;
		if (editorRef.current?.id === targetEditorId) {
			focusToElement(editorRef);
		}
	};

	useEffect(() => {
		if ((closeMenu && statusMenu) || openEditMessageState || isShowPopupQuickMess) {
			return editorRef?.current?.blur();
		}
		if (dataReferences.message_ref_id || (emojiPicked?.shortName !== '' && !reactionRightState) || (!openEditMessageState && !idMessageRefEdit)) {
			handleFocusOnEditorElement(isFocusOnChannelInput, editorRef);
		}
	}, [dataReferences.message_ref_id, emojiPicked, openEditMessageState, idMessageRefEdit, isShowPopupQuickMess]);

	useEffect(() => {
		handleEventAfterEmojiPicked();
	}, [emojiPicked, addEmojiState]);

	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	useEffect(() => {
		if ((currentChannelId !== undefined || currentDmGroupId !== undefined) && !closeMenu) {
			handleFocusOnEditorElement(isFocusOnChannelInput, editorRef);
		}
	}, [currentChannelId, currentDmGroupId]);

	useEffect(() => {
		if (isFocused || attachmentFilteredByChannelId?.files.length > 0) {
			handleFocusOnEditorElement(isFocusOnChannelInput, editorRef);
			dispatch(messagesActions.setIsFocused(false));
		}
	}, [dispatch, isFocused, attachmentFilteredByChannelId?.files]);

	const [mentionWidth, setMentionWidth] = useState('');
	const [chatBoxMaxWidth, setChatBoxMaxWidth] = useState('');

	useEffect(() => {
		if (isDm) {
			setMentionWidth(isShowDMUserProfile ? widthDmUserProfile : widthThumbnailAttachment);
			setChatBoxMaxWidth(isShowDMUserProfile ? maxWidthWithDmUserProfile : defaultMaxWidth);
		} else if (isGr) {
			setMentionWidth(isShowMemberListDM ? widthDmGroupMemberList : widthThumbnailAttachment);
			setChatBoxMaxWidth(isShowMemberListDM ? maxWidthWithDmGroupMemberList : defaultMaxWidth);
		} else {
			setMentionWidth(
				isShowMemberList
					? widthMessageViewChat
					: isShowCreateThread
						? widthMessageViewChatThread
						: isSearchMessage
							? widthSearchMessage
							: widthThumbnailAttachment
			);
			setChatBoxMaxWidth(
				isShowMemberList
					? maxWidthWithMemberList
					: isShowCreateThread
						? maxWidthWithChatThread
						: isSearchMessage
							? maxWidthWithSearchMessage
							: defaultMaxWidth
			);
		}
	}, [currentChannel, isSearchMessage, isShowCreateThread, isShowDMUserProfile, isShowMemberList, isShowMemberListDM, props.mode]);

	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.removeAttribute('aria-hidden');
		}
	}, []);

	const onPasteMentions = useCallback(
		(event: React.ClipboardEvent<HTMLTextAreaElement>) => {
			const pastedData = event.clipboardData.getData(MEZON_MENTIONS_COPY_KEY);

			if (!pastedData) return;

			const parsedData = parsePastedMentionData(pastedData);

			if (!parsedData) return;

			const { message: pastedContent, startIndex, endIndex } = parsedData;
			const currentInputValueLength = (request?.valueTextInput ?? '').length;
			const currentFocusIndex = editorRef.current?.selectionStart as number;
			const appState = appStore.getState() as RootState;
			const clanRolesEntities = selectRolesClanEntities(appState);

			const transformedText =
				pastedContent?.content?.t && pastedContent?.mentions
					? transformTextWithMentions(
							pastedContent.content.t?.slice(startIndex, endIndex),
							pastedContent.mentions,
							currentChatUsersEntities,
							clanRolesEntities
						)
					: pastedContent?.content?.t || '';

			const mentionRaw = generateMentionItems(
				pastedContent?.mentions || [],
				transformedText,
				currentChatUsersEntities,
				currentInputValueLength
			);

			const { mentionList } = processMention(
				[...(request?.mentionRaw || []), ...mentionRaw],
				rolesClan,
				membersOfChild as ChannelMembersEntity[],
				membersOfParent as ChannelMembersEntity[]
			);

			const transformedTextInsertIndex = getMarkupInsertIndex(currentFocusIndex, mentionList, currentChatUsersEntities, clanRolesEntities);

			setRequestInput(
				{
					...request,
					valueTextInput: insertStringAt(request?.valueTextInput || '', transformedText || '', transformedTextInsertIndex),
					content: insertStringAt(request?.content || '', pastedContent?.content?.t?.slice(startIndex, endIndex) || '', currentFocusIndex),
					mentionRaw: [...(request?.mentionRaw || []), ...mentionRaw]
				},
				isNotChannel
			);

			const newFocusIndex = currentFocusIndex + (pastedContent?.content?.t?.slice(startIndex, endIndex) || '').length;
			setTimeout(() => {
				editorRef.current?.focus();
				editorRef.current?.setSelectionRange(newFocusIndex, newFocusIndex);
			}, 0);

			event.preventDefault();
		},
		[request, editorRef, currentChatUsersEntities, setRequestInput, props.isThread]
	);

	const handleShowModalE2ee = () => {
		if (directMessage && directMessage?.e2ee && !hasKeyE2ee) {
			dispatch(e2eeActions.setOpenModalE2ee(true));
		}
	};

	return (
		<div className="contain-layout relative">
			<MentionsInput
				onPaste={(event) => {
					const pastedData = event.clipboardData.getData(MEZON_MENTIONS_COPY_KEY);
					if (pastedData) {
						onPasteMentions(event);
						event.preventDefault();
					} else {
						event.preventDefault();
						const pastedText = event.clipboardData.getData('text');
						setPastedContent(pastedText);
					}
				}}
				onPasteCapture={async (event) => {
					if (event.clipboardData.getData(MEZON_MENTIONS_COPY_KEY)) {
						event.preventDefault();
					} else {
						if (props.handlePaste) {
							await props.handlePaste(event);
						}
					}
				}}
				id={inputElementId}
				inputRef={editorRef}
				placeholder="Write your thoughts here..."
				value={request?.valueTextInput ?? ''}
				onChange={onChangeMentionInput}
				style={{
					...(appearanceTheme === 'light' ? lightMentionsInputStyle : darkMentionsInputStyle),
					suggestions: {
						...(appearanceTheme === 'light' ? lightMentionsInputStyle.suggestions : darkMentionsInputStyle.suggestions),
						width: `${!closeMenu ? mentionWidth : '90vw'}`,
						left: `${!closeMenu ? '-40px' : '-30px'}`
					},

					'&multiLine': {
						highlighter: {
							padding: props.isThread && !threadCurrentChannel ? '10px' : '9px 120px 9px 9px',
							border: 'none',
							maxHeight: '350px',
							overflow: 'auto'
						},
						input: {
							padding: props.isThread && !threadCurrentChannel ? '10px' : '9px 120px 9px 9px',
							border: 'none',
							outline: 'none',
							maxHeight: '350px',
							overflow: 'auto'
						}
					}
				}}
				className={` min-h-11 dark:bg-channelTextarea  bg-channelTextareaLight dark:text-white text-colorTextLightMode rounded-lg ${appearanceTheme === 'light' ? 'lightMode lightModeScrollBarMention' : 'darkMode'} cursor-not-allowed`}
				allowSpaceInQuery={true}
				onKeyDown={onKeyDown}
				forceSuggestionsAboveCursor={true}
				customSuggestionsContainer={(children: React.ReactNode) => {
					return (
						<CustomModalMentions
							isThreadBoxOrTopicBox={props.isThread || props.isTopic}
							children={children}
							titleModalMention={titleModalMention}
						/>
					);
				}}
				onClick={handleShowModalE2ee}
			>
				<Mention
					appendSpaceOnAdd={true}
					data={handleSearchUserMention}
					trigger="@"
					displayTransform={(id: any, display: any) => {
						return display === '@here' ? `${display}` : `@${display}`;
					}}
					renderSuggestion={(suggestion: MentionDataProps) => {
						return (
							<SuggestItem
								valueHightLight={valueHighlight}
								avatarUrl={suggestion.avatarUrl}
								subText={
									suggestion.display === '@here'
										? 'Notify everyone who has permission to see this channel'
										: (suggestion.username ?? '')
								}
								subTextStyle={(suggestion.display === '@here' ? 'normal-case' : 'lowercase') + ' text-xs'}
								showAvatar={suggestion.display !== '@here'}
								display={suggestion.display}
								emojiId=""
								color={suggestion.color}
							/>
						);
					}}
					style={mentionStyle}
					className="dark:bg-[#3B416B] bg-bgLightModeButton"
				/>
				<Mention
					markup="#[__display__](__id__)"
					appendSpaceOnAdd={true}
					data={handleSearchHashtag}
					trigger="#"
					displayTransform={(id: any, display: any) => {
						return `#${display}`;
					}}
					style={mentionStyle}
					renderSuggestion={(suggestion) =>
						suggestion?.id && suggestion?.display ? (
							<SuggestItem
								valueHightLight={valueHighlight}
								display={suggestion.display}
								symbol="#"
								subText={(suggestion as ChannelsMentionProps).subText}
								channelId={suggestion.id}
								emojiId=""
							/>
						) : null
					}
					className="dark:bg-[#3B416B] bg-bgLightModeButton"
				/>
				<Mention
					trigger=":"
					markup="::[__display__](__id__)"
					data={queryEmojis}
					displayTransform={(id: any, display: any) => {
						return `${display}`;
					}}
					renderSuggestion={(suggestion) => {
						return (
							<SuggestItem display={suggestion.display ?? ''} symbol={(suggestion as any).emoji} emojiId={suggestion.id as string} />
						);
					}}
					className="dark:bg-[#3B416B] bg-bgLightModeButton"
					appendSpaceOnAdd={true}
				/>
			</MentionsInput>
			{isShowEmojiPicker && (
				<GifStickerEmojiButtons
					activeTab={SubPanelName.NONE}
					currentClanId={props.currentClanId}
					hasPermissionEdit={props.hasPermissionEdit || true}
					voiceLongPress={props.voiceLongPress}
					isRecording={props.isRecording}
					focusTargetInput={handleFocusInput}
				/>
			)}
			{request?.content?.length > MIN_THRESHOLD_CHARS && (
				<div className="w-16 text-red-300 bottom-0 right-0 absolute">{MIN_THRESHOLD_CHARS - request?.content?.length}</div>
			)}
		</div>
	);
});

MentionReactInput.displayName = 'MentionReactInput';

const useEnterPressTracker = () => {
	const [enterCount, setEnterCount] = useState(0);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const { handleOpenPopupQuickMess } = useHandlePopupQuickMess();

	const resetEnterCount = () => {
		setEnterCount(0);
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	};

	const trackEnterPress = () => {
		setEnterCount((prev) => prev + 1);

		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(resetEnterCount, 1000);
	};

	useEffect(() => {
		if (enterCount >= 8) {
			resetEnterCount();
			handleOpenPopupQuickMess();
		}
	}, [enterCount, handleOpenPopupQuickMess]);

	return { trackEnterPress };
};
