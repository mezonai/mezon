import { Attributes, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		userItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_8
		},
		friendAvatar: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: 50,
			overlayColor: colors.secondary,
			overflow: 'hidden'
		},
		friendItemContent: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			flex: 1
		},
		displayName: {
			paddingVertical: 0,
			paddingHorizontal: size.s_10,
			color: colors.textStrong,
			flexGrow: 1,
			flexShrink: 1,
			fontSize: size.medium
		},
		online: {
			backgroundColor: Colors.green
		},
		offline: {
			backgroundColor: Colors.bgGrayDark
		},
		defaultText: {
			color: colors.textStrong
		},
		avatarDisabled: {
			opacity: 0.4
		},
		disabled: {
			color: Colors.gray72
		},
		statusCircle: {
			position: 'absolute',
			width: 14,
			height: 14,
			borderRadius: 10,
			bottom: 0,
			right: -2,
			borderWidth: 2,
			borderColor: colors.secondary
		},
		friendAction: {
			flexDirection: 'row',
			gap: size.s_20,
			alignItems: 'center'
		},
		approveIcon: {
			backgroundColor: Colors.green,
			width: size.s_28,
			height: size.s_28,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 50
		},
		whiteText: {
			color: colors.textStrong
		},
		avatarWrapper: {
			borderRadius: 50,
			backgroundColor: colors.colorAvatarDefault,
			height: size.s_40,
			width: size.s_40
		},
		wrapperTextAvatar: {
			width: size.s_40,
			height: size.s_40,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h5,
			color: Colors.white
		},
		fill: {
			flex: 1
		},
		checkboxWrapper: {
			height: 20,
			width: 20
		}
	});
