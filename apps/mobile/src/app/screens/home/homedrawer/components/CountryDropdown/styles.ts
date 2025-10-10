import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: Attributes) =>
	StyleSheet.create({
		dropdownContainer: {
			position: 'absolute',
			top: '105%',
			left: 0,
			right: 0,
			backgroundColor: themeValue.secondary,
			borderRadius: size.s_8,
			borderWidth: 1,
			borderColor: baseColor.gray,
			overflow: 'hidden',
			zIndex: 1000,
			width: '50%',
			maxWidth: size.s_220,
			marginTop: size.s_4
		},
		dropdownItem: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_8,
			borderBottomWidth: 1,
			borderBottomColor: themeValue.border,
			justifyContent: 'space-between'
		},
		selectedItem: {
			backgroundColor: `${themeValue.bgViolet}20`
		},
		dropdownItemContent: {
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_2
		},
		dropdownText: {
			fontSize: size.s_14,
			color: themeValue.text
		},
		customStyleFlagIcon: {
			marginRight: size.s_6
		}
	});
