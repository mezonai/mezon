import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			borderRadius: size.s_12,
			marginTop: size.s_4,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_12,
			backgroundColor: colors.secondaryLight,
			marginRight: size.s_80
		},
		info: {
			flexDirection: 'row',
			marginBottom: size.s_4
		},
		title: {
			color: colors.text,
			fontSize: size.s_14,
			marginBottom: size.s_4,
			fontWeight: 'bold'
		},
		lightTitle: {
			color: colors.text,
			fontSize: size.small
		},
		seperatedItem: {
			height: 1,
			backgroundColor: colors.primary
		},
		transaction: {
			justifyContent: 'center',
			alignItems: 'center'
		},
		buttonTitle: {
			marginTop: size.s_8,
			color: baseColor.blurple,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		transactionTitle: {
			color: baseColor.blurple,
			fontSize: size.small
		}
	});
