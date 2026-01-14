import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import type { NotifyProps } from '../types';
import { ENotifyBsToShow } from '../types';
import { style } from './NotificationIndividualItem.styles';

const NotificationIndividualItem = ({ notify, onLongPressNotify }: NotifyProps) => {
	const user = useAppSelector((state) => selectMemberClanByUserId(state, notify?.sender_id ?? ''));
	const username = notify?.content?.username || user?.user?.username;
	const messageTimeDifference = convertTimestampToTimeAgo(notify?.content?.create_time_seconds);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	let notice = notify?.subject;
	const notifyContent = notify?.content?.t;
	let extractedUsername = '';

	if (username) {
		const usernameLength = username?.length;
		notice = notice.includes(username) ? notice.slice(usernameLength) : notice;
	} else if (notifyContent) {
		const usernameMatch = notifyContent.match(/^([\w.]+)\s/);
		extractedUsername = usernameMatch?.[1] ? usernameMatch[1] : '';
	}

	return (
		<TouchableOpacity
			onLongPress={() => {
				onLongPressNotify(ENotifyBsToShow.removeNotification, notify);
			}}
		>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<MezonAvatar avatarUrl={user?.user?.avatar_url || ''} username={username}></MezonAvatar>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text numberOfLines={2} style={styles.notifyUserName}>
								{username || extractedUsername}
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
