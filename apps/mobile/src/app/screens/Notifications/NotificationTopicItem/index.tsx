import { useAuth, useGetPriorityNameFromUserClan } from '@mezon/core';
import { convertTimestampToTimeAgo } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import type { TopicDiscussionsEntity } from '@mezon/store-mobile';
import { getStoreAsync, selectAllUserClans, selectMemberClanByUserId, topicsActions } from '@mezon/store-mobile';
import type { INotification } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { parseObject } from '../NotificationMentionItem';
import { style } from './styles';

type NotifyProps = {
	readonly notify: TopicDiscussionsEntity;
	onPressNotify?: (notify: INotification) => void;
};

const NotificationTopicItem = React.memo(({ notify, onPressNotify }: NotifyProps) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['notification']);
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const data = parseObject(notify?.message);
	const memberClan = useSelector(selectAllUserClans);
	const { userId } = useAuth();
	const { priorityAvatar } = useGetPriorityNameFromUserClan(notify?.last_sent_message?.sender_id);
	const messageTimeDifference = convertTimestampToTimeAgo(notify?.last_sent_message?.timestamp_seconds);
	const initMessage = safeJSONParse(notify?.last_sent_message?.content || '')?.t;
	const userIds = notify?.last_sent_message?.repliers;
	const [subjectTopic, setSubjectTopic] = useState('');
	const lastSentUser = useSelector(selectMemberClanByUserId(notify?.last_sent_message?.sender_id ?? ''));

	const usernames = useMemo(() => {
		return memberClan
			.filter((profile) => (userIds || []).includes(profile?.user?.id || '') && profile?.user?.id !== userId)
			.map((profile) => profile?.user?.username);
	}, [memberClan, userIds, userId]);

	useEffect(() => {
		if (Array.isArray(usernames) && usernames.length > 0) {
			setSubjectTopic(`${usernames[0]} ${t('andYou')}`);
		} else {
			setSubjectTopic(t('topicAndYou'));
		}
	}, [usernames, userIds, t]);

	const handlePressNotify = async () => {
		const content = Object.assign({}, notify?.message || {}, {
			channel_id: notify?.channel_id,
			clan_id: notify?.clan_id,
			message_id: notify?.message_id
		});
		const notifytoJump = Object.assign({}, notify, { content });
		await onPressNotify(notifytoJump);
		const store = await getStoreAsync();
		const promises = [];
		promises.push(store.dispatch(topicsActions.setCurrentTopicInitMessage(data)));
		promises.push(store.dispatch(topicsActions.setCurrentTopicId(notify?.id || '')));
		promises.push(store.dispatch(topicsActions.setIsShowCreateTopic(true)));

		await Promise.allSettled(promises);

		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
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
						<MezonAvatar avatarUrl={priorityAvatar} username={notify?.message?.username}></MezonAvatar>
					</View>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={[styles.notifyHeaderTitle, styles.username]}>
							{subjectTopic.toUpperCase()}
						</Text>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={styles.username}>{t('repliedTo')}</Text>
							{data?.content?.t || 'Unreachable message'}
						</Text>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={styles.username}>{`${lastSentUser ? lastSentUser?.user?.username : t('sender')}: `} </Text>
							{initMessage || 'Unreachable message'}
						</Text>
					</View>
					<Text style={styles.notifyDuration}>{messageTimeDifference}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
});

export default NotificationTopicItem;
