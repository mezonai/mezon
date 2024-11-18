import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			height: size.s_50,
			marginHorizontal: size.s_10,
			paddingRight: size.s_10,
			marginVertical: size.s_4,
			borderRadius: size.s_4,
			backgroundColor: colors.primary,
			padding: size.s_6,
			justifyContent: 'space-between',
			flexDirection: 'row',
			alignItems: 'center'
		},
		title: {
			color: colors.text,
			marginHorizontal: size.s_10,
			width: '90%'
		}
	});
