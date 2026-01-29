import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import { logoutGlobal } from '../../../../utils/helpers';
import { style } from './styles';

interface IMezonConfirmProps {
	content?: string;
}
export const ConfirmReLoginModal = ({ content }: IMezonConfirmProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);
	const { t } = useTranslation(['token']);

	function handleClose() {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}

	const handleConfirm = async () => {
		await logoutGlobal();
	};

	return (
		<View style={styles.main}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>{t('reloginModal.title')}</Text>
				</View>

				<Text style={styles.contentText}>
					{content || t('reloginModal.content')}. {t('reloginModal.loginAgain')}
				</Text>

				<View style={styles.btnWrapper}>
					<TouchableOpacity style={[styles.btn, styles.btnDefault, styles.btnDanger]} onPress={() => handleConfirm()}>
						<Text style={[styles.btnText, styles.btnTextWhite]}>{t('reloginModal.confirmText')}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.btn} onPress={() => handleClose()}>
						<Text style={styles.btnText}>{t('reloginModal.cancelText')}</Text>
					</TouchableOpacity>
				</View>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={handleClose} />
		</View>
	);
};
