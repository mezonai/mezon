import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: Metrics.size.xl,
			marginHorizontal: Metrics.size.l,
			paddingVertical: Metrics.size.xl,
			borderWidth: 1,
			borderColor: colors.border,
			borderRadius: 15,
			backgroundColor: colors.secondary,
			gap: Metrics.size.m
		},

		title: {
			color: colors.text,
			fontSize: Fonts.size.h7,
			fontWeight: 'bold'
		},

		description: {
			fontSize: Fonts.size.h8,
			color: colors.textDisabled
		},

		mainSection: {
			gap: Metrics.size.m
		},

		inline: {
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'center',
			gap: Metrics.size.s
		},

		smallText: {
			color: colors.text,
			fontSize: Fonts.size.h8
		},

		highlight: {
			color: baseColor.green
		},

		privateArea: {
			marginBottom: size.s_8
		},

		privatePanel: {
			backgroundColor: baseColor.redStrong,
			justifyContent: 'center',
			alignItems: 'center',
			padding: size.s_2,
			borderRadius: size.s_2,
			paddingHorizontal: size.s_2,
			position: 'absolute'
		},

		privateText: {
			color: baseColor.white,
			fontSize: Fonts.size.h9,
			lineHeight: Fonts.size.h8
		},
		cover: {
			height: size.s_80,
			width: '100%'
		},
		avatarContainer: {
			width: size.s_18,
			height: size.s_18,
			borderRadius: size.s_18,
			overflow: 'hidden'
		},
		badgeClanEvent: {
			backgroundColor: baseColor.blurple
		},
		badgeChannelEvent: {
			backgroundColor: baseColor.orange
		}
	});
