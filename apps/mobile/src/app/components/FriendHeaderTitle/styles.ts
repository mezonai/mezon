import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			alignItems: 'center'
		},
		title: {
			color: colors.textStrong,
			fontSize: size.s_15,
			fontWeight: '600'
		},
		subtitle: {
			color: colors.textDisabled,
            fontSize: size.s_10
		}
	});
