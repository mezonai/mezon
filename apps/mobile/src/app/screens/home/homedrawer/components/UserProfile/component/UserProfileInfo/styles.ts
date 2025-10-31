import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		username: {
			color: colors.textStrong,
			fontSize: size.h6,
			fontWeight: '600',
			marginBottom: size.s_2
		},
		subUserName: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '400'
		}
	});
