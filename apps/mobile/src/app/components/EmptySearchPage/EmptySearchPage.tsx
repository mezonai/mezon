import { useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { style } from './EmptySearchPage.styles';

export const EmptySearchPage = ({ emptyDescription }: { emptyDescription?: string }) => {
	const { t } = useTranslation('media');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<View style={styles.emptyBox}>
			<MezonIconCDN icon={IconCDN.emptySearchIcon} useOriginalColor={true} width={100} height={100} />
			<Text style={styles.textEmpty}>{emptyDescription ? emptyDescription : t('emptyDescription')}</Text>
		</View>
	);
};
