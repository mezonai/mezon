import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (colors: Attributes) =>
	StyleSheet.create({
		headerRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		titleText: {
			fontSize: size.s_16,
			color: colors.textStrong
		},
		optionRow: {
			flexDirection: 'row',
			borderRadius: size.s_4,
			overflow: 'hidden',
			borderColor: colors.border,
			borderWidth: 1
		},
		optionButton: {
			alignItems: 'center',
			justifyContent: 'center',
			width: size.s_34,
			height: size.s_30
		},
		descriptionText: {
			fontSize: size.s_10,
			color: colors.textDisabled
		},
		optionButtonContainer: {
			borderRightWidth: 1,
			borderRightColor: colors.border
		}
	});
