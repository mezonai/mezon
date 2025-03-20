import { useGetPriorityNameFromUserClan } from '@mezon/core';
import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useColorsRoleById, useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectClanById, useAppSelector } from '@mezon/store-mobile';
import { getNameForPrioritize } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MessageNotification from '../MessageNotification';
import { ENotifyBsToShow, NotifyProps } from '../types';
import { style } from './NotificationMentionItem.styles';

export function parseObject(obj: any) {
	let attachments;
	let mentions;
	let reactions;
	let references;
	let content;
	try {
		attachments = obj?.attachments && safeJSONParse(obj?.attachments || '{}');
	} catch (err) {
		attachments = {};
	}
	try {
		mentions = obj?.mentions && safeJSONParse(obj?.mentions || '{}');
	} catch (err) {
		mentions = {};
	}
	try {
		references = obj?.references && safeJSONParse(obj?.references || '{}');
	} catch (err) {
		references = {};
	}
	try {
		reactions = obj?.reactions && safeJSONParse(obj?.reactions || '{}');
	} catch (err) {
		reactions = {};
	}

	try {
		content = obj?.content && safeJSONParse(obj?.content || '{}');
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
	const channelInfo = useAppSelector((state) => selectChannelById(state, notify?.content?.channel_id || ''));
	const data = parseObject(notify?.content);
	const clan = useAppSelector(selectClanById(notify?.content?.clan_id as string));
	const { priorityAvatar } = useGetPriorityNameFromUserClan(notify?.sender_id);
	const messageTimeDifference = convertTimestampToTimeAgo(data?.create_time?.seconds);
	const colorsUsername = useColorsRoleById(notify?.sender_id)?.highestPermissionRoleColor;
	const subjectText = useMemo(() => {
		return clan?.clan_name && channelInfo?.channel_label
			? `${clan?.clan_name ? `(${clan.clan_name})` : ''} - ${channelInfo?.channel_label || ''}`
			: '';
	}, [clan?.clan_name, channelInfo?.channel_label]);

	const username = useMemo(() => {
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
						<MezonAvatar
							avatarUrl={priorityAvatar ? priorityAvatar : notify?.content?.avatar}
							username={notify?.content?.username}
						></MezonAvatar>
					</View>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={{ ...styles.username, color: colorsUsername }}>{username} </Text>
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
