/* eslint-disable no-console */
import { ActionEmitEvent, validLinkGoogleMapRegex, validLinkInviteRegex } from '@mezon/mobile-components';
import { Text, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity, getStoreAsync, MessagesEntity, selectCurrentChannel, selectDmGroupCurrent, useAppDispatch } from '@mezon/store-mobile';
import React, { useCallback } from 'react';
import { Animated, DeviceEventEmitter, PanResponder, Platform, Pressable, View } from 'react-native';
import { EmbedMessage, MessageAction, RenderTextMarkdownContent } from './components';
import { EMessageActionType, EMessageBSToShow } from './enums';
import { style } from './styles';
// eslint-disable-next-line @nx/enforce-module-boundaries
// eslint-disable-next-line @nx/enforce-module-boundaries
import { setSelectedMessage } from '@mezon/store-mobile';
import { ETypeLinkMedia, isValidEmojiData, TypeMessage } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Entypo from 'react-native-vector-icons/Entypo';
import { AvatarMessage } from './components/AvatarMessage';
import { EmbedComponentsPanel } from './components/EmbedComponents';
import { InfoUserMessage } from './components/InfoUserMessage';
import { MessageAttachment } from './components/MessageAttachment';
import { MessageCallLog } from './components/MessageCallLog';
import { ContainerMessageActionModal } from './components/MessageItemBS/ContainerMessageActionModal';
import MessageSendTokenLog from './components/MessageSendTokenLog';
import MessageTopic from './components/MessageTopic/MessageTopic';
import { RenderMessageItemRef } from './components/RenderMessageItemRef';
import UserProfile from './components/UserProfile';
import { MessageLineSystem } from './MessageLineSystem';
import RenderMessageBlock from './RenderMessageBlock';
import { IMessageActionNeedToResolve } from './types';
import WelcomeMessage from './WelcomeMessage';

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
	isSearchTab?: boolean;
	userId?: string;
	isHighlight?: boolean;
};

const MessageItem = React.memo(
	(props: MessageItemProps) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const {
			mode,
			isNumberOfLine,
			showUserInformation = false,
			preventAction = false,
			channelId = '',
			isSearchTab = false,
			isHighlight = false
		} = props;
		const dispatch = useAppDispatch();
		const { t } = useTranslation('message');
		const message: MessagesEntity = props?.message;
		const previousMessage: MessagesEntity = props?.previousMessage;
		const { t: contentMessage, lk = [] } = message?.content || {};
		const userId = props?.userId;

		const isInviteLink = Array.isArray(lk) && validLinkInviteRegex.test(contentMessage);
		const isMessageCallLog = !!message?.content?.callLog;
		const isGoogleMapsLink = Array.isArray(lk) && validLinkGoogleMapRegex.test(contentMessage);
		const checkAnonymous = message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;
		const checkSystem = message?.sender_id === '0' && message?.username?.toLowerCase() === 'system';
		const isMessageSystem =
			message?.code === TypeMessage.Welcome ||
			message?.code === TypeMessage.CreateThread ||
			message?.code === TypeMessage.CreatePin ||
			message?.code === TypeMessage.AuditLog;

		const translateX = useRef(new Animated.Value(0)).current;
		const onReplyMessage = useCallback(() => {
			const payload: IMessageActionNeedToResolve = {
				type: EMessageActionType.Reply,
				targetMessage: message,
				isStillShowKeyboard: true,
				replyTo: senderDisplayName
			};
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
		}, []);
		//check

		const hasIncludeMention = userId
			? message?.content?.t?.includes('@here') ||
				message?.mentions?.some?.((mention) => mention?.user_id === userId) ||
				message?.references?.[0]?.message_sender_id === userId
			: false;

		const isSameUser = message?.user?.id === previousMessage?.user?.id;

		const isTimeGreaterThan5Minutes =
			message?.create_time && previousMessage?.create_time
				? Date.parse(message.create_time) - Date.parse(previousMessage.create_time) < 2 * 60 * 1000
				: false;

		const isBuzzMessage = message?.code === TypeMessage.MessageBuzz;

		const isCombine = isSameUser && isTimeGreaterThan5Minutes;
		const backgroundColor = React.useRef(new Animated.Value(0)).current;

		const isDM = [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(mode);
		const messageAvatar =
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
				? message?.clan_avatar || message?.avatar
				: message?.avatar;

		const checkOneLinkImage =
			message?.attachments?.length === 1 &&
			message?.attachments[0].filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) &&
			message?.attachments[0].url === message?.content?.t?.trim();

		const isOnlyContainEmoji = isValidEmojiData(message.content);

		const isEdited =
			message?.update_time && !message.isError && !message.isErrorRetry
				? new Date(message?.update_time) > new Date(message?.create_time)
				: message.hide_editted === false && !!message?.content?.t;

		const senderDisplayName = isDM
			? message?.display_name || message?.username || ''
			: message?.clan_nick || message?.display_name || message?.user?.username || (checkAnonymous ? 'Anonymous' : message?.username);

		const usernameMessage = isDM ? message?.display_name || message?.user?.username : checkAnonymous ? 'Anonymous' : message?.user?.username;

		const isSendTokenLog = message?.code === TypeMessage.SendToken;

		const onLongPressImage = useCallback(() => {
			if (preventAction) return;
			dispatch(setSelectedMessage(message));
			const data = {
				snapPoints: ['60%', '90%'],
				children: (
					<ContainerMessageActionModal
						message={message}
						mode={mode}
						type={EMessageBSToShow.MessageAction}
						senderDisplayName={senderDisplayName}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		}, [dispatch, message, mode, preventAction, senderDisplayName]);

		const onPressInfoUser = useCallback(async () => {
			if (preventAction) return;

			if (!checkAnonymous && !checkSystem) {
				const store = await getStoreAsync();
				let currentChannel;
				if (isDM) {
					currentChannel = selectDmGroupCurrent(channelId as string);
				} else {
					currentChannel = selectCurrentChannel(store.getState() as any);
				}
				const data = {
					snapPoints: ['50%', '80%'],
					children: (
						<UserProfile
							userId={message?.user?.id}
							user={message?.user}
							message={message}
							checkAnonymous={checkAnonymous}
							showAction={!isDM}
							currentChannel={currentChannel}
							showRole={!isDM}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			}
		}, [channelId, checkAnonymous, checkSystem, isDM, message, preventAction]);

		const onMention = useCallback(async (mentionedUser: string) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_MENTION_USER_MESSAGE_ITEM, mentionedUser);
		}, []);

		const onChannelMention = useCallback(async (channel: ChannelsEntity) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, channel);
		}, []);

		const handleLongPressMessage = useCallback(() => {
			if (preventAction) return;
			dispatch(setSelectedMessage(message));
			const data = {
				snapPoints: ['60%', '90%'],
				children: (
					<ContainerMessageActionModal
						message={message}
						mode={mode}
						type={EMessageBSToShow.MessageAction}
						senderDisplayName={senderDisplayName}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		}, [dispatch, message, mode, preventAction, senderDisplayName]);

		// Message welcome
		if (message?.sender_id === '0' && !message?.content?.t && message?.username?.toLowerCase() === 'system') {
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

		const panResponder = PanResponder.create({
			onMoveShouldSetPanResponder: (_, gestureState) => {
				if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 && gestureState.dx < -8) {
					Animated.sequence([
						Animated.timing(translateX, {
							toValue: -100,
							duration: 200,
							useNativeDriver: true
						}),
						Animated.spring(translateX, {
							toValue: 0,
							useNativeDriver: true
						})
					]).start();
					onReplyMessage && onReplyMessage();
					return true;
				}

				return false;
			}
		});

		return (
			<Animated.View {...panResponder?.panHandlers} style={[{ backgroundColor: bgColor }, { transform: [{ translateX }] }]}>
				<Pressable
					android_ripple={{
						color: themeValue.secondaryLight
					}}
					disabled={isMessageCallLog || isGoogleMapsLink}
					delayLongPress={300}
					onPressIn={Platform.OS === 'ios' ? handlePressIn : undefined}
					onPressOut={Platform.OS === 'ios' ? handlePressOut : undefined}
					onLongPress={handleLongPressMessage}
					style={[
						styles.messageWrapper,
						(isCombine || preventAction) && { marginTop: 0 },
						hasIncludeMention && styles.highlightMessageReply,
						isHighlight && styles.highlightMessageMention
					]}
				>
					{!isMessageSystem && <RenderMessageItemRef message={message} preventAction={preventAction} isSearchTab={isSearchTab} />}
					<View style={[styles.wrapperMessageBox, !isCombine && styles.wrapperMessageBoxCombine]}>
						{!isMessageSystem && (
							<AvatarMessage
								onPress={onPressInfoUser}
								id={message?.user?.id}
								avatar={messageAvatar}
								username={usernameMessage}
								isShow={!isCombine || !!message?.references?.length || showUserInformation}
							/>
						)}

						<View style={[styles.rowMessageBox, isMessageSystem && { width: '100%' }]}>
							{!isMessageSystem && (
								<InfoUserMessage
									onPress={onPressInfoUser}
									senderDisplayName={senderDisplayName}
									isShow={!isCombine || !!message?.references?.length || showUserInformation}
									createTime={message?.create_time}
									messageSenderId={message?.sender_id}
									mode={mode}
								/>
							)}

							<View style={message?.content?.fwd ? { display: 'flex' } : undefined}>
								<View style={message?.content?.fwd ? { borderLeftWidth: 2, borderColor: 'gray', paddingLeft: 10 } : undefined}>
									{!!message?.content?.fwd && (
										<Text style={styles.forward}>
											<Entypo name="forward" size={15} /> Forwarded
										</Text>
									)}
									<View style={{ opacity: message.isError || message?.isErrorRetry ? 0.6 : 1 }}>
										{isMessageSystem ? (
											<MessageLineSystem message={message} />
										) : isInviteLink || isGoogleMapsLink ? (
											<RenderMessageBlock
												isGoogleMapsLink={isGoogleMapsLink}
												isInviteLink={isInviteLink}
												contentMessage={contentMessage}
											/>
										) : isMessageCallLog ? (
											<MessageCallLog
												contentMsg={message?.content?.t}
												channelId={message?.channel_id}
												senderId={message?.sender_id}
												callLog={message?.content?.callLog}
											/>
										) : isSendTokenLog ? (
											<MessageSendTokenLog messageContent={message?.content?.t} />
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
												isBuzzMessage={isBuzzMessage}
												mode={mode}
												currentChannelId={channelId}
												isOnlyContainEmoji={isOnlyContainEmoji}
												onLongPress={handleLongPressMessage}
											/>
										)}
										{!!message?.content?.embed?.length &&
											message?.content?.embed?.map((embed, index) => (
												<EmbedMessage message_id={message?.id} embed={embed} key={`message_embed_${message?.id}_${index}`} />
											))}
										{!!message?.content?.components?.length &&
											message?.content.components?.map((component, index) => (
												<EmbedComponentsPanel
													key={`message_embed_component_${message?.id}_${index}`}
													actionRow={component}
													messageId={message?.id}
													senderId={message?.sender_id}
													channelId={message?.channel_id || ''}
												/>
											))}
									</View>
									{/* check  */}
									{message?.attachments?.length > 0 && (
										<MessageAttachment
											attachments={message?.attachments}
											clanId={message?.clan_id}
											channelId={message?.channel_id}
											onLongPressImage={onLongPressImage}
										/>
									)}
								</View>
							</View>
							{message.isError && <Text style={{ color: 'red' }}>{t('unableSendMessage')}</Text>}
							{!preventAction && !!message?.reactions?.length ? (
								<MessageAction
									userId={userId}
									message={message}
									mode={mode}
									preventAction={preventAction}
									openEmojiPicker={() => {
										const data = {
											snapPoints: ['70%', '90%'],
											children: (
												<ContainerMessageActionModal
													message={message}
													mode={mode}
													type={EMessageBSToShow.MessageAction}
													senderDisplayName={senderDisplayName}
													isOnlyEmojiPicker={true}
												/>
											)
										};
										DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
									}}
								/>
							) : null}
							{message?.code === TypeMessage.Topic && <MessageTopic message={message} avatar={messageAvatar} />}
						</View>
					</View>
				</Pressable>
			</Animated.View>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps?.message?.id +
				prevProps?.message?.update_time +
				prevProps?.previousMessage?.id +
				prevProps?.message?.code +
				prevProps?.isHighlight +
				prevProps?.message?.reactions ===
			nextProps?.message?.id +
				nextProps?.message?.update_time +
				nextProps?.previousMessage?.id +
				nextProps?.message?.code +
				nextProps?.isHighlight +
				nextProps?.message?.reactions
		);
	}
);

MessageItem.displayName = 'MessageItem';

export default MessageItem;
