import { AVATAR_DEFAULT_URL } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { createImgproxyUrl, getTimeDifferenceDate } from '@mezon/utils';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useMessageSender } from '../../../hooks/useMessageSender';
import { ENotifyBsToShow, NotifyProps } from '../types';
import { style } from './NotificationIndividualItem.styles';

function NotificationIndividualItem({ notify, onLongPressNotify, onPressNotify }: NotifyProps) {
	const user = useAppSelector((state) => selectMemberClanByUserId2(state, notify.sender_id || ''));
	const { avatarImg } = useMessageSender(user as any);
	const userName = notify?.content?.username || user?.user?.display_name || user?.user?.username;
	const messageTimeDifference = getTimeDifferenceDate(notify.create_time);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	let notice = notify?.subject;

	if (userName) {
		const userNameLength = userName?.length;
		notice = notify?.subject?.includes(userName) ? notify?.subject?.slice(userNameLength) : notify?.subject;
	}

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
							{userName} {notice}
						</Text>
					</View>
					<Text style={styles.notifyDuration}>{messageTimeDifference}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
}

export default NotificationIndividualItem;
