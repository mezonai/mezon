import { useCallback, useMemo, useState } from 'react';

import {
	useAppParams,
	useAuth,
	useChatReaction,
	useChatSending,
	useDirect,
	usePermissionChecker,
	useReference,
	useSendInviteMessage
} from '@mezon/core';
import {
	channelMetaActions,
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
	selectCurrentChannelId,
	selectCurrentChannelParentId,
	selectCurrentChannelPrivate,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDefaultCanvasByChannelId,
	selectDmChannelIdById,
	selectDmChannelPrivateById,
	selectDmCreatorIdById,
	selectDmGroupCurrentId,
	selectInitTopicMessageId,
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
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import type { ApiChannelDescription, ApiQuickMenuAccessRequest } from 'mezon-js/types';
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
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentChannelPrivate = useSelector(selectCurrentChannelPrivate);
	const currentChannelParentId = useSelector(selectCurrentChannelParentId);
	const currentClanId = useSelector(selectCurrentClanId);
	const listPinMessages = useAppSelector((state) => selectPinMessageByChannelId(state, currentChannelId as string));
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const isClanView = useSelector(selectClanView);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isFocusThreadBox = useSelector(selectClickedOnThreadBoxStatus);
	const currentThread = useAppSelector(selectThreadCurrentChannel);
	const dmChannelPrivate = useAppSelector((state) => selectDmChannelPrivateById(state, (currentDmId || '') as string));
	const dmChannelId = useAppSelector((state) => selectDmChannelIdById(state, (currentDmId || '') as string));

	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();

	const channelOrDirect = useMemo(() => {
		if (isClanView) {
			return {
				clanId: currentClanId,
				channelPrivate: currentChannelPrivate,
				channelId: currentChannelId
			} as ApiChannelDescription;
		}
		return { channelPrivate: dmChannelPrivate, channelId: dmChannelId, clanId: '0' } as ApiChannelDescription;
	}, [isClanView, currentClanId, currentChannelPrivate, currentChannelId, dmChannelPrivate, dmChannelId]);

	const { sendMessage: sendChatMessage } = useChatSending({
		channelOrDirect,
		mode: activeMode || ChannelStreamMode.STREAM_MODE_CHANNEL
	});

	const message = useAppSelector((state) =>
		selectMessageByMessageId(
			state,
			isTopic ? currentTopicId : isFocusThreadBox ? currentThread?.channelId : isClanView ? currentChannelId : currentDmId,
			messageId
		)
	);

	const currentDmChannelId = useAppSelector((state) => selectDmChannelIdById(state, (currentDmId || '') as string));
	const modeResponsive = useSelector(selectModeResponsive);
	const allMessagesEntities = useAppSelector((state) =>
		selectMessageEntitiesByChannelId(state, (modeResponsive === ModeResponsive.MODE_CLAN ? currentChannelId : currentDmChannelId) || '')
	);
	const allMessageIds = useAppSelector((state) => selectMessageIdsByChannelId(state, (isClanView ? currentChannelId : currentDmId) as string));
	const topicMessageIds = useAppSelector((state) => selectMessageIdsByChannelId(state, currentTopicId || ''));
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
		return message?.senderId === userId && !message?.content?.callLog?.callLogType && !(message?.code === TypeMessage.SendToken);
	}, [message?.senderId, message?.content?.callLog?.callLogType, message?.code, userId]);

	const isErrorMessage = useMemo(() => {
		return message?.isError === true && isMyMessage;
	}, [message?.isError, isMyMessage]);

	const checkMessageHasText = useMemo(() => {
		return message?.content.t !== '';
	}, [message?.content.t]);

	const checkMessageInPinnedList = useMemo(() => {
		return listPinMessages?.some((pinMessage) => pinMessage?.messageId === messageId);
	}, [listPinMessages, messageId]);

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
			channelId: currentChannelId,
			clanId: currentClanId.toString(),
			content,
			isDefault: true,
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

		const isSameSenderWithNextMessage = currentMessage?.senderId === nextMessage?.senderId;
		const isSameSenderWithPreviousMessage = currentMessage?.senderId === previousMessage?.senderId;

		const isNextMessageWithinTimeLimit =
			nextMessage?.createTimeSeconds &&
			currentMessage?.createTimeSeconds &&
			nextMessage?.createTimeSeconds - currentMessage?.createTimeSeconds < FORWARD_MESSAGE_TIME;

		const isPreviousMessageWithinTimeLimit =
			previousMessage.createTimeSeconds &&
			currentMessage?.createTimeSeconds &&
			currentMessage?.createTimeSeconds - previousMessage?.createTimeSeconds < FORWARD_MESSAGE_TIME;

		return (isPreviousMessageWithinTimeLimit && isSameSenderWithPreviousMessage) || (isSameSenderWithNextMessage && isNextMessageWithinTimeLimit);
	}, [allMessageIds, allMessagesEntities, messagePosition]);
	const handleReplyMessage = useCallback(() => {
		if (!message) {
			return;
		}
		dispatch(
			referencesActions.setDataReferences({
				channelId: message.topicId && message.topicId !== '0' ? message.topicId : message.channelId,
				dataReferences: {
					message_ref_id: message.id,
					ref_type: 0,
					message_sender_id: message.senderId,
					content: JSON.stringify(message.content ?? '{}'),
					message_sender_username: message.username,
					mesages_sender_avatar: message.clanAvatar ? message.clanAvatar : message.avatar,
					message_sender_clan_nick: message.clanNick,
					message_sender_display_name: message.displayName,
					has_attachment: (message.attachments && message.attachments?.length > 0) ?? false,
					channel_id: message.topicId && message.topicId !== '0' ? message.topicId : message.channelId,
					mode: message.mode ?? 0,
					channel_label: message.channelLabel
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
				channelId: message?.channelId,
				channelDraftMessage: {
					messageId: message?.id,
					draftContent: message?.content,
					draftMention: message?.mentions ?? [],
					draftAttachment: message?.attachments ?? [],
					draftTopicId: message?.topicId as string
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
				channelId: message?.channelId,
				messageId: message?.id,
				clanId: message?.clanId as string
			})
		);
	}, [dispatch, message?.channelId, message?.id]);

	const setIsShowCreateThread = useCallback(
		(isShowCreateThread: boolean, channelId?: string) => {
			dispatch(threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannelId as string), isShowCreateThread }));
			dispatch(topicsActions.setIsShowCreateTopic(false));
		},
		[currentChannelId, dispatch]
	);

	const setIsShowCreateTopic = useCallback(
		(isShowCreateTopic: boolean, channelId?: string) => {
			dispatch(topicsActions.setIsShowCreateTopic(isShowCreateTopic));
			dispatch(
				threadsActions.setIsShowCreateThread({ channelId: channelId ? channelId : (currentChannelId as string), isShowCreateThread: false })
			);
		},
		[currentChannelId, dispatch]
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
		dispatch(topicsActions.setInitTopicMessageId(message.id));
	}, [dispatch, message, setIsShowCreateTopic, setCurrentTopicInitMessage]);

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
					clanId: message?.clanId || '',
					channelId: message?.channelId,
					messageId: message?.id,
					mode: message?.mode || 0,
					badgeCount: 0,
					message_time: message.createTimeSeconds
				})
			);
			dispatch(
				channelMetaActions.setChannelLastSeenTimestamp({
					channelId: message?.channelId as string,
					timestamp: message.createTimeSeconds || Date.now(),
					messageId: message?.id
				})
			);
		} catch (error) {
			toast.error(t('errors.failedToNoteMessage'));
		}
	}, [dispatch, message, t]);

	const handleSlashCommands = useCallback(async () => {
		// ignore
	}, []);

	const handleSlashCommandSelect = useCallback(
		(command: ApiQuickMenuAccessRequest) => {
			if (command.actionMsg) {
				const payload = {
					t: command.actionMsg.trim(),
					hg: [],
					ej: [],
					mk: []
				};

				try {
					sendChatMessage(payload, [], [], undefined, false, false);
				} catch (error) {
					console.error(t('errors.errorSendingSlashCommand'), error);
					toast.error(`Failed to execute command "${command.menuName}"`);
				}
			}
		},
		[sendChatMessage]
	);

	const handleResendMessage = useCallback(async () => {
		if (!message || !message.channelId) return;

		try {
			await dispatch(
				messagesActions.resendMessage({
					messageId: message.id,
					channelId: message.channelId
				})
			).unwrap();
			showSimpleToast(t('messageResent'));
		} catch (error) {
			console.error(t('errors.failedToResendMessage'), error);
			toast.error(t('errors.failedToResendMessage'));
		}
	}, [dispatch, message, t]);

	const handleDeleteErrorMessage = useCallback(() => {
		if (!message?.channelId || !message?.id) return;
		dispatch(
			messagesActions.remove({
				channelId: message.channelId,
				messageId: message.id
			})
		);
	}, [dispatch, message?.channelId, message?.id]);

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
		const enableEdit = isMyMessage && !message?.content?.tp;
		const enableReport = !isMyMessage;

		return [enableEdit, enableReport];
	}, [isMyMessage, checkPos, message?.content?.tp]);

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
		if (!checkPos || message?.content?.tp) return false;
		if (messageId === initTopicMessageId) return false;
		if (isTopic && topicMessageIds?.length > 0 && messageId === topicMessageIds[0]) return false;
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
	}, [
		activeMode,
		type,
		canDeleteMessage,
		isMyMessage,
		checkPos,
		isOwnerGroupDM,
		message?.content?.tp,
		messageId,
		initTopicMessageId,
		isTopic,
		topicMessageIds
	]);

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
		async (userId: string, displayName?: string, username?: string, avatar?: string) => {
			const response = await createDirectMessageWithUser(userId, displayName, username, avatar);
			if (response.channelId) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(
					`Funds Transferred: ${formatMoney(TOKEN_TO_AMOUNT.ONE_THOUNSAND * 10)}₫ | Give coffee action`,
					response.channelId,
					channelMode,
					TypeMessage.SendToken
				);
			}
		},
		[createDirectMessageWithUser, sendInviteMessage]
	);

	const quickMenuItems = useAppSelector((state) => selectQuickMenuByChannelId(state, currentChannelId || ''));
	const isForwardedMessage = Boolean(message?.content?.fwd);
	const items = useMemo<ContextMenuItem[]>(() => {
		const builder = new MenuBuilder();

		if (message?.isError) {
			builder.addMenuItem('resendMessage', t('resendMessage'), handleResendMessage, <Icons.ResendMessageRightClick defaultSize="w-4 h-4" />);
			builder.addMenuItem(
				'deleteMessage',
				t('deleteMessage'),
				handleDeleteErrorMessage,
				<Icons.DeleteMessageRightClick defaultSize="w-4 h-4" />
			);
			return builder.build();
		}

		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'addReaction', // id
				t('addReaction'), // label
				handleItemClick,
				<Icons.RightArrowRightClick defaultSize="w-4 h-4" />
			);
		});

		builder.when(
			checkPos &&
				message?.senderId !== NX_CHAT_APP_ANNONYMOUS_USER_ID &&
				message?.senderId !== SYSTEM_SENDER_ID &&
				message?.username !== SYSTEM_NAME,
			(builder) => {
				builder.addMenuItem(
					'giveAcoffee', // id
					t('giveACoffee'), // label

					async () => {
						try {
							if (userId !== message.senderId) {
								await dispatch(
									giveCoffeeActions.updateGiveCoffee({
										channelId: message.channelId,
										clanId: message.clanId,
										messageRefId: message.id,
										receiverId: message.senderId,
										senderId: userId
									})
								).unwrap();
								await reactionMessageDispatch({
									id: EMOJI_GIVE_COFFEE.emojiId,
									messageId: message.id ?? '',
									emojiId: EMOJI_GIVE_COFFEE.emojiId,
									emoji: EMOJI_GIVE_COFFEE.emoji,
									count: 1,
									messageSenderId: message?.senderId ?? '',
									action_delete: false,
									isPublic: isPublicChannel({ parentId: currentChannelParentId, channelPrivate: currentChannelPrivate }),
									clanId: message.clanId ?? '',
									channelId: isTopic ? currentChannelId || '' : (message?.channelId ?? ''),
									isFocusTopicBox,
									channelIdOnMessage: message?.channelId
								});

								await sendTransactionMessage(
									message.senderId || '',
									message.user?.name,
									message.user?.name || message.user?.username,
									message.avatar
								);
							}
						} catch (error) {
							console.error(t('errors.failedToGiveCoffee'), error);
						}
					},
					<Icons.DollarIconRightClick defaultSize="w-4 h-4" />
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
					<Icons.EditMessageRightClick defaultSize="w-4 h-4" />
				);
			});
		}

		builder.when(!isTopic && pinMessageStatus === false, (builder) => {
			builder.addMenuItem('unPinMessage', t('unpinMessage'), () => handleUnPinMessage(), <Icons.PinMessageRightClick defaultSize="w-4 h-4" />);
		});
		builder.when(
			checkPos &&
				(canSendMessage || activeMode === ChannelStreamMode.STREAM_MODE_DM || activeMode === ChannelStreamMode.STREAM_MODE_GROUP || isTopic),
			(builder) => {
				builder.addMenuItem(
					'reply',
					t('reply'),
					() => handleReplyMessage(),

					<Icons.ReplyRightClick defaultSize="w-4 h-4" />
				);
			}
		);
		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'forwardMessage',
				t('forwardMessage'),
				() => handleForwardMessage(),
				<Icons.ForwardRightClick defaultSize="w-4 h-4" />
			);
		});
		builder.when(checkPos && isShowForwardAll, (builder) => {
			builder.addMenuItem(
				'forwardAll',
				t('forwardAllMessage'),
				() => handleForwardAllMessage(),
				<Icons.ForwardAllRightClick defaultSize="w-4 h-4" />
			);
		});
		builder.when(enableCreateThreadItem, (builder) => {
			builder.addMenuItem('createThread', t('createThread'), () => handleCreateThread(), <Icons.ThreadIconRightClick defaultSize="w-4 h-4" />);
		});
		builder.when(checkPos, (builder) => {
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
				<Icons.CopyTextRightClick />
			);
		});
		builder.when(!isTopic && pinMessageStatus === true, (builder) => {
			builder.addMenuItem('pinMessage', t('pinMessage'), openPinMessageModal, <Icons.PinMessageRightClick defaultSize="w-4 h-4" />);
		});

		message?.code !== TypeMessage.Topic &&
			notAllowedType &&
			!isTopic &&
			canSendMessage &&
			builder.when(checkPos && hasPermissionCreateTopic, (builder) => {
				builder.addMenuItem('topicDiscussion', t('topicDiscussion'), handleCreateTopic, <Icons.TopicIcon defaultSize="w-4 h-4" />);
			});
		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'markUnread',
				t('markUnread'),
				handleMarkUnread,
				<svg height="16px" width="16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
					<path d="M410.9,0H85.1C72.3,0,61.8,10.4,61.8,23.3V512L248,325.8L434.2,512V23.3C434.2,10.4,423.8,0,410.9,0z" fill="currentColor" />
				</svg>
			);
		});
		builder.when(checkPos, (builder) => {
			builder.addMenuItem(
				'addToInbox',
				t('addToInbox'),
				handleMarkMessageNoti,
				<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
						fill="currentColor"
					/>
				</svg>
			);
		});
		builder.when(checkPos && quickMenuItems?.length > 0, (builder) => {
			builder.addMenuItem(
				'slashCommands',
				t('slashCommands'),
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
		builder.when(enableCopyLinkItem, (builder) => {
			builder.addMenuItem('copyLink', t('copyLink'), async () => {
				try {
					const contentToCopy = isLinkContent && linkContent ? linkContent : checkElementIsImage ? urlImage : (message?.content?.t ?? '');
					await handleCopyLink(contentToCopy);
				} catch (error) {
					console.error(t('errors.failedToCopyLink'), error);
				}
			});
		});

		builder.when(enableOpenLinkItem, (builder) => {
			builder.addMenuItem('openLink', t('openLink'), async () => {
				try {
					const contentToOpen = isLinkContent && linkContent ? linkContent : checkElementIsImage ? urlImage : (message?.content?.t ?? '');
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
				<Icons.ReportMessageRightClick defaultSize="w-4 h-4" />
			);
		});

		builder.when(enableCopyImageItem, (builder) => {
			builder.addMenuItem('copyImage', t('copyImage'), async () => {
				try {
					const success = await handleCopyImage(urlImage, () => {
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
					handleSaveImage(urlImage);
				} catch (error) {
					console.error(t('errors.failedToSaveImage'), error);
				}
			});
		});
		builder.when(enableDelMessageItem, (builder) => {
			builder.addMenuItem('deleteMessage', t('deleteMessage'), openDeleteMessageModal, <Icons.DeleteMessageRightClick defaultSize="w-4 h-4" />);
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
		handleItemClick,
		handleCreateTopic,
		handleSlashCommands,
		handleAddToNote,
		isTopic,
		isErrorMessage,
		handleResendMessage,
		handleDeleteErrorMessage
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
			currentChannelId={currentChannelId as string}
		/>
	);
}

export default MessageContextMenu;
