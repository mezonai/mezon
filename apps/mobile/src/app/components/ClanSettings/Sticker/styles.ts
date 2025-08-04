import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		header: {
			marginHorizontal: size.s_20,
			paddingBottom: size.s_20
		},
		text: {
			color: colors.textStrong
		},
		textTitle: {
			fontSize: size.s_14,
			fontWeight: 'bold',
			textTransform: 'uppercase',
			color: colors.textStrong,
			marginTop: size.s_6,
			marginBottom: size.s_4,
		},
		textDescription: {
			marginLeft: size.s_10,
			lineHeight: size.s_16,
			fontSize: size.s_12
		},
		btn: {
			marginBottom: size.s_20,
			marginHorizontal: size.s_16
		},

		btnTitle: {
			color: baseColor.white
		},
		addButton: {
			height: size.s_30,
			backgroundColor: baseColor.blurple,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_15,
			marginVertical: size.s_15
		},
		buttonText: {
			fontSize: size.s_14,
			color: baseColor.white,
			fontWeight: '500'
		},
	});
