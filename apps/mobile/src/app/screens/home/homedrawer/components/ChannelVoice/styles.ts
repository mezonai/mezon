import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
import { transparent } from 'tailwindcss/colors';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			position: 'relative',
			height: '100%',
			width: '100%'
		},
		userStreamingRoomContainer: {
			backgroundColor: baseColor.black
		},
		menuHeader: {
			width: '100%',
			backgroundColor: transparent,
			padding: size.s_10,
			borderRadius: size.s_10,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between'
		},
		menuFooter: {
			position: 'absolute',
			borderRadius: size.s_80,
			backgroundColor: colors.secondary,
			padding: size.s_10,
			alignItems: 'center',
			alignSelf: 'center',
			justifyContent: 'center'
		},
		textMenuItem: {
			fontSize: size.s_16,
			color: colors.white,
			fontWeight: '500'
		},
		buttonCircle: {
			backgroundColor: colors.border,
			padding: size.s_8,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_40,
			width: size.s_40,
			height: size.s_40
		},
		buttonCircleActive: {
			backgroundColor: colors.text
		},
		btnVoice: {
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			alignItems: 'center',
			borderRadius: size.s_22,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6
		},
		subTitle: {
			fontSize: size.s_14,
			color: colors.white,
			fontWeight: '400',
			flexGrow: 1,
			flexShrink: 1
		},
		lineBtn: { width: '100%', alignItems: 'center', padding: size.s_6 },
		menuIcon: {
			justifyContent: 'center',
			alignItems: 'center',
			position: 'relative',
			width: size.s_50,
			height: size.s_50,
			backgroundColor: colors.border,
			borderRadius: size.s_50
		},
		addPeopleBtn: {
			padding: size.s_20,
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			borderRadius: size.s_16
		},
		bgVoice: {
			width: '100%',
			height: '100%'
		},
		text: { fontSize: size.s_20, fontWeight: '600', color: colors.text },
		roomViewContainer: {
			flex: 1,
			alignItems: 'stretch',
			justifyContent: 'center'
		},
		roomViewContainerPiP: {
			justifyContent: 'flex-start'
		},
		participantView: {
			flex: 1,
			width: '100%',
			borderRadius: size.s_10,
			overflow: 'hidden'
		},
		userView: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			width: '100%',
			height: size.s_150 + size.s_100,
			backgroundColor: colors.border,
			gap: size.s_10,
			borderRadius: size.s_10
		},
		userName: {
			position: 'absolute',
			bottom: '3%',
			backgroundColor: colors.selectedOverlay,
			padding: size.s_6,
			borderRadius: size.s_20
		},
		focusIcon: {
			position: 'absolute',
			top: '3%',
			right: '3%',
			backgroundColor: colors.selectedOverlay,
			borderRadius: size.s_30,
			padding: size.s_10
		}
	});
