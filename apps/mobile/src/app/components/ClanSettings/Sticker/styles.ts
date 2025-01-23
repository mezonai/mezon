import { Attributes, baseColor, Fonts, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingVertical: size.s_16
		},
		text: {
			color: colors.textStrong,
			marginHorizontal: size.s_16
		},
		textTitle: {
			fontSize: Fonts.size.h7,
			textTransform: 'uppercase',
			color: colors.textStrong,
			fontWeight: 'bold',
			marginTop: size.s_6,
			marginBottom: size.s_4,
			marginHorizontal: size.s_16
		},
		btn: {
			marginBottom: size.s_20,
			marginHorizontal: size.s_16
		},

		btnTitle: {
			color: baseColor.white
		}
	});
