import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { TopicDiscussionsEntity } from '@mezon/store-mobile';
import { getFirstMessageOfTopic, getStoreAsync, selectMemberClanByUserId, topicsActions, useAppSelector } from '@mezon/store-mobile';
import type { INotification } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonClanAvatar from '../../../componentUI/MezonClanAvatar';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { parseObject } from '../NotificationMentionItem';
import { style } from './styles';

type NotifyProps = {
	readonly notify: TopicDiscussionsEntity;
	onPressNotify: (notify: INotification) => void | Promise<void>;
};

const NotificationTopicItem = memo(({ notify, onPressNotify }: NotifyProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['notification', 'message']);
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const dataMessage = parseObject(notify?.message);
	const messageTimeDifference = convertTimestampToTimeAgo(notify?.lastSentMessage?.timestampSeconds);
	const lastSentUser = useAppSelector((state) => selectMemberClanByUserId(state, notify?.lastSentMessage?.senderId ?? ''));

	const lastSentMessage = useMemo(() => {
		const content = (
			typeof notify?.lastSentMessage?.content === 'string'
				? safeJSONParse(notify.lastSentMessage.content || '{}')
				: notify?.lastSentMessage?.content
		)?.t;
		const attachments =
			(typeof notify?.lastSentMessage?.attachment === 'string'
				? safeJSONParse(notify.lastSentMessage.attachment || '[]')
				: notify?.lastSentMessage?.attachment) || [];

		if (content) {
			return content;
		} else if (attachments?.length > 0) {
			return `[${t('message:attachments.attachment')}]`;
		} else {
			return '';
		}
	}, [notify?.lastSentMessage?.attachment, notify?.lastSentMessage?.content, t]);

	const priorityAvatar = useMemo(() => {
		return lastSentUser?.clanAvatar || lastSentUser?.user?.avatarUrl || '';
	}, [lastSentUser?.clanAvatar, lastSentUser?.user?.avatarUrl]);

	const priorityUsername = useMemo(() => {
		if (notify?.lastSentMessage?.senderId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}
		return lastSentUser?.user?.username || '';
	}, [lastSentUser?.user?.username, notify?.lastSentMessage?.senderId]);

	const priorityDisplayName = useMemo(() => {
		if (notify?.lastSentMessage?.senderId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}

		return lastSentUser?.clanNick || lastSentUser?.user?.displayName || lastSentUser?.user?.username || '';
	}, [lastSentUser?.clanNick, lastSentUser?.user?.displayName, lastSentUser?.user?.username, notify?.lastSentMessage?.senderId]);

	const handlePressNotify = async () => {
		try {
			const content = Object.assign({}, notify?.message || {}, {
				channelId: notify?.channelId,
				clanId: notify?.clanId,
				messageId: notify?.messageId
			});
			const notifytoJump = Object.assign({}, notify, { content });
			await onPressNotify(notifytoJump);
			const store = await getStoreAsync();
			const promises = [];
			promises.push(store.dispatch(topicsActions.setCurrentTopicId(notify?.id || '')));
			promises.push(store.dispatch(topicsActions.setIsShowCreateTopic(true)));
			promises.push(store.dispatch(getFirstMessageOfTopic({ topicId: notify?.id || '', isMobile: true })));

			await Promise.allSettled(promises);

			navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
				screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
			});
		} catch (error) {
			console.error('Error pressing notify topic:', error);
		}
	};

	return (
		<TouchableOpacity
			onPress={() => {
				handlePressNotify();
			}}
		>
			<View style={styles.notifyContainer}>
				<View style={styles.notifyHeader}>
					<View style={styles.boxImage}>
						<MezonClanAvatar image={priorityAvatar} alt={priorityUsername}></MezonClanAvatar>
					</View>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={[styles.notifyHeaderTitle, styles.username]}>
							{t('topicAndYou').toUpperCase()}
						</Text>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={styles.username}>{t('repliedTo')}</Text>
							{dataMessage?.content?.t || ''}
						</Text>
						{priorityDisplayName && (
							<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
								<Text style={styles.username}>{priorityDisplayName}: </Text>
								{lastSentMessage}
							</Text>
						)}
					</View>
					<Text style={styles.notifyDuration}>{messageTimeDifference}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
});

export default NotificationTopicItem;
