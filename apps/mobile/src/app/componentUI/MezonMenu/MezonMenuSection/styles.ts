import { Attributes, baseColor, Fonts, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		sectionTitle: {
			color: colors.text,
			fontSize: Fonts.size.small,
			fontWeight: '600',
			marginBottom: Fonts.size.s_10
		},

		sectionDescription: {
			color: baseColor.gray,
			fontSize: Fonts.size.small,
			marginTop: size.s_6
		},

		section: {
			backgroundColor: colors.secondary,
			borderRadius: size.s_10,
			overflow: 'hidden'
		}
	});
