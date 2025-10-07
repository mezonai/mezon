import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		roleButton: {
			backgroundColor: colors.secondary,
			padding: size.s_10,
			marginBottom: size.s_10,
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
		tailButton: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_20
		},
		deleteButton: {
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_4,
			borderWidth: 1,
			borderColor: baseColor.red,
			padding: size.s_8
		},
		deleteText: {
			color: baseColor.red
		},
		imagePicker: {
			borderRadius: size.s_50
		}
	});
