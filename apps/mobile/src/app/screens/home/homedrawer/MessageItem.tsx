/* eslint-disable no-console */
import { ActionEmitEvent, ReplyMessageDeleted, validLinkGoogleMapRegex, validLinkInviteRegex } from '@mezon/mobile-components';
import { Block, Colors, Text, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, MessagesEntity, messagesActions, seenMessagePool, selectAllAccount, useAppDispatch } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, DeviceEventEmitter, Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import { EmbedMessage, MessageAction, RenderTextMarkdownContent } from './components';
import { EMessageActionType, EMessageBSToShow } from './enums';
import { style } from './styles';
// eslint-disable-next-line @nx/enforce-module-boundaries
// eslint-disable-next-line @nx/enforce-module-boundaries
import { setSelectedMessage } from '@mezon/store-mobile';
import { ETypeLinkMedia, isValidEmojiData } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import RenderMessageBlock from './RenderMessageBlock';
import WelcomeMessage from './WelcomeMessage';
import { AvatarMessage } from './components/AvatarMessage';
import { InfoUserMessage } from './components/InfoUserMessage';
import { MessageAttachment } from './components/MessageAttachment';
import { RenderMessageItemRef } from './components/RenderMessageItemRef';
import { IMessageActionNeedToResolve } from './types';

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

export type MessageItemProps = {
	message?: MessagesEntity;
	previousMessage?: MessagesEntity;
	messageId?: string;
	isMessNotifyMention?: boolean;
	mode: number;
	channelId?: string;
	isNumberOfLine?: boolean;
	currentClanId?: string;
	showUserInformation?: boolean;
	preventAction?: boolean;
};

const MessageItem = React.memo(
	(props: MessageItemProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const { mode, isNumberOfLine, showUserInformation = false, preventAction = false, channelId = '' } = props;
		const dispatch = useAppDispatch();
		const { t } = useTranslation('message');
		const message: MessagesEntity = props?.message;
		const previousMessage: MessagesEntity = props?.previousMessage;
		const [showHighlightReply, setShowHighlightReply] = useState(false);
		const { t: contentMessage, lk = [] } = message?.content || {};

		const isInviteLink = useMemo(() => {
			return Array.isArray(lk) && validLinkInviteRegex.test(contentMessage);
		}, [contentMessage, lk]);

		const isGoogleMapsLink = useMemo(() => {
			return Array.isArray(lk) && validLinkGoogleMapRegex.test(contentMessage);
		}, [contentMessage, lk]);
		const userProfile = useSelector(selectAllAccount);
		const timeoutRef = useRef<NodeJS.Timeout>(null);

		const checkAnonymous = useMemo(() => message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID, [message?.sender_id]);
		const checkSystem = useMemo(() => {
			return message?.sender_id === '0' && message?.username?.toLowerCase() === 'system';
		}, [message?.sender_id, message?.username]);

		const hasIncludeMention = useMemo(() => {
			const userIdMention = userProfile?.user?.id;
			const mentionOnMessage = message.mentions;
			let includesHere = false;
			if (typeof message.content?.t == 'string') {
				includesHere = message.content.t?.includes('@here');
			}
			const includesUser = !!userIdMention && mentionOnMessage?.some((mention) => mention.user_id === userIdMention);
			const checkReplied = !!userIdMention && message?.references && message?.references[0]?.message_sender_id === userProfile?.user?.id;
			return includesHere || includesUser || checkReplied;
		}, [userProfile?.user?.id, message?.mentions, message?.content?.t, message?.references]);

		const isSameUser = useMemo(() => {
			return message?.user?.id === previousMessage?.user?.id;
		}, [message?.user?.id, previousMessage?.user?.id]);

		const isTimeGreaterThan5Minutes = useMemo(() => {
			if (message?.create_time && previousMessage?.create_time) {
				return Date.parse(message.create_time) - Date.parse(previousMessage.create_time) < 2 * 60 * 1000;
			}
			return false;
		}, [message?.create_time, previousMessage?.create_time]);

		const isCombine = isSameUser && isTimeGreaterThan5Minutes;
		const swipeableRef = React.useRef(null);
		const backgroundColor = React.useRef(new Animated.Value(0)).current;

		const isDM = useMemo(() => {
			return [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(mode);
		}, [mode]);

		const messageAvatar = useMemo(() => {
			if (mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD) {
				return message?.clan_avatar || message?.avatar;
			}
			return message?.avatar;
		}, [message?.clan_avatar, message?.avatar, mode]);

		const checkOneLinkImage = useMemo(() => {
			return (
				message?.attachments?.length === 1 &&
				message?.attachments[0].filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) &&
				message?.attachments[0].url === message?.content?.t?.trim()
			);
		}, [message?.attachments, message?.content?.t]);

		const isOnlyContainEmoji = useMemo(() => {
			return isValidEmojiData(message.content);
		}, [message.content]);

		const isEdited = useMemo(() => {
			if (message?.update_time && !message.isError && !message.isErrorRetry) {
				const updateDate = new Date(message?.update_time);
				const createDate = new Date(message?.create_time);
				return updateDate > createDate;
			} else if (message.hide_editted === false && !!message?.content?.t) {
				return true;
			}
			return false;
		}, [message?.update_time, message.isError, message.isErrorRetry, message.hide_editted, message?.content?.t, message?.create_time]);

		useEffect(() => {
			const event = DeviceEventEmitter.addListener(ActionEmitEvent.MESSAGE_ID_TO_JUMP, (msgId: string) => {
				if (msgId === message?.id) {
					setShowHighlightReply(true);
					timeoutRef.current = setTimeout(() => {
						setShowHighlightReply(false);
						dispatch(messagesActions.setIdMessageToJump(''));
					}, 2000);
				} else {
					setShowHighlightReply(false);
					timeoutRef.current && clearTimeout(timeoutRef.current);
				}
			});

			return () => {
				event.remove();
				timeoutRef.current && clearTimeout(timeoutRef.current);
			};
		}, [dispatch, message?.id]);

		useEffect(() => {
			if (props?.messageId || message?.id) {
				if (message.isSending || message.isError || message.isErrorRetry) {
					return;
				}
				seenMessagePool.addSeenMessage({
					clanId: message.clan_id || '',
					channelId: message.channel_id || '',
					channelLabel: message.channel_label,
					messageId: message.id || '',
					messageCreatedAt: message.create_time_seconds ? +message.create_time_seconds : 0,
					messageSeenAt: +Date.now(),
					mode: message.mode as number
				});
			}
		}, [message, props.messageId]);

		const onLongPressImage = useCallback(() => {
			if (preventAction) return;
			DeviceEventEmitter.emit(ActionEmitEvent.ON_MESSAGE_ACTION_MESSAGE_ITEM, {
				type: EMessageBSToShow.MessageAction,
				senderDisplayName,
				message
			});
			dispatch(setSelectedMessage(message));
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [message, preventAction]);

		const onPressInfoUser = useCallback(() => {
			if (preventAction) return;

			if (!checkAnonymous && !checkSystem) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_MESSAGE_ACTION_MESSAGE_ITEM, {
					type: EMessageBSToShow.UserInformation,
					user: message?.user,
					message
				});
			}
		}, [checkAnonymous, checkSystem, message, preventAction]);

		const onMention = useCallback(async (mentionedUser: string) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_MENTION_USER_MESSAGE_ITEM, mentionedUser);
		}, []);

		const onChannelMention = useCallback(async (channel: ChannelsEntity) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, channel);
		}, []);

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
				extrapolate: 'clamp'
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
					replyTo: senderDisplayName
				};
				//Note: trigger to ChatBox.tsx
				DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
			}
		};

		const handleLongPressMessage = useCallback(() => {
			if (preventAction) return;
			DeviceEventEmitter.emit(ActionEmitEvent.ON_MESSAGE_ACTION_MESSAGE_ITEM, {
				type: EMessageBSToShow.MessageAction,
				senderDisplayName,
				message
			});
			dispatch(setSelectedMessage(message));
		}, [dispatch, message, preventAction, senderDisplayName]);

		// Message welcome
		if (message?.sender_id === '0' && !message?.content?.t && message?.username === 'system') {
			return <WelcomeMessage channelId={props.channelId} />;
		}

		const handlePressIn = () => {
			Animated.timing(backgroundColor, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true
			}).start();
		};

		const handlePressOut = () => {
			Animated.timing(backgroundColor, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true
			}).start();
		};

		const bgColor = backgroundColor.interpolate({
			inputRange: [0, 1],
			outputRange: ['transparent', themeValue.secondaryWeight]
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
						hasIncludeMention && styles.highlightMessageReply,
						showHighlightReply && styles.highlightMessageMention
					]}
				>
					<RenderMessageItemRef message={message} preventAction={preventAction} />
					<View style={[styles.wrapperMessageBox, !isCombine && styles.wrapperMessageBoxCombine]}>
						<AvatarMessage
							onPress={onPressInfoUser}
							id={message?.user?.id}
							avatar={messageAvatar}
							username={usernameMessage}
							isShow={!isCombine || !!message?.references?.length || showUserInformation}
						/>

						<Pressable
							style={[styles.rowMessageBox]}
							delayLongPress={300}
							onPressIn={handlePressIn}
							onPressOut={handlePressOut}
							onLongPress={handleLongPressMessage}
						>
							<InfoUserMessage
								onPress={onPressInfoUser}
								senderDisplayName={senderDisplayName}
								isShow={!isCombine || !!message?.references?.length || showUserInformation}
								createTime={message?.create_time}
								messageSenderId={message?.sender_id}
								mode={mode}
							/>
							<MessageAttachment message={message} onLongPressImage={onLongPressImage} />
							<Block opacity={message.isError || message?.isErrorRetry ? 0.6 : 1}>
								{isInviteLink || isGoogleMapsLink ? (
									<RenderMessageBlock
										isGoogleMapsLink={isGoogleMapsLink}
										isInviteLink={isInviteLink}
										contentMessage={contentMessage}
									/>
								) : (
									<RenderTextMarkdownContent
										content={{
											...(typeof message.content === 'object' ? message.content : {}),
											mentions: message.mentions,
											...(checkOneLinkImage ? { t: '' } : {})
										}}
										isEdited={isEdited}
										translate={t}
										onMention={onMention}
										onChannelMention={onChannelMention}
										isNumberOfLine={isNumberOfLine}
										isMessageReply={false}
										mode={mode}
										currentChannelId={channelId}
										isOnlyContainEmoji={isOnlyContainEmoji}
										onLongPress={handleLongPressMessage}
									/>
								)}
								{!!message?.content?.embed && <EmbedMessage {...message.content.embed} />}
							</Block>
							{message.isError && <Text style={{ color: 'red' }}>{t('unableSendMessage')}</Text>}
							{!preventAction ? (
								<MessageAction
									message={message}
									mode={mode}
									userProfile={userProfile}
									preventAction={preventAction}
									openEmojiPicker={() => {
										DeviceEventEmitter.emit(ActionEmitEvent.ON_MESSAGE_ACTION_MESSAGE_ITEM, {
											type: EMessageBSToShow.MessageAction,
											senderDisplayName,
											message,
											isOnlyEmoji: true
										});
									}}
								/>
							) : null}
						</Pressable>
					</View>
				</View>
				{/* </Swipeable> */}
				{/*<NewMessageRedLine*/}
				{/*	channelId={props?.channelId}*/}
				{/*	messageId={props?.messageId}*/}
				{/*	isEdited={message?.hide_editted}*/}
				{/*	isSending={message?.isSending}*/}
				{/*	isMe={message.sender_id === userProfile?.user?.id}*/}
				{/*/>*/}
			</Animated.View>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps?.message?.id + prevProps?.message?.update_time + prevProps?.previousMessage?.id ===
			nextProps?.message?.id + nextProps?.message?.update_time + nextProps?.previousMessage?.id
		);
	}
);

export default MessageItem;
