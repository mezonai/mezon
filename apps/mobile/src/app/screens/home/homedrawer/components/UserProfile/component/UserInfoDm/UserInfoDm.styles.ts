import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		title: {
			fontSize: size.medium,
			fontWeight: '700',
			color: colors.textStrong,
			marginBottom: size.s_6
		},
		desc: {
			fontSize: size.label,
			fontWeight: '400',
			color: colors.text
		},
		kickBtnContainer: {
			backgroundColor: colors.primary
		}
	});
