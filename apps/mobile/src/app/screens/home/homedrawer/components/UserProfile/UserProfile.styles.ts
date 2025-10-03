import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		wrapper: {
			width: '100%',
			height: '100%'
		},
		userAvatar: {
			position: 'absolute',
			bottom: '-25%',
			paddingLeft: size.s_14
		},
		backdrop: {
			height: 120,
			position: 'relative',
			marginBottom: size.s_20
		},
		container: {
			paddingHorizontal: size.s_14,
			marginTop: size.s_30
		},
		userInfo: {
			backgroundColor: colors.secondary,
			marginBottom: size.s_20,
			padding: size.s_16,
			borderRadius: 8
		},
		roleGroup: {
			backgroundColor: colors.secondary,
			marginBottom: size.s_20,
			borderRadius: 8,
			padding: size.s_20
		},
		actionGroupDM: {
			backgroundColor: colors.secondary,
			marginBottom: size.s_20,
			borderRadius: 8,
			paddingHorizontal: size.s_16
		},
		username: {
			color: colors.textStrong,
			fontSize: size.h6,
			fontWeight: '600',
			marginBottom: size.s_2
		},
		subUserName: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '400'
		},
		userAction: {
			marginTop: size.s_20,
			gap: size.s_14,
			flexDirection: 'row',
			alignItems: 'center'
			// justifyContent: 'space-between',
		},
		actionItem: {
			flexDirection: 'column',
			alignItems: 'center',
			padding: size.s_10,
			minWidth: size.s_80,
			gap: size.s_6,
			backgroundColor: colors.primary,
			borderRadius: 8
		},
		actionText: {
			color: colors.text,
			fontSize: size.medium
		},
		aboutMe: {
			color: colors.textStrong,
			fontSize: size.label,
			fontWeight: '600',
			marginBottom: size.s_10
		},
		aboutMeText: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '500',
			marginBottom: size.s_10,
			fontStyle: 'italic'
		},
		roles: {
			flexDirection: 'row',
			gap: size.s_10,
			flexWrap: 'wrap'
		},
		roleItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			backgroundColor: colors.charcoal,
			minWidth: size.s_80,
			maxWidth: size.s_200,
			padding: size.s_6,
			borderRadius: size.s_8,
			overflow: 'hidden'
		},
		textRole: {
			color: colors.white,
			fontSize: size.medium,
			fontWeight: '400',
			maxWidth: '85%'
		},
		title: {
			color: colors.white,
			fontSize: size.label,
			fontWeight: '600',
			marginBottom: size.s_10
		},
		customStatusText: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '400'
		},
		defaultText: {
			color: 'white',
			textAlign: 'center'
		},
		button: {
			flex: 1,
			paddingVertical: size.s_6,
			borderRadius: size.s_2
		},
		receivedFriendRequestTitle: {
			color: colors.text,
			fontSize: size.h7,
			fontWeight: 'bold'
		},
		statusUser: { right: size.s_8, bottom: size.s_4 },
		memberSince: {
			marginVertical: size.s_8
		},

		textStatus: {
			color: colors.text,
			fontSize: isTabletLandscape ? size.label : size.s_14
		},
		badgeStatusTemp: {
			position: 'absolute',
			left: size.s_100,
			bottom: size.s_30,
			width: size.s_12,
			height: size.s_12,
			borderRadius: size.s_12,
			backgroundColor: colors.badgeHighlight
		},
		badgeStatus: {
			position: 'absolute',
			gap: size.s_6,
			flexDirection: 'row',
			left: size.s_100,
			top: isTabletLandscape ? size.s_100 : size.s_90,
			minHeight: size.s_40,
			minWidth: size.s_50,
			borderRadius: size.s_16,
			maxWidth: '70%',
			backgroundColor: colors.badgeHighlight,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_8,
			overflow: 'visible'
		},
		badgeStatusInside: {
			position: 'absolute',
			left: size.s_16,
			top: -size.s_8,
			width: size.s_20,
			height: size.s_20,
			borderRadius: size.s_20,
			backgroundColor: colors.badgeHighlight
		},
		wrapManageVoice: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_12
		}
	});
