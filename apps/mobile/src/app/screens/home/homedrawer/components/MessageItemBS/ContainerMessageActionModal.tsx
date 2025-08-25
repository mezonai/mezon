/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable no-console */
import { useChannelMembers, useChatSending, useDirect, usePermissionChecker, useSendInviteMessage } from '@mezon/core';
import { ActionEmitEvent, STORAGE_MY_USER_ID, formatContentEditMessage, load } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	MessagesEntity,
	appActions,
	channelMetaActions,
	clansActions,
	directActions,
	getStore,
	giveCoffeeActions,
	messagesActions,
	notificationActions,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDmGroupCurrent,
	selectDmGroupCurrentId,
	selectMessageEntitiesByChannelId,
	selectPinMessageByChannelId,
	setIsForwardAll,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import {
	AMOUNT_TOKEN,
	EMOJI_GIVE_COFFEE,
	EOverriddenPermission,
	EPermission,
	TOKEN_TO_AMOUNT,
	ThreadStatus,
	TypeMessage,
	formatMoney,
	isPublicChannel,
	sleep
} from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode } from 'mezon-js';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../../src/app/constants/icon_cdn';
import { useImage } from '../../../../../hooks/useImage';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { getMessageActions } from '../../constants';
import { EMessageActionType } from '../../enums';
import { IConfirmActionPayload, IMessageAction, IMessageActionNeedToResolve, IReplyBottomSheet } from '../../types/message.interface';
import { ConfirmPinMessageModal } from '../ConfirmPinMessageModal';
import EmojiSelector from '../EmojiPicker/EmojiSelector';
import { IReactionMessageProps } from '../MessageReaction';
import { QuickMenuModal } from '../QuickMenuModal';
import { ReportMessageModal } from '../ReportMessageModal';
import { RecentEmojiMessageAction } from './RecentEmojiMessageAction';
import { style } from './styles';

export const ContainerMessageActionModal = React.memo((props: IReplyBottomSheet) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { message, mode, isOnlyEmojiPicker = false, senderDisplayName = '', channelId } = props;
	const { socketRef } = useMezon();
	const store = getStore();

	const { t } = useTranslation(['message']);
	const [isShowEmojiPicker, setIsShowEmojiPicker] = useState(false);
	const [currentMessageActionType, setCurrentMessageActionType] = useState<EMessageActionType | null>(null);
	const [isShowQuickMenuModal, setIsShowQuickMenuModal] = useState(false);

	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroup = useSelector(selectDmGroupCurrent(currentDmId ?? ''));
	const currentTopicId = useSelector(selectCurrentTopicId);
	const navigation = useNavigation<any>();
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();
	const isMessageSystem =
		message?.code === TypeMessage.Welcome ||
		message?.code === TypeMessage.UpcomingEvent ||
		message?.code === TypeMessage.CreateThread ||
		message?.code === TypeMessage.CreatePin ||
		message?.code === TypeMessage.AuditLog;
	const isAnonymous = message?.sender_id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID;
	const onClose = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	}, []);

	const onCloseModalConfirm = useCallback(() => {
		setCurrentMessageActionType(null);
	}, []);

	const onCloseQuickMenuModal = useCallback(() => {
		setIsShowQuickMenuModal(false);
	}, []);

	const onDeleteMessage = useCallback(
		async (messageId: string) => {
			const socket = socketRef.current;
			const isPublic = currentDmId ? false : isPublicChannel(currentChannel);
			const currentClanId = selectCurrentClanId(store.getState());
			const mentions = message?.mentions || [];
			const references = message?.references || [];
			const mentionsString = JSON.stringify(mentions);
			const referencesString = JSON.stringify(references);

			dispatch(
				messagesActions.remove({
					channelId: currentDmId ? currentDmId : currentTopicId || currentChannelId,
					messageId
				})
			);
			await socket.removeChatMessage(
				currentDmId ? '0' : currentClanId || '',
				currentDmId ? currentDmId : currentChannelId,
				mode,
				isPublic,
				messageId,
				!!message?.attachments,
				currentTopicId,
				mentionsString,
				referencesString
			);
		},
		[currentChannel, currentChannelId, currentDmId, currentTopicId, dispatch, message?.attachments, mode, socketRef, store]
	);

	const onConfirmAction = useCallback(
		(payload: IConfirmActionPayload) => {
			const { type, message } = payload;
			switch (type) {
				case EMessageActionType.DeleteMessage:
					onDeleteMessage(message?.id);
					break;
				case EMessageActionType.ForwardMessage:
				case EMessageActionType.Report:
				case EMessageActionType.PinMessage:
				case EMessageActionType.UnPinMessage:
					setCurrentMessageActionType(type);
					break;
				default:
					break;
			}
		},
		[onDeleteMessage, setCurrentMessageActionType]
	);

	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect:
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup
	});

	const [isClanOwner, isCanManageThread, isCanManageChannel, canSendMessage] = usePermissionChecker(
		[EPermission.clanOwner, EOverriddenPermission.manageThread, EPermission.manageChannel, EOverriddenPermission.sendMessage],
		currentChannelId ?? ''
	);
	const [isAllowDelMessage] = usePermissionChecker([EOverriddenPermission.deleteMessage], message?.channel_id ?? '');
	const { downloadImage, saveImageToCameraRoll, getImageAsBase64OrFile } = useImage();
	const allMessagesEntities = useAppSelector((state) =>
		selectMessageEntitiesByChannelId(state, (currentDmId ? currentDmId : currentChannelId) || '')
	);
	const convertedAllMessagesEntities = useMemo(() => {
		return allMessagesEntities ? (Object.values(allMessagesEntities) as MessagesEntity[]) : [];
	}, [allMessagesEntities]);
	const messagePosition = useMemo(() => {
		return convertedAllMessagesEntities?.findIndex((value: MessagesEntity) => value.id === message?.id);
	}, [convertedAllMessagesEntities, message?.id]);
	const { joinningToThread } = useChannelMembers({ channelId: currentChannelId, mode: mode ?? 0 });

	const handleActionEditMessage = () => {
		onClose();
		const payload: IMessageActionNeedToResolve = {
			type: EMessageActionType.EditMessage,
			targetMessage: message
		};
		//Note: trigger to ChatBox.tsx
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
	};

	const handleActionGiveACoffee = async () => {
		onClose();
		try {
			if (userId !== message.sender_id) {
				const currentClanId = selectCurrentClanId(store.getState());
				const coffeeEvent = {
					channel_id: message.channel_id,
					clan_id: message.clan_id,
					message_ref_id: message.id,
					receiver_id: message.sender_id,
					sender_id: userId,
					token_count: AMOUNT_TOKEN.TEN_TOKENS
				};
				const res = await dispatch(giveCoffeeActions.updateGiveCoffee(coffeeEvent));
				if (res?.meta?.requestStatus === 'rejected' || !res) {
					Toast.show({
						type: 'error',
						text1: 'An error occurred, please try again'
					});
					return;
				}
				handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, message.id, EMOJI_GIVE_COFFEE.emoji_id, EMOJI_GIVE_COFFEE.emoji);
				const response = await createDirectMessageWithUser(message?.sender_id, message?.user?.name, message?.user?.username, message?.avatar);
				if (response?.channel_id) {
					sendInviteMessage(
						`Funds Transferred: ${formatMoney(TOKEN_TO_AMOUNT.ONE_THOUNSAND * 10)}₫ | Give coffee action`,
						response?.channel_id,
						ChannelStreamMode.STREAM_MODE_DM,
						TypeMessage.SendToken
					);
				}
				await dispatch(directActions.setDmGroupCurrentId(''));
				await dispatch(clansActions.joinClan({ clanId: currentClanId }));
			}
		} catch (error) {
			console.error('Failed to give cofffee message', error);
		}
	};
	const listPinMessages = useAppSelector((state) => selectPinMessageByChannelId(state, message?.channel_id as string));
	const isDM = useMemo(() => {
		return [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(mode);
	}, [mode]);

	const handleActionReply = () => {
		onClose();
		const payload: IMessageActionNeedToResolve = {
			type: EMessageActionType.Reply,
			targetMessage: message,
			replyTo: senderDisplayName
		};
		//Note: trigger to ChatBox.tsx
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
	};

	const handleActionCreateThread = () => {
		onClose();
		const payload: IMessageActionNeedToResolve = {
			type: EMessageActionType.CreateThread,
			targetMessage: message
		};
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
	};

	const handleActionCopyText = () => {
		onClose();
		Clipboard.setString(formatContentEditMessage(message)?.formatContentDraft);
		Toast.show({
			type: 'success',
			props: {
				text2: t('toast.copyText'),
				leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} width={size.s_20} height={size.s_20} color={'#676b73'} />
			}
		});
	};

	const handleActionDeleteMessage = () => {
		onClose();
		Alert.alert(
			'Delete Message',
			'Are you sure you want to delete this message?',
			[
				{
					text: 'No',
					onPress: () => console.log('Cancel Pressed'),
					style: 'cancel'
				},
				{
					text: 'Yes',
					onPress: () =>
						onConfirmAction({
							type: EMessageActionType.DeleteMessage,
							message
						})
				}
			],
			{ cancelable: false }
		);
	};

	const handleActionPinMessage = () => {
		setCurrentMessageActionType(EMessageActionType.PinMessage);
	};

	const handleActionUnPinMessage = () => {
		setCurrentMessageActionType(EMessageActionType.UnPinMessage);
	};

	const handleResendMessage = async () => {
		dispatch(
			messagesActions.remove({
				channelId: message.channel_id,
				messageId: message.id
			})
		);
		onClose();
		await sendMessage(message.content, message.mentions, message.attachments, message.references, false, false, true);
	};

	const handleActionCopyMediaLink = () => {
		const media = message?.attachments;
		if (media && media.length > 0) {
			const url = media[0].url;
			Clipboard.setString(url);
		}
	};

	const downloadAndSaveMedia = async (media) => {
		const url = media?.url;
		const filetype = media?.filetype;

		const type = filetype?.split?.('/');
		try {
			const filePath = await downloadImage(url, type?.[1]);

			if (filePath) {
				await saveImageToCameraRoll('file://' + filePath, type?.[0], true);
			}
		} catch (error) {
			console.error(`Error downloading or saving media from URL: ${url}`, error);
		}
	};

	const handleActionSaveImage = async () => {
		try {
			const media = message?.attachments?.length > 0 ? message?.attachments : message?.content?.embed?.map((item) => item?.image);
			dispatch(appActions.setLoadingMainMobile(true));
			if (media && media.length > 0) {
				const promises = media?.map(downloadAndSaveMedia);
				await Promise.all(promises);
			}
		} catch (error) {
			console.error('Error saving image:', error);
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
			onClose();
		}
	};

	const handleActionReportMessage = () => {
		setCurrentMessageActionType(EMessageActionType.Report);
	};

	const handleForwardMessage = async () => {
		dispatch(setIsForwardAll(false));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.FORWARD_MESSAGE,
			params: {
				message: message
			}
		});
	};

	const handleForwardAllMessages = () => {
		dispatch(setIsForwardAll(true));
		setCurrentMessageActionType(EMessageActionType.ForwardMessage);
	};

	const handleActionTopicDiscussion = async () => {
		if (!message) return;
		dispatch(topicsActions.setCurrentTopicInitMessage(message));
		dispatch(topicsActions.setCurrentTopicId(message?.content?.tp || ''));
		dispatch(topicsActions.setIsShowCreateTopic(true));
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
		onClose();
	};

	const handleActionQuickMenu = () => {
		setIsShowQuickMenuModal(true);
	};

	const handleActionMarkMessage = async () => {
		try {
			await dispatch(notificationActions.markMessageNotify(message));
			Toast.show({
				type: 'success',
				props: {
					text2: t('toast.markMessage'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
				}
			});
			onClose();
		} catch (error) {
			console.error('Error marking message:', error);
		}
	};

	const handleMarkUnread = async () => {
		try {
			await dispatch(
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
			Toast.show({
				type: 'success',
				props: {
					text2: t('toast.markMessage'),
					leadingIcon: <MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color={baseColor.green} />
				}
			});
		} catch (error) {
			Toast.show({
				type: 'error',
				props: {
					text2: t('toast.markMessageUnreadFailed'),
					leadingIcon: <MezonIconCDN icon={IconCDN.closeIcon} color={baseColor.redStrong} />
				}
			});
			console.error('Error marking message as unread:', error);
		} finally {
			onClose();
		}
	};

	const handleActionCopyImage = async () => {
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const url = message?.attachments?.[0]?.url;
			const filetype = message?.attachments?.[0]?.filetype;

			const type = filetype?.split?.('/');
			const image = await getImageAsBase64OrFile(url, type?.[1]);
			if (image) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.copyImage'),
						leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} width={size.s_20} height={size.s_20} color={'#676b73'} />
					}
				});
			}
		} catch (error) {
			console.error('Error copying image:', error);
			Toast.show({
				type: 'error',
				text1: t('toast.copyImageFailed', { error })
			});
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
			onClose();
		}
	};

	const implementAction = (type: EMessageActionType) => {
		switch (type) {
			case EMessageActionType.GiveACoffee:
				handleActionGiveACoffee();
				break;
			case EMessageActionType.EditMessage:
				handleActionEditMessage();
				break;
			case EMessageActionType.Reply:
				handleActionReply();
				break;
			case EMessageActionType.CreateThread:
				handleActionCreateThread();
				break;
			case EMessageActionType.CopyText:
				handleActionCopyText();
				break;
			case EMessageActionType.MarkMessage:
				handleActionMarkMessage();
				break;
			case EMessageActionType.DeleteMessage:
				handleActionDeleteMessage();
				break;
			case EMessageActionType.PinMessage:
				handleActionPinMessage();
				break;
			case EMessageActionType.UnPinMessage:
				handleActionUnPinMessage();
				break;
			// case EMessageActionType.CopyMessageLink:
			// 	handleActionCopyMessageLink();
			// 	break;
			case EMessageActionType.CopyMediaLink:
				handleActionCopyMediaLink();
				break;
			case EMessageActionType.SaveImage:
				handleActionSaveImage();
				break;
			case EMessageActionType.Report:
				handleActionReportMessage();
				break;
			case EMessageActionType.ForwardMessage:
				handleForwardMessage();
				break;
			case EMessageActionType.ForwardAllMessages:
				handleForwardAllMessages();
				break;
			case EMessageActionType.ResendMessage:
				handleResendMessage();
				break;
			case EMessageActionType.MarkUnRead:
				handleMarkUnread();
				break;
			case EMessageActionType.TopicDiscussion:
				handleActionTopicDiscussion();
				break;
			case EMessageActionType.QuickMenu:
				handleActionQuickMenu();
				break;
			case EMessageActionType.CopyImage:
				handleActionCopyImage();
				break;
			default:
				break;
		}
	};

	const getActionMessageIcon = (type: EMessageActionType) => {
		switch (type) {
			case EMessageActionType.EditMessage:
				return <MezonIconCDN icon={IconCDN.pencilIcon} width={size.s_20} height={size.s_18} color={themeValue.text} />;
			case EMessageActionType.Reply:
				return <MezonIconCDN icon={IconCDN.arrowAngleLeftUpIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.ForwardMessage:
				return <MezonIconCDN icon={IconCDN.arrowAngleRightUpIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.ForwardAllMessages:
				return <MezonIconCDN icon={IconCDN.arrowAngleRightUpIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.CreateThread:
				return <MezonIconCDN icon={IconCDN.threadIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.CopyText:
				return <MezonIconCDN icon={IconCDN.copyIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.DeleteMessage:
				return <MezonIconCDN icon={IconCDN.trashIconRed} width={size.s_18} height={size.s_18} color={baseColor.red} />;
			case EMessageActionType.PinMessage:
				return <MezonIconCDN icon={IconCDN.pinIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.UnPinMessage:
				return <MezonIconCDN icon={IconCDN.pinIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.SaveImage:
				return <MezonIconCDN icon={IconCDN.downloadIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.CopyMediaLink:
				return <MezonIconCDN icon={IconCDN.linkIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.CopyMessageLink:
				return <MezonIconCDN icon={IconCDN.linkIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.Report:
				return <MezonIconCDN icon={IconCDN.redFlag} width={size.s_14} height={size.s_14} color={baseColor.red} />;
			case EMessageActionType.GiveACoffee:
				return <MezonIconCDN icon={IconCDN.giftIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />;
			case EMessageActionType.ResendMessage:
				return <MezonIconCDN icon={IconCDN.markUnreadIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.MarkUnRead:
				return <MezonIconCDN icon={IconCDN.markUnreadIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.TopicDiscussion:
				return <MezonIconCDN icon={IconCDN.discussionIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.MarkMessage:
				return <MezonIconCDN icon={IconCDN.starIcon} width={size.s_20} height={size.s_18} color={themeValue.text} />;
			case EMessageActionType.QuickMenu:
				return <MezonIconCDN icon={IconCDN.quickAction} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.CopyImage:
				return <MezonIconCDN icon={IconCDN.imageIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			default:
				return <View />;
		}
	};

	const messageActionList = useMemo(() => {
		const isMyMessage = userId === message?.user?.id;
		const isMessageError = message?.isError;
		const isHidePinMessage = !!currentTopicId;
		const isUnPinMessage = listPinMessages.some((pinMessage) => pinMessage?.message_id === message?.id);
		const isHideCreateThread = isDM || ((!isCanManageThread || !isCanManageChannel) && !isClanOwner) || currentChannel?.parent_id !== '0';
		const isHideThread = currentChannel?.parent_id !== '0';
		const isHideDeleteMessage = !((isAllowDelMessage && !isDM) || isMyMessage);
		const isHideTopicDiscussion =
			(message?.topic_id && message?.topic_id !== '0') ||
			message?.code === TypeMessage.Topic ||
			isDM ||
			!canSendMessage ||
			currentChannelId !== message?.channel_id ||
			isMessageSystem;
		const listOfActionOnlyMyMessage = [EMessageActionType.EditMessage];
		const listOfActionOnlyOtherMessage = [EMessageActionType.Report];
		const isHideCopyImage = !(message?.attachments?.length === 1 && message?.attachments?.[0]?.filetype?.includes('image'));

		const isShowForwardAll = () => {
			if (messagePosition === -1) return false;
			return (
				message?.isStartedMessageGroup &&
				messagePosition < (convertedAllMessagesEntities?.length || 0 - 1) &&
				!convertedAllMessagesEntities?.[messagePosition + 1]?.isStartedMessageGroup
			);
		};

		const listOfActionShouldHide = [
			isHidePinMessage && EMessageActionType.PinMessage,
			isUnPinMessage ? EMessageActionType.PinMessage : EMessageActionType.UnPinMessage,
			(!isShowForwardAll() || isHideThread) && EMessageActionType.ForwardAllMessages,
			isHideCreateThread && EMessageActionType.CreateThread,
			isHideDeleteMessage && EMessageActionType.DeleteMessage,
			((!isMessageError && isMyMessage) || !isMyMessage) && EMessageActionType.ResendMessage,
			(isMyMessage || isMessageSystem || isAnonymous) && EMessageActionType.GiveACoffee,
			isHideTopicDiscussion && EMessageActionType.TopicDiscussion,
			isDM && EMessageActionType.QuickMenu,
			isHideCopyImage && EMessageActionType.CopyImage
		];

		let availableMessageActions: IMessageAction[] = [];
		if (isMyMessage) {
			availableMessageActions = getMessageActions(t).filter(
				(action) => ![...listOfActionOnlyOtherMessage, ...listOfActionShouldHide].includes(action.type)
			);
		} else {
			availableMessageActions = getMessageActions(t).filter(
				(action) => ![...listOfActionOnlyMyMessage, ...listOfActionShouldHide].includes(action.type)
			);
		}
		const mediaList =
			(message?.attachments?.length > 0 &&
				message.attachments?.every((att) => att?.filetype?.includes('image') || att?.filetype?.includes('video'))) ||
			message?.content?.embed?.some((embed) => embed?.image)
				? []
				: [EMessageActionType.SaveImage, EMessageActionType.CopyMediaLink];

		const frequentActionList = [
			EMessageActionType.ResendMessage,
			EMessageActionType.GiveACoffee,
			EMessageActionType.EditMessage,
			EMessageActionType.Reply,
			EMessageActionType.CreateThread
		];
		const warningActionList = [EMessageActionType.Report, EMessageActionType.DeleteMessage];

		return {
			frequent: availableMessageActions.filter((action) => frequentActionList.includes(action.type)),
			normal: availableMessageActions.filter((action) => ![...frequentActionList, ...warningActionList, ...mediaList].includes(action.type)),
			warning: availableMessageActions.filter((action) => warningActionList.includes(action.type))
		};
	}, [
		userId,
		message,
		listPinMessages,
		isDM,
		isCanManageThread,
		isCanManageChannel,
		currentChannel?.parent_id,
		isClanOwner,
		isAllowDelMessage,
		canSendMessage,
		currentChannelId,
		isMessageSystem,
		isAnonymous,
		messagePosition,
		convertedAllMessagesEntities,
		t,
		currentTopicId
	]);

	const handleReact = useCallback(
		async (mode, messageId, emoji_id: string, emoji: string) => {
			if (currentChannel?.parent_id !== '0' && currentChannel?.active === ThreadStatus.activePublic) {
				await dispatch(
					threadsActions.updateActiveCodeThread({ channelId: currentChannel?.channel_id ?? '', activeCode: ThreadStatus.joined })
				);
				joinningToThread(currentChannel, [userId ?? '']);
			}
			DeviceEventEmitter.emit(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, {
				id: emoji_id,
				mode: mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL,
				messageId: messageId ?? '',
				clanId: mode === ChannelStreamMode.STREAM_MODE_GROUP || mode === ChannelStreamMode.STREAM_MODE_DM ? '' : message?.clan_id,
				channelId: message?.channel_id ?? '',
				emojiId: emoji_id ?? '',
				emoji: emoji?.trim() ?? '',
				senderId: message?.sender_id ?? '',
				countToRemove: 1,
				actionDelete: false,
				topicId: currentTopicId || ''
			} as IReactionMessageProps);

			onClose();
		},
		[currentChannel, currentTopicId, dispatch, joinningToThread, message?.channel_id, message?.clan_id, message?.sender_id, onClose, userId]
	);

	const renderMessageItemActions = () => {
		return (
			<View style={styles.messageActionsWrapper}>
				<RecentEmojiMessageAction messageId={message.id} mode={mode} handleReact={handleReact} setIsShowEmojiPicker={setIsShowEmojiPicker} />
				<View style={styles.messageActionGroup}>
					{messageActionList.frequent.map((action) => {
						return (
							<Pressable key={action.id} style={styles.actionItem} onPress={() => implementAction(action.type)}>
								<View style={styles.icon}>{getActionMessageIcon(action.type)}</View>
								<Text style={styles.actionText}>{action.title}</Text>
							</Pressable>
						);
					})}
				</View>
				<View style={styles.messageActionGroup}>
					{messageActionList.normal.map((action) => {
						return (
							<Pressable key={action.id} style={styles.actionItem} onPress={() => implementAction(action.type)}>
								<View style={styles.icon}>{getActionMessageIcon(action.type)}</View>
								<Text style={styles.actionText}>{action.title}</Text>
							</Pressable>
						);
					})}
				</View>
				<View style={styles.messageActionGroup}>
					{messageActionList.warning.map((action) => {
						return (
							<Pressable key={action.id} style={styles.actionItem} onPress={() => implementAction(action.type)}>
								<View style={styles.warningIcon}>{getActionMessageIcon(action.type)}</View>
								<Text style={styles.warningActionText}>{action.title}</Text>
							</Pressable>
						);
					})}
				</View>
			</View>
		);
	};

	const onSelectEmoji = useCallback(
		async (emoji_id: string, emoij: string) => {
			if (!message && isOnlyEmojiPicker) {
				if (!socketRef.current || !channelId) return;
				await socketRef.current.writeVoiceReaction([emoji_id], channelId);
				return;
			}
			await handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, message?.id, emoji_id, emoij);
		},
		[channelId, handleReact, isOnlyEmojiPicker, message, mode, socketRef]
	);

	return (
		<View style={[styles.bottomSheetWrapper, { backgroundColor: themeValue.primary }]}>
			{isShowEmojiPicker || isOnlyEmojiPicker ? (
				<View style={{ padding: size.s_10, minHeight: '100%' }}>
					<EmojiSelector onSelected={onSelectEmoji} isReactMessage />
				</View>
			) : (
				renderMessageItemActions()
			)}
			{currentMessageActionType === EMessageActionType.Report && (
				<ReportMessageModal isVisible={currentMessageActionType === EMessageActionType.Report} onClose={onClose} message={message} />
			)}
			{[EMessageActionType.PinMessage, EMessageActionType.UnPinMessage].includes(currentMessageActionType) && (
				<ConfirmPinMessageModal
					isVisible={[EMessageActionType.PinMessage, EMessageActionType.UnPinMessage].includes(currentMessageActionType)}
					onClose={onCloseModalConfirm}
					message={message}
					type={currentMessageActionType}
				/>
			)}

			{isShowQuickMenuModal && <QuickMenuModal channelId={currentChannelId} isVisible={isShowQuickMenuModal} onClose={onCloseQuickMenuModal} />}
		</View>
	);
});
