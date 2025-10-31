import { ActionEmitEvent, convertTimestampToTimeAgo, load, STORAGE_MY_USER_ID, validLinkGoogleMapRegex } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import {
	directActions,
	messagesActions,
	selectDirectById,
	selectDmGroupCurrentId,
	selectIsUnreadDMById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { isContainsUrl } from '@mezon/transport';
import type { IExtendedMessage } from '@mezon/utils';
import { createImgproxyUrl, EMimeTypes } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import BuzzBadge from '../../components/BuzzBadge/BuzzBadge';
import ImageNative from '../../components/ImageNative';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import MessageMenu from '../home/homedrawer/components/MessageMenu';
import { DmListItemLastMessage } from './DMListItemLastMessage';
import { style } from './styles';
import { UserStatusDM } from './UserStatusDM';

export const DmListItem = React.memo((props: { id: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { id } = props;
	const navigation = useNavigation<any>();
	const directMessage = useAppSelector((state) => selectDirectById(state, id));
	const currentDirectId = useAppSelector(selectDmGroupCurrentId);
	const isUnReadChannel = useAppSelector((state) => selectIsUnreadDMById(state, directMessage?.id as string));
	const { t } = useTranslation(['message', 'common']);
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const senderId = directMessage?.last_sent_message?.sender_id;

	const [attachmentContent, setAttachmentContent] = useState<string>('');

	const isYourAccount = useMemo(() => {
		const userId = load(STORAGE_MY_USER_ID);
		return userId?.toString() === senderId?.toString();
	}, [senderId]);

	const isShowActiveDMGroup = useMemo(() => {
		return isTabletLandscape && directMessage?.id === currentDirectId;
	}, [currentDirectId, directMessage?.id, isTabletLandscape]);

	const redirectToMessageDetail = async () => {
		dispatch(messagesActions.setIdMessageToJump(null));
		if (!isTabletLandscape) {
			navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, {
				directMessageId: directMessage?.id
			});
		}
		dispatch(directActions.setDmGroupCurrentId(directMessage?.id));
	};

	const isTypeDMGroup = useMemo(() => {
		return Number(directMessage?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [directMessage?.type]);

	const otherMemberList = useMemo(() => {
		const userIdList = directMessage.user_ids;
		const usernameList = directMessage?.usernames || [];
		const displayNameList = directMessage?.display_names || [];

		return usernameList?.map((username, index) => ({
			userId: userIdList?.[index],
			username,
			displayName: displayNameList?.[index]
		}));
	}, [directMessage]);

	const renderLastMessageContent = useMemo(() => {
		if (!senderId) {
			return '';
		}

		if (isYourAccount) {
			return `${t('directMessage.you')}: `;
		}

		const lastMessageSender = otherMemberList?.find?.((it) => it?.userId === senderId);
		if (lastMessageSender?.username) {
			return `${lastMessageSender?.displayName || lastMessageSender?.username}: `;
		}

		return '';
	}, [isYourAccount, otherMemberList, senderId, t]);

	const getLastMessageAttachmentContent = useCallback(
		async (attachment: ApiMessageAttachment, isLinkMessage: boolean, text: string, embed: any) => {
			if (embed) {
				return `[${t('attachments.embed')}] ${embed?.title || embed?.description || ''}`;
			}
			const isGoogleMapsLink = validLinkGoogleMapRegex.test(text);
			if (isGoogleMapsLink) {
				return `[${t('attachments.location')}]`;
			}
			if (isLinkMessage) {
				return `[${t('attachments.link')}] ${text}`;
			}

			const fileName = attachment?.filename;
			const fileType = attachment?.filetype;
			const url = attachment?.url;

			const type = fileType?.split('/')?.[0];

			switch (type) {
				case 'image': {
					if (url?.includes(EMimeTypes.tenor)) {
						return `[${t('attachments.gif')}]`;
					}
					if (url?.includes(EMimeTypes.cdnmezon) || url?.includes(EMimeTypes.cdnmezon2) || url?.includes(EMimeTypes.cdnmezon3)) {
						return `[${t('attachments.sticker')}]`;
					}
					return `[${t('attachments.image')}]`;
				}
				case 'video': {
					return `[${t('attachments.video')}]`;
				}
				case 'audio': {
					return `[${t('attachments.audio')}]`;
				}
				case 'application':
				case 'text':
					return `[${t('attachments.file')}] ${fileName || ''}`;
				default:
					return `[${t('attachments.file')}]`;
			}
		},
		[t]
	);

	useEffect(() => {
		const resolveAttachmentContent = async () => {
			const content = directMessage?.last_sent_message?.content;

			const text = typeof content === 'string' ? safeJSONParse(content)?.t : safeJSONParse(JSON.stringify(content) || '{}')?.t;
			const attachment = directMessage?.last_sent_message?.attachment;
			const attachementToResolve = typeof attachment === 'object' ? attachment : safeJSONParse(attachment);
			const embed = (typeof content === 'object' ? content : safeJSONParse(content))?.embed?.[0];

			const isLinkMessage = isContainsUrl(text);

			if (attachementToResolve?.[0] || isLinkMessage || embed) {
				const resolved = await getLastMessageAttachmentContent(attachementToResolve[0], isLinkMessage, text, embed);
				setAttachmentContent(resolved);
			} else {
				setAttachmentContent('');
			}
		};

		resolveAttachmentContent();
	}, [directMessage?.last_sent_message?.content, directMessage?.last_sent_message?.attachment, getLastMessageAttachmentContent]);

	const getLastMessageContent = (content: string | IExtendedMessage) => {
		if (!content || (typeof content === 'object' && Object.keys(content).length === 0) || content === '{}') {
			if (isTypeDMGroup) {
				return (
					<View style={styles.contentMessage}>
						<Text
							style={[
								styles.defaultText,
								styles.lastMessage,
								{ color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }
							]}
						>
							{t('directMessage.groupCreated')}
						</Text>
					</View>
				);
			} else {
				return null;
			}
		}
		const text = typeof content === 'string' ? safeJSONParse(content)?.t : safeJSONParse(JSON.stringify(content) || '{}')?.t;
		const isLinkMessage = isContainsUrl(text);

		if (!text || isLinkMessage) {
			return (
				<View style={styles.contentMessage}>
					<Text
						style={[
							styles.defaultText,
							styles.lastMessage,
							{ color: isUnReadChannel && !isYourAccount ? themeValue.textStrong : themeValue.textDisabled }
						]}
						numberOfLines={1}
					>
						{renderLastMessageContent}
						{attachmentContent}
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.contentMessage}>
				{renderLastMessageContent && (
					<Text
						style={[styles.defaultText, styles.lastMessage, { color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }]}
					>
						{renderLastMessageContent}
					</Text>
				)}
				{!!content && (
					<DmListItemLastMessage
						content={typeof content === 'object' ? content : safeJSONParse(content || '{}')}
						styleText={{ color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }}
					/>
				)}
			</View>
		);
	};

	const lastMessageTime = useMemo(() => {
		if (directMessage?.last_sent_message?.timestamp_seconds) {
			const timestamp = Number(directMessage?.last_sent_message?.timestamp_seconds);
			return convertTimestampToTimeAgo(timestamp, t);
		}
		return null;
	}, [directMessage, t]);

	const handleLongPress = useCallback((directMessage: DirectEntity) => {
		const data = {
			heightFitContent: true,
			children: <MessageMenu messageInfo={directMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	return (
		<TouchableOpacity
			style={[styles.messageItem, isShowActiveDMGroup && styles.activeDMGroupBackground]}
			onPress={redirectToMessageDetail}
			onLongPress={() => handleLongPress(directMessage)}
		>
			{isTypeDMGroup ? (
				directMessage?.channel_avatar && !directMessage?.channel_avatar?.includes('avatar-group.png') ? (
					<View style={styles.groupAvatarWrapper}>
						<ImageNative url={createImgproxyUrl(directMessage?.channel_avatar ?? '')} style={styles.imageFullSize} resizeMode={'cover'} />
					</View>
				) : (
					<View style={styles.groupAvatar}>
						<MezonIconCDN icon={IconCDN.groupIcon} />
					</View>
				)
			) : (
				<View style={styles.avatarWrapper}>
					{directMessage?.avatars?.[0] ? (
						<View style={styles.friendAvatar}>
							<ImageNative
								url={createImgproxyUrl(directMessage?.avatars?.[0] ?? '', { width: 50, height: 50, resizeType: 'fit' })}
								style={styles.imageFullSize}
								resizeMode={'cover'}
							/>
						</View>
					) : (
						<View style={styles.wrapperTextAvatar}>
							<Text style={styles.textAvatar}>
								{(
									directMessage?.channel_label ||
									(typeof directMessage?.usernames === 'string' ? directMessage?.usernames : directMessage?.usernames?.[0] || '')
								)
									?.charAt?.(0)
									?.toUpperCase()}
							</Text>
						</View>
					)}
					<UserStatusDM isOnline={directMessage?.onlines?.some(Boolean)} userId={directMessage?.user_ids?.[0]} />
				</View>
			)}

			<View style={styles.flexOne}>
				<View style={styles.messageContent}>
					<Text
						numberOfLines={1}
						style={[styles.defaultText, styles.channelLabel, { color: isUnReadChannel ? themeValue.white : themeValue.textDisabled }]}
					>
						{(directMessage?.channel_label || directMessage?.usernames) ??
							(directMessage?.creator_name ? `${directMessage.creator_name}'s Group` : '')}
					</Text>
					<BuzzBadge
						channelId={directMessage?.channel_id}
						clanId={'0'}
						mode={
							directMessage?.type === ChannelType.CHANNEL_TYPE_DM
								? ChannelStreamMode.STREAM_MODE_DM
								: ChannelStreamMode.STREAM_MODE_GROUP
						}
					/>
					{lastMessageTime ? (
						<Text
							style={[
								styles.defaultText,
								styles.dateTime,
								{ color: isUnReadChannel ? themeValue.textStrong : themeValue.textDisabled }
							]}
						>
							{lastMessageTime}
						</Text>
					) : null}
				</View>
				{getLastMessageContent(directMessage?.last_sent_message?.content)}
			</View>
		</TouchableOpacity>
	);
});
