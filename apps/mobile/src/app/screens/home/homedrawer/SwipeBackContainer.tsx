import React, { useCallback, useRef } from 'react';
import { Animated, Dimensions, Platform, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
const SCREEN_WIDTH = Dimensions.get('window').width;

const SwipeBackContainer = ({ children, handleBack }) => {
	const translateX = useRef(new Animated.Value(0)).current;

	const onHandlerStateChange = useCallback(
		(event: { nativeEvent: { translationX: any; velocityX: any } }) => {
			const { translationX, velocityX } = event.nativeEvent;
			if (translationX > 50 && velocityX > 300) {
				Animated.timing(translateX, {
					toValue: SCREEN_WIDTH * 0.2,
					duration: 100,
					useNativeDriver: true
				}).start(() => {
					handleBack?.();
				});
			}
		},
		[handleBack, translateX]
	);
	return (
		<View
			style={{
				flex: 1
			}}
		>
			{Platform.OS === 'ios' ? (
				children
			) : (
				<PanGestureHandler failOffsetY={[-5, 5]} onHandlerStateChange={onHandlerStateChange}>
					<View style={{ flex: 1 }}>{children}</View>
				</PanGestureHandler>
			)}
		</View>
	);
};

export default SwipeBackContainer;
