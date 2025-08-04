import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		item: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.primary,
			borderRadius: size.s_10,
			padding: size.s_14,
			marginBottom: size.s_10,
			gap: size.s_12,
			borderColor: colors.border,
			borderWidth: 1
		},

		keyContainer: {
			borderWidth: 1,
			borderColor: colors.darkJade,
			alignSelf: 'flex-start',
			paddingHorizontal: size.s_8,
			borderRadius: size.s_6,
			backgroundColor: colors.darkJade
		},

		keyText: {
			color: colors.textSuccess,
			fontSize: size.s_14
		},

		valueText: {
			color: colors.textStrong,
			fontStyle: 'italic',
			fontSize: size.s_12,
			marginTop: size.s_6
		}
	});
