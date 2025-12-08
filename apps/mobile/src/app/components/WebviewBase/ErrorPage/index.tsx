import { size, useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

interface IErrorPageProps {
	error: ErrorWebView;
	customErrorMessage?: string;
	onRefresh?: () => void;
	onGoBack?: () => void;
}

export type ErrorWebView = {
	code: number;
	description: string;
};

const ErrorPage = ({ error, customErrorMessage, onRefresh, onGoBack }: IErrorPageProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('common');
	return (
		<View style={styles.container}>
			<MezonIconCDN icon={IconCDN.errorPage} height={size.s_60} width={size.s_60} color={themeValue.white} />
			<Text style={styles.errorTitle}>{customErrorMessage || t('failedToLoad')}</Text>
			<Text style={styles.errorType}>{error?.description}</Text>
			<TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
				<Text style={styles.refreshButtonText}>{t('refresh')}</Text>
			</TouchableOpacity>
			{onGoBack && (
				<TouchableOpacity style={styles.goBackButton} onPress={onGoBack}>
					<Text style={styles.refreshButtonText}>{t('goBack')}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

export default ErrorPage;
