import { useGifsStickersEmoji, useReference } from '@mezon/core';
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
	selectHasKeyE2ee,
	selectIdMessageRefEdit,
	selectOpenEditMessageState,
	selectOpenThreadMessageState,
	selectQuickMenuByChannelId,
	selectReactionRightState,
	selectStatusMenu,
	selectTheme,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import {
	CHANNEL_INPUT_ID,
	CREATING_TOPIC,
	ChannelMembersEntity,
	GENERAL_INPUT_ID,
	IEmojiOnMessage,
	IHashtagOnMessage,
	ILongPressType,
	IMarkdownOnMessage,
	IMentionOnMessage,
	IMessageWithUser,
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
	extractCanvasIdsFromText,
	filterEmptyArrays,
	filterMentionsWithAtSign,
	formatMentionsToString,
	getDisplayMention,
	parseHtmlAsFormattedText,
	processBoldEntities,
	processMarkdownEntities,
	searchMentionsHashtag,
	threadError,
	updateMentionPositions
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { ReactElement, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mention as MentionComponent, MentionItem, MentionsInput as MentionsInputComponent } from 'react-mentions';
import { useSelector } from 'react-redux';
import CustomModalMentions from './CustomModalMentions';
import lightMentionsInputStyle from './LightRmentionInputStyle';
import darkMentionsInputStyle from './RmentionInputStyle';
import mentionStyle from './RmentionStyle';
import SuggestItem from './SuggestItem';
import { ChatBoxToolbarWrapper } from './components';
import {
	useClickUpToEditMessage,
	useEmojiPicker,
	useEmojiQuery,
	useFocusEditor,
	useFocusManager,
	useKeyboardHandler,
	usePasteMentions,
	useUndoRedoHistory
} from './hooks';
import processMention from './processMention';
import { getCanvasTitles } from './utils/canvas';

const slashCommands = [
	{
		id: 'ephemeral',
		display: 'ephemeral',
		description: 'Send an ephemeral message (only visible to selected user)'
	}
];

const MentionsInput = MentionsInputComponent as any;
const Mention = MentionComponent as any;

/**
 * Custom hook to search and filter emojis based on user input
 */

// update type later
export interface MentionReactBaseProps extends MentionReactInputProps {
	mentionWidth: string;
	handleSearchHashtag?: (search: string, callback: (data: any) => void) => void;
	addMemberToThread?: (channel: ChannelsEntity, users: string[]) => void;
	joinningToThread?: (channel: ChannelsEntity, users: string[]) => void;
	threadCurrentChannel?: ChannelsEntity;
	currentChannel?: ChannelsEntity;
	setOpenThreadMessageState?: (state: boolean) => void;
	checkAttachment?: boolean;
	draftRequest?: RequestInput | null;
	updateDraft?: any;
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

type ChannelsMentionProps = {
	id: string;
	display: string;
	subText: string;
};

export const MentionReactBase = memo((props: MentionReactBaseProps): ReactElement => {
	const editorRef = useRef<HTMLInputElement | null>(null);
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
	const anonymousMode = useSelector(selectAnonymousMode);
	const [mentionEveryone, setMentionEveryone] = useState(false);
	const addEmojiState = useSelector(selectAddEmojiState);
	const emojiPicked = useSelector(selectEmojiObjSuggestion);
	const { queryEmojis } = useEmojiQuery();

	const [isEphemeralMode, setIsEphemeralMode] = useState(false);
	const [ephemeralTargetUserId, setEphemeralTargetUserId] = useState<string | null>(null);
	const [ephemeralTargetUserDisplay, setEphemeralTargetUserDisplay] = useState<string | null>(null);

	const reactionRightState = useSelector(selectReactionRightState);
	const isNotChannel = props.isThread || props.isTopic;
	const inputElementId = isNotChannel ? GENERAL_INPUT_ID : CHANNEL_INPUT_ID;
	const isShowEmojiPicker = !props.isThread;

	const currTopicId = useSelector(selectCurrentTopicId);
	const dataReferences = useAppSelector((state) => selectDataReferences(state, props.currentChannelId ?? ''));
	const dataReferencesTopic = useAppSelector((state) => selectDataReferences(state, currTopicId ?? ''));

	const scopeId = props.isTopic ? currTopicId || CREATING_TOPIC : props.currentChannelId!;

	const attachmentFiltered = useAppSelector((state) => selectAttachmentByChannelId(state, scopeId || ''));

	const isDm = props.mode === ChannelStreamMode.STREAM_MODE_DM;

	const appearanceTheme = useSelector(selectTheme);
	const userProfile = useSelector(selectAllAccount);
	const idMessageRefEdit = useSelector(selectIdMessageRefEdit);
	const { setOpenThreadMessageState, checkAttachment } = useReference(scopeId || '');
	const [mentionData, setMentionData] = useState<ApiMessageMention[]>([]);
	const [valueHighlight, setValueHightlight] = useState<string>('');
	const [titleModalMention, setTitleModalMention] = useState('');
	const [displayPlaintext, setDisplayPlaintext] = useState<string>('');
	const [displayMarkup, setDisplayMarkup] = useState<string>('');
	const [mentionUpdated, setMentionUpdated] = useState<IMentionOnMessage[]>([]);
	const [isPasteMulti, setIsPasteMulti] = useState<boolean>(false);
	const [isFocused, setIsFocused] = useState(false);

	const { addToUndoHistory, handleUndoRedoShortcut } = useUndoRedoHistory({
		updateDraft,
		draftRequest
	});

	const { focusEditorIfMatch } = useFocusEditor({
		editorRef,
		isTopic: props.isTopic
	});

	const { setSubPanelActive } = useGifsStickersEmoji();

	useFocusManager({
		editorRef,
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

	useEmojiPicker({
		editorRef,
		emojiPicked,
		addEmojiState,
		dispatch,
		focusEditorIfMatch
	});

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
				draftRequest?.mentionRaw || [],
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
			const checkedRequest = draftRequest ? draftRequest : emptyRequest;
			const { text, entities } = parseHtmlAsFormattedText(hasToken ? checkedRequest.content : checkedRequest.content.trim());
			const mk: IMarkdownOnMessage[] = processMarkdownEntities(text, entities);
			const boldMarkdownArr = processBoldEntities(checkedRequest.mentionRaw, mk);

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
				updateDraft({
					valueTextInput: displayMarkup,
					content: displayPlaintext,
					mentionRaw: []
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
				updateDraft({
					valueTextInput: '',
					content: '',
					mentionRaw: []
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

			updateDraft({
				valueTextInput: '',
				content: '',
				mentionRaw: []
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			draftRequest,
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
			props.currentChannelId,
			setOpenThreadMessageState,
			updateDraft,
			setSubPanelActive
		]
	);

	const { onKeyDown } = useKeyboardHandler({
		editorRef,
		draftRequest,
		updateDraft,
		handleUndoRedoShortcut,
		handleSend,
		anonymousMode,
		isEphemeralMode,
		setIsEphemeralMode,
		setEphemeralTargetUserId,
		setEphemeralTargetUserDisplay,
		ephemeralTargetUserId
	});

	const closeMenu = useSelector(selectCloseMenu);

	const attachmentData = useMemo(() => {
		if (!attachmentFiltered) {
			return [];
		} else {
			return attachmentFiltered.files;
		}
	}, [attachmentFiltered?.files]);

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

	const onChangeMentionInput = (event: { target: { value: string } }, newValue: string, newPlainTextValue: string, mentions: MentionItem[]) => {
		const previousValue = prevValueRef.current;
		const previousPlainText = prevPlainTextRef.current;
		const newMentions = updateMentionPositions(mentions || [], newValue, newPlainTextValue);

		dispatch(threadsActions.setMessageThreadError(''));

		addToUndoHistory();

		const store = getStore();

		if (newPlainTextValue.startsWith('/ephemeral ')) {
			const command = newPlainTextValue.substring(11).trim();
			if (command) {
				const matchedUser = props.listMentions?.find(
					(user) =>
						user.display?.toLowerCase().includes(command.toLowerCase()) || user.username?.toLowerCase().includes(command.toLowerCase())
				);
				if (matchedUser) {
					setEphemeralTargetUserId(String(matchedUser.id));
					setEphemeralTargetUserDisplay(matchedUser.display || matchedUser.username || '');
					updateDraft({
						valueTextInput: '',
						content: '',
						mentionRaw: []
					});
					return;
				}
			}
		}

		if (isEphemeralMode && newMentions.length > 0) {
			const selectedUser = newMentions[0];
			if (selectedUser) {
				setEphemeralTargetUserId(String(selectedUser.id));
				setEphemeralTargetUserDisplay(selectedUser.display || '');
				setIsEphemeralMode(false);
				updateDraft({
					valueTextInput: '',
					content: '',
					mentionRaw: []
				});
				return;
			}
		}

		updateDraft({
			valueTextInput: newValue,
			content: newPlainTextValue,
			mentionRaw: newMentions || []
		});

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
				[...(draftRequest?.mentionRaw || [])],
				rolesClan,
				props.membersOfChild as ChannelMembersEntity[],
				props.membersOfParent as ChannelMembersEntity[],
				''
			);

			setMentionUpdated(mentionList);
			updateDraft({
				valueTextInput: newValue,
				content: newPlainTextValue,
				mentionRaw: newMentions || []
			});
			setIsPasteMulti(false);
		}

		if (
			props.handleConvertToFile !== undefined &&
			newPlainTextValue?.length > MIN_THRESHOLD_CHARS &&
			pastedContent?.length > MIN_THRESHOLD_CHARS
		) {
			props.handleConvertToFile(pastedContent);
			updateDraft({
				valueTextInput: previousValue || '',
				content: previousPlainText || '',
				mentionRaw: draftRequest?.mentionRaw || []
			});
			setPastedContent('');
		}

		if (newPlainTextValue.endsWith('@')) {
			setTitleModalMention('Members');
		} else if (newPlainTextValue.endsWith('#')) {
			setTitleModalMention('Text channels');
		} else if (newPlainTextValue.endsWith(':')) {
			setTitleModalMention('Emoji matching');
		} else if (newPlainTextValue.endsWith('/')) {
			setTitleModalMention('Commands');
		}
	};

	const handleSearchUserMention = useCallback(
		(search: string, callback: any) => {
			if (!props.listMentions?.length && props.currentClanId && props.currentClanId !== '0') {
				dispatch(
					channelMembersActions.fetchChannelMembers({
						clanId: props.currentClanId as string,
						channelId: props.currentChannelId as string,
						channelType: ChannelType.CHANNEL_TYPE_CHANNEL
					})
				);
			}

			setValueHightlight(search);
			callback(
				searchMentionsHashtag(
					search,
					!isEphemeralMode ? props.listMentions || [] : props.listMentions?.filter((item) => item.display !== TITLE_MENTION_HERE) || []
				)
			);
		},
		[props.listMentions, isEphemeralMode]
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

	const generateCommandsList = useCallback(
		(search: string) => {
			const store = getStore();
			const channelQuickMenuItems = selectQuickMenuByChannelId(store.getState(), props.currentChannelId || '');
			const builtInCommands = slashCommands.filter((cmd) => cmd.display.toLowerCase().includes(search.toLowerCase()));

			const quickMenuCommands = channelQuickMenuItems
				.filter((item) => item.menu_name?.toLowerCase().includes(search.toLowerCase()))
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
		async (search: string, callback: any) => {
			setValueHightlight(search);

			const store = getStore();
			const channelQuickMenuItems = selectQuickMenuByChannelId(store.getState(), props.currentChannelId || '');
			const hasExistingData = channelQuickMenuItems && channelQuickMenuItems.length > 0;

			if (hasExistingData) {
				callback(generateCommandsList(search));
				if (props.currentChannelId) {
					try {
						await dispatch(quickMenuActions.listQuickMenuAccess({ channelId: props.currentChannelId }));
						callback(generateCommandsList(search));
					} catch (error) {
						console.error('Error fetching fresh commands:', error);
					}
				}
			} else {
				callback([{ id: 'loading', display: 'loading', description: 'Loading commands...', isLoading: true }]);
				try {
					if (props.currentChannelId) {
						await dispatch(quickMenuActions.listQuickMenuAccess({ channelId: props.currentChannelId }));
					}
					callback(generateCommandsList(search));
				} catch (error) {
					console.error('Error fetching commands:', error);
					const builtInCommands = slashCommands.filter((cmd) => cmd.display.toLowerCase().includes(search.toLowerCase()));
					callback(builtInCommands);
				}
			}
		},
		[props.currentChannelId, generateCommandsList, dispatch]
	);

	const handleSlashCommandSelect = useCallback(
		(commandId: string, suggestion?: any) => {
			if (commandId === 'ephemeral') {
				setIsEphemeralMode(true);
				setTitleModalMention('Select user for ephemeral message');
				updateDraft({
					valueTextInput: '@',
					content: '@',
					mentionRaw: []
				});
			} else if (commandId.startsWith('quick_menu_')) {
				const quickMenuItemId = commandId.replace('quick_menu_', '');
				const store = getStore();

				const channelQuickMenuItems = selectQuickMenuByChannelId(store.getState(), props.currentChannelId || '');

				const quickMenuItem = channelQuickMenuItems.find((item) => item.id === quickMenuItemId);

				if (quickMenuItem && quickMenuItem.action_msg) {
					updateDraft({
						valueTextInput: quickMenuItem.action_msg,
						content: quickMenuItem.action_msg,
						mentionRaw: []
					});
				}
			}
		},
		[updateDraft, props.currentChannelId]
	);

	useClickUpToEditMessage({
		editorRef,
		currentChannelId: props.currentChannelId,
		userId: userProfile?.user?.id,
		draftRequest,
		dispatch
	});

	const onPasteMentions = usePasteMentions({
		draftRequest,
		updateDraft,
		editorRef,
		membersOfChild: props.membersOfChild,
		membersOfParent: props.membersOfParent
	});

	const handleShowModalE2ee = useCallback((): void => {
		const store = getStore();
		const hasKeyE2ee = selectHasKeyE2ee(store.getState());
		// This function is just checking if E2EE key exists, no return needed
	}, []);

	const handleFocus = () => setIsFocused(true);
	const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
		if (!event.target.value) {
			setIsFocused(false);
		}
	};

	return (
		<div className={`contain-layout relative bg-theme-surface rounded-lg `} ref={containerRef}>
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
					onPaste={(event: any) => {
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
					onPasteCapture={async (event: any) => {
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
					value={draftRequest?.valueTextInput ?? ''}
					onChange={onChangeMentionInput}
					onFocus={handleFocus}
					onBlur={handleBlur}
					autoFocus={false}
					style={{
						...(appearanceTheme === 'light' ? lightMentionsInputStyle : darkMentionsInputStyle),
						suggestions: {
							...(appearanceTheme === 'light' ? lightMentionsInputStyle.suggestions : darkMentionsInputStyle.suggestions),
							width: `${!closeMenu ? props.mentionWidth : '90vw'}`,
							left: `${!closeMenu ? '-40px' : '-30px'}`
						},
						control: {
							padding: props.isThread ? '1px 0' : '0'
						},

						'&multiLine': {
							highlighter: {
								padding: props.isThread && !threadCurrentChannel ? '10px' : '9px 120px 9px 9px',
								border: 'none',
								maxHeight: '350px',
								overflow: 'auto',
								scrollbarWidth: 'none'
							},
							input: {
								padding: props.isThread && !threadCurrentChannel ? '8px' : '9px 120px 9px 9px',
								border: props.isThread && !threadCurrentChannel ? '1px solid var(--border-primary)' : 'none',
								outline: 'none',
								maxHeight: '350px',
								overflow: 'auto',
								borderRadius: '8px'
							}
						}
					}}
					className={`mentions min-h-11 cursor-not-allowed text-theme-message rounded-lg`}
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
							return display === TITLE_MENTION_HERE ? `${display}` : `@${display}`;
						}}
						renderSuggestion={(suggestion: MentionDataProps) => {
							return (
								<SuggestItem
									valueHightLight={valueHighlight}
									avatarUrl={suggestion.avatarUrl}
									subText={
										suggestion.display === TITLE_MENTION_HERE
											? 'Notify everyone who has permission to see this channel'
											: (suggestion.username ?? '')
									}
									subTextStyle={(suggestion.display === TITLE_MENTION_HERE ? 'normal-case' : 'lowercase') + ' text-xs'}
									showAvatar={suggestion.display !== TITLE_MENTION_HERE}
									display={suggestion.display}
									emojiId=""
									color={suggestion.color}
								/>
							);
						}}
						style={mentionStyle}
						className="bg-mention"
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
						renderSuggestion={(suggestion: any) =>
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
						className="bg-mention"
					/>
					<Mention
						trigger=":"
						markup="::[__display__](__id__)"
						data={queryEmojis}
						displayTransform={(id: any, display: any) => {
							return `${display}`;
						}}
						renderSuggestion={(suggestion: any) => {
							return (
								<SuggestItem
									display={suggestion.display ?? ''}
									symbol={(suggestion as any).emoji}
									emojiId={suggestion.id as string}
								/>
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
						className="color-mention"
						style={{ WebkitTextStroke: 1, WebkitTextStrokeColor: appearanceTheme === 'dark' ? 'white' : 'black' }}
					/>
					<Mention
						trigger="/"
						data={handleSearchSlashCommands}
						displayTransform={(id: any, display: any) => {
							return `/${display}`;
						}}
						onAdd={(id: string, display: string, startPos: number, endPos: number, suggestion: any) => {
							handleSlashCommandSelect(id, suggestion);
						}}
						renderSuggestion={(suggestion: any) => {
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
								<SuggestItem
									valueHightLight={valueHighlight}
									display={suggestion.display}
									symbol="/"
									subText={suggestion.description}
								/>
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
			/>
			{draftRequest?.content && draftRequest.content.length > MIN_THRESHOLD_CHARS && (
				<div className="w-16 text-red-300 bottom-0 right-0 absolute">{MIN_THRESHOLD_CHARS - draftRequest.content.length}</div>
			)}
		</div>
	);
});

MentionReactBase.displayName = 'MentionReactBase';
