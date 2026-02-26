import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperClanIcon: {
			alignItems: 'center',
			marginTop: size.s_16,
			paddingHorizontal: size.s_12
		},

		clanIcon: {
			height: size.s_42,
			width: size.s_42,
			borderRadius: size.s_8,
			overflow: 'hidden',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.black
		},

		textLogoClanIcon: {
			color: colors.white,
			fontSize: size.s_22,
			fontWeight: '400'
		},

		logoClan: {
			height: size.s_42,
			width: size.s_42,
			borderRadius: size.s_8,
			overflow: 'hidden'
		},

		logoClanActive: {
			borderRadius: size.s_8
		},

		clanIconActive: {
			backgroundColor: colors.secondary,
			borderRadius: verticalScale(15)
		},
		lineActiveClan: {
			backgroundColor: baseColor.violetBlue,
			width: size.s_4,
			height: '90%',
			top: '5%',
			left: 0,
			borderTopRightRadius: 10,
			borderBottomEndRadius: 10,
			position: 'absolute'
		},
		badge: {
			backgroundColor: baseColor.redStrong,
			position: 'absolute',
			borderRadius: size.s_20,
			borderWidth: size.s_2,
			borderColor: colors.secondary,
			minWidth: size.s_20,
			height: size.s_20,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: -5,
			right: 5
		},
		unreadDot: {
			backgroundColor: colors.text,
			position: 'absolute',
			borderRadius: size.s_8,
			width: size.s_8,
			height: size.s_8,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: size.s_16,
			left: -size.s_4
		},
		badgeText: {
			color: 'white',
			fontWeight: 'bold',
			fontSize: size.tiny
		},
		imageFullSize: {
			width: '100%',
			height: '100%'
		}
	});
