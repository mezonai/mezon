/* eslint-disable no-console */
import { ActionEmitEvent, validLinkGoogleMapRegex, validLinkInviteRegex } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	ChannelsEntity,
	MessagesEntity,
	getStore,
	getStoreAsync,
	selectCurrentChannel,
	selectDmGroupCurrent,
	selectMemberClanByUserId,
	setSelectedMessage,
	useAppDispatch
} from '@mezon/store-mobile';
import { ETypeLinkMedia, ID_MENTION_HERE, TypeMessage, isValidEmojiData } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment, ApiMessageMention } from 'mezon-js/api.gen';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Platform, Pressable, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
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
import UserProfile from './components/UserProfile';
import { EMessageActionType } from './enums';
import { style } from './styles';
import { IMessageActionNeedToResolve } from './types';

const NX_CHAT_APP_ANNONYMOUS_USER_ID = process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID || 'anonymous';

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
		const { t } = useTranslation('message');
		const message: MessagesEntity = props?.message;
		const previousMessage: MessagesEntity = props?.previousMessage;
		const { t: contentMessage, lk = [] } = message?.content || {};
		const userId = props?.userId;
		const swipeRef = useRef(null);

		const isEphemeralMessage = useMemo(() => message?.code === TypeMessage.Ephemeral, [message?.code]);
		const isInviteLink = Array.isArray(lk) && validLinkInviteRegex.test(contentMessage);
		const isMessageCallLog = !!message?.content?.callLog;
		const isGoogleMapsLink = Array.isArray(lk) && validLinkGoogleMapRegex.test(contentMessage);
		const checkAnonymous = message?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;
		const checkSystem = message?.sender_id === '0' && message?.username?.toLowerCase() === 'system';
		const isMessageSystem =
			message?.code === TypeMessage.Welcome ||
			message?.code === TypeMessage.UpcomingEvent ||
			message?.code === TypeMessage.CreateThread ||
			message?.code === TypeMessage.CreatePin ||
			message?.code === TypeMessage.AuditLog;
		const isDM = [ChannelStreamMode.STREAM_MODE_DM, ChannelStreamMode.STREAM_MODE_GROUP].includes(mode);
		const senderDisplayName = isDM
			? message?.display_name || message?.username || ''
			: message?.clan_nick || message?.display_name || message?.user?.username || (checkAnonymous ? 'Anonymous' : message?.username);

		const onReplyMessage = useCallback(() => {
			const payload: IMessageActionNeedToResolve = {
				type: EMessageActionType.Reply,
				targetMessage: message,
				isStillShowKeyboard: true,
				replyTo: senderDisplayName
			};
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, payload);
		}, [message, senderDisplayName]);

		const hasIncludeMention = (() => {
			const store = getStore();
			const currentClanUser = selectMemberClanByUserId(store.getState(), userId as string);

			if (!userId) return false;
			if (typeof message?.content?.t == 'string') {
				if (message?.mentions?.some((mention) => mention?.user_id === ID_MENTION_HERE)) return true;
			}
			if (typeof message?.mentions === 'string') {
				const parsedMentions = safeJSONParse(message?.mentions) as ApiMessageMention[] | undefined;
				const userIdMention = userId;
				const includesUser = parsedMentions?.some((mention) => mention?.user_id === userIdMention);
				const includesRole = parsedMentions?.some((item) => currentClanUser?.role_id?.includes(item?.role_id as string));
				return includesUser || includesRole;
			}
			const userIdMention = userId;
			const includesUser = message?.mentions?.some((mention) => mention?.user_id === userIdMention);
			const includesRole = message?.mentions?.some((item) => currentClanUser?.role_id?.includes(item?.role_id as string));
			const checkReplied = userId && message?.references && message?.references[0]?.message_sender_id === userId;

			return includesUser || includesRole || checkReplied;
		})();

		const isTimeGreaterThan5Minutes =
			message?.create_time && previousMessage?.create_time
				? Date.parse(message.create_time) - Date.parse(previousMessage.create_time) < 2 * 60 * 1000
				: false;

		const isBuzzMessage = message?.code === TypeMessage.MessageBuzz;

		const isCombine = message?.user?.id === previousMessage?.user?.id && isTimeGreaterThan5Minutes;

		const messageAvatar =
			mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
				? message?.clan_avatar || message?.avatar
				: message?.avatar;

		const firstAttachment = Array.isArray(message?.attachments) && message.attachments.length > 0 ? message.attachments[0] : null;
		const checkOneLinkImage =
			message?.attachments?.length === 1 &&
			firstAttachment?.filetype?.startsWith(ETypeLinkMedia.IMAGE_PREFIX) &&
			firstAttachment?.url === message?.content?.t?.trim();

		const isOnlyContainEmoji = isValidEmojiData(message.content);

		const isEdited =
			message?.update_time && !message.isError && !message.isErrorRetry
				? new Date(message?.update_time) > new Date(message?.create_time)
				: message.hide_editted === false && !!message?.content?.t;

		const usernameMessage = isDM
			? message?.display_name || message?.user?.username
			: checkAnonymous
				? 'Anonymous'
				: message?.user?.username || message?.username;

		const isSendTokenLog = message?.code === TypeMessage.SendToken;

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
					currentChannel = selectDmGroupCurrent(channelId as string);
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
							message={message}
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
		}, [channelId, checkAnonymous, checkSystem, isDM, message, preventAction]);

		const onMention = useCallback(async (mentionedUser: string) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_MENTION_USER_MESSAGE_ITEM, mentionedUser);
		}, []);

		const onChannelMention = useCallback(async (channel: ChannelsEntity) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, channel);
		}, []);

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
		}, [dispatch, message, mode, preventAction, senderDisplayName]);

		// Message welcome
		if (message?.sender_id === '0' && !message?.content?.t && message?.username?.toLowerCase() === 'system') {
			return <WelcomeMessage channelId={props.channelId} />;
		}

		const renderRightActions = () => {
			return (
				<View style={styles.replyMessage}>
					<MezonIconCDN icon={IconCDN.replyMsg} width={size.s_20} height={size.s_20} />
				</View>
			);
		};

		const handleSwipeOpen = async () => {
			onReplyMessage();
			requestAnimationFrame(() => {
				swipeRef?.current?.close();
			});
		};

		return (
			<Swipeable
				ref={swipeRef}
				enabled={!preventAction && !isMessageSystem}
				dragOffsetFromLeftEdge={500}
				dragOffsetFromRightEdge={10}
				renderRightActions={renderRightActions}
				onSwipeableWillOpen={handleSwipeOpen}
			>
				<Pressable
					android_ripple={{
						color: themeValue.secondaryLight
					}}
					disabled={isMessageCallLog || isGoogleMapsLink || isSearchTab}
					delayLongPress={300}
					onLongPress={handleLongPressMessage}
					style={({ pressed }) => [
						styles.messageWrapper,
						(isCombine || preventAction) && { marginTop: 0 },
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

						<View style={[styles.rowMessageBox, isMessageSystem && { width: '100%' }]}>
							{!isMessageSystem && (
								<InfoUserMessage
									onPress={onPressInfoUser}
									onLongPress={handleLongPressMessage}
									senderDisplayName={senderDisplayName}
									isShow={!isCombine || !!message?.references?.length || showUserInformation}
									createTime={message?.create_time}
									messageSenderId={message?.sender_id}
									mode={mode}
								/>
							)}

							<View style={[message?.content?.fwd ? { display: 'flex' } : undefined, message?.content?.isCard && styles.cardMsg]}>
								<View style={message?.content?.fwd ? { borderLeftWidth: 2, borderColor: 'gray', paddingLeft: 10 } : undefined}>
									{!!message?.content?.fwd && (
										<Text style={styles.forward}>
											<Entypo name="forward" size={15} color={themeValue.text} /> Forwarded
										</Text>
									)}
									<View style={{ opacity: message.isError || message?.isErrorRetry ? 0.6 : 1 }}>
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
											clanId={message?.clan_id}
											channelId={message?.channel_id}
											onLongPressImage={onLongPressImage}
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
							{message.isError && <Text style={{ color: baseColor.redStrong }}>{t('unableSendMessage')}</Text>}
							{!preventAction && !!message?.reactions?.length ? (
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
			</Swipeable>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps?.message?.id +
				prevProps?.message?.update_time +
				prevProps?.previousMessage?.id +
				prevProps?.message?.code +
				prevProps?.isHighlight +
				prevProps?.message?.reactions +
				prevProps?.message?.references?.[0]?.content ===
			nextProps?.message?.id +
				nextProps?.message?.update_time +
				nextProps?.previousMessage?.id +
				nextProps?.message?.code +
				nextProps?.isHighlight +
				nextProps?.message?.reactions +
				nextProps?.message?.references?.[0]?.content
		);
	}
);

MessageItem.displayName = 'MessageItem';

export default MessageItem;
