import { Metrics, size } from '@mezon/mobile-ui';
import React from 'react';
import { Dimensions, ModalBaseProps, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import codePush from 'react-native-code-push';
import FastImage from 'react-native-fast-image';
import Modal from 'react-native-modal';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BG from './bgUpdateApp.png';

interface IMezonModalProps extends Pick<ModalBaseProps, 'animationType'> {
	visible: boolean;
	onClose?: () => void;
}

const MezonUpdateVersionModal = (props: IMezonModalProps) => {
	const { visible, onClose } = props;
	const [percent, setPercent] = React.useState(0);
	const [isLoading, setIsLoading] = React.useState(false);

	const handleUpdate = () => {
		try {
			setIsLoading(true);
			codePush.sync(
				{
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					updateDialog: false,
					installMode: codePush.InstallMode.IMMEDIATE
				},
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				() => {},
				codePushDownloadProgress
			);
		} catch (err) {
			setIsLoading(false);
		}
	};

	const codePushDownloadProgress = (progress: { receivedBytes: any; totalBytes: any }) => {
		const { receivedBytes, totalBytes } = progress;
		const percent = (receivedBytes / totalBytes) * 100;

		if (Math.round(percent) === 100) {
			setIsLoading(false);
		}
		setPercent(percent);
	};
	return (
		<Modal coverScreen={false} deviceHeight={Dimensions.get('screen').height} isVisible={visible} statusBarTranslucent={true}>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContainer}>
					<FastImage source={BG} style={{ width: size.s_100, height: size.s_100 }} />
					<Text style={styles.title}>Update Available</Text>
					<Text style={styles.message}>A new update is available. Would you like to update now?</Text>
					<View style={styles.buttonContainer}>
						<TouchableOpacity onPress={handleUpdate} style={styles.button} disabled={!!percent}>
							<Text style={styles.buttonText}>{percent ? `${Math.round(percent)}%` : 'Update'}</Text>
							{isLoading && <Chase size={size.s_18} color={'#ededed'} />}
						</TouchableOpacity>
						{!percent && (
							<TouchableOpacity onPress={onClose} style={styles.buttonSecond}>
								<Text style={styles.buttonTextSecond}>Dismiss</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalContainer: {
		width: Metrics.screenWidth / 1.2,
		paddingVertical: size.s_30,
		paddingHorizontal: size.s_20,
		borderRadius: size.s_10,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#242427',
		borderWidth: 1,
		borderColor: '#424242'
	},
	title: {
		color: '#ededed',
		marginTop: size.s_20,
		fontSize: size.s_18,
		fontWeight: 'bold',
		marginBottom: size.s_10
	},
	message: {
		fontSize: size.s_16,
		marginBottom: size.s_30,
		textAlign: 'center',
		color: '#ededed'
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		gap: size.s_10
	},
	button: {
		backgroundColor: '#5a62f4',
		borderColor: '#d8d8d8',
		borderWidth: 1,
		padding: size.s_10,
		borderRadius: size.s_6,
		flex: 1,
		flexDirection: 'row',
		gap: size.s_6,
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: size.s_4
	},
	buttonSecond: {
		backgroundColor: '#d8d8d8',
		borderColor: '#5a62f4',
		borderWidth: 1,
		padding: size.s_10,
		borderRadius: size.s_6,
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: size.s_4
	},
	buttonText: {
		color: '#ededed',
		fontSize: size.s_14,
		fontWeight: '600',
		paddingVertical: size.s_2
	},
	buttonTextSecond: {
		color: '#3920cd',
		fontSize: size.s_14,
		fontWeight: '600',
		paddingVertical: size.s_2
	}
});
export default MezonUpdateVersionModal;
