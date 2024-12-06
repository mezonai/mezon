import { Attributes, Metrics, baseColor, size, verticalScale } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		channelListLink: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingRight: Metrics.size.l
		},

		threadItem: {
			flexDirection: 'row',
			flexGrow: 1,
			alignItems: 'flex-end'
		},

		threadItemActive: {
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_10,
			position: 'absolute',
			width: '95%',
			height: Platform.OS === 'android' ? '90%' : '95%',
			right: 0,
			top: Platform.OS === 'android' ? size.s_18 : size.s_14
		},
		boxThread: {
			flex: 1,
			marginLeft: size.s_2,
			paddingLeft: size.s_6,
			paddingTop: size.s_2,
			paddingBottom: size.s_6,
			borderRadius: size.s_10,
			marginBottom: size.s_6
		},
		titleThread: {
			flex: 1,
			fontSize: size.s_15,
			fontWeight: '600',
			color: colors.channelNormal,
			top: verticalScale(3),
			paddingBottom: size.s_2
		},

		channelListItemTitleActive: {
			color: colors.channelUnread
		},

		threadFirstItemActive: {
			height: '160%',
			right: 0,
			top: size.s_2,
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_10
		},

		channelDotWrapper: {
			backgroundColor: baseColor.redStrong,
			height: size.s_18,
			width: size.s_18,
			right: size.s_18,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_18,
			top: -size.s_2
		},

		channelDot: {
			color: baseColor.white,
			fontSize: size.s_10,
			fontWeight: 'bold'
		},
		buzzBadge: { marginBottom: size.s_10 }
	});
