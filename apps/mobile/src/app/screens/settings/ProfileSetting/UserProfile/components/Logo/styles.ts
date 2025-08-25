import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			marginHorizontal: size.s_20,
			marginVertical: size.s_10,
			padding: size.s_20,
			borderRadius: size.s_12
		},

		title: {
			color: colors.textStrong,
			fontSize: size.medium,
			fontWeight: '500'
		},

		image: {
			height: 50,
			width: 50,
			overflow: 'hidden',
			borderRadius: 12,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.bgViolet
		}
	});
