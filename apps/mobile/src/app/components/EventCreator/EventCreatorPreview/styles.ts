import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, Fonts, Metrics } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		title: {
			color: colors.textStrong,
			fontSize: Fonts.size.h5,
			fontWeight: 'bold',
			textAlign: 'center'
		},

		subtitle: {
			color: colors.text,
			fontSize: Fonts.size.h8,
			textAlign: 'center'
		},

		bottomDescription: {
			color: colors.text,
			fontSize: Fonts.size.h8,
			marginVertical: Metrics.size.l
		},

		headerSection: {
			marginVertical: Metrics.size.xxxl
		},

		container: {
			padding: Metrics.size.xl,
			backgroundColor: colors.primary,
			flex: 1
		},

		inlineSec: {
			flexDirection: 'row',
			gap: Metrics.size.xl
		},

		section: {
			gap: Metrics.size.m
		},

		feedSection: {
			flexBasis: 10,
			flexGrow: 1,
			justifyContent: 'center'
		},

		btnWrapper: {
			paddingVertical: Metrics.size.xl,
			backgroundColor: colors.primary
		},
		titleMezonBtn: { fontSize: Fonts.size.h7, color: baseColor.white, fontWeight: '600' },
		mezonBtn: { backgroundColor: baseColor.blurple },
		headerLeftButton: {
			marginLeft: 20
		},
		headerRightButton: {
			marginRight: 20
		}
	});
