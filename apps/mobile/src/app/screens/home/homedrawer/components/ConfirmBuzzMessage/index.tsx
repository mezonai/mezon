import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { MAX_LENGTH_MESSAGE_BUZZ } from '@mezon/utils';
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
	const [messageBuzz, setMessageBuzz] = useState<string>('Buzz!!');
	const { t } = useTranslation('message');

	const onConfirm = async () => {
		onClose();
		if (!messageBuzz?.trim()) {
			return;
		}
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
					<TextInput
						style={styles.input}
						value={messageBuzz}
						multiline={true}
						numberOfLines={4}
						maxLength={MAX_LENGTH_MESSAGE_BUZZ}
						onChangeText={setMessageBuzz}
					/>
				</View>
				<TouchableOpacity onPress={onConfirm} style={styles.yesButton}>
					<Text style={styles.buttonText}>{t('buzz.confirmText')}</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={onClose} />
		</View>
	);
});
