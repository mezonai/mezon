import { Attributes, Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			alignItems: 'center'
		},
		containerBottom: {
			paddingBottom: size.s_20
		},
		listDMBadge: {
			maxHeight: '100%',
			width: '100%',
			flexGrow: 0,
			paddingHorizontal: size.s_10
		},
		groupAvatar: {
			backgroundColor: Colors.orange,
			width: size.s_48,
			height: size.s_48,
			borderRadius: size.s_48,
			justifyContent: 'center',
			alignItems: 'center'
		},
		badge: {
			backgroundColor: Colors.red,
			position: 'absolute',
			borderRadius: size.s_24,
			borderWidth: size.s_4,
			borderColor: Colors.secondary,
			minWidth: size.s_24,
			height: size.s_24,
			alignItems: 'center',
			justifyContent: 'center',
			bottom: -5,
			right: -5
		},
		badgeText: {
			color: Colors.white,
			fontWeight: 'bold',
			fontSize: size.tiny
		},
		mt10: {
			marginTop: size.s_10
		},
		avatarWrapper: {
			borderRadius: size.s_48,
			backgroundColor: colors.colorAvatarDefault,
			height: size.s_48,
			width: size.s_48
		},
		wrapperTextAvatar: {
			width: size.s_48,
			height: size.s_48,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h5,
			color: Colors.white
		},
		lineBottom: {
			width: '50%',
			height: size.s_2,
			backgroundColor: colors.textDisabled,
			position: 'absolute',
			bottom: 0
		}
	});
