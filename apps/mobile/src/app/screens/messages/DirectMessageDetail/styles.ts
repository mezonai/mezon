import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		dmMessageContainer: {
			backgroundColor: colors.primary,
			flex: 1
		},
		headerWrapper: {
			flexDirection: 'row',
			borderBottomColor: colors.border,
			borderBottomWidth: 1,
			alignItems: 'center'
		},
		backButton: {
			padding: size.s_16,
			borderRadius: 50
		},
		channelTitle: {
			alignItems: 'center',
			flex: 1,
			flexDirection: 'row',
			gap: size.s_8
		},
		titleText: {
			color: colors.text,
			fontSize: size.label,
			flex: 1
		},
		content: {
			flex: 1,
			backgroundColor: '#1E1E1E'
		},
		actions: {
			flexDirection: 'row',
			gap: size.s_20
		},
		groupAvatar: {
			backgroundColor: baseColor.orange,
			width: size.s_30,
			height: size.s_30,
			borderRadius: 50,
			justifyContent: 'center',
			alignItems: 'center'
		},
		groupAvatarWrapper: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: size.s_20,
			overflow: 'hidden'
		},
		friendAvatar: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: size.s_50,
			overflow: 'hidden'
		},
		statusCircle: {
			position: 'absolute',
			width: size.s_14,
			height: size.s_14,
			borderRadius: size.s_10,
			bottom: 0,
			right: -4,
			borderWidth: size.s_2,
			borderColor: colors.secondary
		},
		online: {
			backgroundColor: baseColor.green
		},
		offline: {
			backgroundColor: baseColor.gray
		},
		avatarWrapper: {
			borderRadius: 50,
			backgroundColor: colors.colorAvatarDefault,
			height: size.s_30,
			width: size.s_30
		},
		wrapperTextAvatar: {
			width: size.s_30,
			height: size.s_30,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h6,
			color: 'white'
		},
		iconWrapper: {
			flexDirection: 'row',
			gap: size.s_2
		},
		iconHeader: {
			width: size.s_34,
			height: size.s_34,
			marginLeft: size.s_6,
			borderRadius: size.s_30,
			backgroundColor: colors.secondaryLight,
			alignItems: 'center',
			justifyContent: 'center'
		},
		iconOption: {
			marginLeft: -size.s_2,
			alignItems: 'center',
			justifyContent: 'center'
		}
	});
