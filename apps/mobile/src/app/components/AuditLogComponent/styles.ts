import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		headerRightText: {
			fontWeight: '500',
			fontSize: size.label,
			color: colors.bgViolet
		},
		headerRightBtn: {
			marginRight: size.s_10,
			padding: size.s_10
		},
		headerLeftBtn: {
			marginLeft: size.s_10,
			padding: size.s_10
		},
		filterBtn: {
			flexDirection: 'row',
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_10,
			alignItems: 'center',
			justifyContent: 'flex-end'
		},
		filterText: {
			fontWeight: '500',
			fontSize: size.s_18,
			color: colors.white
		},
		textFilterBtn: {
			fontSize: size.s_12,
			paddingHorizontal: size.s_10,
			color: colors.text
		},
		stylesDatePicker: {
			backgroundColor: colors.tertiary
		}
	});
