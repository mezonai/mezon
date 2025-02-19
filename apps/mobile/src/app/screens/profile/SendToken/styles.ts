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
			paddingHorizontal: size.s_10,
			paddingTop: size.s_20,
			paddingBottom: size.s_30,
			borderRadius: size.s_10
		},
		form: {
			flex: 1,
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
			marginTop: size.s_10,
			marginBottom: size.s_6
		},
		heading: {
			color: colors.textStrong,
			marginBottom: size.s_15,
			fontSize: size.s_18,
			fontWeight: 'bold'
		},
		textInput: {
			paddingHorizontal: size.s_10,
			fontSize: size.s_16,
			height: size.s_50,
			color: colors.text
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
		},
		userItem: {
			flexDirection: 'row',
			gap: size.s_8,
			alignItems: 'center',
			padding: size.s_10,
			marginVertical: size.s_2
		},
		username: {
			color: colors.text,
			paddingHorizontal: size.s_10
		},
		searchText: {
			paddingHorizontal: size.s_10
		},
		fullscreenModal: {
			width: '100%',
			height: '100%',
			backgroundColor: colors.primary,
			justifyContent: 'space-between',
			paddingHorizontal: size.s_30,
			paddingVertical: size.s_30
		},
		modalHeader: {
			marginTop: size.s_20,
			textAlign: 'left'
		},
		successText: {
			fontSize: size.h3,
			fontWeight: 'bold',
			color: colors.white
		},
		amountText: {
			fontSize: size.h3,
			fontWeight: 'bold',
			color: colors.white
		},
		modalBody: {
			width: '100%',
			height: '45%'
		},
		infoRow: {
			flexDirection: 'column',
			justifyContent: 'space-between',
			paddingVertical: size.s_10
		},
		label: {
			fontSize: size.s_14,
			color: colors.textDisabled
		},
		value: {
			fontSize: size.s_18,
			fontWeight: 'bold',
			color: colors.white
		},
		confirmButton: {
			backgroundColor: colors.white,
			justifyContent: 'center',
			alignItems: 'center',
			height: size.s_50,
			borderRadius: size.s_50
		},
		confirmText: {
			fontSize: 18,
			fontWeight: 'bold',
			color: colors.black
		},
		action: {
			display: 'flex',
			gap: size.s_20
		},
		actionMore: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			gap: size.s_30
		},
		buttonActionMore: {
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			gap: size.s_4
		},
		textActionMore: {
			color: colors.white
		}
	});
