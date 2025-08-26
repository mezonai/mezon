import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		plainText: {
			fontSize: size.s_15,
			color: colors.white,
			lineHeight: size.s_22
		},
		wrapperChannel: {
			backgroundColor: colors.midnightBlue,
			lineHeight: size.s_22
		},
		wrapperMention: {
			backgroundColor: colors.midnightBlue,
			lineHeight: size.s_22
		},
		textChannel: {
			color: 'rgb(50 151 255)',
			fontWeight: '600'
		},
		iconEmoji: {
			width: size.s_20,
			height: size.s_20
		},
		textLink: {
			color: baseColor.link,
			textDecorationLine: 'none',
			lineHeight: size.s_22
		}
	});
