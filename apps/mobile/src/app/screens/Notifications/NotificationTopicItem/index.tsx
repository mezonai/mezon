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
	const dataMessage = parseObject(notify?.message || notify);
	const messageTimeDifference = convertTimestampToTimeAgo(notify?.last_sent_message?.timestamp_seconds);
	const lastSentUser = useAppSelector((state) => selectMemberClanByUserId(state, notify?.last_sent_message?.sender_id ?? ''));

	const lastSentMessage = useMemo(() => {
		const content = (
			typeof notify?.last_sent_message?.content === 'string'
				? safeJSONParse(notify.last_sent_message.content || '{}')
				: notify?.last_sent_message?.content
		)?.t;
		const attachments =
			(typeof notify?.last_sent_message?.attachment === 'string'
				? safeJSONParse(notify.last_sent_message.attachment || '[]')
				: notify?.last_sent_message?.attachment) || [];

		if (content) {
			return content;
		} else if (attachments?.length > 0) {
			return `[${t('message:attachments.attachment')}]`;
		} else {
			return '';
		}
	}, [notify?.last_sent_message?.attachment, notify?.last_sent_message?.content, t]);

	const priorityAvatar = useMemo(() => {
		return lastSentUser?.clan_avatar || lastSentUser?.user?.avatar_url || '';
	}, [lastSentUser?.clan_avatar, lastSentUser?.user?.avatar_url]);

	const priorityUsername = useMemo(() => {
		if (notify?.last_sent_message?.sender_id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}
		return lastSentUser?.user?.username || '';
	}, [lastSentUser?.user?.username, notify?.last_sent_message?.sender_id]);

	const priorityDisplayName = useMemo(() => {
		if (notify?.last_sent_message?.sender_id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}

		return lastSentUser?.clan_nick || lastSentUser?.user?.display_name || lastSentUser?.user?.username || '';
	}, [lastSentUser?.clan_nick, lastSentUser?.user?.display_name, lastSentUser?.user?.username, notify?.last_sent_message?.sender_id]);

	const handlePressNotify = async () => {
		try {
			const content = Object.assign({}, notify?.message || {}, {
				channel_id: notify?.channel_id,
				clan_id: notify?.clan_id,
				message_id: notify?.message_id
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
