import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		toolTip: {
			height: '100%',
			padding: 0,
			borderRadius: size.s_10,
			backgroundColor: colors.secondary,
			top: size.s_20,
			right: -size.s_10
		},
		toolTipContainer: {
			position: 'absolute',
			height: 'auto',
			width: size.s_30,
			borderRadius: size.s_30,
			top: 0,
			right: 0,
			zIndex: 1000,
			flex: 1
		},
		iconTooltip: {
			borderRadius: size.s_30,
			justifyContent: 'space-between',
			alignItems: 'center',
			zIndex: 1000,
			left: size.s_10,
			flexDirection: 'row'
		},
		tooltipButton: {
			height: size.s_20,
			width: size.s_20
		}
	});
