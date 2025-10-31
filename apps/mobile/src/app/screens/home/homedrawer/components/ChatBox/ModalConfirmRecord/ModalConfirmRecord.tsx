import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { style } from './styles';

interface IModalConfirmRecordProps {
	visible: boolean;
	onConfirm: () => void;
	onBack: () => void;
}
const ModalConfirmRecord = ({ visible, onBack, onConfirm }: IModalConfirmRecordProps) => {
	const { t } = useTranslation(['recordChatMessage']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	return (
		<Modal
			statusBarTranslucent={true}
			animationType="fade"
			transparent={true}
			visible={visible}
			supportedOrientations={['portrait', 'landscape']}
		>
			<View style={styles.modalContainer}>
				<View style={[styles.modalContent, { backgroundColor: themeValue.white }]}>
					<Text style={styles.modalText}>{t('confirmDeleteRecording')}</Text>
					<View style={[styles.separator, { backgroundColor: themeValue.borderRadio }]}></View>
					<View style={styles.buttonContainer}>
						<TouchableOpacity style={styles.btn} onPress={onBack}>
							<Text style={styles.hideText}>{t('goBack')}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.btn} onPress={onConfirm}>
							<Text style={styles.yesText}>{t('deleteRecording')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default React.memo(ModalConfirmRecord);
