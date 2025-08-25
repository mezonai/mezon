import { Attributes, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		clansBox: {
			flex: 1
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
			height: size.s_42,
			width: size.s_42,
			borderRadius: size.s_42,
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
			backgroundColor: '#4173c3',
			width: size.s_6,
			height: '80%',
			top: '20%',
			left: -13,
			borderTopRightRadius: 10,
			borderBottomEndRadius: 10,
			position: 'absolute'
		}
	});
