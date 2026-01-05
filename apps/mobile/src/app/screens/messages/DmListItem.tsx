import { convertTimestampToTimeAgo, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectDirectById, selectIsUnreadDMById, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import BuzzBadge from '../../components/BuzzBadge/BuzzBadge';
import ImageNative from '../../components/ImageNative';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { MessagePreviewLastest } from './MessagePreviewLastest';
import { style } from './styles';
import { UserStatusDM } from './UserStatusDM';

export const DmListItem = React.memo((props: { id: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { id } = props;
	const directMessage = useAppSelector((state) => selectDirectById(state, id));
	const isUnreadDMById = useAppSelector((state) => selectIsUnreadDMById(state, directMessage?.id as string));

	const isUnReadChannel = useMemo(() => {
		const myUserId = load(STORAGE_MY_USER_ID);

		return isUnreadDMById && directMessage?.last_sent_message?.sender_id !== myUserId;
	}, [isUnreadDMById, directMessage?.last_sent_message?.sender_id]);
	const { t } = useTranslation(['message', 'common']);

	const isTypeDMGroup = useMemo(() => {
		return Number(directMessage?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	}, [directMessage?.type]);

	const lastMessageTime = useMemo(() => {
		if (directMessage?.last_sent_message?.timestamp_seconds) {
			const timestamp = Number(directMessage?.last_sent_message?.timestamp_seconds);
			return convertTimestampToTimeAgo(timestamp, t);
		}
		return null;
	}, [directMessage?.last_sent_message, t]);

	return (
		<View style={[styles.messageItem]}>
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
				<MessagePreviewLastest
					isUnReadChannel={isUnReadChannel}
					type={directMessage?.type}
					senderName={directMessage?.display_names?.[0] || directMessage.usernames?.[0]}
					userId={directMessage?.user_ids?.[0] || ''}
					senderId={directMessage?.last_sent_message?.sender_id}
					lastSentMessageStr={JSON.stringify(directMessage?.last_sent_message)}
				/>
			</View>
		</View>
	);
});
