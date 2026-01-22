import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			flex: 1
		},
		wrapperContainer: {
			flex: 1
		},
		confetti: {
			position: 'absolute',
			top: 0,
			left: 0,
			height: size.s_300,
			width: '100%',
			right: 0,
			zIndex: 999
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
			gap: size.s_10,
			textAlign: 'left'
		},
		successText: {
			fontSize: size.h2,
			fontWeight: 'bold',
			color: colors.white
		},
		successTextDesc: {
			fontSize: size.h5,
			color: colors.textDisabled
		},
		amountText: {
			marginTop: size.s_10,
			fontSize: size.h1,
			fontWeight: 'bold',
			color: colors.white
		},
		modalBody: {
			width: '100%',
			height: '45%'
		},
		infoMain: {
			marginTop: size.s_20
		},
		infoRow: {
			flexDirection: 'column',
			justifyContent: 'space-between',
			paddingVertical: size.s_6
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
		loadingContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			gap: size.s_20
		},
		loadingText: {
			fontSize: size.h4,
			fontWeight: 'bold',
			color: colors.white,
			marginTop: size.s_20
		},
		loadingSubText: {
			fontSize: size.s_14,
			color: colors.textDisabled
		},
		errorText: {
			fontSize: size.h2,
			fontWeight: 'bold',
			color: colors.white
		},
		errorSubText: {
			fontSize: size.h5,
			color: colors.textDisabled,
			marginTop: size.s_10
		}
	});
