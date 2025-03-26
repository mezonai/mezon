import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TextInput, TouchableOpacity, View } from 'react-native';
import useTabletLandscape from '../../../../../hooks/useTabletLandscape';
import { style } from './styles';

interface IBuzzMessageModalProps {
	onSubmit: (text: string) => void;
}

export const ConfirmBuzzMessageModal = memo((props: IBuzzMessageModalProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { onSubmit } = props;
	const [messageBuzz, setMessageBuzz] = useState<string>('');
	const { t } = useTranslation('message');

	const onConfirm = async () => {
		onClose();
		onSubmit(messageBuzz);
	};

	const onClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={styles.main}>
			<View style={[styles.container, isTabletLandscape && { maxWidth: '40%' }]}>
				<View>
					<Text style={styles.title}>{t('buzz.description')}</Text>
				</View>
				<View style={styles.textBox}>
					<TextInput style={styles.input} onChangeText={setMessageBuzz} />
				</View>
				<View style={styles.buttonsWrapper}>
					<TouchableOpacity onPress={onConfirm} style={styles.yesButton}>
						<Text style={styles.buttonText}>{t('buzz.confirmText')}</Text>
					</TouchableOpacity>
				</View>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={onClose} />
		</View>
	);
});
