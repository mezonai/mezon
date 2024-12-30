import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.secondary,
			alignItems: 'center',
			paddingTop: size.s_20
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
		header: {
			color: colors.textStrong,
			fontSize: size.h4,
			fontWeight: 'bold',
			marginHorizontal: size.s_20,
			textAlign: 'center',
			marginBottom: size.s_20
		},
		description: {
			color: colors.text,
			fontSize: size.medium,
			marginHorizontal: size.s_40,
			textAlign: 'center',
			fontWeight: '300'
		},
		pinContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: size.s_40
		},
		pinBox: {
			width: size.s_40,
			height: size.s_50,
			borderWidth: 1,
			borderColor: colors.textStrong,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.bgInputPrimary,
			borderRadius: size.s_8,
			margin: size.s_4
		},
		pinText: {
			fontSize: size.s_20,
			color: colors.textStrong
		},
		hiddenInput: {
			position: 'absolute',
			opacity: 0
		}
	});
