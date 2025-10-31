import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
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
			backgroundColor: colors.secondary,
			borderColor: colors.border,
			borderWidth: 1,
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
			backgroundColor: colors.tertiary,
			borderRadius: size.s_30,
			borderWidth: 0.5,
			borderColor: colors.textDisabled
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
			backgroundColor: colors.secondary,
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
		},
		muteIcon: {
			padding: size.s_4,
			borderRadius: size.s_20,
			borderWidth: 1,
			borderColor: colors.border
		},
		muteOptions: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			position: 'absolute',
			right: size.s_4,
			top: size.s_4
		},
		reactionSenderEmojiContainer: {
			padding: size.s_4,
			marginTop: size.s_4,
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_10,
			width: size.s_90
		},
		senderName: {
			fontSize: size.s_10,
			color: colors.text,
			textAlign: 'center'
		},
		focusedContainer: {
			width: '100%',
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center'
		},
		focusedVideoWrapper: {
			height: size.s_150,
			width: '100%',
			alignSelf: 'center'
		},
		focusedVideoStyle: {
			height: size.s_150,
			width: '100%',
			alignSelf: 'center'
		},
		focusedVideoStyleSmall: {
			height: 100,
			width: '100%',
			alignSelf: 'center'
		},
		focusedVideoWrapperSmall: {
			height: 100,
			width: '100%',
			alignSelf: 'center'
		},
		focusedAvatarWrapper: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: 10
		},
		focusedUsernameWrapper: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center'
		},
		avatarContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: size.s_10
		},
		participantContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center',
			gap: size.s_10,
			alignItems: 'center'
		},
		participantContainerPiP: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'space-between',
			gap: size.s_2,
			alignItems: 'flex-start'
		},
		spacer: {
			height: size.s_300
		},
		controlBarContainer: {
			gap: size.s_10,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: size.s_6
		},
		userNameCentered: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center'
		},
		scrollViewMargin: {
			marginHorizontal: size.s_10
		},
		scrollViewMarginZero: {
			marginHorizontal: 0
		},
		userViewTabletHeight: {
			height: size.s_150 + size.s_100
		},
		userViewPiPScreenShare: {
			width: '100%',
			height: size.s_100 * 1.2,
			marginBottom: size.s_100
		},
		userViewPiPVideo: {
			height: size.s_60 * 2,
			width: '45%',
			marginHorizontal: size.s_4
		},
		userViewSpeaking: {
			borderWidth: 1
		},
		userNameFullWidth: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			width: '90%'
		},
		subTitleFullWidth: {
			width: '100%'
		},
		bottomSheetZIndex: {
			zIndex: 1001
		},
		// CallReactionHandler styles
		animatedEmojiContainer: {
			position: 'absolute',
			bottom: 0,
			left: '50%',
			width: size.s_36,
			height: size.s_36,
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 1000
		},
		emojiImage: {
			width: size.s_36,
			height: size.s_36
		},
		// ButtonEndCall styles
		endCallButton: {
			backgroundColor: baseColor.redStrong
		},
		// HeaderRoomView styles
		headerRowLeft: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_20,
			flexGrow: 1,
			flexShrink: 1
		},
		headerTextTitle: {
			flexGrow: 1,
			flexShrink: 1
		},
		headerRowRight: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		}
	});
