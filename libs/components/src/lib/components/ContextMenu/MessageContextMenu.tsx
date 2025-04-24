import { useCallback, useMemo, useState } from 'react';

import { useAppParams, useAuth, useChatReaction, useDirect, usePermissionChecker, useReference, useSendInviteMessage } from '@mezon/core';
import {
	createEditCanvas,
	directActions,
	gifsStickerEmojiActions,
	giveCoffeeActions,
	messagesActions,
	pinMessageActions,
	reactionActions,
	referencesActions,
	selectAllDirectMessages,
	selectClanView,
	selectClickedOnTopicStatus,
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
	selectTheme,
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
	AMOUNT_TOKEN,
	ContextMenuItem,
	EEventAction,
	EMOJI_GIVE_COFFEE,
	EOverriddenPermission,
	EPermission,
	FOR_10_MINUTES,
	IMessageWithUser,
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
	isPublicChannel
} from '@mezon/utils';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import 'react-contexify/ReactContexify.css';
import { useSelector } from 'react-redux';
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
	openDeleteMessageModal
}: MessageContextMenuProps) {
	console.log('MessageContextMenu');

	const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';
	const { setOpenThreadMessageState } = useReference();
	const dmGroupChatList = useSelector(selectAllDirectMessages);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentClanId = useSelector(selectCurrentClanId);
	const listPinMessages = useSelector(selectPinMessageByChannelId(currentChannel?.id));
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const isClanView = useSelector(selectClanView);
	const currentTopicId = useSelector(selectCurrentTopicId);

	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();

	const message = useAppSelector((state) =>
		selectMessageByMessageId(state, isTopic ? currentTopicId : isClanView ? currentChannel?.id : currentDmId, messageId)
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
	}, [dispatch]);
	const defaultCanvas = useAppSelector((state) => selectDefaultCanvasByChannelId(state, currentChannel?.channel_id ?? ''));
	const messagePosition = allMessageIds.findIndex((id: string) => id === messageId);
	const { userId } = useAuth();
	const { posShowMenu, imageSrc } = useMessageContextMenu();
	const isOwnerGroupDM = useIsOwnerGroupDM();
	const { reactionMessageDispatch } = useChatReaction();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);

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

	const [removeReaction] = usePermissionChecker([EPermission.manageChannel]);
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
		setValueThread(message);
	}, [dispatch, message, setIsShowCreateThread, setOpenThreadMessageState, setValueThread]);

	const handleCreateTopic = useCallback(() => {
		setIsShowCreateTopic(true);
		dispatch(topicsActions.setOpenTopicMessageState(true));
		setCurrentTopicInitMessage(message);
		dispatch(topicsActions.setCurrentTopicId(''));
		dispatch(topicsActions.setFirstMessageOfCurrentTopic(message));
	}, [dispatch, message, setIsShowCreateTopic, setCurrentTopicInitMessage]);

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

	const reactionStatus = true;
	const enableViewReactionItem = useMemo(() => {
		if (!checkPos) return false;
		return reactionStatus;
	}, [reactionStatus, checkPos]);

	const [enableEditMessageItem, enableReportMessageItem] = useMemo(() => {
		if (!checkPos) return [false, false];
		const enableEdit = isMyMessage;
		const enableReport = !isMyMessage;

		return [enableEdit, enableReport];
	}, [isMyMessage, checkPos]);

	const pinMessageStatus = useMemo(() => {
		if (!checkPos) return undefined;
		return !checkMessageInPinnedList && !isTopic;
	}, [checkMessageInPinnedList, checkPos]);

	const enableSpeakMessageItem = useMemo(() => {
		if (!checkPos) return false;
		return checkMessageHasText;
	}, [checkMessageHasText, checkPos]);

	const [enableRemoveOneReactionItem, enableRemoveAllReactionsItem] = useMemo(() => {
		if (!checkPos) return [false, false];
		const enableOne = removeReaction && enableViewReactionItem;
		const enableAll = removeReaction && enableViewReactionItem;
		return [enableOne, enableAll];
	}, [checkPos, enableViewReactionItem, removeReaction]);

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
	}, [activeMode, type, canDeleteMessage, isMyMessage, checkPos, isOwnerGroupDM]);

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

	const sendTransactionMessage = useCallback(
		async (userId: string, username?: string, avatar?: string) => {
			const response = await createDirectMessageWithUser(userId, username, avatar);
			if (response.channel_id) {
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
	/* eslint-disable no-console */
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

		builder.when(
			checkPos &&
				message?.sender_id !== NX_CHAT_APP_ANNONYMOUS_USER_ID &&
				message?.sender_id !== SYSTEM_SENDER_ID &&
				message?.username !== SYSTEM_NAME,
			(builder) => {
				builder.addMenuItem(
					'giveAcoffee', // id
					'Give A Coffee', // label

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
										token_count: AMOUNT_TOKEN.TEN_TOKENS
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
									is_public: isPublicChannel(currentChannel),
									clanId: message.clan_id ?? '',
									mode: message.mode ?? 0,
									channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
									isFocusTopicBox,
									channelIdOnMessage: message?.channel_id
								});

								await sendTransactionMessage(message.sender_id || '', message.user?.name || message.user?.username, message.avatar);
							}
						} catch (error) {
							console.error('Failed to give cofffee message', error);
						}
					},
					<Icons.DollarIconRightClick defaultSize="w-4 h-4" />
				);
			}
		);

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

		builder.when(pinMessageStatus === true, (builder) => {
			builder.addMenuItem('pinMessage', 'Pin Message', openPinMessageModal, <Icons.PinMessageRightClick defaultSize="w-4 h-4" />);
		});
		builder.when(pinMessageStatus === false, (builder) => {
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

		// builder.when(checkPos, (builder) => {
		// 	builder.addMenuItem('apps', 'Apps', () => console.log('apps'), <Icons.RightArrowRightClick defaultSize="w-4 h-4" />);
		// });

		// builder.when(checkPos, (builder) => {
		// 	builder.addMenuItem('markUnread', 'Mark Unread', () => console.log('markUnread'), <Icons.UnreadRightClick defaultSize="w-4 h-4" />);
		// });

		// builder.when(checkPos, (builder) => {
		// 	builder.addMenuItem(
		// 		'copyMessageLink',
		// 		'Copy Message Link',
		// 		() => console.log('copyMessageLink'),
		// 		<Icons.CopyMessageLinkRightClick defaultSize="w-4 h-4" />
		// 	);
		// });
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

		// builder.when(enableRemoveOneReactionItem, (builder) => {
		// 	builder.addMenuItem(
		// 		'removeReactions',
		// 		'Remove Reactions',
		// 		() => {
		// 			console.log('remove reaction');
		// 		},
		// 		<Icons.RightArrowRightClick defaultSize="w-4 h-4" />
		// 	);
		// });
		// builder.when(enableRemoveAllReactionsItem, (builder) => {
		// 	builder.addMenuItem('removeAllReactions', 'Remove All Reactions', () => {
		// 		console.log('remove all reaction');
		// 	});
		// });

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
		enableViewReactionItem,
		enableEditMessageItem,
		pinMessageStatus,
		canSendMessage,
		enableCreateThreadItem,
		isShowForwardAll,
		enableSpeakMessageItem,
		enableRemoveOneReactionItem,
		enableRemoveAllReactionsItem,
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
		isTopic
	]);
	/* eslint-disable no-console */

	return (
		<DynamicContextMenu key={messageId} menuId={id} items={items} messageId={messageId} mode={activeMode} message={message} isTopic={isTopic} />
	);
}

export default MessageContextMenu;
