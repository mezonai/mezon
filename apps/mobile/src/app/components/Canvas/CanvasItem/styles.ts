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
			borderRadius: size.s_8,
			backgroundColor: colors.secondary,
			padding: size.s_6,
			justifyContent: 'space-between',
			flexDirection: 'row',
			alignItems: 'center'
		},
		title: {
			color: colors.text,
			marginHorizontal: size.s_10,
			width: '75%'
		},
		buttonGroup: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4
		},
		button: {
			height: size.s_30,
			width: size.s_30,
			borderRadius: size.s_15,
			borderWidth: 1,
			borderColor: colors.tertiary,
			justifyContent: 'center',
			alignItems: 'center'
		}
	});
