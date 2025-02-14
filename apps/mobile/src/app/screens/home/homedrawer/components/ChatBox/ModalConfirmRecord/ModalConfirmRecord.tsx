import { size, useTheme } from '@mezon/mobile-ui';
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
		<Modal statusBarTranslucent={true} animationType="fade" transparent={true} visible={visible}>
			<View style={styles.modalContainer}>
				<View style={[styles.modalContent, { backgroundColor: themeValue.white }]}>
					<Text style={styles.modalText}>{t('confirmDeleteRecording')}</Text>
					<View style={{ width: '100%', height: 1, backgroundColor: themeValue.borderRadio }}></View>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: size.s_20, width: '100%' }}>
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
