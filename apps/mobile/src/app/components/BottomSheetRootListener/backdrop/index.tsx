import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { baseColor } from '@mezon/mobile-ui';
import React, { useMemo } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
interface CustomBackdropProps extends BottomSheetBackdropProps {
	onBackdropPress?: () => void;
}

const Backdrop = ({ onBackdropPress, ...props }: CustomBackdropProps) => {
	const containerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: interpolate(props.animatedIndex.value, [-1, 0], [0, 0.9], Extrapolation.CLAMP)
	}));

	const containerStyle = useMemo(
		() => [
			props.style,
			{
				backgroundColor: baseColor.black
			},
			containerAnimatedStyle
		],
		[props.style, containerAnimatedStyle]
	);
	return (
		<TouchableWithoutFeedback onPress={onBackdropPress ? onBackdropPress : null}>
			<BottomSheetBackdrop
				{...props}
				style={containerStyle}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				pressBehavior={onBackdropPress ? 'none' : 'close'}
			/>
		</TouchableWithoutFeedback>
	);
};

export default Backdrop;
