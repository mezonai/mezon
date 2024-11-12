import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		text: {
			color: colors.white
		},
		imageWrapper: {
			height: size.s_28,
			width: size.s_28,
			borderRadius: size.s_14
		}
	});
