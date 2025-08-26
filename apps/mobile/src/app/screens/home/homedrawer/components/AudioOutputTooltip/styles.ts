import { Attributes, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		toolTip: {
			flex: 1,
			height: '100%',
			width: '100%',
			padding: 0,
			borderRadius: size.s_10,
			backgroundColor: colors.secondary,
			top: Platform.OS === 'android' ? 0 : size.s_50,
			right: Platform.OS === 'android' ? -size.s_30 : 0
		},
		toolTipContainer: {
			position: 'absolute',
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_30,
			top: 0,
			right: 0,
			zIndex: 1000,
			flex: 1
		},
		iconTooltip: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_30,
			justifyContent: 'center',
			alignItems: 'center',
			alignSelf: 'center',
			backgroundColor: colors.secondary,
			borderColor: colors.border,
			borderWidth: 1
		},
		iconTooltipActive: {
			backgroundColor: colors.white
		},
		tooltipButton: {
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_40,
			width: size.s_40,
			height: size.s_40
		}
	});
