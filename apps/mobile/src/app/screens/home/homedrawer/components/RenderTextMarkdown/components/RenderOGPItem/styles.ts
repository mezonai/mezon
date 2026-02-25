import { baseColor, size, type Attributes } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		wrapper: {
			marginTop: size.s_4
		},
		container: {
			backgroundColor: colors.secondaryLight,
			padding: isTabletLandscape ? size.s_20 : size.s_10,
			borderRadius: size.s_4,
			borderLeftWidth: size.s_4,
			borderLeftColor: baseColor.purple
		},
		title: {
			color: colors.textLink,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		description: {
			color: colors.text,
			fontSize: size.s_12
		},
		image: {
			width: '98%',
			marginTop: size.s_10,
			maxHeight: size.s_150
		}
	});
