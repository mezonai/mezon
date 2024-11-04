import { AVATAR_DEFAULT_URL } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectChannelById, selectMemberClanByUserId, useAppSelector } from '@mezon/store-mobile';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
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
		attachments = obj?.attachments && JSON.parse(obj?.attachments);
	} catch (err) {
		attachments = {};
	}
	try {
		mentions = obj?.mentions && JSON.parse(obj?.mentions);
	} catch (err) {
		mentions = {};
	}
	try {
		references = obj?.references && JSON.parse(obj?.references);
	} catch (err) {
		references = {};
	}
	try {
		reactions = obj?.reactions && JSON.parse(obj?.reactions);
	} catch (err) {
		reactions = {};
	}

	try {
		content = obj?.content && JSON.parse(obj?.content);
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
	const user = useSelector(selectMemberClanByUserId(notify?.sender_id || ''));
	const { avatarImg } = useMessageSender(user as any);
	const channelInfo = useAppSelector((state) => selectChannelById(state, notify?.content?.channel_id || ''));
	const data = parseObject(notify?.content);

	const { messageTimeDifference } = useMessageParser(data);

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
						<Image source={{ uri: avatarImg || AVATAR_DEFAULT_URL }} style={styles.image} />
					</View>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							{notify?.subject} - {channelInfo?.channel_label}:
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
