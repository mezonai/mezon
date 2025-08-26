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
			backgroundColor: colors.primary,
			padding: size.s_8,
			borderRadius: size.s_22
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
			position: 'absolute',
			bottom: size.s_30,
			width: '100%',
			padding: size.s_20,
			gap: size.s_10,
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 10
		},
		menuIcon: {
			justifyContent: 'center',
			alignItems: 'center',
			position: 'relative',
			width: size.s_50,
			height: size.s_50,
			backgroundColor: colors.badgeHighlight,
			borderRadius: size.s_30
		},
		menuIconActive: {
			backgroundColor: colors.white
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
		}
	});
