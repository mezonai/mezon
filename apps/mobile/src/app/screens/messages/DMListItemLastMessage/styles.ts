import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			flex: 1,
			overflow: 'hidden'
		},
		message: {
			fontSize: size.small,
			color: colors.text
		},
		emoji: {
			height: size.s_12,
			width: size.s_12
		}
	});
