import { useAppParams, useAuth, useChatSending, usePermissionChecker, useReference } from '@mezon/core';
import {
	channelMetaActions,
	createEditCanvas,
	directActions,
	gifsStickerEmojiActions,
	messagesActions,
	notificationActions,
	pinMessageActions,
	reactionActions,
	referencesActions,
	selectAllDirectMessages,
	selectClanView,
	selectClickedOnThreadBoxStatus,
	selectCurrentChannel,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDefaultCanvasByChannelId,
	selectDmGroupCurrent,
	selectDmGroupCurrentId,
	selectMessageByMessageId,
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId,
	selectModeResponsive,
	selectPinMessageByChannelId,
	selectQuickMenuByChannelId,
	selectTheme,
	selectThreadCurrentChannel,
	setIsForwardAll,
	setSelectedMessage,
	threadsActions,
	toggleIsShowPopupForwardTrue,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import {
	ContextMenuItem,
	EEventAction,
	EOverriddenPermission,
	FOR_10_MINUTES,
	IMessageWithUser,
	MenuBuilder,
	ModeResponsive,
	SHOW_POSITION,
	SubPanelName,
	TypeMessage,
	handleCopyImage,
	handleCopyLink,
	handleOpenLink,
	handleSaveImage
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { ApiChannelDescription, ApiQuickMenuAccessRequest } from 'mezon-js/api.gen';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import DynamicContextMenu from './DynamicContextMenu';
import { useMessageContextMenu } from './MessageContextMenuContext';

type MessageContextMenuProps = {
	id: string;
	messageId: string;
	elementTarget?: boolean | HTMLElement | null;
	activeMode: number | undefined;
	isTopic: boolean;
	openDeleteMessageModal: () => void;
	openPinMessageModal: () => void;
	openGiveCoffeeModal: () => void;
};

type JsonObject = {
	ops: Array<{
		insert: string | { image: string };
		attributes?: { list: string };
	}>;
};

const useIsOwnerGroupDM = () => {
	const { userProfile } = useAuth();
	const { directId } = useAppParams();
	const currentGroupDM = useSelector(selectDmGroupCurrent(directId as string));

	const isOwnerGroupDM = useMemo(() => {
		return currentGroupDM?.creator_id === userProfile?.user?.id;
	}, [currentGroupDM?.creator_id, userProfile?.user?.id]);

	return isOwnerGroupDM;
};

function MessageContextMenu({
	id,
	elementTarget,
	messageId,
	activeMode,
	isTopic,
	openPinMessageModal,
	openDeleteMessageModal,
	openGiveCoffeeModal
}: MessageContextMenuProps) {
	// const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';
	const { setOpenThreadMessageState } = useReference();
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const listPinMessages = useAppSelector((state) => selectPinMessageByChannelId(state, currentChannel?.id as string));
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const isClanView = useSelector(selectClanView);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isFocusThreadBox = useSelector(selectClickedOnThreadBoxStatus);
	const currentThread = useAppSelector(selectThreadCurrentChannel);
	const currentDmGroup = useSelector(selectDmGroupCurrent(currentDmId || ''));

	const { sendMessage: sendChatMessage } = useChatSending({
		channelOrDirect: (isClanView ? currentChannel : currentDmGroup) as ApiChannelDescription,
		mode: activeMode || ChannelStreamMode.STREAM_MODE_CHANNEL
	});

	const message = useAppSelector((state) =>
		selectMessageByMessageId(
			state,
			isTopic ? currentTopicId : isFocusThreadBox ? currentThread?.channel_id : isClanView ? currentChannel?.id : currentDmId,
			messageId
		)
	);

	const currentDm = useSelector(selectDmGroupCurrent(currentDmId || ''));
	const modeResponsive = useSelector(selectModeResponsive);
	const allMessagesEntities = useAppSelector((state) =>
		selectMessageEntitiesByChannelId(state, (modeResponsive === ModeResponsive.MODE_CLAN ? currentChannel?.channel_id : currentDm?.id) || '')
	);
	const allMessageIds = useAppSelector((state) => selectMessageIdsByChannelId(state, (isClanView ? currentChannel?.id : currentDmId) as string));
	const dispatch = useAppDispatch();

	const handleItemClick = useCallback(() => {
		dispatch(referencesActions.setIdReferenceMessageReaction(message.id));
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.EMOJI_REACTION_RIGHT));
	}, [dispatch, message.id]);
	const defaultCanvas = useAppSelector((state) => selectDefaultCanvasByChannelId(state, currentChannel?.channel_id ?? ''));
	const messagePosition = allMessageIds.findIndex((id: string) => id === messageId);
	const { userId } = useAuth();
	const { posShowMenu, imageSrc } = useMessageContextMenu();
	const isOwnerGroupDM = useIsOwnerGroupDM();

	const isMyMessage = useMemo(() => {
		return message?.sender_id === userId && !message?.content?.callLog?.callLogType && !(message?.code === TypeMessage.SendToken);
	}, [message?.sender_id, message?.content?.callLog?.callLogType, message?.code, userId]);

	const checkMessageHasText = useMemo(() => {
		return message?.content.t !== '';
	}, [message?.content.t]);

	const checkMessageInPinnedList = useMemo(() => {
		return listPinMessages?.some((pinMessage) => pinMessage?.id === messageId);
	}, [listPinMessages, messageId]);

	const [canManageThread, canDeleteMessage, canSendMessage] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EOverriddenPermission.deleteMessage, EOverriddenPermission.sendMessage],
		message?.channel_id ?? ''
	);
	const hasPermissionCreateTopic =
		(canSendMessage && activeMode === ChannelStreamMode.STREAM_MODE_CHANNEL) ||
		(canSendMessage && activeMode === ChannelStreamMode.STREAM_MODE_THREAD);

	const { type } = useAppParams();

	const [enableCopyLinkItem, setEnableCopyLinkItem] = useState<boolean>(false);
	const [enableOpenLinkItem, setEnableOpenLinkItem] = useState<boolean>(false);
	const [enableCopyImageItem, setEnableCopyImageItem] = useState<boolean>(false);
	const [enableSaveImageItem, setEnableSaveImageItem] = useState<boolean>(false);

	const notAllowedType =
		message?.code !== TypeMessage.CreateThread &&
		message?.code !== TypeMessage.CreatePin &&
		message?.code !== TypeMessage.MessageBuzz &&
		message?.code !== TypeMessage.AuditLog &&
		message?.code !== TypeMessage.Welcome;

	const handleAddToNote = useCallback(() => {
		if (!message || !currentChannel || !currentClanId) return;

		const createCanvasBody = (content?: string, id?: string) => ({
			channel_id: currentChannel.channel_id,
			clan_id: currentClanId.toString(),
			content,
			is_default: true,
			...(id && { id }),
			title: defaultCanvas?.title || 'Note',
			status: defaultCanvas ? 0 : EEventAction.CREATED
		});

		const insertImageToJson = (jsonObject: JsonObject, imageUrl?: string) => {
			if (!imageUrl) return;
			const imageInsert = { insert: { image: imageUrl } };
			jsonObject.ops.push(imageInsert);
			jsonObject.ops.push({ attributes: { list: 'ordered' }, insert: '\n' });
		};

		const updateJsonWithInsert = (jsonObject: JsonObject, newInsert: string) => {
			jsonObject.ops.push({ insert: newInsert });
			jsonObject.ops.push({ attributes: { list: 'ordered' }, insert: '\n' });
		};

		const isContentExists = (jsonObject: JsonObject, newInsert: string) => {
			return jsonObject.ops.some((op) => op.insert === newInsert);
		};

		const isImageExists = (jsonObject: JsonObject, imageUrl?: string) => {
			return jsonObject.ops.some((op) => {
				return typeof op.insert === 'object' && op.insert !== null && op.insert.image === imageUrl;
			});
		};

		let formattedString;

		if (!defaultCanvas || (defaultCanvas && !defaultCanvas.content)) {
			const messageContent = message.content.t;
			const jsonObject: JsonObject = { ops: [] };
			if (message.attachments?.length) {
				const newImageUrl = message.attachments[0].url;
				insertImageToJson(jsonObject, newImageUrl);
			}
			if (messageContent) {
				jsonObject.ops.push({ insert: messageContent });
				jsonObject.ops.push({ attributes: { list: 'ordered' }, insert: '\n' });
			}
			formattedString = JSON.stringify(jsonObject);
		} else {
			const jsonObject: JsonObject = safeJSONParse(defaultCanvas.content as string);

			if (message.attachments?.length) {
				const newImageUrl = message.attachments[0].url;
				if (!isImageExists(jsonObject, newImageUrl)) {
					insertImageToJson(jsonObject, newImageUrl);
				} else {
					return;
				}
			} else {
				const newInsert = message.content.t;
				if (newInsert && !isContentExists(jsonObject, newInsert)) {
					updateJsonWithInsert(jsonObject, newInsert);
				} else {
					return;
				}
			}

			formattedString = JSON.stringify(jsonObject);
		}

		dispatch(createEditCanvas(createCanvasBody(formattedString, defaultCanvas?.id)));
	}, [dispatch, message, currentChannel, currentClanId, defaultCanvas]);

	const appearanceTheme = useSelector(selectTheme);

	const isShowForwardAll = useMemo(() => {
		if (messagePosition === -1 || messagePosition === 0) return false;

		const currentMessage = allMessagesEntities?.[allMessageIds?.[messagePosition]];
		const nextMessage = allMessagesEntities?.[allMessageIds?.[messagePosition + 1]];
		const previousMessage = allMessagesEntities?.[allMessageIds?.[messagePosition - 1]];

		const isSameSenderWithNextMessage = currentMessage?.sender_id === nextMessage?.sender_id;
		const isSameSenderWithPreviousMessage = currentMessage?.sender_id === previousMessage?.sender_id;

		const isNextMessageWithinTimeLimit = nextMessage
			? Date.parse(nextMessage?.create_time) - Date.parse(currentMessage?.create_time) < FOR_10_MINUTES
			: false;

		const isPreviousMessageWithinTimeLimit = previousMessage
			? Date.parse(currentMessage?.create_time) - Date.parse(previousMessage?.create_time) < FOR_10_MINUTES
			: false;

		return isSameSenderWithPreviousMessage
			? isSameSenderWithNextMessage && isNextMessageWithinTimeLimit && !isPreviousMessageWithinTimeLimit
			: isSameSenderWithNextMessage && isNextMessageWithinTimeLimit;
	}, [allMessageIds, allMessagesEntities, messagePosition]);

	const handleReplyMessage = useCallback(() => {
		if (!message) {
			return;
		}
		dispatch(
			referencesActions.setDataReferences({
				channelId: message.topic_id && message.topic_id !== '0' ? message.topic_id : message.channel_id,
				dataReferences: {
					message_ref_id: message.id,
					ref_type: 0,
					message_sender_id: message.sender_id,
					content: JSON.stringify(message.content ?? '{}'),
					message_sender_username: message.username,
					mesages_sender_avatar: message.clan_avatar ? message.clan_avatar : message.avatar,
					message_sender_clan_nick: message.clan_nick,
					message_sender_display_name: message.display_name,
					has_attachment: (message.attachments && message.attachments?.length > 0) ?? false,
					channel_id: message.topic_id && message.topic_id !== '0' ? message.topic_id : message.channel_id,
					mode: message.mode ?? 0,
					channel_label: message.channel_label
				}
			})
		);
		dispatch(messagesActions.setIdMessageToJump(null));
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.NONE));
	}, [dispatch, message]);

	const handleEditMessage = useCallback(() => {
		dispatch(reactionActions.setReactionRightState(false));
		dispatch(referencesActions.setOpenEditMessageState(true));
		dispatch(referencesActions.setIdReferenceMessageEdit(message?.id));
		dispatch(
			messagesActions.setChannelDraftMessage({
				channelId: message?.channel_id,
				channelDraftMessage: {
					message_id: message?.id,
					draftContent: message?.content,
					draftMention: message?.mentions ?? [],
					draftAttachment: message?.attachments ?? [],
					draftTopicId: message?.topic_id as string
				}
			})
		);
		dispatch(messagesActions.setIdMessageToJump(null));
	}, [dispatch, message]);

	const handleForwardMessage = useCallback(() => {
		if (dmGroupChatList?.length === 0) {
			dispatch(directActions.fetchDirectMessage({}));
		}
		dispatch(toggleIsShowPopupForwardTrue());
		dispatch(setSelectedMessage(message));
		dispatch(setIsForwardAll(false));
	}, [dispatch, dmGroupChatList?.length, message]);

	const handleForwardAllMessage = useCallback(() => {
		if (dmGroupChatList?.length === 0) {
			dispatch(directActions.fetchDirectMessage({}));
		}
		dispatch(toggleIsShowPopupForwardTrue());
		dispatch(setSelectedMessage(message));
		dispatch(setIsForwardAll(true));
	}, [dispatch, dmGroupChatList?.length, message]);

	const handleUnPinMessage = useCallback(() => {
		dispatch(pinMessageActions.deleteChannelPinMessage({ channel_id: message?.channel_id, message_id: message?.id }));
	}, [dispatch, message?.channel_id, message?.id]);

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannel?.id as string), isShowCreateThread }));
			dispatch(topicsActions.setIsShowCreateTopic(false));
		},
		[currentChannel?.id, dispatch]
	);

	const setIsShowCreateTopic = useCallback(
		(isShowCreateTopic: boolean, channelId?: string) => {
			dispatch(topicsActions.setIsShowCreateTopic(isShowCreateTopic));
			dispatch(
				threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannel?.id as string), isShowCreateThread: false })
			);
		},
		[currentChannel?.id, dispatch]
	);

	const setValueThread = useCallback(
		(value: IMessageWithUser | null) => {
			dispatch(threadsActions.setValueThread(value));
		},
		[dispatch]
	);

	const setCurrentTopicInitMessage = useCallback(
		(value: IMessageWithUser | null) => {
			dispatch(topicsActions.setCurrentTopicInitMessage(value));
		},
		[dispatch]
	);

	const handleCreateThread = useCallback(() => {
		setIsShowCreateThread(true);
		setOpenThreadMessageState(true);
		dispatch(threadsActions.setOpenThreadMessageState(true));
		setValueThread({ ...message, references: [] });
	}, [dispatch, message, setIsShowCreateThread, setOpenThreadMessageState, setValueThread]);

	const handleCreateTopic = useCallback(() => {
		setIsShowCreateTopic(true);
		dispatch(topicsActions.setOpenTopicMessageState(true));
		setCurrentTopicInitMessage(message);
		dispatch(topicsActions.setCurrentTopicId(''));
		dispatch(topicsActions.setFirstMessageOfCurrentTopic(message));
	}, [dispatch, message, setIsShowCreateTopic, setCurrentTopicInitMessage]);

	const handleMarkMessageNoti = useCallback(async () => {
		try {
			dispatch(notificationActions.markMessageNotify(message));
		} catch (error) {
			toast.error('Failed to note this message');
		}
	}, [dispatch, message]);

	const handleMarkUnread = useCallback(async () => {
		try {
			dispatch(
				messagesActions.updateLastSeenMessage({
					clanId: message?.clan_id || '',
					channelId: message?.channel_id,
					messageId: message?.id,
					mode: message?.mode || 0,
					badge_count: 0,
					message_time: message.create_time_seconds
				})
			);
			dispatch(
				channelMetaActions.setChannelLastSeenTimestamp({
					channelId: message?.channel_id as string,
					timestamp: message.create_time_seconds || Date.now()
				})
			);
		} catch (error) {
			toast.error('Failed to note this message');
		}
	}, [dispatch, message]);

	const handleSlashCommands = useCallback(async () => {
		// ignore
	}, []);

	const handleSlashCommandSelect = useCallback(
		(command: ApiQuickMenuAccessRequest) => {
			if (command.action_msg) {
				const payload = {
					t: command.action_msg.trim(),
					hg: [],
					ej: [],
					mk: []
				};

				try {
					sendChatMessage(payload, [], [], undefined, false, false);
				} catch (error) {
					console.error('Error sending slash command message:', error);
					toast.error(`Failed to execute command "${command.menu_name}"`);
				}
			}
		},
		[sendChatMessage]
	);

	const checkPos = useMemo(() => {
		if (posShowMenu === SHOW_POSITION.NONE || posShowMenu === SHOW_POSITION.IN_STICKER || posShowMenu === SHOW_POSITION.IN_EMOJI) {
			return true;
		}
		return false;
	}, [posShowMenu]);

	const isClickedSticker = useMemo(() => {
		return posShowMenu === SHOW_POSITION.IN_STICKER;
	}, [posShowMenu]);

	const isClickedEmoji = useMemo(() => {
		return posShowMenu === SHOW_POSITION.IN_EMOJI;
	}, [posShowMenu]);

	const [enableEditMessageItem, enableReportMessageItem] = useMemo(() => {
		if (!checkPos) return [false, false];
		const enableEdit = isMyMessage;
		const enableReport = !isMyMessage;

		return [enableEdit, enableReport];
	}, [isMyMessage, checkPos]);

	const pinMessageStatus = useMemo(() => {
		if (!checkPos) return undefined;
		return !checkMessageInPinnedList;
	}, [checkMessageInPinnedList, checkPos]);

	const enableSpeakMessageItem = useMemo(() => {
		if (!checkPos) return false;
		return checkMessageHasText;
	}, [checkMessageHasText, checkPos]);

	const enableCreateThreadItem = useMemo(() => {
		if (!checkPos) return false;
		if (activeMode === ChannelStreamMode.STREAM_MODE_DM || activeMode === ChannelStreamMode.STREAM_MODE_GROUP) {
			return false;
		} else {
			return canManageThread;
		}
	}, [checkPos, activeMode, canManageThread]);

	const enableDelMessageItem = useMemo(() => {
		if (!checkPos) return false;
		if (isMyMessage) {
			return true;
		}
		// DM Group
		if (Number(type) === ChannelType.CHANNEL_TYPE_GROUP) {
			return isOwnerGroupDM;
		}
		if (activeMode === ChannelStreamMode.STREAM_MODE_CHANNEL || activeMode === ChannelStreamMode.STREAM_MODE_THREAD) {
			return canDeleteMessage;
		}
		return false;
	}, [checkPos, isMyMessage, type, isOwnerGroupDM, activeMode, canDeleteMessage]);

	const enableGiveCoffeeItem = useMemo(() => {
		if (!checkPos) return false;
		// Don't show give coffee for own messages
		if (isMyMessage) return false;
		// Only show in channels where we can send messages
		return canSendMessage;
	}, [checkPos, isMyMessage, canSendMessage]);

	const checkElementIsImage = elementTarget instanceof HTMLImageElement;

	const urlImage = useMemo(() => {
		if (imageSrc) {
			return imageSrc;
		} else return '';
	}, [imageSrc]);

	useMemo(() => {
		if (isClickedEmoji) {
			setEnableCopyLinkItem(true);
			setEnableOpenLinkItem(true);
			setEnableCopyImageItem(false);
			setEnableSaveImageItem(false);
			return;
		}
		if (isClickedSticker) {
			setEnableCopyLinkItem(false);
			setEnableOpenLinkItem(false);
			setEnableCopyImageItem(false);
			setEnableSaveImageItem(false);
			return;
		}
		if (checkElementIsImage) {
			setEnableCopyLinkItem(true);
			setEnableOpenLinkItem(true);
			setEnableCopyImageItem(true);
			setEnableSaveImageItem(true);
			return;
		} else {
			setEnableCopyLinkItem(false);
			setEnableOpenLinkItem(false);
			setEnableCopyImageItem(false);
			setEnableSaveImageItem(false);
		}
	}, [checkElementIsImage, isClickedEmoji, isClickedSticker]);
	const quickMenuItems = useAppSelector((state) => selectQuickMenuByChannelId(state, currentChannel?.id || ''));

	const items = useMemo<ContextMenuItem[]>(() => {
		const builder = new MenuBuilder();

		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'addReaction', // id
				'Add Reaction', // label
				handleItemClick,
				<Icons.RightArrowRightClick />
			);
		});

		builder.when(enableGiveCoffeeItem, (builder) => {
			builder.addMenuItem('giveCoffee', 'Give Coffee', openGiveCoffeeModal, <Icons.DollarIconRightClick defaultSize="w-4 h-4" />);
		});

		builder.when(enableEditMessageItem, (builder) => {
			builder.addMenuItem(
				'editMessage',
				'Edit Message',
				async () => {
					try {
						handleEditMessage();
					} catch (error) {
						console.error('Failed to edit message', error);
					}
				},

				<Icons.EditMessageRightClick defaultSize="w-4 h-4" />
			);
		});

		builder.when(!isTopic && pinMessageStatus === true, (builder) => {
			builder.addMenuItem('pinMessage', 'Pin Message', openPinMessageModal, <Icons.PinMessageRightClick defaultSize="w-4 h-4" />);
		});
		builder.when(!isTopic && pinMessageStatus === false, (builder) => {
			builder.addMenuItem('unPinMessage', 'Unpin Message', () => handleUnPinMessage(), <Icons.PinMessageRightClick defaultSize="w-4 h-4" />);
		});

		builder.when(
			userId === currentChannel?.creator_id &&
				activeMode !== ChannelStreamMode.STREAM_MODE_DM &&
				activeMode !== ChannelStreamMode.STREAM_MODE_GROUP,
			(builder) => {
				builder.addMenuItem('addNote', 'Add To Note', handleAddToNote, <Icons.CanvasIconRightClick defaultSize="w-4 h-4" />);
			}
		);

		builder.when(
			checkPos &&
				(canSendMessage || activeMode === ChannelStreamMode.STREAM_MODE_DM || activeMode === ChannelStreamMode.STREAM_MODE_GROUP || isTopic),
			(builder) => {
				builder.addMenuItem(
					'reply',
					'Reply',
					() => handleReplyMessage(),

					<Icons.ReplyRightClick defaultSize="w-4 h-4" />
				);
			}
		);

		builder.when(enableCreateThreadItem, (builder) => {
			builder.addMenuItem('createThread', 'Create Thread', () => handleCreateThread(), <Icons.ThreadIconRightClick defaultSize="w-4 h-4" />);
		});

		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'copyText',
				'Copy Text',
				async () => {
					try {
						await handleCopyLink(message?.content?.t ?? '');
					} catch (error) {
						console.error('Failed to copy text', error);
					}
				},
				<Icons.CopyTextRightClick />
			);
		});

		builder.when(checkPos && quickMenuItems?.length > 0, (builder) => {
			builder.addMenuItem(
				'slashCommands',
				'Slash Commands',
				handleSlashCommands,
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M7 12l3-3 3 3m0 6l3-3 3 3M7 6l3-3 3 3"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			);
		});

		// builder.when(checkPos, (builder) => {
		// 	builder.addMenuItem('apps', 'Apps', () => console.log('apps'), <Icons.RightArrowRightClick defaultSize="w-4 h-4" />);
		// });

		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'addToInbox',
				'Add To Inbox',
				handleMarkMessageNoti,
				<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
						fill="currentColor"
					/>
				</svg>
			);
		});

		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'markUnread',
				'Mark Unread',
				handleMarkUnread,
				<svg height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
					<path d="M410.9,0H85.1C72.3,0,61.8,10.4,61.8,23.3V512L248,325.8L434.2,512V23.3C434.2,10.4,423.8,0,410.9,0z" fill="currentColor" />
				</svg>
			);
		});
		message?.code !== TypeMessage.Topic &&
			notAllowedType &&
			!isTopic &&
			canSendMessage &&
			builder.when(checkPos && hasPermissionCreateTopic, (builder) => {
				builder.addMenuItem('topicDiscussion', 'Topic Discussion', handleCreateTopic, <Icons.TopicIcon defaultSize="w-4 h-4" />);
			});

		builder.when(checkPos, (builder) => {
			builder.addMenuItem('forwardMessage', 'Forward Message', () => handleForwardMessage(), <Icons.ForwardRightClick defaultSize="w-4 h-4" />);
		});

		isShowForwardAll &&
			builder.when(checkPos, (builder) => {
				builder.addMenuItem(
					'forwardAll',
					'Forward All Message',
					() => handleForwardAllMessage(),
					<Icons.ForwardRightClick defaultSize="w-4 h-4" />
				);
			});

		builder.when(enableDelMessageItem, (builder) => {
			builder.addMenuItem('deleteMessage', 'Delete Message', openDeleteMessageModal, <Icons.DeleteMessageRightClick defaultSize="w-4 h-4" />);
		});

		// builder.when(enableReportMessageItem, (builder) => {
		// 	builder.addMenuItem(
		// 		'reportMessage',
		// 		'Report Message',
		// 		() => {
		// 			console.log('report message');
		// 		},
		// 		<Icons.ReportMessageRightClick defaultSize="w-4 h-4" />
		// 	);
		// });

		builder.when(enableCopyLinkItem, (builder) => {
			builder.addMenuItem('copyLink', 'Copy Link', async () => {
				try {
					await handleCopyLink(urlImage);
				} catch (error) {
					console.error('Failed to copy link:', error);
				}
			});
		});

		builder.when(enableOpenLinkItem, (builder) => {
			builder.addMenuItem('openLink', 'Open Link', async () => {
				try {
					await handleOpenLink(urlImage);
				} catch (error) {
					console.error('Failed to copy image:', error);
				}
			});
		});

		builder.when(enableCopyImageItem, (builder) => {
			builder.addMenuItem('copyImage', 'Copy Image', async () => {
				try {
					await handleCopyImage(urlImage);
				} catch (error) {
					console.error('Failed to copy image:', error);
				}
			});
		});

		builder.when(enableSaveImageItem, (builder) => {
			builder.addMenuItem('saveImage', 'Save Image', async () => {
				try {
					handleSaveImage(urlImage);
				} catch (error) {
					console.error('Failed to save image:', error);
				}
			});
		});

		return builder.build();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		checkPos,
		enableEditMessageItem,
		pinMessageStatus,
		canSendMessage,
		enableCreateThreadItem,
		isShowForwardAll,
		enableSpeakMessageItem,
		enableDelMessageItem,
		enableGiveCoffeeItem,
		enableReportMessageItem,
		enableCopyLinkItem,
		enableOpenLinkItem,
		enableCopyImageItem,
		enableSaveImageItem,
		appearanceTheme,
		userId,
		message,
		dispatch,
		handleEditMessage,
		handleUnPinMessage,
		handleReplyMessage,
		handleCreateThread,
		handleForwardMessage,
		handleForwardAllMessage,
		urlImage,
		handleItemClick,
		handleCreateTopic,
		handleSlashCommands,
		isTopic
	]);
	/* eslint-disable no-console */

	return (
		<DynamicContextMenu
			key={messageId}
			menuId={id}
			items={items}
			messageId={messageId}
			message={message}
			isTopic={isTopic}
			onSlashCommandExecute={handleSlashCommandSelect}
			currentChannelId={currentChannel?.id}
		/>
	);
}

export default MessageContextMenu;
