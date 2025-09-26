import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		title: {
			fontSize: size.h6,
			color: colors.text,
			textAlign: 'center',
			fontWeight: 'bold',
			marginBottom: size.s_10
		},
		description: {
			fontSize: size.s_16,
			color: colors.text,
			textAlign: 'center',
			marginBottom: size.s_10
		},
		buttonSubmit: {
			backgroundColor: baseColor.bgButtonPrimary,
			paddingVertical: size.s_10,
			borderRadius: size.s_10
		},
		buttonContinue: {
			backgroundColor: baseColor.bgDanger,
			width: '40%',
			paddingVertical: size.s_8,
			borderRadius: size.s_10
		},
		buttonNope: {
			backgroundColor: baseColor.bgButtonSecondary,
			width: '40%',
			paddingVertical: size.s_8,
			borderRadius: size.s_10
		},
		btnText: {
			fontSize: size.s_16,
			color: 'white',
			textAlign: 'center',
			fontWeight: 'bold'
		},
		datePicker: {
			backgroundColor: colors.secondaryLight,
			marginVertical: size.s_20
		}
	});
