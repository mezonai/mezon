import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: any) =>
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
			justifyContent: 'space-between'
		},
		optionText: {
			color: theme.text,
			fontSize: size.s_14,
			paddingVertical: size.s_3
		},
		itemSeparator: {
			height: 1
		}
	});
