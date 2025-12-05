import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		modalContainer: {
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_10,
			paddingTop: size.s_20,
			paddingBottom: size.s_30,
			borderRadius: size.s_10
		},
		form: {
			flex: 1,
			backgroundColor: colors.primary,
			borderRadius: size.s_10,
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_20,
			gap: size.s_10
		},
		textField: {
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_6,
			justifyContent: 'center',
			paddingHorizontal: size.s_4,
			borderWidth: 0.3,
			borderColor: colors.textDisabled
		},
		title: {
			color: colors.text,
			marginTop: size.s_10,
			marginBottom: size.s_10
		},
		heading: {
			color: colors.textStrong,
			marginBottom: size.s_15,
			fontSize: size.s_18,
			fontWeight: 'bold'
		},
		textInput: {
			paddingHorizontal: size.s_10,
			fontSize: size.s_14,
			height: size.s_40,
			color: colors.text
		},
		textInputNote: {
			paddingHorizontal: size.s_10,
			fontSize: size.s_12,
			color: colors.text,
			height: size.s_100,
			paddingVertical: size.s_10,
			paddingTop: size.s_10
		},
		wrapperButton: {
			position: 'absolute',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.primary,
			width: '100%',
			paddingTop: size.s_10,
			bottom: 0,
			paddingBottom: size.s_30
		},
		button: {
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: '#5e65ee',
			height: size.s_50,
			width: '90%',
			marginHorizontal: size.s_20,
			borderRadius: size.s_14
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
			paddingHorizontal: size.s_10,
			borderBottomWidth: 1,
			borderColor: colors.borderHighlight
		},
		username: {
			color: colors.text,
			paddingHorizontal: size.s_10,
			maxWidth: '90%'
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
		note: {
			fontSize: size.s_14,
			color: colors.white,
			fontWeight: '500'
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
		},
		cardWallet: {
			borderRadius: size.s_10,
			marginBottom: size.s_20,
			backgroundColor: colors.border,
			borderWidth: 0.3,
			borderColor: colors.textDisabled
		},
		cardWalletWrapper: {
			padding: size.s_16,
			paddingVertical: size.s_14,
			gap: size.s_14
		},
		cardWalletLine: {
			flexDirection: 'row',
			alignItems: 'flex-end',
			justifyContent: 'space-between'
		},
		cardTitle: {
			fontSize: size.s_12,
			fontWeight: '600',
			color: colors.text
		},
		cardAmount: {
			fontSize: size.s_18,
			fontWeight: 'bold',
			color: colors.white
		},
		viewShotContainer: {
			flex: 1
		},
		wrapperContainer: {
			flex: 1
		},
		bottomSheetStyle: {
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_10,
			flex: 1,
			gap: size.s_10
		},
		flatListContentStyle: {
			paddingBottom: size.s_20
		},
		flatListStyle: {
			borderRadius: size.s_8,
			marginTop: size.s_10
		},
		btnCopyAddress: {
			height: '100%',
			paddingHorizontal: size.s_10,
			justifyContent: 'center'
		},
		selectSendTokenTo: {
			height: size.s_40,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingRight: size.s_10
		},
		characterCount: {
			alignSelf: 'flex-end',
			color: colors.textDisabled,
			marginBottom: size.s_2,
			marginRight: size.s_2
		}
	});
