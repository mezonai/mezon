import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectClanById, useAppSelector } from '@mezon/store-mobile';
import React, { memo, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import { parseObject } from '../NotificationMentionItem';
import type { NotifyProps } from '../types';
import { ENotifyBsToShow } from '../types';
import MessageWebhookClan from './MessageWebhookClan';
import { style } from './styles';

const NotificationWebhookClan = ({ notify, onLongPressNotify }: NotifyProps) => {
	const clan = useAppSelector(selectClanById(notify?.content?.clan_id as string));
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const unixTimestamp = useMemo(() => {
		return notify?.content?.create_time_seconds || Math.floor(new Date(notify?.create_time).getTime() / 1000);
	}, [notify?.content?.create_time_seconds, notify?.create_time]);
	const messageTimeDifference = convertTimestampToTimeAgo(unixTimestamp);
	const data = parseObject(notify?.content);

	return (
		<TouchableOpacity onLongPress={() => onLongPressNotify(ENotifyBsToShow.removeNotification, notify)}>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<View style={styles.boxImage}>
						<MezonClanAvatar alt={notify?.content?.display_name} image={notify?.content?.avatar} />
					</View>
					<View style={styles.notifyContent}>
						{clan?.clan_name && (
							<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
								<Text style={styles.username}>{notify?.content?.display_name} </Text>
								{clan?.clan_name}
							</Text>
						)}
						<View style={styles.contentMessage}>{<MessageWebhookClan message={data} />}</View>
					</View>
					<Text style={styles.notifyDuration}>{messageTimeDifference}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};
export default memo(NotificationWebhookClan);
