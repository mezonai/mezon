import { Attributes, Metrics, size } from '@mezon/mobile-ui';
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
			zIndex: 100
		},
		modalContainer: {
			backgroundColor: colors.secondaryLight,
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_14,
			borderRadius: size.s_16
		},
		headerText: {
			color: colors.white,
			fontSize: size.s_18,
			fontWeight: '500'
		},
		modalHeader: {
			paddingTop: size.s_4
		},
		modalContent: {
			flexDirection: 'row',
			paddingVertical: size.s_20,
			alignItems: 'center',
			gap: size.s_10
		},
		circleIcon: {
			backgroundColor: colors.midnightBlue,
			borderRadius: size.s_20,
			width: size.s_40,
			height: size.s_40,
			alignItems: 'center',
			justifyContent: 'center'
		},
		textContent: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '400'
		},
		modalFooter: {
			flexDirection: 'row',
			alignItems: 'center'
		},
		button: {
			padding: size.s_10,
			borderWidth: size.s_2,
			borderColor: colors.borderDim,
			width: '50%'
		},
		textButton: {
			color: colors.textLink,
			fontSize: size.label,
			fontWeight: '400',
			textAlign: 'center'
		},
		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0,0,0,0.5)'
		}
	});
