import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			marginBottom: size.s_10
		},
		field: {
			gap: size.s_6
		},
		name: {
			color: colors.white,
			fontWeight: 'bold',
			fontSize: size.medium
		},
		value: {
			color: colors.text,
			fontSize: size.s_13,
			marginTop: size.s_6
		}
	});
