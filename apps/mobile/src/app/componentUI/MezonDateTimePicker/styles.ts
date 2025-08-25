import { Attributes, baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		box: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			gap: Metrics.size.l,
			paddingHorizontal: Metrics.size.m,
			paddingVertical: Metrics.size.m,
			borderRadius: 10
		},
		textBox: {
			color: colors.textStrong,
			flex: 1,
			flexGrow: 1,
			flexBasis: 10,
			fontSize: Fonts.size.h7
		},

		bsContainer: {
			paddingHorizontal: Metrics.size.xl,
			flexDirection: 'row',
			justifyContent: 'center',
			marginBottom: size.s_10
		},

		sectionTitle: {
			color: colors.textStrong,
			fontSize: Fonts.size.h8,
			fontWeight: '600',
			marginBottom: Fonts.size.s_10
		},

		textApply: {
			color: baseColor.blurple,
			fontSize: Fonts.size.medium,
			fontWeight: 'bold'
		},
		btnHeaderBS: { padding: Metrics.size.l },
		textError: {
			color: colors.white,
			fontSize: size.small,
			fontWeight: '400'
		},
		wrapperError: {
			width: '100%',
			backgroundColor: baseColor.redStrong,
			marginTop: size.s_6,
			padding: size.s_6,
			borderRadius: size.s_8
		}
	});
