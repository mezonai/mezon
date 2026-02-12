import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import checkVersion from 'react-native-store-version';
import VersionInfo from 'react-native-version-info';
import MezonIconCDN from '../componentUI/MezonIconCDN';
import { IconCDN } from '../constants/icon_cdn';

const PURPLE_LIGHT_BG = '#F3E8FF';
const ICON_SIZE = 80;
const ICON_BORDER_RADIUS = 40;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: size.s_24,
		paddingVertical: size.s_40,
		alignItems: 'center'
	},
	iconContainer: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		borderRadius: ICON_BORDER_RADIUS,
		backgroundColor: PURPLE_LIGHT_BG,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: size.s_24
	},
	title: {
		fontSize: size.s_20,
		fontWeight: '700',
		marginBottom: size.s_12,
		textAlign: 'center'
	},
	description: {
		fontSize: size.medium,
		opacity: 0.6,
		textAlign: 'center',
		marginBottom: size.s_32,
		lineHeight: 22,
		paddingHorizontal: size.s_16
	},
	updateButton: {
		backgroundColor: baseColor.blurple,
		paddingVertical: size.s_16,
		paddingHorizontal: size.s_32,
		borderRadius: size.s_100,
		width: '100%',
		alignItems: 'center',
		marginBottom: size.s_16
	},
	updateButtonText: {
		color: baseColor.white,
		fontWeight: '600',
		fontSize: size.s_16
	},
	versionInfo: {
		fontSize: size.s_12,
		opacity: 0.4,
		textAlign: 'center',
		letterSpacing: 0.5
	}
});

const UpdateGateBottomSheet = ({ storeUrl, remoteVersion }: { storeUrl: string; remoteVersion: string }) => {
	const { t } = useTranslation(['setting']);
	const { themeValue } = useTheme();

	const onPress = () => Linking.openURL(storeUrl);

	return (
		<View style={styles.container}>
			<View style={styles.iconContainer}>
				<MezonIconCDN icon={IconCDN.downloadIcon} color={baseColor.blurple} width={40} height={40} />
			</View>
			<Text style={[styles.title, { color: themeValue.textStrong }]}>{t('updateGate.outOfDateVersion')}</Text>
			<Text style={[styles.description, { color: themeValue.text }]}>{t('updateGate.updateExperience')}</Text>
			<TouchableOpacity onPress={onPress} style={styles.updateButton}>
				<Text style={styles.updateButtonText}>{t('updateGate.updateNow')}</Text>
			</TouchableOpacity>
			<Text style={[styles.versionInfo, { color: themeValue.text }]}>
				{t('updateGate.versionInfo')} {remoteVersion}
			</Text>
		</View>
	);
};

export const useCheckUpdatedVersion = () => {
	useEffect(() => {
		const checkUpdatedVersion = async () => {
			try {
				const check = await checkVersion({
					version: VersionInfo.appVersion,
					iosStoreURL: process.env.NX_APP_STORE_URL,
					androidStoreURL: process.env.NX_GOOGLE_PLAY_URL,
					country: 'vn'
				});

				if (check.detail === 'remote > local') {
					const storeUrl = Platform.OS === 'ios' ? process.env.NX_APP_STORE_URL : process.env.NX_GOOGLE_PLAY_URL;
					const data = {
						heightFitContent: true,
						children: <UpdateGateBottomSheet storeUrl={storeUrl || ''} remoteVersion={check?.remote} />,
						blockDismiss: true
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
				}
			} catch (error) {
				console.warn(error);
			}
		};

		const timer = setTimeout(() => {
			checkUpdatedVersion();
		}, 2000);
		return () => clearTimeout(timer);
	}, []);

	return {};
};
