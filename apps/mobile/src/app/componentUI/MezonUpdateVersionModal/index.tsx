import { Metrics, size } from '@mezon/mobile-ui';
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Dimensions, ModalBaseProps, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
	const [error, setError] = React.useState<string | null>(null);

	// Use refs to maintain values across re-renders and app state changes
	const downloadRef = useRef<{
		syncInProgress: boolean;
		receivedBytes: number;
		totalBytes: number;
	}>({
		syncInProgress: false,
		receivedBytes: 0,
		totalBytes: 0
	});

	// Handle app state changes
	useEffect(() => {
		const subscription = AppState.addEventListener('change', handleAppStateChange);
		return () => {
			subscription.remove();
		};
	}, []);

	const handleAppStateChange = async (nextAppState: AppStateStatus) => {
		// If coming back to foreground and download was in progress
		if (nextAppState === 'active' && downloadRef.current.syncInProgress) {
			// Update the UI with the stored progress
			const storedPercent = (downloadRef.current.receivedBytes / downloadRef.current.totalBytes) * 100;
			setPercent(storedPercent);
		}
	};

	const codePushDownloadProgress = (progress: { receivedBytes: number; totalBytes: number }) => {
		const { receivedBytes, totalBytes } = progress;

		// Store progress in ref for background state
		downloadRef.current.receivedBytes = receivedBytes;
		downloadRef.current.totalBytes = totalBytes;

		const currentPercent = (receivedBytes / totalBytes) * 100;
		setPercent(currentPercent);

		if (Math.round(currentPercent) === 100) {
			downloadRef.current.syncInProgress = false;
			setIsLoading(false);
		}
	};

	const codePushStatusChange = (syncStatus: codePush.SyncStatus) => {
		switch (syncStatus) {
			case codePush.SyncStatus.CHECKING_FOR_UPDATE:
				setIsLoading(true);
				break;
			case codePush.SyncStatus.DOWNLOADING_PACKAGE:
				downloadRef.current.syncInProgress = true;
				break;
			case codePush.SyncStatus.INSTALLING_UPDATE:
				break;
			case codePush.SyncStatus.UPDATE_INSTALLED:
				downloadRef.current.syncInProgress = false;
				setIsLoading(false);
				break;
			case codePush.SyncStatus.UNKNOWN_ERROR:
				downloadRef.current.syncInProgress = false;
				setIsLoading(false);
				setError('Update failed. Please try again.');
				break;
		}
	};

	const handleUpdate = async () => {
		try {
			setError(null);
			setIsLoading(true);

			// Configure CodePush options
			const codePushOptions = {
				installMode: codePush.InstallMode.IMMEDIATE,
				mandatoryInstallMode: codePush.InstallMode.IMMEDIATE,
				minimumBackgroundDuration: 0
			};

			// Start the sync process
			await codePush.sync(codePushOptions, codePushStatusChange, codePushDownloadProgress);
		} catch (err) {
			console.error('CodePush sync error:', err);
			setError('Update failed. Please try again.');
			setIsLoading(false);
			downloadRef.current.syncInProgress = false;
		}
	};

	return (
		<Modal coverScreen={false} deviceHeight={Dimensions.get('screen').height} isVisible={visible} statusBarTranslucent={true}>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContainer}>
					<FastImage source={BG} style={{ width: size.s_100, height: size.s_100 }} />
					<Text style={styles.title}>Update Available</Text>
					<Text style={styles.message}>A new update is available. Would you like to update now?</Text>
					{error && <Text style={styles.errorText}>{error}</Text>}
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
		borderColor: '#373737'
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
	},
	errorText: {
		color: 'red',
		marginBottom: 10
	}
});
export default MezonUpdateVersionModal;
