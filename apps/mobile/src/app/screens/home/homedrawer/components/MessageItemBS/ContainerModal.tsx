/* eslint-disable no-console */
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useChannelMembers, useChatSending, usePermissionChecker } from '@mezon/core';
import { ActionEmitEvent, CopyIcon, Icons, STORAGE_MY_USER_ID, formatContentEditMessage, load } from '@mezon/mobile-components';
import { Colors, baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	MessagesEntity,
	appActions,
	giveCoffeeActions,
	messagesActions,
	selectCurrentChannel,
	selectCurrentChannelId,
	selectCurrentClanId,
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
import { AMOUNT_TOKEN, EMOJI_GIVE_COFFEE, EOverriddenPermission, EPermission, ThreadStatus, TypeMessage, getSrcEmoji } from '@mezon/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Platform, Pressable, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useImage } from '../../../../../hooks/useImage';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { getMessageActions } from '../../constants';
import { EMessageActionType, EMessageBSToShow } from '../../enums';
import { IMessageAction, IMessageActionNeedToResolve, IReplyBottomSheet } from '../../types/message.interface';
import EmojiSelector from '../EmojiPicker/EmojiSelector';
import { IReactionMessageProps } from '../MessageReaction';
import UserProfile from '../UserProfile';
import { emojiFakeData } from '../fakeData';
import { style } from './styles';

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';
export const ContainerModal = React.memo((props: IReplyBottomSheet) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const { type, onClose, onConfirmAction, message, mode, isOnlyEmojiPicker = false, user, senderDisplayName = '', handleBottomSheetExpand } = props;
	const checkAnonymous = useMemo(() => message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID, [message?.sender_id]);
	const timeoutRef = useRef(null);
	const [content, setContent] = useState<React.ReactNode>(<View />);
	const { t } = useTranslation(['message']);
	const [recentEmoji, setRecentEmoji] = useState([]);
	const [isShowEmojiPicker, setIsShowEmojiPicker] = useState(false);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const currentDmId = useSelector(selectDmGroupCurrentId);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroup = useSelector(selectDmGroupCurrent(currentDmId ?? ''));
	const navigation = useNavigation<any>();
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect:
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? currentChannel : currentDmGroup
	});

	const [isCanManageThread, isCanManageChannel, canSendMessage] = usePermissionChecker(
		[EOverriddenPermission.manageThread, EPermission.manageChannel, EOverriddenPermission.sendMessage],
		currentChannelId ?? ''
	);
	const [isAllowDelMessage] = usePermissionChecker([EOverriddenPermission.deleteMessage], message?.channel_id ?? '');
	const { downloadImage, saveImageToCameraRoll } = useImage();
	const allMessagesEntities = useAppSelector((state) =>
		selectMessageEntitiesByChannelId(state, (currentDmId ? currentDmId : currentChannelId) || '')
	);
	const convertedAllMessagesEntities: MessagesEntity[] = allMessagesEntities ? Object.values(allMessagesEntities) : [];
	const messagePosition = useMemo(() => {
		return convertedAllMessagesEntities?.findIndex((value: MessagesEntity) => value.id === message?.id);
	}, [convertedAllMessagesEntities, message?.id]);
	const { joinningToThread } = useChannelMembers({ channelId: currentChannelId, mode: mode ?? 0 });

	const isShowForwardAll = () => {
		if (messagePosition === -1) return false;
		return (
			message?.isStartedMessageGroup &&
			messagePosition < (convertedAllMessagesEntities?.length || 0 - 1) &&
			!convertedAllMessagesEntities?.[messagePosition + 1]?.isStartedMessageGroup
		);
	};

	const handleActionEditMessage = () => {
		onClose();
		const payload: IMessageActionNeedToResolve = {
			type: EMessageActionType.EditMessage,
			targetMessage: message
		};
		//Note: trigger to ChatBox.tsx
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
	};

	const handleActionGiveACoffee = () => {
		onClose();
		try {
			if (userId !== message.sender_id) {
				const coffeeEvent = {
					channel_id: message.channel_id,
					clan_id: message.clan_id,
					message_ref_id: message.id,
					receiver_id: message.sender_id,
					sender_id: userId,
					token_count: AMOUNT_TOKEN.TEN_TOKENS
				};
				dispatch(giveCoffeeActions.updateGiveCoffee(coffeeEvent));
				handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, message.id, EMOJI_GIVE_COFFEE.emoji_id, EMOJI_GIVE_COFFEE.emoji, userId);
			}
		} catch (error) {
			console.error('Failed to give cofffee message', error);
		}
	};

	const listPinMessages = useSelector(selectPinMessageByChannelId(message?.channel_id));
	const bottomSheetRef = useRef<BottomSheetModal>(null);
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
				leadingIcon: <CopyIcon color={Colors.bgGrayLight} />
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
		if (message) onClose();
		timeoutRef.current = setTimeout(
			() => {
				onConfirmAction({
					type: EMessageActionType.PinMessage
				});
			},
			Platform.OS === 'ios' ? 500 : 0
		);
	};

	const handleActionUnPinMessage = () => {
		if (message) onClose();
		timeoutRef.current = setTimeout(
			() => {
				onConfirmAction({
					type: EMessageActionType.UnPinMessage
				});
			},
			Platform.OS === 'ios' ? 500 : 0
		);
	};

	const handleActionMarkUnRead = () => {
		Toast.show({ type: 'info', text1: 'Updating...' });
	};

	const handleResendMessage = async () => {
		dispatch(
			messagesActions.remove({
				channelId: message.channel_id,
				messageId: message.id
			})
		);
		onClose();
		await sendMessage(
			message.content,
			message.mentions,
			message.attachments,
			message.references,
			false,
			message?.isMentionEveryone || false,
			true
		);
	};

	const handleActionMention = () => {
		onClose();
		const payload: IMessageActionNeedToResolve = {
			type: EMessageActionType.Mention,
			targetMessage: message
		};
		DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
	};

	const handleActionCopyMessageLink = () => {
		Toast.show({ type: 'info', text1: 'Updating...' });
	};

	const handleActionCopyMediaLink = () => {
		const media = message?.attachments;
		if (media && media.length > 0) {
			const url = media[0].url;
			Clipboard.setString(url);
		}
	};

	const downloadAndSaveMedia = async (media) => {
		const url = media.url;
		const filetype = media?.filetype;

		const type = filetype.split('/');
		try {
			const filePath = await downloadImage(url, type[1]);

			if (filePath) {
				await saveImageToCameraRoll('file://' + filePath, type[0]);
			}
		} catch (error) {
			console.error(`Error downloading or saving media from URL: ${url}`, error);
		}
	};

	const handleActionSaveImage = async () => {
		onClose();
		const media = message?.attachments;
		bottomSheetRef?.current?.dismiss();
		dispatch(appActions.setLoadingMainMobile(true));
		if (media && media.length > 0) {
			const promises = media?.map(downloadAndSaveMedia);
			await Promise.all(promises);
		}
		dispatch(appActions.setLoadingMainMobile(false));
	};

	const handleActionReportMessage = () => {
		onClose();
		timeoutRef.current = setTimeout(
			() => {
				onConfirmAction({
					type: EMessageActionType.Report
				});
			},
			Platform.OS === 'ios' ? 500 : 0
		);
	};

	const handleForwardMessage = () => {
		onClose();
		dispatch(setIsForwardAll(false));
		timeoutRef.current = setTimeout(
			() => {
				onConfirmAction({
					type: EMessageActionType.ForwardMessage,
					message
				});
			},
			Platform.OS === 'ios' ? 500 : 0
		);
	};

	const handleForwardAllMessages = () => {
		onClose();
		dispatch(setIsForwardAll(true));
		timeoutRef.current = setTimeout(
			() => {
				onConfirmAction({
					type: EMessageActionType.ForwardMessage,
					message
				});
			},
			Platform.OS === 'ios' ? 500 : 0
		);
	};

	const handleActionTopicDiscussion = async () => {
		if (!message) return;
		dispatch(topicsActions.setValueTopic(message));
		dispatch(topicsActions.setCurrentTopicId(message?.content?.tp || ''));
		dispatch(topicsActions.setIsShowCreateTopic({ channelId: message?.channel_id as string, isShowCreateTopic: true }));
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
		onClose();
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
			case EMessageActionType.DeleteMessage:
				handleActionDeleteMessage();
				break;
			case EMessageActionType.PinMessage:
				handleActionPinMessage();
				break;
			case EMessageActionType.UnPinMessage:
				handleActionUnPinMessage();
				break;
			case EMessageActionType.MarkUnRead:
				handleActionMarkUnRead();
				break;
			// case EMessageActionType.Mention:
			// 	handleActionMention();
			// 	break;
			case EMessageActionType.CopyMessageLink:
				handleActionCopyMessageLink();
				break;
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
			case EMessageActionType.TopicDiscussion:
				handleActionTopicDiscussion();
				break;
			default:
				break;
		}
	};

	const getActionMessageIcon = (type: EMessageActionType) => {
		switch (type) {
			case EMessageActionType.EditMessage:
				return <Icons.PencilIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.Reply:
				return <Icons.ArrowAngleLeftUpIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.ForwardMessage:
				return <Icons.ArrowAngleRightUpIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.ForwardAllMessages:
				return <Icons.ArrowAngleRightUpIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.CreateThread:
				return <Icons.ThreadIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.CopyText:
				return <Icons.CopyIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.DeleteMessage:
				return <Icons.TrashIcon color={baseColor.red} height={size.s_20} width={size.s_20} />;
			case EMessageActionType.PinMessage:
				return <Icons.PinIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.UnPinMessage:
				return <Icons.PinIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.MarkUnRead:
				return <Icons.ChatMarkUnreadIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			// case EMessageActionType.Mention:
			// 	return <Icons.AtIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.SaveImage:
				return <Icons.DownloadIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.CopyMediaLink:
				return <Icons.LinkIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.CopyMessageLink:
				return <Icons.LinkIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.Report:
				return <Icons.FlagIcon color={baseColor.red} height={size.s_14} width={size.s_14} />;
			case EMessageActionType.GiveACoffee:
				return <Icons.GiftIcon color={themeValue.text} height={size.s_20} width={size.s_20} />;
			case EMessageActionType.ResendMessage:
				return <Icons.ChatMarkUnreadIcon color={themeValue.text} width={size.s_24} height={size.s_24} />;
			case EMessageActionType.TopicDiscussion:
				return <Icons.DiscussionIcon color={themeValue.text} width={size.s_32} height={size.s_32} />;
			default:
				return <View />;
		}
	};

	const messageActionList = useMemo(() => {
		const isMyMessage = userId === message?.user?.id;
		const isMessageError = message?.isError;
		const isUnPinMessage = listPinMessages.some((pinMessage) => pinMessage?.message_id === message?.id);
		const isHideCreateThread = isDM || !isCanManageThread || !isCanManageChannel || currentChannel?.parrent_id !== '0';
		const isHideThread = currentChannel?.parrent_id !== '0';
		const isHideDeleteMessage = !((isAllowDelMessage && !isDM) || isMyMessage);
		const isHideTopicDiscussion =
			message?.topic_id || message?.code === TypeMessage.Topic || isDM || !canSendMessage || currentChannelId !== message?.channel_id;
		const listOfActionOnlyMyMessage = [EMessageActionType.EditMessage];
		const listOfActionOnlyOtherMessage = [EMessageActionType.Report];

		const listOfActionShouldHide = [
			isUnPinMessage ? EMessageActionType.PinMessage : EMessageActionType.UnPinMessage,
			(!isShowForwardAll() || isHideThread) && EMessageActionType.ForwardAllMessages,
			isHideCreateThread && EMessageActionType.CreateThread,
			isHideDeleteMessage && EMessageActionType.DeleteMessage,
			((!isMessageError && isMyMessage) || !isMyMessage) && EMessageActionType.ResendMessage,
			isMyMessage && EMessageActionType.GiveACoffee,
			isHideTopicDiscussion && EMessageActionType.TopicDiscussion
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
			message?.attachments?.length > 0 &&
			message.attachments?.every((att) => att?.filetype?.includes('image') || att?.filetype?.includes('video'))
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
		message?.user?.id,
		message?.isError,
		message?.code,
		message?.attachments,
		message?.id,
		listPinMessages,
		isDM,
		isCanManageThread,
		isCanManageChannel,
		currentChannel?.parrent_id,
		isAllowDelMessage,
		canSendMessage,
		isShowForwardAll,
		t
	]);

	const renderUserInformation = () => {
		return (
			<UserProfile
				userId={user?.id}
				user={user}
				message={message}
				checkAnonymous={checkAnonymous}
				showAction={!isDM}
				currentChannel={isDM ? currentDmGroup : currentChannel}
				showRole={!isDM}
			/>
		);
	};

	const handleReact = async (mode, messageId, emoji_id: string, emoji: string, senderId) => {
		if (currentChannel?.parrent_id !== '0' && currentChannel?.active === ThreadStatus.activePublic) {
			await dispatch(threadsActions.updateActiveCodeThread({ channelId: currentChannel?.channel_id ?? '', activeCode: ThreadStatus.joined }));
			joinningToThread(currentChannel, [userId ?? '']);
		}

		DeviceEventEmitter.emit(ActionEmitEvent.ON_REACTION_MESSAGE_ITEM, {
			id: '',
			mode: mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL,
			messageId: messageId ?? '',
			clanId:
				mode === ChannelStreamMode.STREAM_MODE_GROUP || mode === ChannelStreamMode.STREAM_MODE_DM ? '' : (message?.clan_id ?? currentClanId),
			channelId: message?.channel_id ?? '',
			emojiId: emoji_id ?? '',
			emoji: emoji?.trim() ?? '',
			senderId: senderId ?? '',
			countToRemove: 1,
			actionDelete: false,
			topicId: message.content?.tp || ''
		} as IReactionMessageProps);

		onClose();
	};

	useEffect(() => {
		if (type === EMessageBSToShow?.MessageAction) {
			AsyncStorage.getItem('recentEmojis')
				.then((emojis) => safeJSONParse(emojis || '[]'))
				.then((parsedEmojis) => {
					const recentEmojis = parsedEmojis
						?.reverse()
						?.slice(0, 5)
						?.map((item: { emoji: any; emojiId: any }) => ({
							shortname: item.emoji,
							id: item.emojiId
						}));

					const uniqueEmojis = [...recentEmojis, ...emojiFakeData]?.filter(
						(emoji, index, self) => index === self?.findIndex((e) => e?.id === emoji?.id)
					);
					setRecentEmoji(uniqueEmojis?.slice(0, 5));
				});
		}
	}, [type]);

	const renderMessageItemActions = () => {
		return (
			<View style={styles.messageActionsWrapper}>
				<View style={styles.reactWrapper}>
					{recentEmoji?.map((item, index) => {
						return (
							<Pressable
								key={index}
								style={styles.favouriteIconItem}
								onPress={() =>
									handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, message.id, item.id, item.shortname, userId)
								}
							>
								<FastImage
									source={{
										uri: getSrcEmoji(item.id)
									}}
									resizeMode={'contain'}
									style={{
										width: size.s_28,
										height: size.s_28
									}}
								/>
							</Pressable>
						);
					})}

					<Pressable onPress={() => setIsShowEmojiPicker(true)} style={{ height: size.s_28, width: size.s_28 }}>
						<Icons.ReactionIcon color={themeValue.text} height={size.s_24} width={size.s_24} />
					</Pressable>
				</View>
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
			await handleReact(mode ?? ChannelStreamMode.STREAM_MODE_CHANNEL, message?.id, emoji_id, emoij, userId);
		},
		[handleReact, message?.id, mode, userId]
	);

	const renderEmojiSelector = () => {
		return (
			<View style={{ padding: size.s_10 }}>
				<EmojiSelector onSelected={onSelectEmoji} isReactMessage handleBottomSheetExpand={handleBottomSheetExpand} />
			</View>
		);
	};

	const setVisibleBottomSheet = (isShow: boolean) => {
		if (bottomSheetRef) {
			if (isShow) {
				bottomSheetRef.current?.present();
			} else {
				bottomSheetRef.current?.close();
			}
		}
	};

	useEffect(() => {
		return () => {
			timeoutRef.current && clearTimeout(timeoutRef.current);
		};
	}, []);

	useEffect(() => {
		switch (type) {
			case EMessageBSToShow.MessageAction:
				setVisibleBottomSheet(true);
				if (isShowEmojiPicker || isOnlyEmojiPicker) {
					setContent(renderEmojiSelector());
				} else {
					setContent(renderMessageItemActions());
				}
				break;
			case EMessageBSToShow.UserInformation:
				setVisibleBottomSheet(true);
				setContent(renderUserInformation());
				break;
			default:
				setVisibleBottomSheet(false);
				setContent(<View />);
		}
	}, [type, isShowEmojiPicker, isOnlyEmojiPicker, recentEmoji]);

	return <View style={[styles.bottomSheetWrapper, { backgroundColor: themeValue.primary }]}>{content}</View>;
});
