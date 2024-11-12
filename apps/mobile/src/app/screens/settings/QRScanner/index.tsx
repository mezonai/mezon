import { useAuth } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { baseColor, Block, size } from '@mezon/mobile-ui';
import { appActions } from '@mezon/store';
import { getStoreAsync } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import RNQRGenerator from 'rn-qr-generator';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { styles } from './styles';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BG_LOGIN from './bgLoginQR.png';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import ICON_LOGIN from './iconLogin.png';

export const QRScanner = () => {
	const [hasPermission, setHasPermission] = useState(false);
	const device = useCameraDevice('back');
	const navigation = useNavigation<any>();
	const [valueCode, setValueCode] = useState<string>('');
	const [isSuccess, setIsSuccess] = useState<boolean>(false);
	const { confirmLoginRequest } = useAuth();

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
						text1: 'An error occurred, please try again'
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
		} catch (error) {
			store.dispatch(appActions.setLoadingMainMobile(false));
			Toast.show({
				type: 'error',
				text1: 'An error occurred, please try again'
			});
		}
	};

	const onNavigationScanned = async (value: string) => {
		const store = await getStoreAsync();
		try {
			store.dispatch(appActions.setLoadingMainMobile(false));
			const valueObj = JSON.parse(value || '{}');
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
				<ImageBackground source={BG_LOGIN} style={styles.popupLogin}>
					<Block
						zIndex={100}
						flexDirection={'row'}
						position={'absolute'}
						justifyContent={'space-between'}
						top={size.s_40}
						flex={1}
						paddingHorizontal={size.s_10}
						width={'100%'}
					>
						<TouchableOpacity
							style={styles.backHeader}
							onPress={() => {
								navigation.goBack();
							}}
						>
							<Icons.CloseSmallBoldIcon width={size.s_28} height={size.s_28} color={baseColor.white} />
						</TouchableOpacity>
					</Block>
					<TouchableOpacity
						style={[styles.button, styles.buttonBorder]}
						onPress={() => {
							requestCameraPermission();
						}}
					>
						<Text style={styles.buttonText}>Request Camera Permission</Text>
					</TouchableOpacity>
				</ImageBackground>
			</View>
		);
	}

	return (
		<View style={styles.wrapper}>
			<Camera codeScanner={codeScanner} style={StyleSheet.absoluteFill} device={device} isActive={!valueCode} />
			{!valueCode ? (
				<Block flex={1}>
					<Block
						zIndex={100}
						flexDirection={'row'}
						position={'absolute'}
						justifyContent={'space-between'}
						top={size.s_40}
						flex={1}
						backgroundColor={'red'}
						paddingHorizontal={size.s_10}
						width={'100%'}
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
							<Block
								paddingHorizontal={size.s_20}
								borderRadius={size.s_30}
								backgroundColor={'rgba(0,0,0,0.5)'}
								flexDirection={'row'}
								height={'100%'}
								alignItems={'center'}
								gap={size.s_10}
								justifyContent={'center'}
							>
								<Icons.UserIcon width={size.s_24} height={size.s_24} color={baseColor.white} />
								<Text style={styles.textMyQRCode}>My QR code</Text>
							</Block>
						</TouchableOpacity>
						<Block width={size.s_50} backgroundColor={'transparent'} />
					</Block>

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
				</Block>
			) : (
				<ImageBackground source={BG_LOGIN} style={styles.popupLogin}>
					<View style={styles.popupLoginSub}>
						<FastImage source={ICON_LOGIN} style={styles.iconLogin} />
						<Text style={styles.title}>{isSuccess ? `You're in!` : `Log in on a new device?`}</Text>
						{isSuccess ? (
							<Text style={styles.subTitleSuccess}>You're now logged in on desktop</Text>
						) : (
							<Text style={styles.subTitle}>Newer scan a lgin QR code from another user.</Text>
						)}
						<TouchableOpacity style={styles.button} onPress={isSuccess ? onGoback : onConfirmLogin}>
							<Text style={styles.buttonText}>{isSuccess ? 'Start talking' : 'Log in'}</Text>
						</TouchableOpacity>
						{!isSuccess && (
							<TouchableOpacity style={[styles.button, { backgroundColor: 'transparent' }]} onPress={onGoback}>
								<Text style={styles.buttonText}>Cancel</Text>
							</TouchableOpacity>
						)}
					</View>
				</ImageBackground>
			)}
		</View>
	);
};
