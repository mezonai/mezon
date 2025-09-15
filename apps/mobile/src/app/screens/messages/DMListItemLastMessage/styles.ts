import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			flex: 1,
			alignItems: 'center',
			overflow: 'hidden'
		},
		message: {
			fontSize: size.small,
			color: colors.text,
			overflow: 'hidden'
		},
		emoji: {
			height: size.s_12,
			width: size.s_12,
			flexShrink: 0
		},
		emojiWrap: {
			height: size.s_16,
			width: size.s_12,
			justifyContent: 'center',
			overflow: 'hidden'
		}
	});
