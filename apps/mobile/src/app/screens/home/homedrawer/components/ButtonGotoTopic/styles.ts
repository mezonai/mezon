import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6,
			marginTop: size.s_10,
			paddingVertical: size.s_6,
			paddingHorizontal: size.s_10,
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_6
		},
		title: {
			fontSize: size.small,
			color: colors.text
		}
	});
