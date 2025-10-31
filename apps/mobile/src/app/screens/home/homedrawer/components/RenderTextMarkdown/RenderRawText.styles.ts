import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (themeValue?: Attributes) =>
	StyleSheet.create({
		textPartsContainer: {
			flexDirection: 'row',
			gap: size.s_6,
			flexWrap: 'wrap',
			alignItems: 'flex-end'
		},
		editedText: {
			fontSize: size.small,
			color: themeValue?.textDisabled,
			marginTop: size.s_2
		},
		numberLineContainer: {
			flex: 1,
			maxHeight: size.s_20 * 10 - size.s_10,
			overflow: 'hidden'
		}
	});
