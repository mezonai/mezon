import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		itemSuggestion: {
			paddingVertical: size.s_10,
			flexDirection: 'row',
			gap: size.s_18,
			alignItems: 'center'
		},
		titleSuggestion: {
			fontSize: size.medium,
			color: colors.text
		},
		avatarImage: {
			width: size.s_24,
			height: size.s_24,
			borderRadius: 50
		}
	});
