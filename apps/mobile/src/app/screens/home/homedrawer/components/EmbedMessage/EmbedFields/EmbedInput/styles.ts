import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		TextInput: {
			borderWidth: 1,
			borderColor: colors.border,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_8,
			borderRadius: size.s_12,
			marginBottom: size.s_10,
			color: colors.textStrong,
			fontSize: size.medium,
			flexGrow: 1
		}
	});
