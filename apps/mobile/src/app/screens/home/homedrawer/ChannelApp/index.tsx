/* eslint-disable no-empty */
import { size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { channelAppActions, selectAppChannelById, useAppDispatch } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../components/StatusBarHeight/StatusBarHeight';
import WebviewBase from '../../../../components/WebviewBase';
import { IconCDN } from '../../../../constants/icon_cdn';
import { style } from './styles';

const ChannelAppScreen = ({ navigation, route }: { navigation: any; route: any }) => {
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const paramsRoute = route?.params;
	const styles = style(themeValue);
	const [uri, setUri] = useState<string>('');
	const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
	const [showCloseButton, setShowCloseButton] = useState<boolean>(true);
	const animatedHeight = useRef(new Animated.Value(1)).current;
	const animatedRotation = useRef(new Animated.Value(0)).current;
	const appChannel = useAppSelector((state) => selectAppChannelById(state, paramsRoute?.channelId || ''));

	const getUrlChannelApp = useCallback(async () => {
		if (appChannel.appId && appChannel.app_url) {
			const hashData = await dispatch(
				channelAppActions.generateAppUserHash({
					appId: appChannel.appId
				})
			).unwrap();
			if (hashData.web_app_data) {
				const encodedHash = encodeURIComponent(hashData.web_app_data);
				const urlWithHash = `${appChannel.app_url}?data=${encodedHash}`;
				setUri(urlWithHash);
			}
		}
	}, [appChannel?.appId, appChannel?.app_url, dispatch]);

	useEffect(() => {
		const handleOrientationChange = (handler: { screen: any }) => {
			const screen = handler?.screen;
			const width = screen?.width;
			const height = screen?.height;
			if (width > height) {
				StatusBar.setHidden(true, 'fade');
			} else {
				StatusBar.setHidden(false, 'fade');
			}
			setOrientation(width > height ? 'Landscape' : 'Portrait');
		};
		const subscription = Platform.OS === 'ios' ? Dimensions.addEventListener('change', handleOrientationChange) : null;
		return () => {
			subscription?.remove();
		};
	}, []);

	useEffect(() => {
		getUrlChannelApp();
	}, [getUrlChannelApp]);

	const onClose = () => {
		navigation.goBack();
	};

	const toggleCloseButton = () => {
		const toValue = showCloseButton ? 0 : 1;
		const rotationValue = showCloseButton ? 1 : 0;

		Animated.parallel([
			Animated.timing(animatedHeight, {
				toValue,
				duration: 300,
				useNativeDriver: false
			}),
			Animated.timing(animatedRotation, {
				toValue: rotationValue,
				duration: 300,
				useNativeDriver: true
			})
		]).start();

		setShowCloseButton((prev) => !prev);
	};

	const heightInterpolate = animatedHeight.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 50]
	});

	const rotateInterpolate = animatedRotation.interpolate({
		inputRange: [0, 1],
		outputRange: ['180deg', '0deg']
	});

	const insets = useSafeAreaInsets();
	return (
		<Modal style={styles.container} visible={true} transparent={true} supportedOrientations={['portrait', 'landscape']}>
			{orientation === 'Portrait' && Platform.OS === 'ios' && <StatusBarHeight />}
			<Animated.View
				style={[
					styles.backButton,
					{
						height: heightInterpolate,
						opacity: animatedHeight
					},
					orientation === 'Landscape' && styles.backButtonLandscape,
					Platform.OS === 'ios' && { backgroundColor: themeValue.primary }
				]}
			>
				{Platform.OS === 'ios' && (
					<LinearGradient
						start={{ x: 1, y: 0 }}
						end={{ x: 0, y: 0 }}
						colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
						style={[StyleSheet.absoluteFillObject]}
					/>
				)}

				<TouchableOpacity onPress={onClose} style={{ padding: size.s_8, paddingRight: size.s_2 }}>
					<MezonIconCDN icon={IconCDN.closeIcon} height={size.s_24} width={size.s_24} color={themeValue.text} />
				</TouchableOpacity>
				<Text style={styles.title}>{appChannel?.app_name}</Text>
			</Animated.View>
			<TouchableOpacity
				onPress={toggleCloseButton}
				style={[
					styles.toggleButton,
					{ top: Platform.OS === 'ios' ? (orientation === 'Landscape' ? size.s_6 : insets.top + size.s_2) : size.s_2 },
					orientation === 'Landscape' && { right: size.s_30 }
				]}
			>
				<Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
					<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_16} width={size.s_16} color={themeValue.text} />
				</Animated.View>
			</TouchableOpacity>
			<WebviewBase url={uri} incognito={true} style={styles.container} javaScriptEnabled={true} nestedScrollEnabled={true} onGoBack={onClose} />
		</Modal>
	);
};

export default ChannelAppScreen;
