import { STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { selectTypingUsersById } from '@mezon/store-mobile';
import LottieView from 'lottie-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { TYPING_DARK_MODE, TYPING_LIGHT_MODE } from '../../../../../../assets/lottie';
import { style } from './styles';

export const MessageUserTyping = React.memo(({ channelId, isDM, mode, isPublic }: IProps) => {
	const { themeValue, themeBasic } = useTheme();
	const { t } = useTranslation(['common']);
	const styles = style(themeValue);
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const typingUsers = useSelector((state) => selectTypingUsersById(state, channelId, userId));
	const typingLabel = useMemo(() => {
		if (typingUsers?.length === 1) {
			return `${typingUsers[0].typingName}${t('isTyping')}`;
		}
		if (typingUsers?.length > 1) {
			return `${t('severalPeopleTyping')}`;
		}
		return '';
	}, [typingUsers, t]);

	if (!typingLabel) {
		return null;
	}

	return (
		<View style={[styles.typingContainer, { overflow: 'visible', backgroundColor: 'transparent' }]}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={StyleSheet.absoluteFillObject}
			/>
			<LottieView source={themeBasic === ThemeModeBase.DARK ? TYPING_DARK_MODE : TYPING_LIGHT_MODE} autoPlay loop style={styles.threeDot} />
			<Text style={styles.typingLabel} numberOfLines={1}>
				{typingLabel}
			</Text>
		</View>
	);
});
