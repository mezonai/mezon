import { useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './EmptyPinMessage.style';

const EmptyPinMessage = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['pinMessage']);
	return (
		<View style={styles.emptyPinMessageBox}>
			<MezonIconCDN icon={IconCDN.emptyPinIcon} width={120} height={120} useOriginalColor={true} />
			<Text style={styles.emptyPinMessageTitle}>{t('emptyTitle')}</Text>
			<View>
				<Text style={styles.emptyPinMessageHeaderText}> {t('PROTIP')}</Text>
				<Text style={styles.emptyPinMessageDescription}>{t('emptyDescription')}</Text>
			</View>
		</View>
	);
};

export default EmptyPinMessage;
