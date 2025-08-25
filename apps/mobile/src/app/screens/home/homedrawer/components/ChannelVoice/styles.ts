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
			backgroundColor: 'rgba(48,48,48,0.55)',
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_4,
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
			borderWidth: 0.5,
			borderColor: colors.textDisabled,
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
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.border,
			gap: size.s_10,
			borderRadius: size.s_10,
			width: '48%',
			height: size.s_150,
			borderWidth: 1,
			borderColor: colors.borderDim
		},
		userName: {
			position: 'absolute',
			bottom: '3%',
			backgroundColor: colors.selectedOverlay,
			padding: size.s_6,
			borderRadius: size.s_20
		},
		wrapperHeaderFocusSharing: {
			position: 'absolute',
			top: '7%',
			right: '3%',
			flexDirection: 'row',
			gap: size.s_10
		},
		focusIcon: {
			backgroundColor: colors.selectedOverlay,
			borderRadius: size.s_30,
			padding: size.s_10
		},
		focusIconAbsolute: {
			position: 'absolute',
			top: '7%',
			right: '3%'
		},
		reactionContainer: {
			position: 'absolute',
			bottom: '30%',
			width: '70%',
			left: '15%',
			alignSelf: 'center',
			right: size.s_20,
			height: '40%'
		},
		animatedEmoji: {
			height: size.s_40,
			width: size.s_40
		},
		wrapperUser: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			marginHorizontal: size.s_10,
			alignSelf: 'center'
		},
		soundEffectIcon: {
			position: 'absolute',
			top: size.s_4,
			right: size.s_4,
			padding: size.s_6,
			borderRadius: size.s_20,
			backgroundColor: colors.bgViolet
		}
	});
