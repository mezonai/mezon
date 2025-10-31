import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';

export const createStyles = (themeValue: Attributes, themeBasic: string, heightKeyboardShow: number, typeKeyboardBottomSheet: string) =>
	StyleSheet.create({
		spacerView: {
			height: Platform.OS === 'ios' || typeKeyboardBottomSheet !== 'text' ? heightKeyboardShow : 0,
			backgroundColor: themeBasic === 'light' ? themeValue.tertiary : themeValue.primary
		},
		bottomSheetBackground: {
			backgroundColor: themeBasic === 'light' ? themeValue.tertiary : themeValue.primary
		},
		handleIndicator: {
			backgroundColor: themeBasic === 'light' || themeBasic === 'sunrise' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
			height: size.s_6,
			width: size.s_50
		},
		scrollViewContentFlex: {
			flex: 1
		},
		scrollViewMinHeight: {
			minHeight: heightKeyboardShow
		}
	});
