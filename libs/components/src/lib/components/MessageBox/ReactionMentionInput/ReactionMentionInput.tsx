import {
	useChannelMembers,
	useClickUpToEdit,
	useCurrentChat,
	useCurrentInbox,
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
import { Icons } from '@mezon/ui';
import {
	CHANNEL_INPUT_ID,
	ChannelMembersEntity,
	GENERAL_INPUT_ID,
	IMentionOnMessage,
	MIN_THRESHOLD_CHARS,
	MentionDataProps,
	MentionReactInputProps,
	SubPanelName,
	TITLE_MENTION_HERE,
	ThreadStatus,
	addMention,
	blankReferenceObj,
	checkIsThread,
	convertMentionOnfile,
	filterEmptyArrays,
	filterMentionsWithAtSign,
	focusToElement,
	formatMentionsToString,
	generateMentionItems,
	getDisplayMention,
	insertStringAt,
	parsePastedMentionData,
	searchMentionsHashtag,
	threadError,
	transformTextWithMentions
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageMention } from 'mezon-js/api.gen';
import { KeyboardEvent, ReactElement, RefObject, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mention, MentionItem, MentionsInput, OnChangeHandlerFunc } from 'react-mentions';
import { useSelector, useStore } from 'react-redux';
import textFieldEdit from 'text-field-edit';
import { ThreadNameTextField } from '../../../components';
import PrivateThread from '../../ChannelTopbar/TopBarComponents/Threads/CreateThread/PrivateThread';
import GifStickerEmojiButtons from '../GifsStickerEmojiButtons';
import ChannelMessageThread from './ChannelMessageThread';
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
import useProcessedContent from './useProcessedContent';

type ChannelsMentionProps = {
	id: string;
	display: string;
	subText: string;
};

type HistoryItem = {
	valueTextInput: string;
	content: string;
	mentionRaw: any[];
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
	const { valueTopic } = useTopics();
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
	const currentDmOrChannelId = useCurrentInbox()?.channel_id;

	const currTopicId = useSelector(selectCurrentTopicId);
	const dataReferences = useSelector(selectDataReferences(currentDmOrChannelId ?? ''));
	const dataReferencesTopic = useSelector(selectDataReferences(currTopicId ?? ''));

	const { request, setRequestInput } = useMessageValue(isNotChannel ? currentChannelId + String(isNotChannel) : (currentChannelId as string));
	const { linkList, markdownList, voiceLinkRoomList } = useProcessedContent(request?.content);
	const { membersOfChild, membersOfParent } = useChannelMembers({ channelId: currentChannelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const { mentionList, hashtagList, emojiList, usersNotExistingInThread } = processMention(
		request?.mentionRaw,
		rolesClan,
		membersOfChild as ChannelMembersEntity[],
		membersOfParent as ChannelMembersEntity[],
		dataReferences?.message_sender_id || ''
	);

	const attachmentFilteredByChannelId = useSelector(selectAttachmentByChannelId(props.currentChannelId ?? ''));

	const userProfile = useSelector(selectAllAccount);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
	const isSearchMessage = useAppSelector((state) => selectIsSearchMessage(state, currentDmOrChannelId));
	const lastMessageByUserId = useSelector((state) => selectLassSendMessageEntityBySenderId(state, currentDmOrChannelId, userProfile?.user?.id));
	const { setOpenThreadMessageState, checkAttachment } = useReference(currentDmOrChannelId || '');
	const [valueHighlight, setValueHightlight] = useState<string>('');
	const [titleModalMention, setTitleModalMention] = useState('');
	const [displayPlaintext, setDisplayPlaintext] = useState<string>('');
	const [displayMarkup, setDisplayMarkup] = useState<string>('');
	const [mentionUpdated, setMentionUpdated] = useState<IMentionOnMessage[]>([]);
	const [isPasteMulti, setIsPasteMulti] = useState<boolean>(false);
	const directMessage = useAppSelector((state) => selectDirectById(state, currentDmOrChannelId));
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

	const handleSend = useCallback(
		(anonymousMessage?: boolean) => {
			const payload = {
				t: request?.content,
				hg: hashtagList,
				ej: emojiList,
				lk: linkList,
				mk: markdownList,
				vk: voiceLinkRoomList
			};
			const addMentionToPayload = addMention(payload, mentionList);
			const removeEmptyOnPayload = filterEmptyArrays(addMentionToPayload);
			const payloadJson = JSON.stringify(removeEmptyOnPayload);

			if (payloadJson.length > MIN_THRESHOLD_CHARS && props.handleConvertToFile) {
				setIsPasteMulti(true);
				props.handleConvertToFile(payload.t ?? '');
				setRequestInput(
					{
						...request,
						valueTextInput: displayMarkup,
						content: displayPlaintext
					},
					isNotChannel
				);

				return;
			}

			if ((!request?.valueTextInput && !checkAttachment) || ((request?.valueTextInput || '').trim() === '' && !checkAttachment)) {
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
					isPasteMulti ? mentionUpdated : mentionList,
					attachmentData,
					[dataReferences],
					{ nameValueThread, isPrivate },
					anonymousMessage,
					mentionEveryone
				);

				setMentionEveryone(false);
				dispatch(
					referencesActions.setDataReferences({
						channelId: currentDmOrChannelId ?? '',
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

				setOpenThreadMessageState(false);
			} else if (isReplyOnTopic) {
				props.onSend(
					filterEmptyArrays(payload),
					mentionList,
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
					isPasteMulti ? mentionUpdated : mentionList,
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
					channelId: currentDmOrChannelId ?? '',
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
			linkList,
			markdownList,
			voiceLinkRoomList,
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
		if (props.mode !== ChannelStreamMode.STREAM_MODE_GROUP && props.mode !== ChannelStreamMode.STREAM_MODE_DM) {
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
		if (props.mode === ChannelStreamMode.STREAM_MODE_DM) {
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
				mentionRaw: mentions
			},
			isNotChannel
		);
		if (mentions.some((mention) => mention.display === TITLE_MENTION_HERE)) {
			setMentionEveryone(true);
		} else {
			setMentionEveryone(false);
		}
		if (typeof props.onTyping === 'function') {
			props.onTyping();
		}

		const onlyMention = filterMentionsWithAtSign(mentions);
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

	const handleChangeNameThread = (nameThread: string) => {
		dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue: nameThread }));
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
					channelId: currentDmOrChannelId as string,
					channelDraftMessage: {
						message_id: idRefMessage,
						draftContent: lastMessageByUserId?.content,
						draftMention: lastMessageByUserId.mentions ?? [],
						draftAttachment: lastMessageByUserId.attachments ?? []
					}
				})
			);
		}
	}, [lastMessageByUserId, currentDmOrChannelId, request]);

	const appearanceTheme = useSelector(selectTheme);

	const handleSearchUserMention = (search: string, callback: any) => {
		setValueHightlight(search);
		callback(searchMentionsHashtag(search, props.listMentions ?? []));
	};

	const handleSearchHashtag = (search: string, callback: any) => {
		setValueHightlight(search);
		if (props.mode === ChannelStreamMode.STREAM_MODE_DM) {
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
		if (props.mode === ChannelStreamMode.STREAM_MODE_DM) {
			setMentionWidth(isShowDMUserProfile ? widthDmUserProfile : widthThumbnailAttachment);
			setChatBoxMaxWidth(isShowDMUserProfile ? maxWidthWithDmUserProfile : defaultMaxWidth);
		} else if (props.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
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
			const pastedData = event.clipboardData.getData('text/mezon-mentions');

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
					? transformTextWithMentions(pastedContent.content.t, pastedContent.mentions, currentChatUsersEntities, clanRolesEntities)
					: pastedContent?.content?.t || '';

			const mentionRaw = generateMentionItems(
				pastedContent?.mentions || [],
				transformedText,
				currentChatUsersEntities,
				currentInputValueLength
			);

			setRequestInput(
				{
					...request,
					valueTextInput: insertStringAt(request?.valueTextInput || '', transformedText || '', currentFocusIndex),
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
		<div className="relative">
			{props.isThread && !props.isTopic && !threadCurrentChannel && (
				<div className={`flex flex-col overflow-y-auto ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}>
					<div className="flex flex-col justify-end flex-grow">
						{!threadCurrentChannel && (
							<div className="relative flex items-center justify-center mx-4 w-16 h-16 dark:bg-bgInputDark bg-bgTextarea rounded-full pointer-events-none">
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
			{props.isThread && !props.isTopic && messageThreadError && !threadCurrentChannel && (
				<span className="text-xs text-[#B91C1C] mt-1 ml-1">{messageThreadError}</span>
			)}

			{props.isTopic && props.isThread && !currentTopicId && (
				<div className={`flex flex-col overflow-y-auto ${appearanceTheme === 'light' ? 'customScrollLightMode' : ''}`}>
					<div className="flex flex-col justify-end flex-grow">
						{valueTopic && openTopicMessageState && <ChannelMessageThread message={valueTopic} />}
					</div>
				</div>
			)}

			<MentionsInput
				onFocus={handleFocusInput}
				onPaste={(event) => {
					const pastedData = event.clipboardData.getData('text/mezon-mentions');
					if (pastedData) {
						onPasteMentions(event);
						event.preventDefault();
					} else {
						event.preventDefault();
						const pastedText = event.clipboardData.getData('text');
						setPastedContent(pastedText);
					}
				}}
				onPasteCapture={(event) => {
					if (event.clipboardData.getData('text/mezon-mentions')) {
						event.preventDefault();
					} else {
						if (props.handlePaste) {
							props.handlePaste(event);
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
							overflow: 'auto',
							minWidth: '300px'
						},
						input: {
							padding: props.isThread && !threadCurrentChannel ? '10px' : '9px 120px 9px 9px',
							border: 'none',
							outline: 'none',
							maxHeight: '350px',
							overflow: 'auto',
							minWidth: '300px'
						}
					}
				}}
				className={`dark:bg-channelTextarea  bg-channelTextareaLight dark:text-white text-colorTextLightMode rounded-md ${appearanceTheme === 'light' ? 'lightMode lightModeScrollBarMention' : 'darkMode'} cursor-not-allowed`}
				allowSpaceInQuery={true}
				onKeyDown={onKeyDown}
				forceSuggestionsAboveCursor={true}
				customSuggestionsContainer={(children: React.ReactNode) => {
					return <CustomModalMentions isThreadBox={props.isThread} children={children} titleModalMention={titleModalMention} />;
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
