import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import { ReactNode } from 'react';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { style } from './styles';

interface IMezonConfirmProps {
	title: string;
	children?: ReactNode;
	confirmText: string;
	content?: string;
	isDanger?: boolean;
	onConfirm?: () => void;
	onCancel?: () => void;
}
export default function MezonConfirm({ children, title, confirmText, content, isDanger, onConfirm, onCancel }: IMezonConfirmProps) {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);

	function handleClose() {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		onCancel && onCancel();
	}

	function handleConfirm() {
		onConfirm && onConfirm();
	}

	return (
		<View style={styles.main}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>{title}</Text>
				</View>

				{children ? children : <Text style={styles.contentText}>{content || ''}</Text>}

				<View style={styles.btnWrapper}>
					<TouchableOpacity
						style={[styles.btn, styles.btnDefault, isDanger && styles.btnDanger]}
						onPress={() => handleConfirm()}
					>
						<Text style={[styles.btnText, { color: baseColor.white }]}>{confirmText}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.btn} onPress={() => handleClose()}>
						<Text style={styles.btnText}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={handleClose} />
		</View>
	);
}
