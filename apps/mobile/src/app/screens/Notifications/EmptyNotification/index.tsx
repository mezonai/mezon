import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Icons } from '../../../componentUI/MobileIcons';
import { style } from './EmptyNotification.styles';

const EmptyNotification = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['notification']);

	return (
		<View style={styles.container}>
			<View style={styles.contentWrapper}>
				<Text style={styles.title}>{t('nothingHere')}</Text>
				<Text style={styles.description}>{t('comeBackNotify')}</Text>
				<Icons.EmptyNotificationIcon color={themeValue.text} width={size.s_300} height={size.s_300} />
			</View>
		</View>
	);
};

export default EmptyNotification;
