import { useAuth } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { baseColor, Colors, size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import { appActions } from '@mezon/store';
import { getStoreAsync } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import RNQRGenerator from 'rn-qr-generator';
import LogoMezonDark from '../../../../assets/svg/logoMezonDark.svg';
import LogoMezonLight from '../../../../assets/svg/logoMezonLight.svg';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './styles';

export const QRScanner = () => {
	const { t } = useTranslation(['qrScanner']);
	const [hasPermission, setHasPermission] = useState(false);
	const device = useCameraDevice('back');
	const navigation = useNavigation<any>();
	const [valueCode, setValueCode] = useState<string>('');
	const [isSuccess, setIsSuccess] = useState<boolean>(false);
	const { confirmLoginRequest } = useAuth();
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);

	const codeScanner = useCodeScanner({
		codeTypes: ['qr'],
		onCodeScanned: (codes) => {
			onNavigationScanned(codes?.[0]?.value || '');
		}
	});

	useEffect(() => {
		const requestCameraPermission = async () => {
			const permission = await Camera.requestCameraPermission();
			setHasPermission(permission === 'granted');
		};

		requestCameraPermission();
	}, []);

	const requestCameraPermission = async () => {
		const permission = await Camera.requestCameraPermission();
		if (permission === 'denied') {
			Alert.alert(
				t('cameraPermissionDenied'),
				t('pleaseAllowCamera'),
				[
					{ text: t('cancel'), style: 'cancel' },
					{ text: t('openSettings'), onPress: () => Linking.openSettings() }
				],
				{ cancelable: false }
			);
		}
		setHasPermission(permission === 'granted');
	};

	const onConfirmLogin = async () => {
		const store = await getStoreAsync();
		try {
			if (valueCode) {
				store.dispatch(appActions.setLoadingMainMobile(true));
				const res = await confirmLoginRequest(valueCode);
				store.dispatch(appActions.setLoadingMainMobile(false));
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				if (res?.action?.action?.requestStatus === 'rejected' || !res) {
					Toast.show({
						type: 'error',
						text1: t('anErrorOccurred')
					});
				} else {
					setIsSuccess(true);
				}
			}
		} catch (err) {
			store.dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const onGoback = () => {
		navigation.goBack();
	};

	const openLibrary = async () => {
		const store = await getStoreAsync();
		try {
			store.dispatch(appActions.setLoadingMainMobile(true));
			const result = await launchImageLibrary({
				selectionLimit: 1,
				mediaType: 'photo'
			});
			const fileUri = result?.assets?.[0]?.uri;
			if (fileUri) {
				const res = await RNQRGenerator.detect({
					uri: fileUri
				});

				onNavigationScanned(res?.values?.[0]?.toString() || '');
			}
			store.dispatch(appActions.setLoadingMainMobile(false));
		} catch (error) {
			store.dispatch(appActions.setLoadingMainMobile(false));
			Toast.show({
				type: 'error',
				text1: t('anErrorOccurred')
			});
		}
	};

	const onNavigationScanned = async (value: string) => {
		const store = await getStoreAsync();
		try {
			store.dispatch(appActions.setLoadingMainMobile(false));
			const valueObj = safeJSONParse(value || '{}');
			// case send token
			if (valueObj?.receiver_id) {
				navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
					screen: APP_SCREEN.SETTINGS.SEND_COFFEE,
					params: {
						formValue: value
					}
				});
				// 	case login
			} else if (value) {
				setValueCode(value);
			} else {
				// 	empty
			}
		} catch (error) {
			store.dispatch(appActions.setLoadingMainMobile(false));
			console.error('log  => error', error);
		}
	};

	const onMyQRCode = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
			screen: APP_SCREEN.SETTINGS.MY_QR_CODE
		});
	};

	if (device == null || !hasPermission) {
		return (
			<View style={styles.wrapper}>
				<View style={[styles.popupLogin, { backgroundColor: 'rgba(0,0,0,0.16)' }]}>
					<View
						style={{
							zIndex: 100,
							flexDirection: 'row',
							position: 'absolute',
							justifyContent: 'space-between',
							top: size.s_40,
							flex: 1,
							paddingHorizontal: size.s_10,
							width: '100%'
						}}
					>
						<TouchableOpacity
							style={styles.backHeader}
							onPress={() => {
								navigation.goBack();
							}}
						>
							<Icons.CloseSmallBoldIcon width={size.s_28} height={size.s_28} color={baseColor.white} />
						</TouchableOpacity>
					</View>
					<TouchableOpacity
						style={[styles.button, styles.buttonBorder, { backgroundColor: '#292929' }]}
						onPress={() => {
							requestCameraPermission();
						}}
					>
						<Text style={styles.buttonText}>{t('requestCameraPermission')}</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.wrapper}>
			<Camera codeScanner={codeScanner} style={StyleSheet.absoluteFill} device={device} isActive={!valueCode} />
			{!valueCode ? (
				<View style={{ flex: 1 }}>
					<View
						style={{
							zIndex: 100,
							flexDirection: 'row',
							position: 'absolute',
							justifyContent: 'space-between',
							top: size.s_40,
							flex: 1,
							paddingHorizontal: size.s_10,
							width: '100%'
						}}
					>
						<TouchableOpacity
							style={styles.backHeader}
							onPress={() => {
								navigation.goBack();
							}}
						>
							<Icons.CloseSmallBoldIcon width={size.s_28} height={size.s_28} color={baseColor.white} />
						</TouchableOpacity>
						<TouchableOpacity onPress={onMyQRCode}>
							<View
								style={{
									paddingHorizontal: size.s_20,
									borderRadius: size.s_30,
									backgroundColor: 'rgba(0,0,0,0.5)',
									flexDirection: 'row',
									height: '100%',
									alignItems: 'center',
									gap: size.s_10,
									justifyContent: 'center'
								}}
							>
								<Icons.UserIcon width={size.s_24} height={size.s_24} color={baseColor.white} />
								<Text style={styles.textMyQRCode}>{t('myQRCode')}</Text>
							</View>
						</TouchableOpacity>
						<View style={{ width: size.s_50, backgroundColor: 'transparent' }} />
					</View>

					<View style={styles.mainOverlay}></View>
					<View style={styles.overlayCenter}>
						<View style={styles.overlayCenterSub} />
						<View style={styles.square} />
						<View style={styles.overlayCenterSub} />
					</View>
					<View style={styles.mainOverlay}></View>
					<TouchableOpacity style={styles.iconLibrary} onPress={openLibrary}>
						<Icons.ImageIcon width={size.s_34} height={size.s_34} />
					</TouchableOpacity>
				</View>
			) : (
				<LinearGradient
					start={{ x: 0, y: 1.2 }}
					end={{ x: 1, y: 0 }}
					colors={[baseColor.white, Colors.bgViolet, Colors.textLink]}
					style={styles.popupLogin}
				>
					<View style={styles.popupLoginSub}>
						{themeBasic === ThemeModeBase.DARK ? (
							<LogoMezonDark width={size.s_100} height={size.s_80} />
						) : (
							<LogoMezonLight width={size.s_100} height={size.s_80} />
						)}
						<Text style={styles.title}>{isSuccess ? `${t('youAreIn')}` : `${t('logInOnNewDevice')}`}</Text>
						{isSuccess ? (
							<Text style={styles.subTitleSuccess}>{t('youAreLoggedInOnDesktop')}</Text>
						) : (
							<Text style={styles.subTitle}>{t('neverScanALoginQRCodeFromAnotherUser')}</Text>
						)}
						<TouchableOpacity style={styles.button} onPress={isSuccess ? onGoback : onConfirmLogin}>
							<Text style={styles.buttonTextOutline}>{isSuccess ? `${t('startTalking')}` : `${t('logIn')}`}</Text>
						</TouchableOpacity>
						{!isSuccess && (
							<TouchableOpacity style={[styles.button, { backgroundColor: 'transparent', marginTop: size.s_10 }]} onPress={onGoback}>
								<Text style={styles.buttonTextOutline}>{t('cancel')}</Text>
							</TouchableOpacity>
						)}
					</View>
				</LinearGradient>
			)}
		</View>
	);
};
