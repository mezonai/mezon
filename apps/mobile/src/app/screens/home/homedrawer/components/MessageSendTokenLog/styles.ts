import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			maxWidth: '95%',
			borderRadius: size.s_12,
			overflow: 'hidden',
			marginTop: size.s_4,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_12,
			backgroundColor: colors.secondaryLight
		},
		info: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginBottom: size.s_4,
			paddingHorizontal: size.s_8
		},
		title: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		lightTitle: {
			color: colors.text,
			fontSize: size.small
		},
		seperatedItem: {
			height: 1,
			backgroundColor: colors.borderDim
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
