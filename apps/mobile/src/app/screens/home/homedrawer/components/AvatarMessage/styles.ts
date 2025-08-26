import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperAvatar: {
			width: size.s_40,
			height: size.s_40
		},
		wrapperAvatarCombine: {
			width: size.s_40
		},
		btnScrollDown: {
			position: 'absolute',
			right: size.s_10,
			bottom: size.s_20,
			backgroundColor: colors.primary,
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_50,
			justifyContent: 'center',
			alignItems: 'center',
			shadowColor: 'black',
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.3,
			shadowRadius: 4.65,
			elevation: 8,
			zIndex: 1000
		},
		avatarMessageBoxDefault: {
			width: '100%',
			height: '100%',
			borderRadius: size.s_50,
			backgroundColor: colors.colorAvatarDefault,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textAvatarMessageBoxDefault: {
			fontSize: size.h4,
			color: 'white'
		},
		logoUser: {
			width: '100%',
			height: '100%'
		}
	});
