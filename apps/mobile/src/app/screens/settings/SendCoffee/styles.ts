import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.secondary
		},
		modalContainer: {
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			paddingBottom: size.s_60,
			paddingHorizontal: size.s_10,
			paddingTop: size.s_20,
			borderRadius: size.s_10
		},
		form: {
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			borderRadius: size.s_10,
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_20,
			gap: size.s_10
		},
		textField: {
			backgroundColor: colors.bgInputPrimary,
			borderRadius: size.s_10,
			justifyContent: 'center',
			paddingHorizontal: size.s_6
		},
		title: {
			color: colors.text,
			marginBottom: size.s_4
		},
		heading: {
			color: colors.textStrong,
			marginBottom: size.s_15,
			fontSize: size.s_18,
			fontWeight: 'bold'
		},
		textInput: {
			fontSize: size.s_16,
			height: size.s_50,
			color: colors.text,
			width: '90%'
		},
		button: {
			position: 'absolute',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: '#5e65ee',
			height: size.s_50,
			width: '90%',
			bottom: size.s_20,
			marginHorizontal: size.s_20,
			borderRadius: size.s_50
		},
		buttonTitle: {
			color: 'white',
			fontSize: size.s_16,
			fontWeight: 'bold'
		}
	});
