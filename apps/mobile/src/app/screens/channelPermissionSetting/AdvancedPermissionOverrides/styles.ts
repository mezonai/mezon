import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_18,
			gap: size.s_18,
			marginTop: size.s_10
		},
		headerTitle: {
			fontSize: size.s_18,
			marginLeft: 0,
			marginRight: 0,
			fontWeight: 'bold',
			color: colors.white
		},
		headerRightContainer: {
			marginRight: size.s_20,
			paddingVertical: size.s_10
		},
		saveButtonText: {
			fontSize: size.s_16,
			marginLeft: 0,
			marginRight: 0,
			color: colors.bgViolet
		},
		headerLeftContainer: {
			marginLeft: size.s_16
		},
		permissionTypeText: {
			color: colors.textDisabled,
			fontSize: size.s_12
		},
		scrollContent: {
			gap: size.s_10
		}
	});
