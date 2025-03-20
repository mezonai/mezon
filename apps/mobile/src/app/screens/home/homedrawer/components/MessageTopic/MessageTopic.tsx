import { size, useTheme } from '@mezon/mobile-ui';
import { MessagesEntity, selectMemberClanByUserId2, topicsActions, useAppDispatch } from '@mezon/store-mobile';
import { convertTimeString } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

const MessageTopic = ({ message, avatar }: { message: MessagesEntity; avatar: string }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const topicCreator = useSelector((state) => selectMemberClanByUserId2(state, message?.content?.cid as string));

	const handleOpenTopic = () => {
		dispatch(topicsActions.setCurrentTopicInitMessage(message));
		dispatch(topicsActions.setCurrentTopicId(message?.content?.tp || ''));
		dispatch(topicsActions.setIsShowCreateTopic(true));
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
	};
	return (
		<TouchableOpacity onPress={handleOpenTopic} style={styles.container}>
			<MezonAvatar
				avatarUrl={topicCreator?.clan_avatar || topicCreator?.user?.avatar_url}
				username={topicCreator?.clan_nick}
				width={size.s_20}
				height={size.s_20}
			/>
			<Text style={styles.repliesText}>View topic</Text>
			<Text style={styles.dateMessageBox}>{message?.create_time ? convertTimeString(message?.create_time) : ''}</Text>
		</TouchableOpacity>
	);
};

export default React.memo(MessageTopic);
