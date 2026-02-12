import { size, type Attributes } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		wrapper: {
			width: '100%'
		},
		container: {
			width: '100%',
			backgroundColor: colors.secondaryLight,
			padding: isTabletLandscape ? size.s_20 : size.s_10,
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: size.s_10
		},
		title: {
			color: colors.textLink,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		row: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: size.s_4,
			paddingVertical: size.s_4
		},
		description: {
			color: colors.text,
			fontSize: size.s_12
		},
		image: {
			width: size.s_50,
			height: size.s_50
		}
	});
