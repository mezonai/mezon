import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = () =>
	StyleSheet.create({
		container: {
			backgroundColor: baseColor.white,
			borderRadius: size.s_12,
			padding: size.s_16,
			alignItems: 'center',
			gap: size.s_12
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		headerText: {
			fontSize: size.s_22,
			fontWeight: 'bold',
			color: baseColor.black,
			letterSpacing: 1.1
		},
		qrWrapper: {
			width: size.s_200,
			height: size.s_200
		},
		qrCode: {
			width: '100%',
			height: '100%'
		},
		logoOverlay: {
			position: 'absolute',
			top: (size.s_200 - size.s_36) / 2,
			left: (size.s_200 - size.s_36) / 2,
			shadowColor: baseColor.black,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.2,
			shadowRadius: 4,
			elevation: 2,
			backgroundColor: baseColor.white,
			padding: 3,
			borderRadius: size.s_8
		},
		clanLogo: {
			width: size.s_36,
			height: size.s_36,
			borderRadius: size.s_6
		},
		clanLogoFallback: {
			width: size.s_36,
			height: size.s_36,
			borderRadius: size.s_6,
			backgroundColor: baseColor.gray,
			justifyContent: 'center',
			alignItems: 'center'
		},
		fallbackText: {
			fontSize: size.s_18,
			fontWeight: 'bold',
			color: baseColor.white
		},
		divider: {
			width: size.s_100,
			height: 1,
			backgroundColor: baseColor.gray
		},
		footer: {
			marginTop: -size.s_8,
			fontSize: size.s_12,
			color: baseColor.black
		}
	});
