import { Attributes, Fonts, Metrics, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		avatarWrapper: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: size.s_10,
			overflow: 'hidden'
		},

		container: {
			padding: Metrics.size.xl,
			paddingTop: 0
		},

		serverName: {
			color: colors.textStrong,
			fontSize: Fonts.size.s_18,
			fontWeight: '700',
			marginBottom: Metrics.size.m
		},

		header: {
			gap: Metrics.size.l
		},

		actionWrapper: {
			flexDirection: 'row',
			gap: Metrics.size.m,
			padding: Metrics.size.m,
			justifyContent: 'space-between',
			minWidth: '100%'
		}
	});
