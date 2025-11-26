import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		title: {
			fontSize: size.regular,
			color: colors.white,
			fontWeight: '500',
			marginTop: size.s_10
		},
		hookEmpty: {
			height: 145,
			width: 272
		}
	});
