import {
	useChannelMembers,
	useClickUpToEdit,
	useCurrentInbox,
	useEmojiSuggestion,
	useGifsStickersEmoji,
	useHandlePopupQuickMess,
	useMessageValue,
	useReference,
	useThreads
} from '@mezon/core';
import {
	ChannelsEntity,
	emojiSuggestionActions,
	messagesActions,
	reactionActions,
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
	selectDataReferences,
	selectDmGroupCurrentId,
	selectIdMessageRefEdit,
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
	selectStatusMenu,
	selectTheme,
	selectThreadCurrentChannel,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	ChannelMembersEntity,
	EmojiPlaces,
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
	getDisplayMention,
	searchMentionsHashtag,
	threadError
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageMention } from 'mezon-js/api.gen';
import { KeyboardEvent, ReactElement, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mention, MentionItem, MentionsInput, OnChangeHandlerFunc } from 'react-mentions';
import { useSelector } from 'react-redux';
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
import useProcessMention from './useProcessMention';
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
	const channels = useSelector(selectAllChannels);
	const rolesClan = useSelector(selectAllRolesClan);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const { addMemberToThread, joinningToThread } = useChannelMembers({ channelId: currentChannelId, mode: props.mode ?? 0 });
	const dispatch = useAppDispatch();
	const openThreadMessageState = useSelector(selectOpenThreadMessageState);
	const { setSubPanelActive } = useGifsStickersEmoji();
	const commonChannelDms = useSelector(selectAllHashtagDm);
	const [mentionData, setMentionData] = useState<ApiMessageMention[]>([]);
	const anonymousMode = useSelector(selectAnonymousMode);
	const [mentionEveryone, setMentionEveryone] = useState(false);
	const threadCurrentChannel = useSelector(selectThreadCurrentChannel);
	const { messageThreadError, isPrivate, nameValueThread, valueThread, isShowCreateThread } = useThreads();
	const currentChannel = useSelector(selectCurrentChannel);
	const usersClan = useSelector(selectAllUserClans);
	const { emojis } = useEmojiSuggestion();
	const { emojiPicked, addEmojiState } = useEmojiSuggestion();

	const reactionRightState = useSelector(selectReactionRightState);
	const isFocused = useSelector(selectIsFocused);
	const isShowMemberList = useSelector(selectIsShowMemberList);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const isShowDMUserProfile = useSelector(selectIsUseProfileDM);

	const [undoHistory, setUndoHistory] = useState<HistoryItem[]>([]);
	const [redoHistory, setRedoHistory] = useState<HistoryItem[]>([]);
	const currentDmOrChannelId = useCurrentInbox()?.channel_id;
	const dataReferences = useSelector(selectDataReferences(currentDmOrChannelId ?? ''));

	const { request, setRequestInput } = useMessageValue(props.isThread ? currentChannelId + String(props.isThread) : (currentChannelId as string));
	const { linkList, markdownList, voiceLinkRoomList } = useProcessedContent(request?.content);
	const { membersOfChild, membersOfParent } = useChannelMembers({ channelId: currentChannelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const { mentionList, hashtagList, emojiList, usersNotExistingInThread } = useProcessMention(
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

				setRequestInput({
					...request,
					valueTextInput: valueTextInput,
					content: content,
					mentionRaw: mentionRaw
				});
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

				setRequestInput({
					...request,
					valueTextInput: valueTextInput,
					content: content,
					mentionRaw: mentionRaw
				});
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
					props.isThread
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

			if (!nameValueThread?.trim() && props.isThread && !threadCurrentChannel && !openThreadMessageState) {
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

			if (dataReferences.message_ref_id !== '') {
				props.onSend(
					filterEmptyArrays(payload),
					isPasteMulti ? mentionUpdated : mentionList,
					attachmentData,
					[dataReferences],
					{ nameValueThread: nameValueThread, isPrivate },
					anonymousMessage,
					mentionEveryone
				);
				setRequestInput({ ...request, valueTextInput: '', content: '' }, props.isThread);
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
			} else {
				if (openThreadMessageState) {
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
				} else {
					props.onSend(
						filterEmptyArrays(payload),
						isPasteMulti ? mentionUpdated : mentionList,
						attachmentData,
						undefined,
						{ nameValueThread: nameValueThread, isPrivate },
						anonymousMessage,
						mentionEveryone
					);
				}
				setRequestInput({ ...request, valueTextInput: '', content: '' }, props.isThread);
				setMentionEveryone(false);
				dispatch(threadsActions.setNameValueThread({ channelId: currentChannelId as string, nameValue: '' }));
				setMentionData([]);
				dispatch(threadsActions.setIsPrivate(0));
			}
			dispatch(reactionActions.setReactionPlaceActive(EmojiPlaces.EMOJI_REACTION_NONE));
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
			props.isThread
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
				props.isThread
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
				props.isThread
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

	const input = document.querySelector('#editorReactMention') as HTMLElement;
	function handleEventAfterEmojiPicked() {
		const isEmptyEmojiPicked = emojiPicked && Object.keys(emojiPicked).length === 1 && emojiPicked[''] === '';

		if (isEmptyEmojiPicked || !input) {
			return;
		} else if (emojiPicked) {
			for (const [emojiKey, emojiValue] of Object.entries(emojiPicked)) {
				textFieldEdit.insert(input, `::[${emojiKey}](${emojiValue})${' '}`);
			}
		}
	}

	const clickUpToEditMessage = () => {
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
	};

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

	useClickUpToEdit(editorRef, request?.valueTextInput, clickUpToEditMessage);

	useEffect(() => {
		if ((closeMenu && statusMenu) || openEditMessageState || isShowPopupQuickMess) {
			return editorRef?.current?.blur();
		}
		if (dataReferences.message_ref_id || (emojiPicked?.shortName !== '' && !reactionRightState) || (!openEditMessageState && !idMessageRefEdit)) {
			return focusToElement(editorRef);
		}
	}, [dataReferences.message_ref_id, emojiPicked, openEditMessageState, idMessageRefEdit, isShowPopupQuickMess]);

	useEffect(() => {
		handleEventAfterEmojiPicked();
	}, [emojiPicked, addEmojiState]);

	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	useEffect(() => {
		if ((currentChannelId !== undefined || currentDmGroupId !== undefined) && !closeMenu) {
			focusToElement(editorRef);
		}
	}, [currentChannelId, currentDmGroupId]);

	useEffect(() => {
		if (isFocused || attachmentFilteredByChannelId?.files.length > 0) {
			editorRef.current?.focus();
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
		const textarea = document.getElementById('editorReactMention');
		if (textarea) {
			textarea.removeAttribute('aria-hidden');
		}
	}, []);

	return (
		<div className="relative">
			{props.isThread && !threadCurrentChannel && (
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
			{props.isThread && messageThreadError && !threadCurrentChannel && (
				<span className="text-xs text-[#B91C1C] mt-1 ml-1">{messageThreadError}</span>
			)}
			<MentionsInput
				onPaste={(event) => {
					event.preventDefault();
					const pastedText = event.clipboardData.getData('text');
					setPastedContent(pastedText);
				}}
				onPasteCapture={props.handlePaste}
				id="editorReactMention"
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
					control: {
						...(appearanceTheme === 'light' ? lightMentionsInputStyle.control : darkMentionsInputStyle.control),
						maxWidth: `${!closeMenu ? chatBoxMaxWidth : '75vw'}`
					},
					'&multiLine': {
						...(appearanceTheme === 'light' ? lightMentionsInputStyle['&multiLine'] : darkMentionsInputStyle['&multiLine']),
						input: {
							...(appearanceTheme === 'light'
								? lightMentionsInputStyle['&multiLine'].input
								: darkMentionsInputStyle['&multiLine'].input),
							padding: props.isThread && !threadCurrentChannel ? '10px' : '9px 100px 9px 10px'
						}
					},
					maxWidth: '100%',
					maxHeight: '350px'
				}}
				className={`dark:bg-channelTextarea bg-channelTextareaLight dark:text-white text-colorTextLightMode rounded-md ${appearanceTheme === 'light' ? 'lightMode lightModeScrollBarMention' : 'darkMode'} cursor-not-allowed`}
				allowSpaceInQuery={true}
				onKeyDown={onKeyDown}
				forceSuggestionsAboveCursor={true}
				customSuggestionsContainer={(children: React.ReactNode) => {
					return <CustomModalMentions isThreadBox={props.isThread} children={children} titleModalMention={titleModalMention} />;
				}}
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
			{!props.isThread && (
				<GifStickerEmojiButtons
					activeTab={SubPanelName.NONE}
					currentClanId={props.currentClanId}
					hasPermissionEdit={props.hasPermissionEdit || true}
				/>
			)}
			{request?.content?.length > MIN_THRESHOLD_CHARS && (
				<div className="w-16 text-red-300 bottom-0 right-0 absolute">{MIN_THRESHOLD_CHARS - request?.content?.length}</div>
			)}
		</div>
	);
});

const useEnterPressTracker = () => {
	const [enterCount, setEnterCount] = useState(0);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const { handleOpenPopupQuickMess, handleClosePopupQuickMess } = useHandlePopupQuickMess();

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
