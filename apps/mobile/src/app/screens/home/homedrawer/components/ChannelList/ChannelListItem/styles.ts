import type { Attributes } from '@mezon/mobile-ui';
import { Fonts, Metrics, ThemeModeBase, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, themeBasic?: ThemeModeBase) =>
	StyleSheet.create({
		channelListLink: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingRight: Metrics.size.m
		},

		channelListItemActive: {
			borderRadius: size.s_10
		},

		channelListItemContainer: {
			zIndex: 1
		},

		channelListItemWrapper: {
			backgroundColor: themeBasic === ThemeModeBase.LIGHT ? colors.secondaryWeight : colors.secondaryLight,
			shadowColor: colors.primary,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
			zIndex: 1,
			borderRadius: size.s_10
		},

		channelListItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: size.s_12,
			borderRadius: 5,
			flex: 1,
			paddingLeft: 20
		},

		dotIsNew: {
			position: 'absolute',
			left: -10,
			width: size.s_6,
			height: size.s_6,
			borderRadius: size.s_6,
			backgroundColor: colors.textStrong
		},

		channelListItemTitle: {
			fontSize: size.medium,
			fontWeight: '600',
			marginLeft: size.s_10,
			color: colors.channelNormal,
			maxWidth: '80%'
		},

		channelListItemTitleActive: {
			color: colors.white
		},

		channelDotWrapper: {
			backgroundColor: baseColor.red,
			height: 20,
			width: 20,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: 10
		},

		channelDot: {
			color: baseColor.white,
			fontSize: Fonts.size.h8
		}
	});
