import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		userAction: {
			marginTop: size.s_20,
			gap: size.s_14,
			flexDirection: 'row',
			alignItems: 'center'
		},
		actionItem: {
			flexDirection: 'column',
			alignItems: 'center',
			padding: size.s_10,
			minWidth: size.s_80,
			gap: size.s_6,
			backgroundColor: colors.primary,
			borderRadius: 8
		},
		actionText: {
			color: colors.text,
			fontSize: size.medium
		}
	});
