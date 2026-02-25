import { Attributes, baseColor, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperLogo: {
			alignSelf: 'center',
			paddingVertical: size.s_6,
			paddingHorizontal: size.s_10
		},

		badge: {
			backgroundColor: baseColor.redStrong,
			position: 'absolute',
			borderRadius: size.s_24,
			borderWidth: size.s_4,
			borderColor: colors.secondary,
			minWidth: size.s_24,
			height: size.s_24,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: 0,
			right: 0
		},

		badgeText: {
			color: 'white',
			fontWeight: 'bold',
			fontSize: size.tiny
		},
		wrapperPlusClan: {
			marginTop: verticalScale(5),
			height: verticalScale(50),
			width: verticalScale(50),
			borderRadius: 50,
			overflow: 'hidden',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.secondary
		},
		contentScroll: {
			paddingBottom: size.s_100
		},
		separatorLine: {
			width: '60%',
			marginTop: size.s_6,
			alignSelf: 'center'
		},
		focusDirectMessage: {
			backgroundColor: baseColor.azureBlue,
			width: size.s_6,
			height: '80%',
			top: '25%',
			left: 0,
			borderTopRightRadius: 10,
			borderBottomEndRadius: 10,
			position: 'absolute'
		}
	});
