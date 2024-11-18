import { AVATAR_DEFAULT_URL } from '@mezon/mobile-components';
import { useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectClanById, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl, getNameForPrioritize } from '@mezon/utils';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useMessageParser } from '../../../hooks/useMessageParser';
import { useMessageSender } from '../../../hooks/useMessageSender';
import MessageNotification from '../MessageNotification';
import { ENotifyBsToShow, NotifyProps } from '../types';
import { style } from './NotificationMentionItem.styles';

function parseObject(obj: any) {
	let attachments;
	let mentions;
	let reactions;
	let references;
	let content;
	try {
		attachments = obj?.attachments && JSON.parse(obj?.attachments || '{}');
	} catch (err) {
		attachments = {};
	}
	try {
		mentions = obj?.mentions && JSON.parse(obj?.mentions || '{}');
	} catch (err) {
		mentions = {};
	}
	try {
		references = obj?.references && JSON.parse(obj?.references || '{}');
	} catch (err) {
		references = {};
	}
	try {
		reactions = obj?.reactions && JSON.parse(obj?.reactions || '{}');
	} catch (err) {
		reactions = {};
	}

	try {
		content = obj?.content && JSON.parse(obj?.content || '{}');
	} catch (err) {
		content = {};
	}
	const parsedObj = {
		...obj,
		attachments,
		mentions,
		reactions,
		references,
		content
	};
	return parsedObj;
}

const NotificationMentionItem = React.memo(({ notify, onLongPressNotify, onPressNotify }: NotifyProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, notify?.sender_id || ''));
	const { avatarImg } = useMessageSender(user as any);
	const channelInfo = useAppSelector((state) => selectChannelById(state, notify?.content?.channel_id || ''));
	const data = parseObject(notify?.content);
	const clan = useAppSelector(selectClanById(notify?.content?.clan_id as string));

	const { messageTimeDifference } = useMessageParser(data);
	const colorsUsername = useColorsRoleById(notify?.sender_id)?.highestPermissionRoleColor;
	const subjectText = useMemo(() => {
		return clan?.clan_name && channelInfo?.channel_label
			? `${clan?.clan_name ? `(${clan.clan_name})` : ''} - ${channelInfo?.channel_label || ''}`
			: '';
	}, [clan?.clan_name, channelInfo?.channel_label]);

	const userName = useMemo(() => {
		return getNameForPrioritize(notify?.content?.clan_nick, notify?.content?.display_name, notify?.content?.username);
	}, [notify]);

	return (
		<TouchableOpacity
			onPress={() => {
				onPressNotify(notify);
			}}
			onLongPress={() => {
				onLongPressNotify(ENotifyBsToShow.removeNotification, notify);
			}}
		>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<View style={styles.boxImage}>
						<FastImage
							source={{
								uri: avatarImg
									? createImgproxyUrl(avatarImg ?? '', { width: 100, height: 100, resizeType: 'fit' })
									: AVATAR_DEFAULT_URL
							}}
							style={styles.image}
						/>
					</View>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={{ ...styles.username, color: colorsUsername }}>{userName} </Text>
							{subjectText}
						</Text>
						<View style={styles.contentMessage}>
							<MessageNotification message={data} />
						</View>
					</View>
					<Text style={styles.notifyDuration}>{messageTimeDifference}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
});

export default NotificationMentionItem;
