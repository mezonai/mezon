import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './EmptyNotification.styles';

const EmptyNotification = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['notification']);

	return (
		<View style={styles.container}>
			<View style={styles.contentWrapper}>
				<MezonIconCDN icon={IconCDN.bellIcon} width={size.s_100} height={size.s_100} color={themeValue.text} />
				<Text style={styles.title}>{t('nothingHere')}</Text>
				<Text style={styles.description}>{t('comeBackNotify')}</Text>
			</View>
		</View>
	);
};

export default EmptyNotification;
