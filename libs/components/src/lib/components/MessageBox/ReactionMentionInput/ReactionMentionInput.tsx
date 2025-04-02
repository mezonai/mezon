import {
	getCurrentChatData,
	useChannelMembers,
	useClickUpToEdit,
	useEmojiSuggestionContext,
	useGifsStickersEmoji,
	useHandlePopupQuickMess,
	useMessageValue,
	useReference,
	useThreads
} from '@mezon/core';
import {
	ChannelsEntity,
	appActions,
	emojiSuggestionActions,
	getStore,
	messagesActions,
	referencesActions,
	selectAllAccount,
	selectAllChannels,
	selectAllHashtagDm,
	selectAllRolesClan,
	selectAnonymousMode,
	selectAttachmentByChannelId,
	selectCloseMenu,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentTopicId,
	selectDataReferences,
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
	selectReactionRightState,
	selectRequestByChannelId,
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
	EBacktickType,
	ETypeMEntion,
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
	handleBoldShortCut,
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
import { Mention, MentionItem, MentionsInput } from 'react-mentions';
import { useSelector } from 'react-redux';
import textFieldEdit from 'text-field-edit';
import GifStickerEmojiButtons from '../GifsStickerEmojiButtons';
import CustomModalMentions from './CustomModalMentions';
import {
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

// update type later
export interface MentionReactBaseProps extends MentionReactInputProps {
	mentionWidth: string;
	handleSearchHashtag?: (search: string, callback: any) => void;
	addMemberToThread?: any;
	joinningToThread?: any;
	threadCurrentChannel?: any;
	currentChannel?: any;
	setOpenThreadMessageState?: any;
	checkAttachment?: any;
	request?: any;
	setRequestInput?: any;
	openThreadMessageState?: any;
	isShowCreateThread?: any;
	nameValueThread?: any;
	valueThread?: any;
	isPrivate?: any;
	membersOfChild?: any;
	membersOfParent?: any;
	dataReferences?: any;
	dataReferencesTopic?: any;
	currentDmGroupId?: string;
}

type ChannelsMentionProps = {
	id: string;
	display: string;
	subText: string;
};

export const MentionReactBase = memo((props: MentionReactBaseProps): ReactElement => {
	const editorRef = useRef<HTMLInputElement | null>(null);
	const {
		currentChannel,
		addMemberToThread,
		joinningToThread,
		request,
		threadCurrentChannel,
		isPrivate,
		nameValueThread,
		valueThread,
		setRequestInput
	} = props;
	const dispatch = useAppDispatch();
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { setSubPanelActive } = useGifsStickersEmoji();
	const anonymousMode = useSelector(selectAnonymousMode);
	const [mentionEveryone, setMentionEveryone] = useState(false);
	const { emojis, emojiPicked, addEmojiState } = useEmojiSuggestionContext();
	const reactionRightState = useSelector(selectReactionRightState);
	const isFocused = useSelector(selectIsFocused);
	const isFocusOnChannelInput = useSelector(selectIsFocusOnChannelInput);
	const isNotChannel = props.isThread || props.isTopic;
	const inputElementId = isNotChannel ? GENERAL_INPUT_ID : CHANNEL_INPUT_ID;
	const isShowEmojiPicker = !props.isThread;

	const currTopicId = useSelector(selectCurrentTopicId);
	const dataReferences = useSelector(selectDataReferences(props.currentChannelId ?? ''));
	const dataReferencesTopic = useSelector(selectDataReferences(currTopicId ?? ''));

	const attachmentFilteredByChannelId = useSelector(selectAttachmentByChannelId(props.currentChannelId ?? ''));

	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;

	const appearanceTheme = useSelector(selectTheme);
	const userProfile = useSelector(selectAllAccount);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
	const { setOpenThreadMessageState, checkAttachment } = useReference(props.currentChannelId || '');

	const [mentionData, setMentionData] = useState<ApiMessageMention[]>([]);
	const [valueHighlight, setValueHightlight] = useState<string>('');
	const [titleModalMention, setTitleModalMention] = useState('');
	const [displayPlaintext, setDisplayPlaintext] = useState<string>('');
	const [displayMarkup, setDisplayMarkup] = useState<string>('');
	const [mentionUpdated, setMentionUpdated] = useState<IMentionOnMessage[]>([]);
	const [isPasteMulti, setIsPasteMulti] = useState<boolean>(false);

	const [undoHistory, setUndoHistory] = useState<HistoryItem[]>([]);
	const [redoHistory, setRedoHistory] = useState<HistoryItem[]>([]);

	const queryEmojis = useCallback(
		(query: string, callback: (data: any[]) => void) => {
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
		},
		[emojis]
	);

	const { trackEnterPress } = useEnterPressTracker();
	const isShowPopupQuickMess = useSelector(selectIsShowPopupQuickMess);

	const handleSend = useCallback(
		(anonymousMessage?: boolean) => {
			//TODO: break logic send width thread box, channel, topic box, dm
			if (props.isThread && !nameValueThread?.trim() && !props.isTopic && !threadCurrentChannel) {
				dispatch(threadsActions.setNameThreadError(threadError.name));
				return;
			}

			const store = getStore();
			const rolesClan = selectAllRolesClan(store.getState());
			const { mentionList, hashtagList, emojiList, usersNotExistingInThread } = processMention(
				request?.mentionRaw,
				rolesClan,
				props.membersOfChild as ChannelMembersEntity[],
				props.membersOfParent as ChannelMembersEntity[],
				dataReferences?.message_sender_id || ''
			);

			const hasToken = mentionList.length > 0 || hashtagList.length > 0 || emojiList.length > 0; // no remove trim() if message has token

			const emptyRequest: RequestInput = {
				content: '',
				valueTextInput: '',
				mentionRaw: []
			};
			const checkedRequest = request ? request : emptyRequest;
			const { text, entities } = parseHtmlAsFormattedText(hasToken ? checkedRequest.content : checkedRequest.content.trim());
			const mk: IMarkdownOnMessage[] = processMarkdownEntities(text, entities);

			const boldMarkdownArr: IMarkdownOnMessage[] = [];

			checkedRequest?.mentionRaw?.forEach((mention: any) => {
				if (mention.childIndex === ETypeMEntion.BOLD) {
					boldMarkdownArr.push({
						type: EBacktickType.BOLD,
						s: mention.plainTextIndex,
						e: mention.plainTextIndex + mention.display.length
					});
				}
			});

			const { adjustedMentionsPos, adjustedHashtagPos, adjustedEmojiPos } = adjustPos(mk, mentionList, hashtagList, emojiList, text);
			const payload = {
				t: text,
				hg: adjustedHashtagPos as IHashtagOnMessage[],
				ej: adjustedEmojiPos as IEmojiOnMessage[],
				mk: [...mk, ...boldMarkdownArr]
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
				dispatch(threadsActions.setNameValueThread({ channelId: props.currentChannelId as string, nameValue: '' }));
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
			props.currentChannelId,
			valueThread?.content.t,
			valueThread?.mentions,
			valueThread?.attachments,
			valueThread?.references,
			setOpenThreadMessageState,
			setRequestInput
		]
	);

	const onKeyDown = useCallback(
		async (event: KeyboardEvent<HTMLTextAreaElement> | KeyboardEvent<HTMLInputElement>): Promise<void> => {
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

			if ((ctrlKey || metaKey) && (key === 'b' || key === 'B')) {
				handleBoldShortCut({ editorRef: editorRef, request: request, setRequestInput: setRequestInput });
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
		},
		[undoHistory, redoHistory, request, isNotChannel, trackEnterPress, handleSend, anonymousMode]
	);

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

	const [pastedContent, setPastedContent] = useState<string>('');
	const prevValueRef = useRef('');
	const prevPlainTextRef = useRef('');

	useEffect(() => {
		prevValueRef.current = request?.valueTextInput;
	}, [request?.valueTextInput]);

	useEffect(() => {
		prevPlainTextRef.current = request?.content;
	}, [request?.content]);

	const onChangeMentionInput = (event: { target: { value: string } }, newValue: string, newPlainTextValue: string, mentions: MentionItem[]) => {
		const store = getStore();
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
		const rolesClan = selectAllRolesClan(store.getState());

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
			const { mentionList } = processMention(
				[...(request?.mentionRaw || [])],
				rolesClan,
				props.membersOfChild as ChannelMembersEntity[],
				props.membersOfParent as ChannelMembersEntity[]
			);

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

	const handleEventAfterEmojiPicked = useCallback(() => {
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
	}, [emojiPicked, isFocusOnChannelInput]);

	const clickUpToEditMessage = useCallback(() => {
		const store = getStore();
		const lastMessageByUserId = selectLassSendMessageEntityBySenderId(store.getState(), props.currentChannelId, userProfile?.user?.id);
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
	}, [props.currentChannelId, request]);

	const handleSearchUserMention = useCallback(
		(search: string, callback: any) => {
			setValueHightlight(search);
			callback(searchMentionsHashtag(search, props.listMentions ?? []));
		},
		[props.listMentions]
	);

	const handleSearchHashtag = useCallback(
		(search: string, callback: any) => {
			setValueHightlight(search);
			const store = getStore();
			if (isDm) {
				const commonChannelDms = selectAllHashtagDm(store.getState());
				const mentions = commonChannelDms
					.map((item) => ({
						id: item?.channel_id ?? '',
						display: item?.channel_label ?? '',
						subText: item?.clan_name ?? ''
					}))
					.filter((mention) => mention.id || mention.display || mention.subText) as ChannelsMentionProps[];

				callback(searchMentionsHashtag(search, mentions ?? []));
			} else {
				const channels = selectAllChannels(store.getState());

				const listChannelsMention = channels
					.map((item) => ({
						id: item?.channel_id ?? '',
						display: item?.channel_label ?? '',
						subText: item?.category_name ?? ''
					}))
					.filter((mention) => mention.id || mention.display || mention.subText) as ChannelsMentionProps[];
				callback(searchMentionsHashtag(search, listChannelsMention ?? []));
			}
		},
		[isDm]
	);

	const handleFocusInput = useCallback(() => {
		dispatch(appActions.setIsFocusOnChannelInput(!isNotChannel));
	}, [dispatch, isNotChannel]);

	useClickUpToEdit(editorRef, request?.valueTextInput, clickUpToEditMessage);

	const handleFocusOnEditorElement = useCallback(
		(isFocusOnChannelInput: boolean, editorRef: RefObject<HTMLInputElement | HTMLDivElement | HTMLUListElement>) => {
			const targetEditorId = isFocusOnChannelInput ? CHANNEL_INPUT_ID : GENERAL_INPUT_ID;
			if (editorRef.current?.id === targetEditorId) {
				focusToElement(editorRef);
			}
		},
		[]
	);

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

	useEffect(() => {
		if ((props.currentChannelId !== undefined || props.currentDmGroupId !== undefined) && !closeMenu) {
			handleFocusOnEditorElement(isFocusOnChannelInput, editorRef);
		}
	}, [props.currentChannelId, props.currentDmGroupId]);

	useEffect(() => {
		if (isFocused || attachmentFilteredByChannelId?.files.length > 0) {
			handleFocusOnEditorElement(isFocusOnChannelInput, editorRef);
			dispatch(messagesActions.setIsFocused(false));
		}
	}, [dispatch, isFocused, attachmentFilteredByChannelId?.files]);

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
			const { currentChatUsersEntities } = getCurrentChatData();

			const { message: pastedContent, startIndex, endIndex } = parsedData;
			const currentInputValueLength = (request?.valueTextInput ?? '').length;
			const currentFocusIndex = editorRef.current?.selectionStart as number;
			const store = getStore();
			const clanRolesEntities = selectRolesClanEntities(store.getState());

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

			const rolesClan = selectAllRolesClan(store.getState());

			const { mentionList } = processMention(
				[...(request?.mentionRaw || []), ...mentionRaw],
				rolesClan,
				props.membersOfChild as ChannelMembersEntity[],
				props.membersOfParent as ChannelMembersEntity[]
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
		[request, editorRef, setRequestInput, props.isThread, props.membersOfChild, props.membersOfParent, isNotChannel]
	);

	const handleShowModalE2ee = useCallback(() => {
		const store = getStore();
		const hasKeyE2ee = selectHasKeyE2ee(store.getState());
	}, []);

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
						width: `${!closeMenu ? props.mentionWidth : '90vw'}`,
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
				<Mention
					trigger="**"
					markup="**__display__**"
					data={[]}
					displayTransform={(id: any, display: any) => {
						return `${display}`;
					}}
					className="dark:!text-white !text-black"
					style={{ WebkitTextStroke: 1, WebkitTextStrokeColor: appearanceTheme === 'dark' ? 'white' : 'black' }}
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

MentionReactBase.displayName = 'MentionReactBase';

const ClanMentionReactInput = memo((props: MentionReactInputProps) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isSearchMessage = useSelector((state) => selectIsSearchMessage(state, props.currentChannelId));
	const [mentionWidth, setMentionWidth] = useState('');

	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const currentChannel = useSelector(selectCurrentChannel);
	const { addMemberToThread, joinningToThread } = useChannelMembers({ channelId: currentChannelId, mode: props.mode ?? 0 });
	const { isPrivate, nameValueThread, valueThread, isShowCreateThread } = useThreads();
	const currTopicId = useSelector(selectCurrentTopicId);
	const dataReferences = useSelector(selectDataReferences(currentChannelId ?? ''));
	const dataReferencesTopic = useSelector(selectDataReferences(currTopicId ?? ''));
	const { setRequestInput } = useMessageValue();
	const request = useAppSelector((state) =>
		selectRequestByChannelId(
			state,
			props.isThread || props.isTopic ? currentChannelId + String(props.isThread || props.isTopic) : (currentChannelId as string)
		)
	);
	const { membersOfChild, membersOfParent } = useChannelMembers({ channelId: currentChannelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { setOpenThreadMessageState, checkAttachment } = useReference(currentChannelId || '');

	useEffect(() => {
		setMentionWidth(
			isShowMemberList
				? widthMessageViewChat
				: isShowCreateThread
					? widthMessageViewChatThread
					: isSearchMessage
						? widthSearchMessage
						: widthThumbnailAttachment
		);
	}, [isSearchMessage, isShowCreateThread, isShowMemberList]);

	return (
		<MentionReactBase
			{...props}
			currentChannelId={currentChannelId || ''}
			mentionWidth={mentionWidth}
			addMemberToThread={addMemberToThread}
			joinningToThread={joinningToThread}
			threadCurrentChannel={threadCurrentChannel}
			currentChannel={currentChannel}
			setOpenThreadMessageState={setOpenThreadMessageState}
			checkAttachment={checkAttachment}
			request={request}
			setRequestInput={setRequestInput}
			openThreadMessageState={openThreadMessageState}
			isShowCreateThread={isShowCreateThread}
			nameValueThread={nameValueThread}
			valueThread={valueThread}
			isPrivate={isPrivate}
			membersOfChild={membersOfChild}
			membersOfParent={membersOfParent}
			dataReferences={dataReferences}
			dataReferencesTopic={dataReferencesTopic}
		/>
	);
});

interface DMReactionInputProps extends MentionReactInputProps {
	isDm: boolean;
	isGr: boolean;
}

const DMReactionInput = memo((props: DMReactionInputProps) => {
	const isShowDMUserProfile = useSelector(selectIsUseProfileDM);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const [mentionWidth, setMentionWidth] = useState('');

	const { setRequestInput } = useMessageValue();
	const request = useAppSelector((state) => selectRequestByChannelId(state, props.currentChannelId as string));

	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;
	const isGr = props.mode === ChannelStreamMode.STREAM_MODE_GROUP;

	useEffect(() => {
		if (isDm) {
			setMentionWidth(isShowDMUserProfile ? widthDmUserProfile : widthThumbnailAttachment);
		} else if (isGr) {
			setMentionWidth(isShowMemberListDM ? widthDmGroupMemberList : widthThumbnailAttachment);
		}
	}, [isDm, isGr, isShowDMUserProfile, isShowMemberListDM]);

	return (
		<MentionReactBase
			{...props}
			mentionWidth={mentionWidth}
			request={request}
			setRequestInput={setRequestInput}
			currentDmGroupId={props.currentChannelId as string}
		/>
	);
});

DMReactionInput.displayName = 'DMReactionInput';

export const MentionReactInput = memo((props: MentionReactInputProps): ReactElement => {
	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;
	const isGr = props.mode === ChannelStreamMode.STREAM_MODE_GROUP;
	if (isDm || isGr) {
		return <DMReactionInput {...props} isDm={isDm} isGr={isGr} />;
	}

	return <ClanMentionReactInput {...props} />;
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
