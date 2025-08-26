import { ActionEmitEvent, convertTimestampToTimeAgo, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	directActions,
	DirectEntity,
	messagesActions,
	selectDirectById,
	selectIsUnreadDMById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { createImgproxyUrl, IExtendedMessage } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType, safeJSONParse } from 'mezon-js';
import React, { useCallback, useMemo } from 'react';
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

	const isUnReadChannel = useAppSelector((state) => selectIsUnreadDMById(state, directMessage?.id as string));
	const { t } = useTranslation('message');
	const isTabletLandscape = useTabletLandscape();
	const dispatch = useAppDispatch();
	const senderId = directMessage?.last_sent_message?.sender_id;
	const isYourAccount = useMemo(() => {
		const userId = load(STORAGE_MY_USER_ID);
		return userId?.toString() === senderId?.toString();
	}, [senderId]);

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
		const userIdList = directMessage.user_id;
		const usernameList = directMessage?.usernames || [];
		const displayNameList = directMessage?.display_names || [];

		return usernameList?.map((username, index) => ({
			userId: userIdList?.[index],
			username: username,
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

	const getLastMessageContent = (content: string | IExtendedMessage) => {
		if (!content || (typeof content === 'object' && Object.keys(content).length === 0) || content === '{}') return null;
		const text = typeof content === 'string' ? safeJSONParse(content)?.t : safeJSONParse(JSON.stringify(content) || '{}')?.t;

		if (!text) {
			return (
				<View style={styles.contentMessage}>
					<Text
						style={[
							styles.defaultText,
							styles.lastMessage,
							{ color: isUnReadChannel && !isYourAccount ? themeValue.white : themeValue.textDisabled }
						]}
						numberOfLines={1}
					>
						{renderLastMessageContent}
						{'attachment '}
						<MezonIconCDN icon={IconCDN.attachmentIcon} width={13} height={13} color={'#c7c7c7'} />
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.contentMessage}>
				{renderLastMessageContent && (
					<Text
						style={[
							styles.defaultText,
							styles.lastMessage,
							{ color: isUnReadChannel && !isYourAccount ? themeValue.white : themeValue.textDisabled }
						]}
					>
						{renderLastMessageContent}
					</Text>
				)}
				{!!content && (
					<DmListItemLastMessage
						content={typeof content === 'object' ? content : safeJSONParse(content || '{}')}
						styleText={{ color: isUnReadChannel && !isYourAccount ? themeValue.white : themeValue.textDisabled }}
					/>
				)}
			</View>
		);
	};

	const lastMessageTime = useMemo(() => {
		if (directMessage?.last_sent_message?.timestamp_seconds) {
			const timestamp = Number(directMessage?.last_sent_message?.timestamp_seconds);
			return convertTimestampToTimeAgo(timestamp);
		}
		return null;
	}, [directMessage]);

	const handleLongPress = useCallback((directMessage: DirectEntity) => {
		const data = {
			heightFitContent: true,
			children: <MessageMenu messageInfo={directMessage} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, []);

	return (
		<TouchableOpacity style={[styles.messageItem]} onPress={redirectToMessageDetail} onLongPress={() => handleLongPress(directMessage)}>
			{isTypeDMGroup ? (
				<View style={styles.groupAvatar}>
					<MezonIconCDN icon={IconCDN.groupIcon} />
				</View>
			) : (
				<View style={styles.avatarWrapper}>
					{directMessage?.channel_avatar?.[0] ? (
						<View style={styles.friendAvatar}>
							<ImageNative
								url={createImgproxyUrl(directMessage?.channel_avatar?.[0] ?? '', { width: 50, height: 50, resizeType: 'fit' })}
								style={{ width: '100%', height: '100%' }}
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
					<UserStatusDM
						isOnline={directMessage?.is_online?.some(Boolean)}
						metadata={directMessage?.metadata?.[0]}
						userId={directMessage?.user_id?.[0]}
					/>
				</View>
			)}

			<View style={{ flex: 1 }}>
				<View style={styles.messageContent}>
					<Text
						numberOfLines={1}
						style={[
							styles.defaultText,
							styles.channelLabel,
							{ color: isUnReadChannel && !isYourAccount ? themeValue.white : themeValue.textDisabled }
						]}
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
								{ color: isUnReadChannel && !isYourAccount ? themeValue.white : themeValue.textDisabled }
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
