import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		listContainer: {
			height: '100%',
			paddingHorizontal: size.s_16
		},
		inputSearch: {
			borderRadius: size.s_8,
			height: size.s_36
		},
		btn: {
			height: size.s_40,
			backgroundColor: baseColor.blurple,
			justifyContent: 'center',
			alignItems: 'center',
			borderStartColor: 'red',
			borderRadius: size.s_50,
			paddingHorizontal: size.s_12
		},
		btnText: {
			color: 'white',
			fontSize: size.medium
		},
		memberAvatar: {
			height: size.s_34,
			width: size.s_34,
			borderRadius: 50,
			backgroundColor: '#676b73'
		},
		groupAvatarDefaultContainer: {
			backgroundColor: baseColor.orange,
			width: size.s_34,
			height: size.s_34,
			borderRadius: size.s_20,
			justifyContent: 'center',
			alignItems: 'center'
		},
		memberAvatarDefaultContainer: {
			height: size.s_34,
			width: size.s_34,
			justifyContent: 'center',
			borderRadius: 50,
			backgroundColor: colors.colorAvatarDefault
		},
		memberAvatarDefaultText: {
			textAlign: 'center',
			fontSize: size.s_16,
			color: colors.textStrong
		},
		groupAvatarContainer: {
			width: size.s_34,
			height: size.s_34,
			borderRadius: size.s_20,
			overflow: 'hidden'
		},
		iconTextContainer: {
			width: size.s_16,
			height: size.s_34,
			justifyContent: 'center'
		},
		renderContentContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			height: size.s_50,
			gap: size.s_6,
			justifyContent: 'center'
		},
		container: {
			flex: 1
		},
		header: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginBottom: size.s_18
		},
		headerSide: {
			flex: 1
		},
		headerTitle: {
			fontSize: verticalScale(18),
			color: colors.white
		},
		inputWrapper: {
			backgroundColor: colors.secondaryLight,
			paddingHorizontal: size.s_6
		},
		contentWrapper: {
			marginTop: size.s_12,
			marginBottom: size.s_12,
			marginHorizontal: size.s_6,
			flex: 1
		},
		containerMessage: {
			paddingTop: size.s_12,
			paddingHorizontal: size.s_20,
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			marginHorizontal: -size.s_16,
			gap: size.s_6
		},
		containerMessageForward: {
			flexDirection: 'row',
			flex: 1,
			alignItems: 'center',
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_6,
			borderLeftWidth: size.s_2,
			borderColor: colors.border
		},
		messageContentContainer: {
			flex: 1,
			paddingRight: size.s_10,
			justifyContent: 'center',
			alignItems: 'flex-start'
		},
		messageContent: {
			minHeight: size.s_20
		},
		containerSendMessage: {
			padding: size.s_16,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			marginHorizontal: -size.s_16,
			gap: size.s_6
		},
		chatInput: {
			flexShrink: 1,
			height: size.s_40,
			borderRadius: size.s_20,
			paddingHorizontal: size.s_12,
			backgroundColor: colors.primary,
			width: '100%',
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: 0
		},
		textInput: {
			flex: 1,
			alignItems: 'center',
			paddingVertical: 0,
			height: size.s_40,
			color: colors.white
		},
		iconRightInput: {
			backgroundColor: colors.borderDim,
			padding: size.s_4,
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_24,
			justifyContent: 'center',
			alignItems: 'center'
		},
		forward: {
			fontSize: size.s_12,
			color: baseColor.gray,
			fontStyle: 'italic'
		},
		image: {
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_4
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		titleText: {
			color: colors.textDisabled,
			fontSize: size.s_12
		},
		wrapper: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_16,
			paddingTop: size.s_16
		}
	});
