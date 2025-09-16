import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
import { transparent } from 'tailwindcss/colors';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.secondary,
			flex: 1
		},
		main: {
			flex: 1,
			marginBottom: size.s_50
		},
		menuHeader: {
			width: '100%',
			backgroundColor: transparent,
			padding: 10,
			borderRadius: 10,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			zIndex: 10
		},
		buttonCircle: {
			backgroundColor: colors.badgeHighlight,
			padding: size.s_12,
			borderRadius: size.s_100
		},
		buttonCircleActive: {
			backgroundColor: colors.text
		},
		card: {
			flex: 1,
			margin: size.s_10,
			borderRadius: size.s_10,
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.primary,
			overflow: 'hidden',
			zIndex: 10
		},
		cardNoVideo: {
			alignItems: 'center',
			justifyContent: 'center'
		},
		menuFooter: {
			marginBottom: size.s_40,
			width: '75%',
			alignSelf: 'center',
			padding: size.s_20,
			alignItems: 'center',
			zIndex: 10,
			gap: size.s_30,
			flexDirection: 'row',
			justifyContent: 'space-around'
		},
		menuIcon: {
			justifyContent: 'center',
			alignItems: 'center',
			position: 'relative',
			width: size.s_50 + size.s_4,
			height: size.s_50 + size.s_4,
			backgroundColor: colors.badgeHighlight,
			opacity: 0.5,
			borderRadius: size.s_100
		},
		menuIconActive: {
			backgroundColor: colors.white,
			opacity: 1
		},
		avatar: {
			width: size.s_70,
			height: size.s_70,
			borderRadius: size.s_70,
			alignSelf: 'center'
		},
		titleConfirm: {
			color: colors.text,
			marginVertical: size.s_10,
			fontSize: size.s_18,
			textAlign: 'center'
		},
		containerStatusState: {
			gap: size.s_4,
			flexDirection: 'row',
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: 11
		},
		statusMain: {
			width: '100%'
		},
		textStatus: {
			color: '#fabf2b',
			fontSize: size.s_16,
			textAlign: 'center'
		},
		textDescControl: {
			color: colors.text,
			fontSize: size.s_12,
			textAlign: 'center',
			fontWeight: '600',
			marginTop: size.s_10
		},
		cardMyVideoCall: {
			position: 'absolute',
			width: size.s_140,
			height: size.s_165,
			top: size.s_10,
			right: size.s_10,
			borderRadius: size.s_10,
			overflow: 'hidden',
			borderWidth: 1,
			borderColor: colors.border
		}
	});
