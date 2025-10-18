import { Attributes, baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		main: {
			flex: 1,
			width: '100%',
			height: '100%',
			alignItems: 'center',
			justifyContent: 'center'
		},
		container: {
			backgroundColor: colors.secondary,
			padding: Metrics.size.xl,
			margin: Metrics.size.l,
			borderRadius: 10,
			overflow: 'hidden',
			width: '90%',
			marginHorizontal: 0,
			zIndex: 100
		},
		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0,0,0,0.5)'
		},
		noButton: {
			paddingVertical: size.s_10,
			borderRadius: 50,
			backgroundColor: colors.bgInputPrimary
		},
		yesButton: {
			height: size.s_40,
			borderRadius: size.s_8,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.bgViolet
		},
		buttonText: {
			color: baseColor.white,
			textAlign: 'center'
		},
		buttonsWrapper: {
			gap: size.s_10
		},
		title: {
			fontSize: size.h6,
			color: colors.white,
			paddingBottom: size.s_10
		},
		descriptionText: {
			color: colors.tertiary
		},
		textBox: {
			borderWidth: 1,
			borderColor: colors.textDisabled,
			borderRadius: size.s_8,
			marginBottom: size.s_20,
			padding: size.s_4,
			paddingHorizontal: size.s_12
		},
		input: {
			paddingVertical: size.s_10,
			color: colors.text
		}
	});
