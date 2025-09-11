import type { Attributes } from '@mezon/mobile-ui';
import { horizontalScale, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperOption: {
			paddingHorizontal: horizontalScale(10),
			paddingVertical: verticalScale(10),
			marginBottom: verticalScale(30)
		},
		optionContainer: {
			backgroundColor: '#3e4247',
			borderRadius: 8
		},
		headerTitle: {
			color: 'white',
			textAlign: 'center',
			fontWeight: '600',
			fontSize: size.h5,
			marginBottom: verticalScale(10)
		},
		optionContent: {},
		option: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: 15,
			gap: 20
		},
		textOption: {
			color: 'white',
			fontSize: size.label,
			flex: 1,
			fontWeight: '500'
		},
		notifySetting: {
			backgroundColor: '#676b73',
			borderRadius: 8,
			marginTop: verticalScale(20)
		},
		icon: { color: 'white', fontWeight: '600', fontSize: 20 }
	});
