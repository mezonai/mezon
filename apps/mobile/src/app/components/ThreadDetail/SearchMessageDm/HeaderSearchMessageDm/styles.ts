import type { Attributes } from '@mezon/mobile-ui';
import { size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		searchBox: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			borderRadius: verticalScale(50),
			flex: 1,
			height: size.s_40,
			paddingHorizontal: size.s_10,
			justifyContent: 'space-between'
		},
		input: {
			color: colors.text,
			flex: 1
		},
		headerContainer: {
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_20,
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_20
		},
		iconMargin: {
			marginRight: size.s_6
		}
	});
