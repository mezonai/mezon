import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			paddingRight: size.s_10,
			marginVertical: size.s_4,
			borderRadius: size.s_8,
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_16,
			gap: size.s_8,
			flexDirection: 'row',
			alignItems: 'center'
		},
		content: {
			flex: 1
		},
		fileName: {
			color: colors.textStrong,
			maxWidth: '90%'
		},
		footer: {
			flex: 1,
			flexDirection: 'row',
			gap: size.s_10,
			justifyContent: 'space-between'
		},
		footerTitle: {
			color: colors.text,
			fontSize: size.small
		},
		footerTime: {
			color: colors.textDisabled,
			fontSize: size.small,
			fontWeight: '300'
		}
	});
