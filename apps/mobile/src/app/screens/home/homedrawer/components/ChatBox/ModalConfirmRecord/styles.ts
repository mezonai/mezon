import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		modalContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0, 0, 0, 0.5)'
		},
		modalContent: {
			width: '70%',
			paddingTop: size.s_20,
			borderRadius: size.s_10,
			alignItems: 'center'
		},
		modalText: {
			fontSize: size.s_18,
			color: colors.black,
			marginBottom: size.s_20,
			fontWeight: '500'
		},
		hideText: {
			fontSize: size.s_16,
			color: colors.black,
			fontWeight: '500'
		},
		yesText: {
			fontSize: size.s_16,
			color: colors.textLink,
			fontWeight: '500'
		},
		btn: {
			padding: size.s_14
		},
		separator: {
			width: '100%',
			height: 1
		},
		buttonContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'flex-end',
			gap: size.s_20,
			width: '100%'
		}
	});
