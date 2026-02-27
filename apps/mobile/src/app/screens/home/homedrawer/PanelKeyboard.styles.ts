import { size, type Attributes } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const createStyles = (themeValue: Attributes) =>
	StyleSheet.create({
		spacerView: {
			overflow: 'hidden',
			bottom: 0,
			left: 0,
			right: 0,
			zIndex: 0,
			backgroundColor: themeValue.primary
		},
		bottomSheetBackground: {
			paddingTop: 0
		},
		handleIndicator: {
			height: size.s_6,
			backgroundColor: themeValue.text,
			borderRadius: size.s_6,
			width: size.s_50
		},
		handleIndicatorContainer: {
			width: '100%',
			height: size.s_20,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: themeValue.primary,
			zIndex: 1
		},
		scrollViewContentFlex: {
			flex: 1
		},
		backgroundBottomSheet: {
			backgroundColor: themeValue.primary
		}
	});
