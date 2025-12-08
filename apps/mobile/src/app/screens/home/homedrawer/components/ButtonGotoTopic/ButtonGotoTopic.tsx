import { size, useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import { topicsActions, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

const ButtonGotoTopic = ({ message }: { message: MessagesEntity }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { t } = useTranslation('message');

	const handleOpenTopic = () => {
		dispatch(topicsActions.setCurrentTopicId(message?.content?.tp || ''));
		dispatch(topicsActions.setInitTopicMessageId(message?.id || ''));
		dispatch(topicsActions.setIsShowCreateTopic(true));
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
	};

	return (
		<View style={styles.wrapper}>
			<TouchableOpacity onPress={handleOpenTopic} style={styles.container}>
				<MezonIconCDN icon={IconCDN.discussionIcon} width={size.s_16} height={size.s_16} color={themeValue.text} />
				<Text style={styles.title}>{t('goToTopic')}</Text>
				<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={size.s_16} height={size.s_16} color={themeValue.text} />
			</TouchableOpacity>
		</View>
	);
};

export default React.memo(ButtonGotoTopic);
