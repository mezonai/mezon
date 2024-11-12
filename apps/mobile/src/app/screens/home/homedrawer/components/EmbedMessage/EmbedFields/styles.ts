import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		name: {
			color: colors.white,
			fontWeight: 'bold',
			fontSize: size.medium,
			marginTop: size.s_10
		},
		value: {
			color: colors.text,
			fontSize: size.s_13,
			marginTop: size.s_6
		}
	});
