import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { baseColor } from '@mezon/mobile-ui';
import React, { useMemo } from 'react';
import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

const Backdrop = ({ ...props }: BottomSheetBackdropProps) => {
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

	return <BottomSheetBackdrop {...props} style={containerStyle} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior={'close'} />;
};

export default Backdrop;
