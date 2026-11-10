import { useCallback, useMemo, useState } from 'react';

import {
	useAppParams,
	useAuth,
	useCdnUrlSigner,
	useChatReaction,
	useChatSending,
	useDirect,
	usePermissionChecker,
	useReference,
	useSendInviteMessage,
	useTopics
} from '@mezon/core';
import {
	channelMetaActions,
	closePoll,
	createEditCanvas,
	directActions,
	gifsStickerEmojiActions,
	giveCoffeeActions,
	messagesActions,
	notificationActions,
	pinMessageActions,
	reactionActions,
	referencesActions,
	selectAllDirectMessages,
	selectClanView,
	selectClickedOnThreadBoxStatus,
	selectClickedOnTopicStatus,
	selectCurrentChannelChannelId,
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectCurrentChannelPrivate,
	selectCurrentChannelType,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDefaultCanvasByChannelId,
	selectDmChannelIdById,
	selectDmChannelPrivateById,
	selectDmCreatorIdById,
	selectDmGroupCurrentId,
	selectInitTopicMessageId,
	selectIsMessagePinned,
	selectMessageByMessageId,
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId,
	selectModeResponsive,
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
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import type { ContextMenuItem, IMessageWithUser } from '@mezon/utils';
import {
	EEventAction,
	EMOJI_GIVE_COFFEE,
	EOverriddenPermission,
	FORWARD_MESSAGE_TIME,
	MenuBuilder,
	ModeResponsive,
	SHOW_POSITION,
	SYSTEM_NAME,
	SYSTEM_SENDER_ID,
	SubPanelName,
	TOKEN_TO_AMOUNT,
	TypeMessage,
	formatMoney,
	handleCopyImage,
	handleCopyLink,
	handleOpenLink,
	handleSaveImage,
	isPublicChannel,
	showSimpleToast
} from '@mezon/utils';
import type { ApiChannelDescription, ApiQuickMenuAccessRequest } from 'mezon-js';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import { useTranslation } from 'react-i18next';
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
	openReportMessageModal: () => void;
	linkContent?: string;
	isLinkContent?: boolean;
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
	const creatorId = useAppSelector((state) => selectDmCreatorIdById(state, (directId as string) || ''));

	const isOwnerGroupDM = useMemo(() => {
		return creatorId === userProfile?.user?.id;
	}, [creatorId, userProfile?.user?.id]);

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
	openReportMessageModal,
	linkContent,
	isLinkContent
}: MessageContextMenuProps) {
	const { t } = useTranslation('contextMenu');
	const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';
	const { setOpenThreadMessageState } = useReference();
	const { startCreateTopicFromMessage } = useTopics();
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelPrivate = useSelector(selectCurrentChannelPrivate);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentChannelType = useSelector(selectCurrentChannelType);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelChannelId = useSelector(selectCurrentChannelChannelId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const isClanView = useSelector(selectClanView);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isFocusThreadBox = useSelector(selectClickedOnThreadBoxStatus);
	const currentThread = useAppSelector(selectThreadCurrentChannel);
	const dmChannelPrivate = useAppSelector((state) => selectDmChannelPrivateById(state, (currentDmId || '') as string));
	const dmChannelId = useAppSelector((state) => selectDmChannelIdById(state, (currentDmId || '') as string));

	const { createDirectMessageWithUser } = useDirect({ suppressDeniedToast: true });
	const { sendInviteMessage } = useSendInviteMessage();

	const channelOrDirect = useMemo(() => {
		if (isClanView) {
			return {
				clan_id: currentClanId,
				channel_private: currentChannelPrivate,
				channel_id: currentChannelId
			} as ApiChannelDescription;
		}
		return { channel_private: dmChannelPrivate, channel_id: dmChannelId, clan_id: '0' } as ApiChannelDescription;
	}, [isClanView, currentClanId, currentChannelPrivate, currentChannelId, dmChannelPrivate, dmChannelId]);

	const { sendMessage: sendChatMessage } = useChatSending({
		channelOrDirect,
		mode: activeMode || ChannelStreamMode.STREAM_MODE_CHANNEL
	});

	const message = useAppSelector((state) =>
		selectMessageByMessageId(
			state,
			isTopic ? currentTopicId : isFocusThreadBox ? currentThread?.channel_id : isClanView ? currentChannelId : currentDmId,
			messageId
		)
	);

	const currentDmChannelId = useAppSelector((state) => selectDmChannelIdById(state, (currentDmId || '') as string));
	const modeResponsive = useSelector(selectModeResponsive);
	const allMessagesEntities = useAppSelector((state) =>
		selectMessageEntitiesByChannelId(state, (modeResponsive === ModeResponsive.MODE_CLAN ? currentChannelId : currentDmChannelId) || '')
	);
	const allMessageIds = useAppSelector((state) => selectMessageIdsByChannelId(state, (isClanView ? currentChannelId : currentDmId) as string));
	const dispatch = useAppDispatch();

	const handleItemClick = useCallback(() => {
		dispatch(referencesActions.setIdReferenceMessageReaction(message.id));
		dispatch(gifsStickerEmojiActions.setSubPanelActive(SubPanelName.EMOJI_REACTION_RIGHT));
	}, [dispatch]);
	const defaultCanvas = useAppSelector((state) => selectDefaultCanvasByChannelId(state, currentChannelId ?? ''));
	const messagePosition = allMessageIds.findIndex((id: string) => id === messageId);
	const { userId } = useAuth();
	const { posShowMenu, imageSrc } = useMessageContextMenu();
	const isOwnerGroupDM = useIsOwnerGroupDM();
	const { reactionMessageDispatch } = useChatReaction();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const initTopicMessageId = useSelector(selectInitTopicMessageId);

	const isMyMessage = useMemo(() => {
		return message?.sender_id === userId && !message?.content?.callLog?.callLogType && !(message?.code === TypeMessage.SendToken);
	}, [message?.sender_id, message?.content?.callLog?.callLogType, message?.code, userId]);

	const isErrorMessage = useMemo(() => {
		return message?.isError === true && isMyMessage;
	}, [message?.isError, isMyMessage]);

	const pollData = message?.content as unknown as Record<string, unknown> | undefined;

	const checkMessageHasText = useMemo(() => {
		return message?.content?.t !== '';
	}, [message?.content?.t]);

	const pinCheckChannelIds = useMemo(
		() => [currentChannelId, currentChannelChannelId, message?.channel_id, currentDmId],
		[currentChannelId, currentChannelChannelId, message?.channel_id, currentDmId]
	);

	const isMessagePinned = useAppSelector((state) => selectIsMessagePinned(state, pinCheckChannelIds, messageId));

	const [canManageThread, canDeleteMessage, canSendMessage] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EOverriddenPermission.deleteMessage, EOverriddenPermission.sendMessage],
		currentChannelId ?? ''
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
		message?.code !== TypeMessage.Welcome &&
		message?.code !== TypeMessage.UpcomingEvent;

	const handleAddToNote = useCallback(() => {
		if (!message || !currentChannelId || !currentClanId) return;

		const createCanvasBody = (content?: string, id?: string) => ({
			channel_id: currentChannelId,
			clan_id: currentClanId.toString(),
			content,
			is_default: true,
			...(id && { id }),
			title: defaultCanvas?.title || t('note'),
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
	}, [dispatch, message, currentClanId, defaultCanvas, t]);

	const appearanceTheme = useSelector(selectTheme);

	const isShowForwardAll = useMemo(() => {
		if (messagePosition === -1 || messagePosition === 0) return false;

		const currentMessage = allMessagesEntities?.[allMessageIds?.[messagePosition]];
		const nextMessage = allMessagesEntities?.[allMessageIds?.[messagePosition + 1]];
		const previousMessage = allMessagesEntities?.[allMessageIds?.[messagePosition - 1]];

		const isSameSenderWithNextMessage = currentMessage?.sender_id === nextMessage?.sender_id;
		const isSameSenderWithPreviousMessage = currentMessage?.sender_id === previousMessage?.sender_id;

		const isNextMessageWithinTimeLimit =
			nextMessage?.create_time_seconds && currentMessage?.create_time_seconds
				? nextMessage?.create_time_seconds - currentMessage?.create_time_seconds < FORWARD_MESSAGE_TIME
				: false;
		const isPreviousMessageWithinTimeLimit =
			currentMessage?.create_time_seconds && previousMessage?.create_time_seconds
				? currentMessage?.create_time_seconds - previousMessage?.create_time_seconds < FORWARD_MESSAGE_TIME
				: false;
		return (isPreviousMessageWithinTimeLimit && isSameSenderWithPreviousMessage) || (isSameSenderWithNextMessage && isNextMessageWithinTimeLimit);
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
					message_sender_avatar: message.clan_avatar ? message.clan_avatar : message.avatar,
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
		dispatch(
			pinMessageActions.deleteChannelPinMessage({
				channel_id: message?.channel_id,
				message_id: message?.id,
				clan_id: message?.clan_id as string
			})
		);
	}, [dispatch, message?.channel_id, message?.id]);

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannelId as string), isShowCreateThread }));
			dispatch(topicsActions.setIsShowCreateTopic(false));
			dispatch(topicsActions.setFocusTopicBox(false));
		},
		[currentChannelId, dispatch]
	);

	const setValueThread = useCallback(
		(value: IMessageWithUser | null) => {
			dispatch(threadsActions.setValueThread(value));
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
		startCreateTopicFromMessage(message, message);
	}, [message, startCreateTopicFromMessage]);

	const handleMarkMessageNoti = useCallback(async () => {
		try {
			dispatch(notificationActions.markMessageNotify(message));
		} catch (error) {
			toast.error(t('errors.failedToNoteMessage'));
		}
	}, [dispatch, message, t]);

	const handleMarkUnread = useCallback(async () => {
		try {
			dispatch(
				messagesActions.updateLastSeenMessage({
					clanId: message?.clan_id || '0',
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
					timestamp: message.create_time_seconds || Date.now() / 1000,
					messageId: message?.id,
					clanId: message.clan_id || ''
				})
			);
		} catch (error) {
			toast.error(t('errors.failedToNoteMessage'));
		}
	}, [dispatch, message, t]);

	const handleQuickMenuSelect = useCallback(
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
					console.error(t('errors.errorSendingQuickMenu'), error);
					toast.error(`Failed to execute command "${command.menu_name}"`);
				}
			}
		},
		[sendChatMessage]
	);

	const handleResendMessage = useCallback(async () => {
		if (!message || !message.channel_id) return;

		try {
			await dispatch(
				messagesActions.resendMessage({
					messageId: message.id,
					channelId: message.channel_id
				})
			).unwrap();
			showSimpleToast(t('messageResent'));
		} catch (error) {
			console.error(t('errors.failedToResendMessage'), error);
			toast.error(t('errors.failedToResendMessage'));
		}
	}, [dispatch, message, t]);

	const handleDeleteErrorMessage = useCallback(() => {
		if (!message?.channel_id || !message?.id) return;
		dispatch(
			messagesActions.remove({
				channelId: message.channel_id,
				messageId: message.id
			})
		);
	}, [dispatch, message?.channel_id, message?.id]);

	const handleClosePoll = useCallback(async () => {
		if (!message?.channel_id || !message?.id) return;

		try {
			await dispatch(
				closePoll({
					message_id: message.id,
					channel_id: message.channel_id
				})
			).unwrap();
			showSimpleToast(t('pollEnded'));
		} catch (error) {
			console.error('Failed to close poll', error);
			toast.error(t('errors.failedToClosePoll'));
		}
	}, [dispatch, message?.channel_id, message?.id, t]);

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

	const isPollMessage = useMemo(() => {
		return message?.code === TypeMessage.Poll;
	}, [message?.code]);

	const isTopicRootMessage = useMemo(() => message?.code === TypeMessage.Topic, [message?.code]);

	const [enableEditMessageItem, enableReportMessageItem] = useMemo(() => {
		if (!checkPos) return [false, false];
		const enableEdit = isMyMessage && !isTopicRootMessage && !isPollMessage;
		const enableReport = !isMyMessage;

		return [enableEdit, enableReport];
	}, [isMyMessage, checkPos, isTopicRootMessage, isPollMessage]);

	const pinMessageStatus = useMemo(() => {
		if (!checkPos) return undefined;
		return !isMessagePinned;
	}, [isMessagePinned, checkPos]);

	const enableSpeakMessageItem = useMemo(() => {
		if (!checkPos) return false;
		return checkMessageHasText;
	}, [checkMessageHasText, checkPos]);

	const enableCreateThreadItem = useMemo(() => {
		if (!checkPos) return false;
		if (isTopic) return false;
		if (
			activeMode === ChannelStreamMode.STREAM_MODE_DM ||
			activeMode === ChannelStreamMode.STREAM_MODE_GROUP ||
			activeMode === ChannelStreamMode.STREAM_MODE_THREAD
		) {
			return false;
		}
		if (
			currentChannelType === ChannelType.CHANNEL_TYPE_STREAMING ||
			currentChannelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE ||
			currentChannelType === ChannelType.CHANNEL_TYPE_APP
		) {
			return false;
		}
		return canManageThread;
	}, [checkPos, activeMode, canManageThread, currentChannelType, isTopic]);

	const enableDelMessageItem = useMemo(() => {
		if (!checkPos) return false;
		if (isTopicRootMessage) return false;
		const isInitTopicMessage = !isTopic && messageId === initTopicMessageId;
		if (isInitTopicMessage) return false;

		if (isMyMessage) return true;

		if (Number(type) === ChannelType.CHANNEL_TYPE_GROUP) return isOwnerGroupDM;

		const isChannelOrThreadOrTopic =
			isTopic || activeMode === ChannelStreamMode.STREAM_MODE_CHANNEL || activeMode === ChannelStreamMode.STREAM_MODE_THREAD;
		return isChannelOrThreadOrTopic ? canDeleteMessage : false;
	}, [activeMode, type, canDeleteMessage, isMyMessage, checkPos, isOwnerGroupDM, isTopicRootMessage, messageId, initTopicMessageId, isTopic]);

	const checkElementIsImage = elementTarget instanceof HTMLImageElement;
	const checkElementIsLink = elementTarget instanceof HTMLAnchorElement;

	const urlImage = useMemo(() => {
		if (message?.content?.embed && Array.isArray(message.content.embed)) {
			for (const embed of message.content.embed) {
				if (embed?.image?.url) {
					return embed.image.url;
				}
			}
		}
		if (imageSrc && imageSrc !== SHOW_POSITION.NONE) {
			return imageSrc;
		}
		return '';
	}, [imageSrc, message?.content?.embed]);
	const { signCdnUrl } = useCdnUrlSigner([urlImage], message?.channel_id);

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
		}
		if (isLinkContent && linkContent) {
			setEnableCopyLinkItem(true);
			setEnableOpenLinkItem(true);
			setEnableCopyImageItem(false);
			setEnableSaveImageItem(false);
			return;
		} else {
			setEnableCopyLinkItem(false);
			setEnableOpenLinkItem(false);
			setEnableCopyImageItem(false);
			setEnableSaveImageItem(false);
		}
	}, [checkElementIsImage, checkElementIsLink, isClickedEmoji, isClickedSticker, isLinkContent, linkContent]);

	const sendTransactionMessage = useCallback(
		async (userId: string, display_name?: string, username?: string, avatar?: string) => {
			const response = await createDirectMessageWithUser(userId, display_name, username, avatar);
			if (response?.channel_id) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(
					`Funds Transferred: ${formatMoney(TOKEN_TO_AMOUNT.ONE_THOUNSAND * 10)}₫ | Give coffee action`,
					response.channel_id,
					channelMode,
					TypeMessage.SendToken
				);
			}
		},
		[createDirectMessageWithUser, sendInviteMessage]
	);

	const quickMenuItems = useAppSelector((state) => selectQuickMenuByChannelId(state, currentChannelId || ''));
	const isForwardedMessage = Boolean(message?.content?.fwd);
	const hasSelectedText = !!window.getSelection?.()?.toString().length;
	const items = useMemo<ContextMenuItem[]>(() => {
		const builder = new MenuBuilder();

		if (message?.isError) {
			builder.addMenuItem(
				'resendMessage',
				t('resendMessage'),
				handleResendMessage,
				<MezonIcon icon={MzIcons16.mzSend} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
			builder.addMenuItem('deleteMessage', t('deleteMessage'), handleDeleteErrorMessage, <MezonIcon icon={MzIcons16.mzTrash} />);
			return builder.build();
		}

		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'addReaction', // id
				t('addReaction'), // label
				handleItemClick,
				<MezonIcon icon={MzIcons16.mzEmoji} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});

		builder.when(
			checkPos &&
				userId !== message?.sender_id &&
				message?.sender_id !== NX_CHAT_APP_ANNONYMOUS_USER_ID &&
				message?.sender_id !== SYSTEM_SENDER_ID &&
				message?.username !== SYSTEM_NAME,
			(builder) => {
				builder.addMenuItem(
					'giveAcoffee', // id
					t('giveACoffee'), // label

					async () => {
						try {
							if (userId !== message.sender_id) {
								await dispatch(
									giveCoffeeActions.updateGiveCoffee({
										channel_id: message.channel_id,
										clan_id: message.clan_id,
										message_ref_id: message.id,
										receiver_id: message.sender_id,
										sender_id: userId,
										receiver_name: message?.username || message?.user?.username || ''
									})
								).unwrap();
								await reactionMessageDispatch({
									id: EMOJI_GIVE_COFFEE.emoji_id,
									messageId: message.id ?? '',
									emoji_id: EMOJI_GIVE_COFFEE.emoji_id,
									emoji: EMOJI_GIVE_COFFEE.emoji,
									count: 1,
									message_sender_id: message?.sender_id ?? '',
									action_delete: false,
									is_public: isPublicChannel({ parent_id: currentChannelParentId, channel_private: currentChannelPrivate }),
									clanId: message.clan_id ?? '',
									channelId: isTopic ? currentChannelId || '' : (message?.channel_id ?? ''),
									isFocusTopicBox,
									channelIdOnMessage: message?.channel_id
								});

								await sendTransactionMessage(
									message.sender_id || '',
									message.user?.name,
									message.user?.name || message.user?.username,
									message.avatar
								);
							}
						} catch (error) {
							console.error(t('errors.failedToGiveCoffee'), error);
						}
					},
					<MezonIcon icon={MzIcons16.mzCoin} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
				);
			}
		);
		if (!isForwardedMessage) {
			builder.when(enableEditMessageItem, (builder) => {
				builder.addMenuItem(
					'editMessage',
					t('editMessage'),
					async () => {
						try {
							handleEditMessage();
						} catch (error) {
							console.error(t('errors.failedToEditMessage'), error);
						}
					},
					<MezonIcon icon={MzIcons16.mzEdit} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
				);
			});
		}

		builder.when(!isTopic && pinMessageStatus === false, (builder) => {
			builder.addMenuItem(
				'unPinMessage',
				t('unpinMessage'),
				() => handleUnPinMessage(),
				<MezonIcon icon={MzIcons16.mzPin} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(
			checkPos &&
				(canSendMessage || activeMode === ChannelStreamMode.STREAM_MODE_DM || activeMode === ChannelStreamMode.STREAM_MODE_GROUP || isTopic),
			(builder) => {
				builder.addMenuItem(
					'reply',
					t('reply'),
					() => handleReplyMessage(),

					<MezonIcon icon={MzIcons16.mzReply} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
				);
			}
		);
		builder.when(checkPos && !isPollMessage, (builder) => {
			builder.addMenuItem(
				'forwardMessage',
				t('forwardMessage'),
				() => handleForwardMessage(),
				<MezonIcon icon={MzIcons16.mzForward} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(checkPos && isShowForwardAll && !isPollMessage, (builder) => {
			builder.addMenuItem(
				'forwardAll',
				t('forwardAllMessage'),
				() => handleForwardAllMessage(),
				<MezonIcon icon={MzIcons16.mzForwardAll} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(enableCreateThreadItem && !isPollMessage, (builder) => {
			builder.addMenuItem(
				'createThread',
				t('createThread'),
				() => handleCreateThread(),
				<MezonIcon icon={MzIcons16.mzThread} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});

		builder.when(checkPos && !isPollMessage, (builder) => {
			builder.addMenuItem(
				'copyText',
				t('copyText'),
				async () => {
					try {
						await handleCopyLink(message?.content?.t ?? '');
					} catch (error) {
						console.error(t('errors.failedToCopyText'), error);
					}
				},
				<MezonIcon icon={MzIcons16.mzCopy} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(checkPos && !isPollMessage && hasSelectedText, (builder) => {
			builder.addMenuItem(
				'copyTextSelected',
				t('copyTextSelected'),
				async () => {
					try {
						const selectedText = window.getSelection?.()?.toString() || '';
						await handleCopyLink(selectedText || message?.content?.t || '');
					} catch (error) {
						console.error(t('errors.failedToCopyText'), error);
					}
				},
				<MezonIcon icon={MzIcons16.mzCopy} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(!isTopic && pinMessageStatus === true, (builder) => {
			builder.addMenuItem(
				'pinMessage',
				t('pinMessage'),
				openPinMessageModal,
				<MezonIcon icon={MzIcons16.mzPin} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});

		builder.when(
			message?.code === TypeMessage.Poll && pollData && !pollData.is_closed && message?.sender_id === userId && checkPos,
			(builder) => {
				builder.addMenuItem(
					'endPollNow',
					t('endPollNow'),
					handleClosePoll,
					<MezonIcon icon={MzIcons16.mzCloseCircle} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
				);
			}
		);

		message?.code !== TypeMessage.Topic &&
			!isPollMessage &&
			notAllowedType &&
			!isTopic &&
			canSendMessage &&
			currentChannelType !== ChannelType.CHANNEL_TYPE_APP &&
			currentChannelType !== ChannelType.CHANNEL_TYPE_MEZON_VOICE &&
			currentChannelType !== ChannelType.CHANNEL_TYPE_STREAMING &&
			builder.when(checkPos && hasPermissionCreateTopic, (builder) => {
				builder.addMenuItem(
					'topicDiscussion',
					t('topicDiscussion'),
					handleCreateTopic,
					<MezonIcon icon={MzIcons16.mzTopic} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
				);
			});
		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'markUnread',
				t('markUnread'),
				handleMarkUnread,
				<MezonIcon icon={MzIcons16.mzMarkUnread} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'addToInbox',
				t('addToInbox'),
				handleMarkMessageNoti,
				<MezonIcon icon={MzIcons16.mzInbox} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(checkPos && quickMenuItems?.length > 0, (builder) => {
			builder.addMenuItem(
				'quickMenus',
				t('quickMenus'),
				() => {}, // Ignored because handled by onQuickMenuExecute
				<MezonIcon icon={MzIcons16.mzBolt} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
			);
		});
		builder.when(enableCopyLinkItem, (builder) => {
			builder.addMenuItem('copyLink', t('copyLink'), async () => {
				try {
					const contentToCopy =
						isLinkContent && linkContent ? linkContent : checkElementIsImage ? signCdnUrl(urlImage) : (message?.content?.t ?? '');
					await handleCopyLink(contentToCopy);
				} catch (error) {
					console.error(t('errors.failedToCopyLink'), error);
				}
			});
		});

		builder.when(enableOpenLinkItem, (builder) => {
			builder.addMenuItem('openLink', t('openLink'), async () => {
				try {
					const contentToOpen =
						isLinkContent && linkContent ? linkContent : checkElementIsImage ? signCdnUrl(urlImage) : (message?.content?.t ?? '');
					await handleOpenLink(contentToOpen);
				} catch (error) {
					console.error(t('errors.failedToCopyImage'), error);
				}
			});
		});
		builder.when(enableReportMessageItem, (builder) => {
			builder.addMenuItem(
				'reportMessage',
				t('reportMessage'),
				() => {
					openReportMessageModal();
				},
				<MezonIcon icon={MzIcons16.mzFlag} />
			);
		});

		builder.when(enableCopyImageItem, (builder) => {
			builder.addMenuItem('copyImage', t('copyImage'), async () => {
				try {
					const success = await handleCopyImage(signCdnUrl(urlImage), () => {
						showSimpleToast(t('imageCopiedToClipboard'));
					});
					if (!success) {
						toast.error(t('errors.failedToCopyImage'));
					}
				} catch (error) {
					console.error(t('errors.failedToCopyImage'), error);
					toast.error(t('errors.failedToCopyImage'));
				}
			});
		});

		builder.when(enableSaveImageItem, (builder) => {
			builder.addMenuItem('saveImage', t('saveImage'), async () => {
				try {
					handleSaveImage(signCdnUrl(urlImage));
				} catch (error) {
					console.error(t('errors.failedToSaveImage'), error);
				}
			});
		});
		builder.when(enableDelMessageItem, (builder) => {
			builder.addMenuItem('deleteMessage', t('deleteMessage'), openDeleteMessageModal, <MezonIcon icon={MzIcons16.mzTrash} />);
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
		signCdnUrl,
		handleItemClick,
		handleCreateTopic,
		handleAddToNote,
		isTopic,
		isErrorMessage,
		handleResendMessage,
		handleDeleteErrorMessage,
		hasSelectedText
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
			onQuickMenuExecute={handleQuickMenuSelect}
			currentChannelId={currentChannelId as string}
		/>
	);
}

export default MessageContextMenu;
