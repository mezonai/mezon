import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		languageSettingContainer: {
			backgroundColor: theme.primary,
			flex: 1,
			paddingHorizontal: size.s_18
		},
		languageItem: {
			flexDirection: 'row',
			backgroundColor: theme.secondary,
			padding: size.s_10,
			justifyContent: 'space-between',
			alignItems: 'center',
			height: size.s_42
		},
		optionText: {
			color: theme.text,
			fontSize: size.s_14
		},
		contributeText: {
			fontStyle: 'italic',
			fontSize: size.s_12
		},
		itemSeparator: {
			height: 1
		}
	});
