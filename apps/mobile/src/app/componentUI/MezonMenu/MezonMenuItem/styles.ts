import type { Attributes } from '@mezon/mobile-ui';
import { Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		btn: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			backgroundColor: colors.border,
			paddingLeft: Metrics.size.xl
		},

		btnTextWrapper: {
			flexBasis: 10,
			flexGrow: 1
		},

		btnTitle: {
			color: colors.text,
			fontSize: Fonts.size.medium,
			fontWeight: '600'
		},

		btnDescription: {
			marginTop: Metrics.size.s,
			color: colors.text,
			fontSize: Fonts.size.small
		},

		btnTitleWrapper: {
			padding: Metrics.size.xl,
			paddingLeft: 0,
			flexGrow: 1,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: Metrics.size.s,
			flexBasis: 10
		},
		borderBottom: {
			borderBottomColor: colors.tertiary,
			borderBottomWidth: 1
		},

		disable: {
			opacity: 0.5
		},

		previewValue: {
			color: colors.text,
			fontSize: Fonts.size.small
		}
	});
