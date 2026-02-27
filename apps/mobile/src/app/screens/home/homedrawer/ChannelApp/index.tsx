/* eslint-disable no-empty */
import { size, useTheme } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { channelAppActions, selectAppChannelById, useAppDispatch } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { clamp, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import StatusBarHeight from '../../../../components/StatusBarHeight/StatusBarHeight';
import WebviewBase from '../../../../components/WebviewBase';
import { IconCDN } from '../../../../constants/icon_cdn';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import { style } from './styles';

const { width, height } = Dimensions.get('screen');

const SPRING_CONFIG = {
	damping: 15,
	stiffness: 150,
	mass: 1,
	overshootClamping: false
};

const BUBBLE_SPRING_CONFIG = {
	damping: 20,
	stiffness: 180,
	mass: 1
};

const TIMING_CONFIG = {
	duration: 300
};

const ChannelAppScreen = ({ navigation, route }: { navigation: any; route: any }) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const dispatch = useAppDispatch();
	const paramsRoute = route?.params;
	const styles = style(themeValue);
	const [uri, setUri] = useState<string>('');
	const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
	const scale = useSharedValue(1);
	const hasMoved = useSharedValue(false);
	const headerHeight = useSharedValue(50);
	const headerOpacity = useSharedValue(1);
	const bubbleOpacity = useSharedValue(0);
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const appChannel = useAppSelector((state) => selectAppChannelById(state, paramsRoute?.channelId || ''));
	const [windowWidth, setWindowWidth] = useState(width);
	const [windowHeight, setWindowHeight] = useState(height);

	const insets = useSafeAreaInsets();

	const computedEntitySize = useMemo(() => {
		return {
			button: isTabletLandscape ? size.s_40 : size.s_32,
			marginLeft: isTabletLandscape ? size.s_8 : size.s_6
		};
	}, [isTabletLandscape]);

	const initialBounds = useMemo(() => {
		const startY = Platform.OS === 'android' ? size.s_10 : size.s_100 + size.s_10;
		return {
			MIN_X: -windowWidth + size.s_50,
			MAX_X: size.s_10,
			MIN_Y: -startY + size.s_4 + (Platform.OS === 'android' ? 0 : insets.top),
			MAX_Y: windowHeight - startY - computedEntitySize.button - size.s_10 - (Platform.OS === 'android' ? 0 : insets.bottom)
		};
	}, [computedEntitySize?.button, insets?.bottom, insets?.top, windowHeight, windowWidth]);

	const getUrlChannelApp = useCallback(async () => {
		if (appChannel.app_id && appChannel.app_url) {
			const hashData = await dispatch(
				channelAppActions.generateAppUserHash({
					appId: appChannel.app_id
				})
			).unwrap();
			if (hashData.web_app_data) {
				const encodedHash = encodeURIComponent(hashData.web_app_data);
				const urlWithHash = `${appChannel.app_url}?data=${encodedHash}`;
				setUri(urlWithHash);
			}
		}
	}, [appChannel?.app_id, appChannel?.app_url, dispatch]);

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
			setWindowHeight(height);
			setWindowWidth(width);
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

	const hideHeader = useCallback(() => {
		headerHeight.value = withTiming(0, TIMING_CONFIG);
		headerOpacity.value = withTiming(0, TIMING_CONFIG);
		bubbleOpacity.value = withTiming(1, TIMING_CONFIG);
	}, []);

	const resetTimer = useCallback(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			runOnJS(hideHeader)();
		}, 5000);
	}, [hideHeader]);

	const showHeader = useCallback(() => {
		headerHeight.value = withTiming(50, TIMING_CONFIG);
		headerOpacity.value = withTiming(1, TIMING_CONFIG);
		bubbleOpacity.value = withTiming(0, TIMING_CONFIG);
		runOnJS(resetTimer)();
	}, [resetTimer]);

	useEffect(() => {
		showHeader();
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		height: headerHeight.value,
		opacity: headerOpacity.value,
		zIndex: 1
	}));

	const bubbleAnimatedStyle = useAnimatedStyle(() => ({
		opacity: 0.5,
		transform: [{ scale: bubbleOpacity.value }, { translateX: translateX.value }, { translateY: translateY.value }] as any,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4
		},
		shadowOpacity: 0.45,
		shadowRadius: 3.84,
		zIndex: 10001
	}));

	const tapGesture = useMemo(
		() =>
			Gesture.Tap()
				.maxDuration(200)
				.onEnd(() => {
					scale.value = withSequence(withSpring(1.5, BUBBLE_SPRING_CONFIG), withSpring(1, BUBBLE_SPRING_CONFIG));
					runOnJS(showHeader)();
				}),
		[showHeader]
	);

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.minDistance(5)
				.onBegin(() => {
					hasMoved.value = false;
					scale.value = withSpring(1.1, SPRING_CONFIG);
				})
				.onChange(({ changeX, changeY }) => {
					if (Math.abs(changeX) > 0 || Math.abs(changeY) > 0) {
						hasMoved.value = true;
					}
					translateX.value = clamp(translateX.value + changeX, initialBounds.MIN_X, initialBounds.MAX_X);
					translateY.value = clamp(translateY.value + changeY, initialBounds.MIN_Y, initialBounds.MAX_Y);
				})
				.onFinalize(() => {
					scale.value = withSpring(1, SPRING_CONFIG);
				}),
		[hasMoved, initialBounds?.MAX_X, initialBounds?.MAX_Y, initialBounds?.MIN_X, initialBounds?.MIN_Y, scale, translateX, translateY]
	);

	const gesture = useMemo(() => Gesture.Exclusive(panGesture, tapGesture), [panGesture, tapGesture]);

	return (
		<View style={styles.container}>
			<GestureHandlerRootView style={styles.containerWebview}>
				{orientation === 'Portrait' && Platform.OS === 'ios' && <StatusBarHeight />}
				<Animated.View
					style={[
						styles.backButton,
						animatedStyle,
						orientation === 'Landscape' && styles.backButtonLandscape,
						Platform.OS === 'ios' && { backgroundColor: themeValue.primary }
					]}
				>
					{Platform.OS === 'ios' && (
						<LinearGradient
							start={{ x: 1, y: 0 }}
							end={{ x: 0, y: 0 }}
							colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
							style={[StyleSheet.absoluteFill]}
						/>
					)}

					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<MezonIconCDN icon={IconCDN.closeIcon} height={size.s_24} width={size.s_24} color={themeValue.text} />
					</TouchableOpacity>
					<Text style={styles.title}>{appChannel?.app_name}</Text>
					<TouchableOpacity onPress={hideHeader} style={styles.toggleButton}>
						<MezonIconCDN
							icon={IconCDN.chevronDownSmallIcon}
							height={size.s_20}
							width={size.s_20}
							color={themeValue.text}
							customStyle={styles.bubbleButton}
						/>
					</TouchableOpacity>
				</Animated.View>
				<GestureDetector gesture={gesture}>
					<Animated.View
						style={[
							{
								position: 'absolute',
								top: Platform.OS === 'android' ? size.s_10 : size.s_60,
								right: size.s_10,
								alignSelf: 'center',
								backgroundColor: themeValue.primary,
								borderRadius: size.s_20,
								padding: size.s_8,
								shadowColor: '#000',
								shadowOffset: {
									width: 0,
									height: 2
								},
								shadowOpacity: 0.25,
								shadowRadius: 3.84,
								elevation: 5,
								zIndex: 10000
							},
							bubbleAnimatedStyle
						]}
					>
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_24} width={size.s_24} color={themeValue.text} />
					</Animated.View>
				</GestureDetector>
				<WebviewBase
					url={uri}
					incognito={true}
					style={styles.container}
					javaScriptEnabled={true}
					nestedScrollEnabled={true}
					onGoBack={onClose}
				/>
			</GestureHandlerRootView>
		</View>
	);
};

export default ChannelAppScreen;
