import { useLocalParticipant, useRoomContext } from '@livekit/react-native';
import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Alert, Linking, Platform, TouchableOpacity } from 'react-native';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from '../styles';

const ButtonToggleMic = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { isMicrophoneEnabled } = useLocalParticipant();
	const room = useRoomContext();

	const checkAndRequestMicPermission = async () => {
		if (Platform.OS === 'ios') {
			let result = await check(PERMISSIONS.IOS.MICROPHONE);
			if (result !== RESULTS.GRANTED) {
				result = await request(PERMISSIONS.IOS.MICROPHONE);
			}
			return result === RESULTS.GRANTED;
		} else if (Platform.OS === 'android') {
			let result = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
			if (result !== RESULTS.GRANTED) {
				result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
			}
			return result === RESULTS.GRANTED;
		}
		return false;
	};

	const showPermissionAlert = () => {
		Alert.alert('Microphone Permission Required', 'Please allow microphone access in your device settings to use this feature.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Open Settings',
				onPress: () => {
					Linking.openSettings();
				}
			}
		]);
	};

	const handleToggleMicrophone = async () => {
		try {
			if (isMicrophoneEnabled) {
				await room.localParticipant.setMicrophoneEnabled(false);
				return;
			}

			try {
				await room.localParticipant.setMicrophoneEnabled(true);
			} catch (enableError) {
				console.error('Error enabling microphone:', enableError);

				if (enableError?.message === 'Permission denied.') {
					const hasPermission = await checkAndRequestMicPermission();
					if (!hasPermission) {
						showPermissionAlert();
						return;
					}
				}
			}
		} catch (error) {
			console.error('Error toggling microphone:', error);
		}
	};
	return (
		<TouchableOpacity onPress={handleToggleMicrophone} style={styles.menuIcon}>
			<MezonIconCDN icon={isMicrophoneEnabled ? IconCDN.microphoneIcon : IconCDN.microphoneSlashIcon} color={themeValue.textStrong} />
		</TouchableOpacity>
	);
};

export default React.memo(ButtonToggleMic);
