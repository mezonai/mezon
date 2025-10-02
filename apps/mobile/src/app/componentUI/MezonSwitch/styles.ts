import { Attributes, baseColor } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		switchContainer: {
			width: 50,
			height: 30,
			borderRadius: 15,
			backgroundColor: colors.textDisabled,
			justifyContent: 'center',
			padding: 2
		},
		switchContainerEnabled: {
			backgroundColor: baseColor.blurple
		},
		disabled: {
			opacity: 0.5
		},
		circle: {
			width: 26,
			height: 26,
			borderRadius: 13,
			backgroundColor: baseColor.white,
			justifyContent: 'center',
			alignItems: 'center'
		},
		circleEnabled: {
			transform: [{ translateX: 20 }]
		}
	});
