import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.secondaryLight,
			flexDirection: 'row',
			borderRadius: size.s_4,
			marginTop: size.s_4
		},
		embed: {
			padding: 10,
			flex: 1
		},
		content: {
			gap: size.s_6,
			flex: 1,
			overflow: 'hidden'
		},
		sizeColor: {
			width: size.s_4,
			backgroundColor: colors.bgViolet,
			borderBottomLeftRadius: size.s_4,
			borderTopLeftRadius: size.s_4
		},
		valueContainer: {
			flexDirection: 'row',
			gap: 6,
			flex: 1
		},
		imageWrapper: {
			marginTop: size.s_6,
			height: size.s_100 * 3,
			width: '100%',
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
