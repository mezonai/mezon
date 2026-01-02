/* eslint-disable @nx/enforce-module-boundaries */
/* eslint-disable no-console */
import { useChannelMembers, useChatSending, useDirect, usePermissionChecker, useSendInviteMessage } from '@mezon/core';
import { ActionEmitEvent, formatContentEditMessage, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	appActions,
	channelMetaActions,
	clansActions,
	directActions,
	directMetaActions,
	getStore,
	giveCoffeeActions,
	messagesActions,
	notificationActions,
	selectAnonymousMode,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectCurrentTopicId,
	selectDmGroupCurrent,
	selectDmGroupCurrentId,
	selectMessageEntitiesByChannelId,
	selectMessageIdsByChannelId,
	selectPinMessageByChannelId,
	setIsForwardAll,
	threadsActions,
	topicsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import {
	EMOJI_GIVE_COFFEE,
	EOverriddenPermission,
	EPermission,
	formatMoney,
	FORWARD_MESSAGE_TIME,
	isPublicChannel,
	sleep,
	ThreadStatus,
	TOKEN_TO_AMOUNT,
	TypeMessage
} from '@mezon/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../../src/app/componentUI/MezonIconCDN';
import MezonConfirm from '../../../../../componentUI/MezonConfirm';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { useImage } from '../../../../../hooks/useImage';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { getMessageActions } from '../../constants';
import { EMessageActionType } from '../../enums';
import type {
	IConfirmActionPayload,
	IMessageAction,
	IMessageActionNeedToResolve,
	IReplyBottomSheet
} from '../../types/message.interface';
import { ConfirmPinMessageModal } from '../ConfirmPinMessageModal';
import EmojiSelector from '../EmojiPicker/EmojiSelector';
import type { IReactionMessageProps } from '../MessageReaction';
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

	const { t } = useTranslation(['message', 'token']);
	const [currentMessageActionType, setCurrentMessageActionType] = useState<EMessageActionType | null>(null);
	const [isShowQuickMenuModal, setIsShowQuickMenuModal] = useState(false);

	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroup = useSelector(selectDmGroupCurrent(currentDmId ?? ''));
	const currentTopicId = useSelector(selectCurrentTopicId);
	const anonymousMode = useSelector((state) => selectAnonymousMode(state, currentChannel?.clan_id));
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
		[currentChannel, currentChannelId, currentDmId, currentTopicId, dispatch, message, mode, socketRef, store]
	);

	const onConfirmAction = useCallback(
		(payload: IConfirmActionPayload) => {
			const { type, message } = payload;
			switch (type) {
				case EMessageActionType.DeleteMessage:
					onDeleteMessage(message?.id);
					break;
				case EMessageActionType.ForwardMessage:
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
	const { downloadImage, saveMediaToCameraRoll, getImageAsBase64OrFile } = useImage();
	const allMessagesEntities = useAppSelector((state) =>
		selectMessageEntitiesByChannelId(state, (currentDmId ? currentDmId : currentTopicId ? currentTopicId : currentChannelId) || '')
	);
	const allMessageIds = useAppSelector((state) =>
		selectMessageIdsByChannelId(state, (currentDmId ? currentDmId : currentTopicId ? currentTopicId : currentChannelId) || '')
	);
	const messagePosition = useMemo(() => {
		return allMessageIds?.findIndex((id: string) => id === message?.id);
	}, [allMessageIds, message?.id]);
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

	const handleActionReportMessage = useCallback(() => {
		const data = {
			children: <ReportMessageModal messageId={message?.id} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [message?.id]);

	const handleActionGiveACoffee = async () => {
		try {
			if (userId !== message.sender_id) {
				const currentClanId = selectCurrentClanId(store.getState());
				const coffeeEvent = {
					channel_id: message.channel_id,
					clan_id: message.clan_id,
					message_ref_id: message.id,
					receiver_id: message.sender_id,
					sender_id: userId
				};
				const res = await dispatch(giveCoffeeActions.updateGiveCoffee(coffeeEvent));
				if (res?.meta?.requestStatus === 'rejected' || !res || !res?.payload) {
					Toast.show({
						type: 'error',
						text1: res?.payload?.toString() || 'An error occurred, please try again'
					});
					return;
				}
				handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, message.id, EMOJI_GIVE_COFFEE.emoji_id, EMOJI_GIVE_COFFEE.emoji);
				const response = await createDirectMessageWithUser(message?.sender_id, message?.user?.name, message?.user?.username, message?.avatar);
				if (response?.channel_id) {
					sendInviteMessage(
						`${t('tokensSent', { ns: 'token' })} ${formatMoney(TOKEN_TO_AMOUNT.ONE_THOUNSAND * 10)}₫ | ${t('giveCoffeeAction', { ns: 'token' })}`,
						response?.channel_id,
						ChannelStreamMode.STREAM_MODE_DM,
						TypeMessage.SendToken
					);
				}
				await dispatch(directActions.setDmGroupCurrentId(''));
				await dispatch(clansActions.joinClan({ clanId: currentClanId }));
				onClose();
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
		const data = {
			children: (
				<MezonConfirm
					title={t('deleteMessageModal.title')}
					content={t('deleteMessageModal.deleteMessageDescription')}
					confirmText={t('deleteMessageModal.delete')}
					isDanger
					onConfirm={() => {
						onConfirmAction({
							type: EMessageActionType.DeleteMessage,
							message
						});
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
					}}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
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

		const type = filetype === 'video/quicktime' ? ['video', 'mov'] : filetype?.split?.('/');
		try {
			const filePath = await downloadImage(url, type?.[1]);

			if (filePath) {
				await saveMediaToCameraRoll(`file://${filePath}`, type?.[0], true);
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

	const handleForwardMessage = async () => {
		dispatch(setIsForwardAll(false));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.FORWARD_MESSAGE,
			params: {
				message
			}
		});
	};

	const handleForwardAllMessages = async () => {
		dispatch(setIsForwardAll(true));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.FORWARD_MESSAGE,
			params: {
				message
			}
		});
	};

	const handleActionTopicDiscussion = async () => {
		if (!message) return;

		dispatch(topicsActions.setCurrentTopicId(''));
		dispatch(topicsActions.setInitTopicMessageId(message?.id || ''));
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
		const payloadSetLastSeenTimestamp = {
			channelId: message?.channel_id || '',
			timestamp: 1,
			messageId: message?.id
		};
		try {
			await dispatch(
				messagesActions.updateLastSeenMessage({
					clanId: message?.clan_id || '',
					channelId: message?.channel_id || '',
					messageId: message?.id || '',
					mode: message?.mode || 0,
					badge_count: 0,
					message_time: 1
				})
			);
			if (message?.clan_id === '0') {
				dispatch(directMetaActions.setDirectLastSeenTimestamp(payloadSetLastSeenTimestamp));
			} else {
				dispatch(channelMetaActions.setChannelLastSeenTimestamp(payloadSetLastSeenTimestamp));
			}

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
					text2: t('toast.markMessageUnreadFailed')
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

	const handleActionShareImage = async () => {
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const url = message?.attachments?.[0]?.url;
			const filetype = message?.attachments?.[0]?.filetype;
			const filename = message?.attachments?.[0]?.filename || 'image';

			if (!url) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.shareImageFailed', { error: 'No image URL found' }),
						leadingIcon: <MezonIconCDN icon={IconCDN.circleXIcon} color={baseColor.red} />
					}
				});
				return;
			}

			const type = filetype?.split?.('/');
			const imageData = await getImageAsBase64OrFile(url, type?.[1], { forSharing: true });

			if (!imageData || !imageData.filePath) {
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.shareImageFailed', { error: 'Failed to process image' }),
						leadingIcon: <MezonIconCDN icon={IconCDN.circleXIcon} color={baseColor.red} />
					}
				});
				return;
			}

			const shareOptions = {
				url: `file://${imageData.filePath}`,
				type: filetype || 'image/png',
				filename
			};

			await Share.open(shareOptions);
		} catch (error) {
			if (error?.message !== 'User did not share') {
				Toast.show({
					type: 'success',
					props: {
						text2: t('toast.shareImageFailed', { error: 'Unknown error' }),
						leadingIcon: <MezonIconCDN icon={IconCDN.circleXIcon} color={baseColor.red} />
					}
				});
			}
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
			case EMessageActionType.SaveMedia:
				handleActionSaveImage();
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
			case EMessageActionType.ShareImage:
				handleActionShareImage();
				break;
			case EMessageActionType.Report:
				handleActionReportMessage();
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
				return <MezonIconCDN icon={IconCDN.forwardAllIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
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
			case EMessageActionType.SaveMedia:
				return <MezonIconCDN icon={IconCDN.downloadIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.CopyMediaLink:
				return <MezonIconCDN icon={IconCDN.linkIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.CopyMessageLink:
				return <MezonIconCDN icon={IconCDN.linkIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
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
			case EMessageActionType.ShareImage:
				return <MezonIconCDN icon={IconCDN.shareIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case EMessageActionType.Report:
				return <MezonIconCDN icon={IconCDN.redFlag} width={size.s_14} height={size.s_14} color={baseColor.red} />;
			default:
				return <View />;
		}
	};

	const messageActionList = useMemo(() => {
		const isMyMessage = userId === message?.user?.id;
		const isMessageError = message?.isError;
		const isHidePinMessage = !!currentTopicId;
		const isUnPinMessage = listPinMessages.some((pinMessage) => pinMessage?.message_id === message?.id);
		const isHideCreateThread =
			isDM ||
			((!isCanManageThread || !isCanManageChannel) && !isClanOwner) ||
			[
				ChannelType.CHANNEL_TYPE_APP,
				ChannelType.CHANNEL_TYPE_MEZON_VOICE,
				ChannelType.CHANNEL_TYPE_STREAMING,
				ChannelType.CHANNEL_TYPE_THREAD
			].includes(currentChannel?.type);
		const isTopicFirstMessage = message?.code === TypeMessage.Topic;
		const isHideDeleteMessage = !((isAllowDelMessage && !isDM) || isMyMessage) || isTopicFirstMessage;
		const isHideTopicDiscussion =
			(message?.topic_id && message?.topic_id !== '0') ||
			message?.code === TypeMessage.Topic ||
			isDM ||
			!canSendMessage ||
			currentChannelId !== message?.channel_id ||
			isMessageSystem ||
			message?.code === TypeMessage.MessageBuzz ||
			anonymousMode;
		const listOfActionOnlyMyMessage = [EMessageActionType.EditMessage];
		const listOfActionOnlyOtherMessage = [EMessageActionType.Report];
		const isHideActionImage = !(message?.attachments?.length === 1 && message?.attachments?.[0]?.filetype?.includes('image'));
		const isHideActionMedia =
			message?.attachments?.length === 0 ||
			!message?.attachments?.every((a) => a?.filetype?.startsWith('image') || a?.filetype?.startsWith('video'));

		const isShowForwardAll = () => {
			if ((messagePosition === -1 || messagePosition === 0) && !currentTopicId) return false;

			const currentMessage = allMessagesEntities?.[allMessageIds?.[messagePosition]];
			const nextMessage = allMessagesEntities?.[allMessageIds?.[messagePosition + 1]];

			const isSameSenderWithNextMessage = currentMessage?.sender_id === nextMessage?.sender_id;

			const isNextMessageWithinTimeLimit = nextMessage
				? (nextMessage?.create_time_seconds - currentMessage?.create_time_seconds) * 1000 < FORWARD_MESSAGE_TIME
				: false;

			return isSameSenderWithNextMessage && isNextMessageWithinTimeLimit;
		};

		const listOfActionShouldHide = [
			isHidePinMessage && EMessageActionType.PinMessage,
			isUnPinMessage ? EMessageActionType.PinMessage : EMessageActionType.UnPinMessage,
			!isShowForwardAll() && EMessageActionType.ForwardAllMessages,
			isHideCreateThread && EMessageActionType.CreateThread,
			isHideDeleteMessage && EMessageActionType.DeleteMessage,
			((!isMessageError && isMyMessage) || !isMyMessage) && EMessageActionType.ResendMessage,
			(isMyMessage || isMessageSystem || isAnonymous) && EMessageActionType.GiveACoffee,
			isHideTopicDiscussion && EMessageActionType.TopicDiscussion,
			isDM && EMessageActionType.QuickMenu,
			isHideActionImage && EMessageActionType.CopyImage,
			isHideActionImage && EMessageActionType.ShareImage,
			isHideActionMedia && EMessageActionType.SaveMedia,
			(isTopicFirstMessage || message?.content?.fwd || message?.code === TypeMessage.SendToken) && EMessageActionType.EditMessage
		];

		let availableMessageActions: IMessageAction[] = [];
		if (isMyMessage) {
			availableMessageActions = getMessageActions(t).filter(
				(action) => ![...(listOfActionOnlyOtherMessage ?? []), ...(listOfActionShouldHide ?? [])]?.includes(action.type)
			);
		} else {
			availableMessageActions = getMessageActions(t).filter(
				(action) => ![...(listOfActionOnlyMyMessage ?? []), ...(listOfActionShouldHide ?? [])]?.includes(action.type)
			);
		}
		const mediaList =
			(message?.attachments?.length > 0 &&
				message.attachments?.every((att) => att?.filetype?.includes('image') || att?.filetype?.includes('video'))) ||
			message?.content?.embed?.some((embed) => embed?.image)
				? [EMessageActionType.SaveMedia, EMessageActionType.CopyMediaLink, EMessageActionType.ShareImage, EMessageActionType.CopyImage]
				: [];

		const frequentActionList = [
			EMessageActionType.ForwardMessage,
			EMessageActionType.ForwardAllMessages,
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
			media: availableMessageActions.filter((action) => mediaList.includes(action.type)),
			warning: availableMessageActions.filter((action) => warningActionList.includes(action.type))
		};
	}, [
		userId,
		message?.user?.id,
		message?.isError,
		message?.code,
		message?.topic_id,
		message?.channel_id,
		message?.attachments,
		message?.content?.fwd,
		message?.content?.embed,
		message?.id,
		currentTopicId,
		listPinMessages,
		isDM,
		isCanManageThread,
		isCanManageChannel,
		isClanOwner,
		currentChannel?.type,
		isAllowDelMessage,
		canSendMessage,
		currentChannelId,
		isMessageSystem,
		anonymousMode,
		isAnonymous,
		messagePosition,
		allMessagesEntities,
		allMessageIds,
		t
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
				<RecentEmojiMessageAction
					messageId={message.id}
					mode={mode}
					handleReact={handleReact}
					message={message}
					senderDisplayName={senderDisplayName}
				/>
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
					{messageActionList.media.map((action) => {
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
			{isOnlyEmojiPicker ? (
				<View style={styles.emojiPickerContainer}>
					<EmojiSelector onSelected={onSelectEmoji} isReactMessage />
				</View>
			) : (
				renderMessageItemActions()
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
