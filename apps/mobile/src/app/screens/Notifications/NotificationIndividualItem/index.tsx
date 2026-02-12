import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectUserById, useAppSelector } from '@mezon/store-mobile';
import { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import type { NotifyProps } from '../types';
import { ENotifyBsToShow } from '../types';
import { style } from './NotificationIndividualItem.styles';

const NotificationIndividualItem = ({ notify, onLongPressNotify }: NotifyProps) => {
	const user = useAppSelector((state) => selectUserById(state as any, notify?.sender_id ?? ''));
	const messageTimeDifference = convertTimestampToTimeAgo(notify?.create_time_seconds);
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const username = useMemo(() => {
		return notify?.content?.username || user?.username || '';
	}, [notify?.content?.username, user?.username]);

	const notice = useMemo(() => {
		if (username) {
			return (notify?.subject?.includes(username) ? notify?.subject?.slice(username?.length) : notify?.subject) || '';
		}
		return notify?.subject || '';
	}, [notify?.subject, username]);

	const computedUsername = useMemo(() => {
		if (username) return username;
		if (!notify?.content?.t) return '';

		const usernameMatch = notify.content.t.match(/^([\w.]+)\s/);
		return usernameMatch?.[1] ?? '';
	}, [notify?.content?.t, username]);

	return (
		<TouchableOpacity
			onLongPress={() => {
				onLongPressNotify(ENotifyBsToShow.removeNotification, notify);
			}}
		>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<View style={styles.boxImage}>
						<MezonClanAvatar image={user?.avatar_url || ''} alt={computedUsername}></MezonClanAvatar>
					</View>

					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text numberOfLines={2} style={styles.notifyUserName}>
								{computedUsername}
							</Text>
							{notice}
						</Text>
					</View>
					<Text style={styles.notifyDuration}>{messageTimeDifference}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export default NotificationIndividualItem;
