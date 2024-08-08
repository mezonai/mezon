import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	ReplyIcon,
	ReplyMessageDeleted,
	save,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
} from '@mezon/mobile-components';
import { Block, Colors, Text, useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	ChannelsEntity,
	getStoreAsync,
	messagesActions,
	MessagesEntity,
	selectAllAccount,
	selectAllUsesClan,
	selectIdMessageToJump,
	selectMessageEntityById,
	useAppDispatch,
} from '@mezon/store-mobile';
import { ApiMessageAttachment, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Animated, DeviceEventEmitter, Linking, Platform, Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import { linkGoogleMeet } from '../../../utils/helpers';
import { MessageAction } from './components';
import { RenderTextMarkdownContent } from './constants';
import { EMessageActionType, EMessageBSToShow } from './enums';
import { style } from './styles';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { useSeenMessagePool } from 'libs/core/src/lib/chat/hooks/useSeenMessagePool';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { setSelectedMessage } from 'libs/store/src/lib/forwardMessage/forwardMessage.slice';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useTranslation } from 'react-i18next';
import { AvatarMessage } from './components/AvatarMessage';
import { InfoUserMessage } from './components/InfoUserMessage';
import { MessageAttachment } from './components/MessageAttachment';
import { MessageReferences } from './components/MessageReferences';
import { NewMessageRedLine } from './components/NewMessageRedLine';
import { IMessageActionNeedToResolve, IMessageActionPayload } from './types';
import WelcomeMessage from './WelcomeMessage';

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

export type MessageItemProps = {
	message?: MessagesEntity;
	messageId?: string;
	isMessNotifyMention?: boolean;
	mode: number;
	channelId?: string;
	channelName?: string;
	onOpenImage?: (image: ApiMessageAttachment) => void;
	isNumberOfLine?: boolean;
	jumpToRepliedMessage?: (messageId: string) => void;
	currentClanId?: string;
	onMessageAction?: (payload: IMessageActionPayload) => void;
	setIsOnlyEmojiPicker?: (value: boolean) => void;
	showUserInformation?: boolean;
	preventAction?: boolean;
};

const MessageItem = React.memo((props: MessageItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const {
		mode,
		onOpenImage,
		isNumberOfLine,
		jumpToRepliedMessage,
		onMessageAction,
		setIsOnlyEmojiPicker,
		showUserInformation = false,
		preventAction = false,
	} = props;
	const dispatch = useAppDispatch();
	const { t } = useTranslation('message');
	const selectedMessage = useSelector((state) => selectMessageEntityById(state, props.channelId, props.messageId));
	const message: MessagesEntity = props?.message ? props?.message : (selectedMessage as MessagesEntity);
	const { markMessageAsSeen } = useSeenMessagePool();
	const userProfile = useSelector(selectAllAccount);
	const idMessageToJump = useSelector(selectIdMessageToJump);
	const usersClan = useSelector(selectAllUsesClan);

	const checkAnonymous = useMemo(() => message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID, [message?.sender_id]);
	const hasIncludeMention = useMemo(() => {
		return message?.content?.t?.includes?.('@here') || message?.content?.t?.includes?.(`@${userProfile?.user?.username}`);
	}, [message?.content?.t, userProfile]);
	const messageReferences = useMemo(() => {
		return message?.references?.[0] as ApiMessageRef;
	}, [message?.references]);

	const isCombine = !message?.isStartedMessageGroup;
	const swipeableRef = React.useRef(null);
	const backgroundColor = React.useRef(new Animated.Value(0)).current;

	const checkMessageTargetToMoved = useMemo(() => {
		return idMessageToJump === message?.id;
	}, [idMessageToJump, message?.id]);

	const isMessageReplyDeleted = useMemo(() => {
		return !messageReferences && message?.references && message?.references?.length;
	}, [messageReferences, message.references]);

	const isDM = useMemo(() => {
		return [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(mode);
	}, [mode]);

	const messageAvatar = useMemo(() => {
		if (mode === ChannelStreamMode.STREAM_MODE_CHANNEL) {
			return message?.clan_avatar || message?.avatar;
		}
		return message?.avatar;
	}, [message?.clan_avatar, message?.avatar, mode]);

	useEffect(() => {
		if (props?.messageId) {
			const timestamp = Date.now() / 1000;
			markMessageAsSeen(message);
			dispatch(channelsActions.setChannelLastSeenTimestamp({ channelId: message.channel_id, timestamp }));
		}
	}, [dispatch, markMessageAsSeen, message, props.messageId]);

	const onLongPressImage = useCallback(() => {
		if (preventAction) return;
		setIsOnlyEmojiPicker(false);
		onMessageAction({
			type: EMessageBSToShow.MessageAction,
			senderDisplayName,
			message,
		});
		dispatch(setSelectedMessage(message));
	}, [message, preventAction]);

	const onPressAvatar = useCallback(() => {
		if (preventAction) return;
		setIsOnlyEmojiPicker(false);
		onMessageAction({
			type: EMessageBSToShow.UserInformation,
			user: message?.user,
			message,
		});
	}, [preventAction, setIsOnlyEmojiPicker, onMessageAction, message]);

	const onPressInfoUser = useCallback(() => {
		if (preventAction) return;
		setIsOnlyEmojiPicker(false);

		onMessageAction({
			type: EMessageBSToShow.UserInformation,
			user: message?.user,
			message,
		});
	}, [message, onMessageAction, preventAction, setIsOnlyEmojiPicker]);

	const onMention = useCallback(
		async (mentionedUser: string) => {
			try {
				const tagName = mentionedUser?.slice(1);
				const clanUser = usersClan?.find((userClan) => tagName === userClan?.user?.username);

				if (!mentionedUser || tagName === 'here') return;
				onMessageAction({
					type: EMessageBSToShow.UserInformation,
					user: clanUser?.user,
				});
			} catch (error) {
				console.log('error', error);
			}
		},
		[usersClan, onMessageAction],
	);

	const jumpToChannel = async (channelId: string, clanId: string) => {
		const store = await getStoreAsync();
		// TODO: do we need to jump to message here?
		store.dispatch(messagesActions.jumpToMessage({ messageId: '', channelId }));
		store.dispatch(
			channelsActions.joinChannel({
				clanId,
				channelId,
				noFetchMembers: false,
			}),
		);
	};

	const onChannelMention = useCallback(async (channel: ChannelsEntity) => {
		try {
			const type = channel?.type;
			const channelId = channel?.channel_id;
			const clanId = channel?.clan_id;

			if (type === ChannelType.CHANNEL_TYPE_VOICE && channel?.status === 1 && channel?.meeting_code) {
				const urlVoice = `${linkGoogleMeet}${channel?.meeting_code}`;
				await Linking.openURL(urlVoice);
			} else if (type === ChannelType.CHANNEL_TYPE_TEXT) {
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
				await jumpToChannel(channelId, clanId);
			}
		} catch (error) {
			console.log(error);
		}
	}, []);

	const isEdited = useMemo(() => {
		if (message?.update_time) {
			const updateDate = new Date(message?.update_time);
			const createDate = new Date(message?.create_time);
			return updateDate > createDate;
		}
		return false;
	}, [message?.create_time, message?.update_time]);

	const senderDisplayName = useMemo(() => {
		if (isDM) {
			return message?.display_name || message?.username || '';
		}
		return message?.clan_nick || message?.display_name || message?.user?.username || (checkAnonymous ? 'Anonymous' : message?.username);
	}, [checkAnonymous, message?.clan_nick, message?.user?.username, message?.username, message?.display_name, isDM]);

	const usernameMessage = useMemo(() => {
		return isDM ? message?.display_name || message?.user?.username : message?.user?.username;
	}, [isDM, message?.display_name, message?.user?.username]);

	const renderRightActions = (progress, dragX) => {
		const scale = dragX.interpolate({
			inputRange: [-50, 0],
			outputRange: [1, 0],
			extrapolate: 'clamp',
		});
		return (
			<Animated.View style={[{ transform: [{ scale }] }, { alignItems: 'center', justifyContent: 'center' }]}>
				<ReplyMessageDeleted width={70} height={25} color={Colors.bgViolet} />
			</Animated.View>
		);
	};

	const handleSwipeableOpen = (direction: 'left' | 'right') => {
		if (preventAction && swipeableRef.current) {
			swipeableRef.current.close();
		}
		if (direction === 'right') {
			swipeableRef.current?.close();
			const payload: IMessageActionNeedToResolve = {
				type: EMessageActionType.Reply,
				targetMessage: message,
				isStillShowKeyboard: true,
				replyTo: senderDisplayName,
			};
			//Note: trigger to ChatBox.tsx
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
		}
	};

	if (message.isStartedMessageGroup && message.sender_id == '0') return <WelcomeMessage channelTitle={props.channelName} />;

	const handlePressIn = () => {
		Animated.timing(backgroundColor, {
			toValue: 1,
			duration: 500,
			useNativeDriver: false,
		}).start();
	};

	const handlePressOut = () => {
		Animated.timing(backgroundColor, {
			toValue: 0,
			duration: 500,
			useNativeDriver: false,
		}).start();
	};

	const bgColor = backgroundColor.interpolate({
		inputRange: [0, 1],
		outputRange: ['transparent', themeValue.secondaryWeight],
	});

	return (
		<Animated.View style={[{ backgroundColor: bgColor }]}>
			{/* <Swipeable
			renderRightActions={renderRightActions}
			ref={swipeableRef}
			overshootRight={false}
			onSwipeableOpen={handleSwipeableOpen}
			hitSlop={{ left: -10 }
		> */}
			<View
				style={[
					styles.messageWrapper,
					(isCombine || preventAction) && { marginTop: 0 },
					hasIncludeMention && styles.highlightMessageMention,
					checkMessageTargetToMoved && styles.highlightMessageReply,
				]}
			>
				{!!messageReferences && (
					<MessageReferences
						messageReferences={messageReferences}
						preventAction={preventAction}
						isMessageReply={true}
						jumpToRepliedMessage={jumpToRepliedMessage}
						mode={mode}
					/>
				)}
				{isMessageReplyDeleted ? (
					<View style={styles.aboveMessageDeleteReply}>
						<View style={styles.iconReply}>
							<ReplyIcon width={34} height={30} style={styles.deletedMessageReplyIcon} />
						</View>
						<View style={styles.iconMessageDeleteReply}>
							<ReplyMessageDeleted width={18} height={9} />
						</View>
						<Text style={styles.messageDeleteReplyText}>{t('messageDeleteReply')}</Text>
					</View>
				) : null}
				<View style={[styles.wrapperMessageBox, !isCombine && styles.wrapperMessageBoxCombine]}>
					<AvatarMessage
						onPress={onPressAvatar}
						id={message?.user?.id}
						avatar={messageAvatar}
						username={usernameMessage}
						isShow={!isCombine || !!message?.references?.length || showUserInformation}
					/>
					<Pressable
						style={[styles.rowMessageBox]}
						delayLongPress={Platform.OS === 'ios' ? 300 : 100}
						onPressIn={handlePressIn}
						onPressOut={handlePressOut}
						onLongPress={() => {
							if (preventAction) return;
							setIsOnlyEmojiPicker(false);
							onMessageAction({
								type: EMessageBSToShow.MessageAction,
								senderDisplayName,
								message,
							});
							dispatch(setSelectedMessage(message));
						}}
					>
						<InfoUserMessage
							onPress={onPressInfoUser}
							senderDisplayName={senderDisplayName}
							isShow={!isCombine || !!message?.references?.length || showUserInformation}
							createTime={message?.create_time}
						/>
						<MessageAttachment message={message} onOpenImage={onOpenImage} onLongPressImage={onLongPressImage} />
						<Block opacity={message.isError ? 0.6 : 1}>
							<RenderTextMarkdownContent
								content={message.content}
								isEdited={isEdited}
								translate={t}
								onMention={onMention}
								onChannelMention={onChannelMention}
								isNumberOfLine={isNumberOfLine}
								isMessageReply={false}
								mode={mode}
							/>
						</Block>
						{message.isError && <Text style={{ color: 'red' }}>{t('unableSendMessage')}</Text>}
						{!preventAction ? (
							<MessageAction
								message={message}
								mode={mode}
								userProfile={userProfile}
								preventAction={preventAction}
								openEmojiPicker={() => {
									setIsOnlyEmojiPicker(true);
									onMessageAction({
										type: EMessageBSToShow.MessageAction,
										senderDisplayName,
										message,
									});
								}}
							/>
						) : null}
					</Pressable>
				</View>
			</View>
			{/* </Swipeable> */}
			<NewMessageRedLine channelId={props?.channelId} messageId={props?.messageId} isEdited={isEdited} />
		</Animated.View>
	);
});

export default MessageItem;
