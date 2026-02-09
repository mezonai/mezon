import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectClanById, useAppSelector } from '@mezon/store-mobile';
import { memo, useMemo } from 'react';
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
	const messageTimeDifference = convertTimestampToTimeAgo(notify?.content?.create_time_seconds);
	const data = parseObject(notify?.content);

	const priorityName = useMemo(() => {
		return notify?.content?.display_name || notify?.content?.username || '';
	}, [notify?.content?.display_name, notify?.content?.username]);

	if (!data?.content && !data?.attachments) {
		return null;
	}

	return (
		<TouchableOpacity onLongPress={() => onLongPressNotify(ENotifyBsToShow.removeNotification, notify)}>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<View style={styles.boxImage}>
						<MezonClanAvatar alt={priorityName} image={notify?.content?.avatar} />
					</View>
					<View style={styles.notifyContent}>
						{clan?.clan_name && (
							<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
								<Text style={styles.username}>{priorityName} </Text>
								{clan.clan_name}
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
