import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			padding: size.s_14,
			gap: size.s_16
		},
		settingGroup: {
			gap: size.s_6
		},
		settingGroupTitle: {
			color: colors.text,
			fontSize: size.medium
		},
		optionListWrapper: {
			borderRadius: size.s_10,
			overflow: 'hidden'
		},
		optionDescription: {
			color: colors.text,
			fontSize: size.medium
		},
		optionRightSide: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		},
		optionTitle: {
			color: colors.white,
			fontSize: size.medium,
			fontWeight: 'bold'
		},
		optionItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_16
		},
		textRed: {
			color: baseColor.redStrong
		}
	});
