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
	const clan = useAppSelector(selectClanById(notify?.content?.clanId as string));
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const unixTimestamp = useMemo(() => {
		return notify?.content?.createTimeSeconds || Math.floor(new Date(notify?.createTime).getTime() / 1000);
	}, [notify?.content?.createTimeSeconds, notify?.createTime]);
	const messageTimeDifference = convertTimestampToTimeAgo(unixTimestamp);
	const data = parseObject(notify?.content);

	return (
		<TouchableOpacity onLongPress={() => onLongPressNotify(ENotifyBsToShow.removeNotification, notify)}>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<View style={styles.boxImage}>
						<MezonClanAvatar alt={notify?.content?.displayName} image={notify?.content?.avatar} />
					</View>
					<View style={styles.notifyContent}>
						{clan?.clanName && (
							<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
								<Text style={styles.username}>{notify?.content?.displayName} </Text>
								{clan?.clanName}
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
