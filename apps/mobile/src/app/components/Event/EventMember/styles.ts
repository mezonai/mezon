import type { Attributes } from '@mezon/mobile-ui';
import { Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			padding: Metrics.size.xl
		},

		emptyScreen: {
			paddingVertical: size.s_40,
			alignItems: 'center',
			gap: size.s_8
		},

		emptyText: {
			color: colors.textDisabled,
			fontSize: size.s_16
		},

		item: {
			flexDirection: 'row',
			alignItems: 'center',
			marginVertical: size.s_6
		},

		text: {
			color: colors.text,
			marginLeft: Metrics.size.l,
			fontWeight: '500'
		}
	});
