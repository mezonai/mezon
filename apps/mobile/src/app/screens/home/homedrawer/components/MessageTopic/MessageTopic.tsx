import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import { getFirstMessageOfTopic, selectMemberClanByUserId, topicsActions, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

const MessageTopic = ({ message }: { message: MessagesEntity }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const topicCreator = useSelector((state) => selectMemberClanByUserId(state, message?.content?.cid as string));
	const { t } = useTranslation('message');

	const handleOpenTopic = () => {
		dispatch(topicsActions.setCurrentTopicInitMessage(message));
		dispatch(topicsActions.setCurrentTopicId(message?.content?.tp || ''));
		dispatch(getFirstMessageOfTopic(message?.content?.tp || ''));
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
	};
	return (
		<View style={{ flexDirection: 'row' }}>
			<TouchableOpacity onPress={handleOpenTopic} style={styles.container}>
				<MezonAvatar
					avatarUrl={topicCreator?.clan_avatar || topicCreator?.user?.avatar_url}
					username={topicCreator?.clan_nick}
					width={size.s_20}
					height={size.s_20}
				/>
				<Text style={styles.repliesText}>{t('creator')}</Text>
				<Text style={styles.dateMessageBox}>{t('viewTopic')}</Text>
				<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={size.s_16} height={size.s_16} color={baseColor.gray} />
			</TouchableOpacity>
		</View>
	);
};

export default React.memo(MessageTopic);
