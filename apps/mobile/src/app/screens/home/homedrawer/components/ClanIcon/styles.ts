import { Attributes, Colors, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperClanIcon: {
			alignItems: 'center',
			marginTop: size.s_10
		},

		clanIcon: {
			height: size.s_48,
			width: size.s_48,
			borderRadius: size.s_48,
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
			height: size.s_48,
			width: size.s_48,
			borderRadius: size.s_48,
			overflow: 'hidden'
		},

		logoClanActive: {
			borderRadius: verticalScale(15)
		},

		clanIconActive: {
			backgroundColor: colors.secondary,
			borderRadius: verticalScale(15)
		},
		lineActiveClan: {
			backgroundColor: Colors.azureBlue,
			width: size.s_6,
			height: '80%',
			top: '10%',
			left: 0,
			borderTopRightRadius: 10,
			borderBottomEndRadius: 10,
			position: 'absolute'
		},
		badge: {
			backgroundColor: Colors.red,
			position: 'absolute',
			borderRadius: size.s_20,
			borderWidth: size.s_2,
			borderColor: Colors.secondary,
			minWidth: size.s_20,
			height: size.s_20,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: -5,
			right: 5
		},
		badgeText: {
			color: Colors.white,
			fontWeight: 'bold',
			fontSize: size.tiny
		}
	});
