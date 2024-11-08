import { useAuth } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { baseColor, Block, size } from '@mezon/mobile-ui';
import { appActions } from '@mezon/store';
import { getStoreAsync } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { isNumeric } from '../../../utils/helpers';
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
	const [tokenCode, setTokenCode] = useState<string>('');
	const [isSuccess, setIsSuccess] = useState<boolean>(false);
	const { confirmLoginRequest } = useAuth();

	const codeScanner = useCodeScanner({
		codeTypes: ['qr'],
		onCodeScanned: (codes) => {
			if (isNumeric(codes?.[0]?.value)) {
				setValueCode(codes?.[0]?.value);
			} else {
				setTokenCode(codes?.[0]?.value);
			}
		}
	});

	useEffect(() => {
		const requestCameraPermission = async () => {
			const permission = await Camera.requestCameraPermission();
			setHasPermission(permission === 'granted');
		};

		requestCameraPermission();
	}, []);

	useEffect(() => {
		if (tokenCode) {
			navigation.navigate(APP_SCREEN.SETTINGS.STACK, {
				screen: APP_SCREEN.SETTINGS.SEND_COFFEE,
				params: {
					formValue: tokenCode
				}
			});
		}
	}, [navigation, tokenCode]);

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

	if (device == null || !hasPermission) {
		return (
			<View style={styles.wrapper}>
				<ImageBackground source={BG_LOGIN} style={styles.popupLogin}>
					<TouchableOpacity
						style={styles.backHeader}
						onPress={() => {
							navigation.goBack();
						}}
					>
						<Icons.CloseSmallBoldIcon width={size.s_28} height={size.s_28} color={baseColor.white} />
					</TouchableOpacity>
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
					<TouchableOpacity
						style={styles.backHeader}
						onPress={() => {
							navigation.goBack();
						}}
					>
						<Icons.CloseSmallBoldIcon width={size.s_28} height={size.s_28} color={baseColor.white} />
					</TouchableOpacity>
					<View style={styles.mainOverlay}></View>
					<View style={styles.overlayCenter}>
						<View style={styles.overlayCenterSub} />
						<View style={styles.square} />
						<View style={styles.overlayCenterSub} />
					</View>
					<View style={styles.mainOverlay}></View>
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
