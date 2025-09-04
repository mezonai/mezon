import { useAuth } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { appActions, getStoreAsync } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { Snowflake } from '@theinternetfolks/snowflake';
import { safeJSONParse } from 'mezon-js';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Linking, PermissionsAndroid, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import RNQRGenerator from 'rn-qr-generator';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { getQueryParam } from '../../../utils/helpers';
import { style } from './styles';

export const QRScanner = () => {
	const { t } = useTranslation(['qrScanner']);
	const [hasPermission, setHasPermission] = useState(false);
	const [doScanBarcode, setDoScanBarcode] = useState(true);
	const navigation = useNavigation<any>();
	const [valueCode, setValueCode] = useState<string>('');
	const [cameraKey, setCameraKey] = useState(0);
	const [isNavigating, setIsNavigating] = useState(false);
	const [isSuccess, setIsSuccess] = useState<boolean>(false);
	const { confirmLoginRequest } = useAuth();
	const { themeValue } = useTheme();
	const scanningRef = useRef(true);
	const styles = style(themeValue);

	useEffect(() => {
		requestCameraPermission();
	}, []);

	useEffect(() => {
		return navigation.addListener('focus', () => {
			setCameraKey((prev) => prev + 1);
			setIsNavigating(false);
			setDoScanBarcode(true);
		});
	}, [navigation]);

	const requestCameraPermission = async () => {
		try {
			if (Platform.OS === 'android') {
				const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
				if (granted === PermissionsAndroid.RESULTS.GRANTED) {
					setHasPermission(true);
				} else {
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
			} else if (Platform.OS === 'ios') {
				setHasPermission(true);
			}
		} catch (err) {
			console.warn(err);
		}
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
			setDoScanBarcode(false);
			setIsNavigating(true);
			if (value?.includes('channel-app')) {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_NAVIGATION_DEEPLINK, value);
				return;
			}
			if (value?.includes('/invite/')) {
				const inviteMatch = value.match(/invite\/(\d+)/);
				const inviteId = inviteMatch?.[1];
				if (inviteId) {
					navigation.navigate(APP_SCREEN.INVITE_CLAN, {
						code: inviteId
					});
				}
				return;
			}
			if (value?.includes('/chat/')) {
				const chatMatch = value.match(/(?:^|\/)chat\/([^/?#]+)/);
				const username = chatMatch?.[1];
				if (username) {
					const dataParam = getQueryParam(value, 'data');
					navigation.navigate(APP_SCREEN.PROFILE_DETAIL, {
						username: username,
						data: dataParam || undefined
					});
				}
				return;
			}
			try {
				const valueObj = safeJSONParse(value || '{}');
				// case Transfer funds
				if (valueObj?.receiver_id) {
					navigation.push(APP_SCREEN.WALLET, {
						activeScreen: 'transfer',
						formValue: value
					});
					// 	case login
				} else if (value) {
					const decode = Snowflake.parse(value);
					if (decode?.timestamp && Number.isInteger(Number(value))) {
						setValueCode(value);
					}
				} else {
					// 	empty
				}
			} catch (e) {
				setDoScanBarcode(true);
				setIsNavigating(false);
			}
		} catch (error) {
			store.dispatch(appActions.setLoadingMainMobile(false));
			console.error('log  => error', error);
		} finally {
			setDoScanBarcode(true);
		}
	};

	const onMyQRCode = () => {
		navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
			screen: APP_SCREEN.SETTINGS.MY_QR_CODE
		});
	};

	if (!hasPermission) {
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
							<MezonIconCDN icon={IconCDN.closeSmallBold} width={size.s_28} height={size.s_28} color={baseColor.white} />
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
			{!isNavigating && (
				<Camera
					key={cameraKey}
					cameraType={CameraType.Back}
					showFrame={false}
					onReadCode={async (event) => {
						if (!scanningRef.current) return;
						const qrValue = event?.nativeEvent?.codeStringValue;
						scanningRef.current = false;
						if (qrValue) {
							setDoScanBarcode(false);
							await onNavigationScanned(qrValue);
						}
						await sleep(5000);
						scanningRef.current = true;
					}}
					scanBarcode={doScanBarcode}
					style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
				/>
			)}
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
							<MezonIconCDN icon={IconCDN.closeSmallBold} width={size.s_28} height={size.s_28} color={baseColor.white} />
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
								<MezonIconCDN icon={IconCDN.userIcon} width={size.s_24} height={size.s_24} color={baseColor.white} />
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
						<MezonIconCDN icon={IconCDN.imageIcon} width={size.s_34} height={size.s_34} />
					</TouchableOpacity>
				</View>
			) : (
				<LinearGradient
					start={{ x: 0, y: 1.2 }}
					end={{ x: 1, y: 0 }}
					colors={[baseColor.white, themeValue.bgViolet, baseColor.link]}
					style={styles.popupLogin}
				>
					<View style={styles.popupLoginSub}>
						<MezonIconCDN icon={IconCDN.logoMezon} width={size.s_100} height={size.s_80} useOriginalColor={true} />
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
