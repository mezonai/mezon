import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.secondaryLight,
			flexDirection: 'row',
			borderRadius: size.s_4
		},
		embed: {
			padding: 10
		},
		content: {
			gap: size.s_6,
			width: '80%'
		},
		sizeColor: {
			width: size.s_4,
			backgroundColor: colors.bgViolet,
			borderBottomLeftRadius: size.s_4,
			borderTopLeftRadius: size.s_4
		},
		valueContainer: {
			flexDirection: 'row',
			gap: 6
		},
		imageWrapper: {
			height: size.s_100 * 1.4,
			width: '90%',
			borderRadius: size.s_4,
			marginBottom: size.s_10
		},
		thumbnail: {
			height: size.s_50,
			width: size.s_50,
			borderRadius: size.s_4
		},
		title: {
			color: colors.white,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		description: {
			color: colors.text,
			fontSize: size.s_13
		}
	});
