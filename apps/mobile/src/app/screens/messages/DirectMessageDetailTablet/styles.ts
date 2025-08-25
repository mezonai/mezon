import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		dmMessageContainer: {
			backgroundColor: colors.secondary,
			flex: 1
		},
		headerWrapper: {
			flexDirection: 'row',
			borderBottomColor: colors.border,
			backgroundColor: colors.primary,
			borderBottomWidth: 1,
			alignItems: 'center',
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_8
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
		friendAvatar: {
			width: size.s_30,
			height: size.s_30,
			borderRadius: size.s_50,
			overflow: 'hidden',
			overlayColor: colors.secondary
		},
		statusCircle: {
			position: 'absolute',
			width: size.s_10,
			height: size.s_10,
			borderRadius: 10,
			bottom: 0,
			right: -2,
			borderWidth: 2,
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
		iconHeader: {
			marginRight: size.s_4,
			width: size.s_34,
			height: size.s_34,
			borderRadius: size.s_30,
			backgroundColor: colors.secondaryLight,
			alignItems: 'center',
			justifyContent: 'center'
		},
		iconWrapper: {
			flexDirection: 'row',
			gap: size.s_2
		}
	});
