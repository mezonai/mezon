import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			flexWrap: 'wrap',
			flexShrink: 1,
			gap: size.s_6
		},
		text: {
			fontSize: size.small,
			color: colors.text
		},
		imageWrapper: {
			height: size.s_24,
			width: size.s_24,
			borderRadius: size.s_12
		}
	});
