import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			alignItems: 'center'
		},
		containerBottom: {
			paddingBottom: size.s_14
		},
		listDMBadge: {
			maxHeight: '100%',
			width: '100%',
			flexGrow: 0,
			paddingHorizontal: size.s_10
		},
		groupAvatar: {
			backgroundColor: baseColor.orange,
			width: size.s_42,
			height: size.s_42,
			borderRadius: size.s_42,
			justifyContent: 'center',
			alignItems: 'center'
		},
		badge: {
			backgroundColor: baseColor.redStrong,
			position: 'absolute',
			borderRadius: size.s_20,
			borderWidth: size.s_2,
			borderColor: colors.secondary,
			minWidth: size.s_20,
			paddingHorizontal: size.s_2,
			paddingVertical: size.s_2,
			height: size.s_20,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: -5,
			right: -5
		},
		badgeText: {
			color: 'white',
			fontWeight: 'bold',
			fontSize: size.tiny
		},
		mt10: {
			marginTop: size.s_10
		},
		avatarWrapper: {
			borderRadius: size.s_42,
			backgroundColor: colors.colorAvatarDefault,
			height: size.s_42,
			width: size.s_42
		},
		wrapperTextAvatar: {
			width: size.s_42,
			height: size.s_42,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h5,
			color: 'white'
		},
		lineBottom: {
			width: '50%',
			height: size.s_2,
			backgroundColor: colors.textDisabled,
			position: 'absolute',
			bottom: 0
		}
	});
