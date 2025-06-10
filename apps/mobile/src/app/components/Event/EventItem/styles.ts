import { Attributes, baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: Metrics.size.xl,
			paddingVertical: Metrics.size.xl,
			borderWidth: 1,
			borderColor: colors.border,
			borderRadius: 15,
			backgroundColor: colors.secondary,
			gap: Metrics.size.xs
		},
		description: {
			fontSize: Fonts.size.h8,
			color: colors.text
		},
		title: {
			fontSize: Fonts.size.h7,
			color: colors.text
		},
		infoSection: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginBottom: Metrics.size.m
		},

		inline: {
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'center',
			gap: Metrics.size.s
		},

		tinyText: {
			color: colors.text,
			fontSize: Fonts.size.tiny
		},

		smallText: {
			color: colors.text,
			fontSize: Fonts.size.h8
		},

		avatar: {
			width: Fonts.size.s_20,
			height: Fonts.size.s_20,
			borderRadius: Fonts.size.s_10,
			overflow: 'hidden'
		},

		infoRight: {
			gap: Metrics.size.l
		},

		mainSec: {
			gap: 5,
			width: '67%',
			marginBottom: Metrics.size.m
		},

		mainArea: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: size.s_10
		},

		eventLogo: {
			height: size.s_80,
			borderRadius: size.s_6,
			overflow: 'hidden',
			width: '30%'
		},
		eventLogoImage: {
			height: '100%',
			width: '100%'
		},
		privatePanel: {
			backgroundColor: baseColor.redStrong,
			justifyContent: 'center',
			alignItems: 'center',
			padding: size.s_2,
			borderRadius: size.s_2,
			alignSelf: 'flex-start'
		},

		privateText: {
			color: baseColor.white,
			fontSize: Fonts.size.h9,
			lineHeight: Fonts.size.h8
		}
	});
