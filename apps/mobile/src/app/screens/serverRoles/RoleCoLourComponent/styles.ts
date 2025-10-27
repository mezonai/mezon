import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		roleButton: {
			backgroundColor: colors.secondary,
			padding: size.s_10,
			marginVertical: size.s_10,
			borderRadius: size.s_8,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between'
		},
		textBtn: {
			fontSize: size.small,
			fontWeight: '500',
			color: colors.white,
			textAlign: 'center'
		},
		colorText: {
			fontSize: size.small,
			color: colors.textDisabled
		},
		checkedIcon: {
			color: colors.black
		},

		labelContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},

		colorContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		},

		colorBox: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_6
		}
	});
