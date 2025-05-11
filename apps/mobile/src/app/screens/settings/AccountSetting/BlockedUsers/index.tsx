import { useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { APP_SCREEN, SettingScreenProps } from '../../../../navigation/ScreenTypes';
import { style } from './styles';

type BlockedUsersScreen = typeof APP_SCREEN.SETTINGS.BLOCKED_USERS;
export const BlockedUsers = ({ navigation }: SettingScreenProps<BlockedUsersScreen>) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('accountSetting');
	return (
		<View style={styles.container}>
			{/* TODO: update later */}
			<Text style={{ color: themeValue.text, textAlign: 'center' }}>{t('doNotHaveBlockedUser')}</Text>
		</View>
	);
};
