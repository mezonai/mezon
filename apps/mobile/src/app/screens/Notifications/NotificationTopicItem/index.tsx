import { useAuth, useGetPriorityNameFromUserClan } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import {
	TopicDiscussionsEntity,
	getStoreAsync,
	selectAllUserClans,
	selectMemberClanByUserId,
	topicsActions,
	useAppSelector
} from '@mezon/store-mobile';
import { INotification } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MezonAvatar } from '../../../componentUI';
import { useMessageParser } from '../../../hooks/useMessageParser';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { parseObject } from '../NotificationMentionItem';
import { style } from './styles';

type NotifyProps = {
	readonly notify: TopicDiscussionsEntity;
	onPressNotify?: (notify: INotification) => void;
};

const NotificationTopicItem = React.memo(({ notify, onPressNotify }: NotifyProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const data = parseObject(notify?.message);
	const memberClan = useAppSelector(selectAllUserClans);
	const { userId } = useAuth();
	const { priorityAvatar: priorityAvatarSender } = useGetPriorityNameFromUserClan(notify?.last_sent_message?.sender_id);
	const { priorityAvatar: priorityAvatarContentSender } = useGetPriorityNameFromUserClan(notify?.message?.sender_id);
	const message = Object.assign({}, data, { create_time: notify?.create_time, avatar: priorityAvatarContentSender });
	const { messageTimeDifference } = useMessageParser(message);
	const initMessage = safeJSONParse(notify?.last_sent_message?.content || '')?.t;
	const userIds = notify?.last_sent_message?.repliers;
	const [subjectTopic, setSubjectTopic] = useState('');
	const lastSentUser = useAppSelector(selectMemberClanByUserId(notify?.last_sent_message?.sender_id ?? ''));

	const usernames = useMemo(() => {
		return memberClan
			.filter((profile) => (userIds || []).includes(profile?.user?.id || '') && profile?.user?.id !== userId)
			.map((profile) => profile?.user?.username);
	}, [memberClan, userIds, userId]);

	useEffect(() => {
		if (usernames.length === 0) {
			setSubjectTopic('Topic and you');
		}
		if (usernames.length === 1) {
			setSubjectTopic(`${usernames[0]} and you`);
		}
		if (usernames.length > 1) {
			setSubjectTopic(`${usernames[usernames.length - 1]} and ${usernames.length - 1} others`);
		}
	}, [usernames, userIds]);

	const handlePressNotify = async () => {
		const content = Object.assign({}, notify?.message || {}, {
			channel_id: notify?.channel_id,
			clan_id: notify?.clan_id,
			message_id: notify?.message_id
		});
		const notifytoJump = Object.assign({}, notify, { content: content });
		await onPressNotify(notifytoJump);
		const store = await getStoreAsync();
		const promises = [];
		promises.push(store.dispatch(topicsActions.setCurrentTopicInitMessage(message)));
		promises.push(store.dispatch(topicsActions.setCurrentTopicId(notify?.id || '')));
		promises.push(store.dispatch(topicsActions.setIsShowCreateTopic(true)));

		await Promise.all(promises);

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
						<MezonAvatar avatarUrl={priorityAvatarSender} username={notify?.message?.username}></MezonAvatar>
					</View>
					<View style={styles.notifyContent}>
						<Text numberOfLines={2} style={[styles.notifyHeaderTitle, styles.username]}>
							{subjectTopic.toUpperCase()}
						</Text>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={styles.username}>{'Replied To: '}</Text>
							{data?.content?.t || 'Unreachable message'}
						</Text>
						<Text numberOfLines={2} style={styles.notifyHeaderTitle}>
							<Text style={styles.username}>{`${lastSentUser ? lastSentUser?.user?.username : 'Sender'}: `} </Text>
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
