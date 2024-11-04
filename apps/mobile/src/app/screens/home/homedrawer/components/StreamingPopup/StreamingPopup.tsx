import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectStatusStream, useAppDispatch } from '@mezon/store';
import { appActions } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Dimensions, Keyboard, PanResponder, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import StreamingRoom from '../StreamingRoom';
import { style } from './styles';
const { width, height } = Dimensions.get('window');

export const StreamingPopup = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
	const [isFullScreen, setIsFullScreen] = useState(true);
	const streamPlay = useSelector(selectStatusStream);

	const [windowSize, setWindowSize] = useState(new Animated.ValueXY({ x: 100, y: 100 }));
	const [isAnimationComplete, setIsAnimationComplete] = useState(true);
	const dispatch = useAppDispatch();
	const [isOpenDrawer, setIsOpenDrawer] = useState(true);

	useEffect(() => {
		const showSKlListener = DeviceEventEmitter.addListener(ActionEmitEvent.OPEN_CLOSE_DRAWER, ({ isOpenDrawer }) => {
			setIsOpenDrawer(isOpenDrawer);
		});
		return () => {
			showSKlListener.remove();
		};
	}, []);
	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: () => true,
			onPanResponderMove: (event, gestureState) => {
				Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(event, gestureState);
			},
			onPanResponderRelease: () => {
				pan.extractOffset();
			}
		})
	).current;

	useEffect(() => {
		if (isFullScreen) {
			Animated.timing(windowSize, {
				toValue: { x: width, y: height },
				duration: 100,
				useNativeDriver: false
			}).start();
		}
	}, []);

	const handleResizeStreamRoom = useCallback(
		(isFullScreen: boolean) => {
			if (isFullScreen) {
				pan.setOffset({ x: 0, y: 0 });

				Animated.parallel([
					Animated.spring(pan, {
						toValue: { x: 0, y: 0 },
						useNativeDriver: false
					}),
					Animated.timing(windowSize, {
						toValue: { x: width, y: height },
						duration: 100,
						useNativeDriver: false
					})
				]).start(() => {
					setIsAnimationComplete(true);
				});
				dispatch(appActions.setHiddenBottomTabMobile(true));
			} else {
				Animated.timing(windowSize, {
					toValue: { x: 100, y: 100 },
					duration: 100,
					useNativeDriver: false
				}).start(() => {
					setIsAnimationComplete(false);
				});
				dispatch(appActions.setHiddenBottomTabMobile(!isOpenDrawer));
			}
			setIsFullScreen(isFullScreen);
			Keyboard.dismiss();
		},
		[isOpenDrawer]
	);
	if (!streamPlay) return null;
	return (
		<Animated.View
			style={[
				styles.animatedView,
				{
					width: windowSize.x,
					height: windowSize.y,
					transform: [{ translateX: pan.x }, { translateY: pan.y }],
					position: 'absolute'
				}
			]}
			{...(!isFullScreen ? panResponder.panHandlers : {})}
		>
			<TouchableOpacity activeOpacity={1} onPress={() => !isFullScreen && handleResizeStreamRoom(true)}>
				<StreamingRoom isAnimationComplete={isAnimationComplete} onPressMinimizeRoom={handleResizeStreamRoom} />
			</TouchableOpacity>
		</Animated.View>
	);
};
