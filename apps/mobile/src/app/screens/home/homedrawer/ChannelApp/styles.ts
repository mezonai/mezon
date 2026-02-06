import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

const height = Dimensions.get('window').height;
export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			height: '100%',
			width: '100%',
			backgroundColor: colors.primary,
			position: 'absolute',
			top: 0,
			left: 0
		},
		containerWebview: {
			width: '100%',
			height: '100%'
		},
		row: {
			flexDirection: 'row',
			gap: size.s_10
		},
		backButton: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			width: '100%',
			top: 0,
			zIndex: 1000,
			overflow: 'hidden'
		},
		backButtonLandscape: {
			top: 0,
			paddingHorizontal: size.s_10,
			paddingTop: size.s_10
		},
		reloadButton: {
			borderRadius: size.s_30,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			justifyContent: 'space-between',
			padding: size.s_6,
			alignItems: 'center',
			position: 'absolute',
			gap: size.s_6,
			top: size.s_6,
			right: size.s_10,
			zIndex: 1000,
			flexDirection: 'row'
		},
		title: {
			fontSize: size.s_16,
			fontWeight: 'bold',
			color: colors.textStrong
		},

		buttonText: {
			fontSize: size.s_12,
			color: 'white',
			marginRight: size.s_2,
			fontWeight: 'bold'
		},
		toolTip: {
			minWidth: 220,
			padding: 0,
			borderRadius: size.s_10,
			backgroundColor: colors.secondary,
			top: size.s_20,
			right: -size.s_10
		},
		toolTipContainer: {
			position: 'absolute',
			height: size.s_30,
			width: size.s_30,
			borderRadius: size.s_30,
			top: 0,
			right: 0,
			zIndex: 1000
		},
		toggleButton: {
			borderColor: colors.textDisabled,
			borderWidth: 1,
			borderRadius: size.s_30,
			backgroundColor: colors.primary,
			padding: size.s_8,
			justifyContent: 'center',
			alignItems: 'center',
			position: 'absolute',
			right: size.s_10,
			zIndex: 1000
		},
		closeButton: {
			padding: size.s_8,
			paddingRight: size.s_2
		},
		bubbleButton: {
			transform: [{ rotate: '180deg' }]
		}
	});
