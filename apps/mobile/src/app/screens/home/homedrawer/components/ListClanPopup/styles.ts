import { Attributes, Colors, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		clansBox: {
			marginTop: size.s_10
		},
		serverItem: {
			marginBottom: size.s_10
		},
		serverName: {
			flexDirection: 'row',
			gap: size.s_16,
			alignItems: 'center'
		},
		wrapperPlusClan: {
			height: size.s_48,
			width: size.s_48,
			borderRadius: size.s_48,
			overflow: 'hidden',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.secondary
		},
		createClan: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'center',
			marginVertical: size.s_10
		},
		clanName: {
			color: colors.textStrong,
			fontSize: size.label,
			fontWeight: '400',
			maxWidth: 150
		},

		activeClanItem: {
			backgroundColor: colors.secondaryLight
		},
		activeClanName: {
			fontWeight: '700',
			color: colors.white
		},
		mt10: {
			marginTop: size.s_10
		},
		wrapperClanIcon: {
			alignItems: 'center'
		},

		clanIcon: {
			height: verticalScale(50),
			width: verticalScale(50),
			borderRadius: verticalScale(50),
			overflow: 'hidden',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.black,
			marginTop: size.s_10
		},

		textLogoClanIcon: {
			color: colors.white,
			fontSize: size.s_22,
			fontWeight: '400'
		},

		logoClan: {
			height: verticalScale(70),
			width: verticalScale(70),
			resizeMode: 'cover'
		},

		clanIconActive: {
			backgroundColor: colors.secondary,
			borderRadius: verticalScale(15)
		},
		lineActiveClan: {
			backgroundColor: Colors.azureBlue,
			width: size.s_6,
			height: '80%',
			top: '20%',
			left: -13,
			borderTopRightRadius: 10,
			borderBottomEndRadius: 10,
			position: 'absolute'
		}
	});
