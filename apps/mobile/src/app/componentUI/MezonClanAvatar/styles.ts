import { Attributes, baseColor, Fonts, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isMsgReply = false) =>
	StyleSheet.create({
		image: {
			height: '100%',
			width: '100%'
		},

		fakeBox: {
			height: '100%',
			width: '100%',
			justifyContent: 'center',
			alignItems: 'center'
			// backgroundColor: baseColor.blurple
		},

		altText: {
			color: baseColor.white,
			fontSize: Fonts.size.h4,
			textAlign: 'center',
			fontWeight: 'bold'
		},

		altTextLight: {
			fontSize: Fonts.size.h5,
			fontWeight: 'normal'
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
			fontSize: isMsgReply ? size.h8 : size.h4,
			color: 'white'
		}
	});
