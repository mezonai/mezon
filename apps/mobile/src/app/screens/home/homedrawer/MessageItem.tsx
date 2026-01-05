/* eslint-disable no-console */
import { ActionEmitEvent, validLinkGoogleMapRegex, validLinkInviteRegex } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import {
	getStore,
	getStoreAsync,
	selectCurrentChannel,
	selectDmGroupCurrent,
	selectMemberClanByUserId,
	setSelectedMessage,
	useAppDispatch
} from '@mezon/store-mobile';
import { ETypeLinkMedia, ID_MENTION_HERE, isValidEmojiData, TypeMessage } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import type { ApiMessageAttachment, ApiMessageMention } from 'mezon-js/api.gen';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, DeviceEventEmitter, PanResponder, Platform, Pressable, Text, View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { MessageLineSystem } from './MessageLineSystem';
import RenderMessageBlock from './RenderMessageBlock';
import WelcomeMessage from './WelcomeMessage';
import { AvatarMessage } from './components/AvatarMessage';
import ButtonGotoTopic from './components/ButtonGotoTopic/ButtonGotoTopic';
import { EmbedComponentsPanel } from './components/EmbedComponents';
import { EmbedMessage } from './components/EmbedMessage';
import { InfoUserMessage } from './components/InfoUserMessage';
import { MessageAttachment } from './components/MessageAttachment';
import { MessageCallLog } from './components/MessageCallLog';
import { ContainerMessageActionModal } from './components/MessageItemBS/ContainerMessageActionModal';
import { MessageAction } from './components/MessageReaction';
import MessageSendTokenLog from './components/MessageSendTokenLog';
import MessageTopic from './components/MessageTopic/MessageTopic';
import { RenderMessageItemRef } from './components/RenderMessageItemRef';
import { RenderTextMarkdownContent } from './components/RenderTextMarkdown';
import { RenderRawText } from './components/RenderTextMarkdown/RenderRawText';
import UserProfile from './components/UserProfile';
import { EMessageActionType } from './enums';
import { style } from './styles';
import type { IMessageActionNeedToResolve } from './types';

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

const COMBINE_TIME_SECONDS = 2 * 60;

export type MessageItemProps = {
	message?: MessagesEntity;
	previousMessage?: MessagesEntity;
	messageId?: string;
	isMessNotifyMention?: boolean;
	mode: number;
	channelId?: string;
	topicChannelId?: string;
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
			topicChannelId,
			isSearchTab = false,
			isHighlight = false
		} = props;
		const dispatch = useAppDispatch();
		const { t } = useTranslation(['message', 'common']);
		const message: MessagesEntity = props?.message;
		const previousMessage: MessagesEntity = props?.previousMessage;
		const { t: contentMessage, lk = [] } = message?.content || {};
		const userId = props?.userId;
		const translateX = useRef(new Animated.Value(0)).current;

		const shouldShowForwardedText = useMemo(() => {
			if (!message?.content?.fwd) return false;

			if (!previousMessage) return true;

			if (!previousMessage?.content?.fwd) return true;

			const timeDiff = message.create_time_seconds - previousMessage.create_time_seconds;
			const isDifferentSender = message.sender_id !== previousMessage.sender_id;
			const isTimeGap = timeDiff > COMBINE_TIME_SECONDS;

			return isDifferentSender || isTimeGap;
		}, [message, previousMessage]);

		const isEphemeralMessage = useMemo(() => message?.code === TypeMessage.Ephemeral, [message?.code]);

		const isInviteLink = useMemo(() => Array.isArray(lk) && validLinkInviteRegex.test(contentMessage), [lk, contentMessage]);
		const isMessageCallLog = useMemo(() => !!message?.content?.callLog, [message?.content?.callLog]);
		const isGoogleMapsLink = useMemo(() => Array.isArray(lk) && validLinkGoogleMapRegex.test(contentMessage), [lk, contentMessage]);

		const checkAnonymous = useMemo(() => message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID, [message?.sender_id]);
		const checkSystem = useMemo(
			() => message?.sender_id === '0' && message?.username?.toLowerCase() === 'system',
			[message?.sender_id, message?.username]
		);

		const isMessageSystem = useMemo(
			() =>
				message?.code === TypeMessage.Welcome ||
				message?.code === TypeMessage.UpcomingEvent ||
				message?.code === TypeMessage.CreateThread ||
				message?.code === TypeMessage.CreatePin ||
				message?.code === TypeMessage.AuditLog,
			[message?.code]
		);

		const isDM = useMemo(() => [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(mode), [mode]);

		const senderDisplayName = useMemo(
			() =>
				isDM
					? message?.display_name || message?.username || ''
					: message?.clan_nick || message?.display_name || message?.user?.username || (checkAnonymous ? 'Anonymous' : message?.username),
			[isDM, message?.display_name, message?.username, message?.clan_nick, message?.user?.username, checkAnonymous]
		);

		const onReplyMessage = useCallback(() => {
			const payload: IMessageActionNeedToResolve = {
				type: EMessageActionType.Reply,
				targetMessage: message,
				isStillShowKeyboard: true,
				replyTo: senderDisplayName
			};
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
		}, [message, senderDisplayName]);

		const hasIncludeMention = useMemo(() => {
			if (!userId) return false;

			const store = getStore();
			const currentClanUser = selectMemberClanByUserId(store.getState(), userId as string);

			if (typeof message?.content?.t === 'string') {
				if (message?.mentions?.some((mention) => mention?.user_id === ID_MENTION_HERE)) return true;
			}

			if (typeof message?.mentions === 'string') {
				const parsedMentions = safeJSONParse(message?.mentions) as ApiMessageMention[] | undefined;
				const includesUser = parsedMentions?.some((mention) => mention?.user_id === userId);
				const includesRole = parsedMentions?.some((item) => currentClanUser?.role_id?.includes(item?.role_id as string));
				return includesUser || includesRole;
			}

			const includesUser = message?.mentions?.some((mention) => mention?.user_id === userId);
			const includesRole = message?.mentions?.some((item) => currentClanUser?.role_id?.includes(item?.role_id as string));
			const checkReplied = userId && message?.references && message?.references[0]?.message_sender_id === userId;

			return includesUser || includesRole || checkReplied;
		}, [userId, message?.content?.t, message?.mentions, message?.references]);

		const isTimeGreaterThan5Minutes = useMemo(
			() =>
				message?.create_time_seconds && previousMessage?.create_time_seconds
					? message.create_time_seconds - previousMessage.create_time_seconds < COMBINE_TIME_SECONDS
					: false,
			[message?.create_time_seconds, previousMessage?.create_time_seconds]
		);

		const isBuzzMessage = useMemo(() => message?.code === TypeMessage.MessageBuzz, [message?.code]);

		const isCombine = useMemo(
			() => message?.user?.id === previousMessage?.user?.id && isTimeGreaterThan5Minutes,
			[message?.user?.id, previousMessage?.user?.id, isTimeGreaterThan5Minutes]
		);

		const messageAvatar = useMemo(
			() =>
				mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
					? message?.clan_avatar || message?.avatar
					: message?.avatar,
			[mode, message?.clan_avatar, message?.avatar]
		);

		const firstAttachment = useMemo(
			() => (Array.isArray(message?.attachments) && message.attachments.length > 0 ? message.attachments[0] : null),
			[message?.attachments]
		);

		const checkOneLinkImage = useMemo(
			() =>
				message?.attachments?.length === 1 &&
				firstAttachment?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) &&
				firstAttachment?.url === message?.content?.t?.trim(),
			[message?.attachments?.length, firstAttachment?.filetype, firstAttachment?.url, message?.content?.t]
		);

		const isOnlyContainEmoji = useMemo(() => isValidEmojiData(message.content), [message.content]);

		const isEdited = useMemo(
			() =>
				message?.update_time_seconds && !message.isError && !message.isErrorRetry
					? message.update_time_seconds > message.create_time_seconds
					: message.hide_editted === false && !!message?.content?.t,
			[
				message?.update_time_seconds,
				message?.create_time_seconds,
				message.isError,
				message.isErrorRetry,
				message.hide_editted,
				message?.content?.t
			]
		);

		const usernameMessage = useMemo(
			() =>
				isDM ? message?.display_name || message?.user?.username : checkAnonymous ? 'Anonymous' : message?.user?.username || message?.username,
			[isDM, message?.display_name, message?.user?.username, checkAnonymous, message?.username]
		);

		const isSendTokenLog = useMemo(() => message?.code === TypeMessage.SendToken, [message?.code]);

		const onLongPressImage = useCallback(
			(image?: ApiMessageAttachment) => {
				if (preventAction) return;
				dispatch(setSelectedMessage(message));
				let targetMessage = message;
				if (image?.filetype?.includes?.('image') && !!image) {
					targetMessage = { ...message, attachments: [image] };
				}
				const data = {
					snapPoints: ['55%', '85%'],
					heightFitContent: true,
					maxHeightPercent: '90%',
					children: <ContainerMessageActionModal message={targetMessage} mode={mode} senderDisplayName={senderDisplayName} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			},
			[dispatch, message, mode, preventAction, senderDisplayName]
		);

		const onPressInfoUser = useCallback(async () => {
			if (preventAction) return;

			if (!checkAnonymous && !checkSystem) {
				const store = await getStoreAsync();
				let currentChannel;
				if (isDM) {
					currentChannel = selectDmGroupCurrent(channelId ?? '')?.(store.getState());
				} else {
					currentChannel = selectCurrentChannel(store.getState() as any);
				}
				const data = {
					snapPoints: ['50%', '80%'],
					hiddenHeaderIndicator: true,
					children: (
						<UserProfile
							userId={message?.user?.id}
							user={message?.user}
							messageAvatar={messageAvatar}
							checkAnonymous={checkAnonymous}
							showAction={!isDM}
							currentChannel={currentChannel}
							showRole={!isDM}
							directId={channelId}
						/>
					)
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			}
		}, [channelId, checkAnonymous, checkSystem, isDM, message?.user, messageAvatar, preventAction]);

		const handleLongPressMessage = useCallback(() => {
			if (preventAction || isMessageSystem) return;
			dispatch(setSelectedMessage(message));
			const data = {
				snapPoints: ['55%', '85%'],
				heightFitContent: true,
				maxHeightPercent: '90%',
				children: <ContainerMessageActionModal message={message} mode={mode} senderDisplayName={senderDisplayName} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
				isShow: false
			});
		}, [dispatch, isMessageSystem, message, mode, preventAction, senderDisplayName]);

		const isRawMessage = useMemo(() => {
			const { t, embed, hg, ej, mk } = message.content || {};
			const mentions = message?.mentions || [];
			return Boolean(t && !embed && !mentions?.length && !hg?.length && !ej?.length && !mk?.length);
		}, [message?.content, message?.mentions]);

		if (message?.sender_id === '0' && !message?.content?.t && message?.username?.toLowerCase() === 'system') {
			return <WelcomeMessage channelId={props.channelId} message={message} />;
		}

		const panResponder = PanResponder.create({
			onMoveShouldSetPanResponder: (_, gestureState) => {
				if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 && gestureState.dx < -10) {
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
			<Animated.View {...(preventAction || isMessageSystem ? {} : panResponder.panHandlers)} style={[{ transform: [{ translateX }] }]}>
				<Pressable
					android_ripple={{
						color: themeValue.secondaryLight
					}}
					disabled={isMessageCallLog || isGoogleMapsLink || isSearchTab}
					delayLongPress={300}
					onLongPress={handleLongPressMessage}
					style={({ pressed }) => [
						styles.messageWrapper,
						(isCombine || preventAction) && styles.messageWrapperCombine,
						hasIncludeMention && styles.highlightMessageReply,
						isHighlight && styles.highlightMessageMention,
						isEphemeralMessage && styles.ephemeralMessage,
						Platform.OS === 'ios' &&
							pressed && {
								backgroundColor: themeValue.secondaryWeight,
								opacity: 0.8
							}
					]}
				>
					{!isMessageSystem && !message?.content?.fwd && (
						<RenderMessageItemRef
							message={message}
							channelId={topicChannelId}
							preventAction={preventAction}
							isSearchTab={isSearchTab}
							onLongPress={handleLongPressMessage}
						/>
					)}
					<View style={[styles.wrapperMessageBox, !isCombine && styles.wrapperMessageBoxCombine]}>
						{!isMessageSystem && (
							<AvatarMessage
								onPress={onPressInfoUser}
								onLongPress={handleLongPressMessage}
								id={message?.user?.id}
								avatar={messageAvatar}
								username={usernameMessage}
								isShow={!isCombine || !!message?.references?.length || showUserInformation}
								isAnonymous={checkAnonymous}
							/>
						)}

						<View style={[styles.rowMessageBox, isMessageSystem && styles.rowMessageBoxFullWidth]}>
							{!isMessageSystem && (
								<InfoUserMessage
									onPress={onPressInfoUser}
									onLongPress={handleLongPressMessage}
									senderDisplayName={senderDisplayName}
									isShow={!isCombine || !!message?.references?.length || showUserInformation}
									createTime={message?.create_time_seconds}
									messageSenderId={message?.sender_id}
									mode={mode}
								/>
							)}

							<View style={[message?.content?.fwd ? styles.contentDisplay : undefined, message?.content?.isCard && styles.cardMsg]}>
								<View style={message?.content?.fwd ? styles.forwardBorder : undefined}>
									{!!message?.content?.fwd && shouldShowForwardedText && (
										<Text style={styles.forward}>
											<Entypo name="forward" size={15} color={themeValue.text} /> {t('common:forwarded')}
										</Text>
									)}
									<View style={message.isError || message?.isErrorRetry ? styles.opacityErrorRetry : styles.opacityNormal}>
										{isMessageSystem ? (
											<MessageLineSystem message={message} />
										) : isMessageCallLog ? (
											<MessageCallLog
												contentMsg={message?.content?.t}
												channelId={message?.channel_id}
												senderId={message?.sender_id}
												callLog={message?.content?.callLog}
												username={message?.display_name || message?.username || ''}
											/>
										) : isSendTokenLog ? (
											<MessageSendTokenLog messageContent={message?.content?.t} />
										) : isRawMessage ? (
											<RenderRawText
												text={message.content?.t}
												isEdited={isEdited}
												isNumberOfLine={isNumberOfLine}
												translate={t}
												isBuzzMessage={isBuzzMessage}
											/>
										) : message?.content?.t ? (
											<RenderTextMarkdownContent
												content={{
													...(typeof message.content === 'object' ? message.content : {}),
													mentions: message.mentions,
													...(checkOneLinkImage ? { t: '' } : {}),
													...(isGoogleMapsLink ? { t: '' } : {})
												}}
												isEdited={isEdited}
												translate={t}
												isNumberOfLine={isNumberOfLine}
												isMessageReply={false}
												isBuzzMessage={isBuzzMessage}
												mode={mode}
												currentChannelId={channelId}
												isOnlyContainEmoji={isOnlyContainEmoji}
											/>
										) : null}
										{!!message?.content?.embed?.length &&
											message?.content?.embed?.map((embed, index) => (
												<EmbedMessage
													message_id={message?.id}
													channel_id={message?.channel_id}
													embed={embed}
													key={`message_embed_${message?.id}_${index}`}
													onLongPress={handleLongPressMessage}
												/>
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
									{(isInviteLink || isGoogleMapsLink) && (
										<RenderMessageBlock
											isGoogleMapsLink={isGoogleMapsLink}
											isInviteLink={isInviteLink}
											contentMessage={contentMessage}
											avatarUrl={messageAvatar}
											isSelf={message?.user?.id === userId}
											senderName={senderDisplayName}
										/>
									)}
									{/* check  */}
									{message?.attachments?.length > 0 && (
										<MessageAttachment
											attachments={message?.attachments}
											messageCreatTime={message?.create_time_seconds}
											clanId={message?.clan_id}
											channelId={message?.channel_id}
											onLongPressImage={onLongPressImage}
											senderId={message?.sender_id}
										/>
									)}
									{isEphemeralMessage && (
										<View style={styles.ephemeralIndicator}>
											<MezonIconCDN icon={IconCDN.eyeSlashIcon} width={12} height={12} color={themeValue.textDisabled} />
											<Text style={styles.ephemeralText}>{t('ephemeral.onlyVisibleToRecipient')}</Text>
										</View>
									)}
								</View>

								{message?.content?.isCard && message?.code !== TypeMessage.Topic && <ButtonGotoTopic message={message} />}
								{message?.code === TypeMessage.Topic && message?.content?.isCard && <MessageTopic message={message} />}
							</View>
							{message.isError && <Text style={styles.errorTextColor}>{t('unableSendMessage')}</Text>}
							{message?.reactions?.length ? (
								<MessageAction
									userId={userId}
									message={message}
									mode={mode}
									preventAction={preventAction}
									openEmojiPicker={() => {
										const data = {
											snapPoints: ['75%'],
											children: (
												<ContainerMessageActionModal
													message={message}
													mode={mode}
													senderDisplayName={senderDisplayName}
													isOnlyEmojiPicker={true}
												/>
											)
										};
										DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
									}}
								/>
							) : null}
							{message?.code === TypeMessage.Topic && !message?.content?.isCard && <MessageTopic message={message} />}
						</View>
					</View>
				</Pressable>
			</Animated.View>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps?.message?.id +
				prevProps?.message?.update_time_seconds +
				prevProps?.previousMessage?.id +
				prevProps?.message?.code +
				prevProps?.isHighlight +
				prevProps?.message?.reactions +
				prevProps?.message?.content?.t +
				prevProps?.message?.attachments?.length +
				prevProps?.message?.references?.[0]?.content +
				prevProps?.preventAction ===
			nextProps?.message?.id +
				nextProps?.message?.update_time_seconds +
				nextProps?.previousMessage?.id +
				nextProps?.message?.code +
				nextProps?.isHighlight +
				nextProps?.message?.reactions +
				nextProps?.message?.content?.t +
				nextProps?.message?.attachments?.length +
				nextProps?.message?.references?.[0]?.content +
				nextProps?.preventAction
		);
	}
);

MessageItem.displayName = 'MessageItem';

export default MessageItem;
