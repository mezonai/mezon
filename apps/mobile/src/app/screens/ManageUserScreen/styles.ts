import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: themeValue?.primary
		},
		headerContainer: {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			justifyContent: 'space-between' as const,
			height: size.s_40,
			paddingHorizontal: size.s_14
		},
		headerTitle: {
			flex: 1
		},
		headerTitleText: {
			fontSize: verticalScale(20),
			textAlign: 'center',
			color: themeValue.white
		},
		userInfoContainer: {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			justifyContent: 'space-between' as const,
			backgroundColor: themeValue.secondary,
			padding: size.s_12,
			gap: size.s_10,
			marginHorizontal: size.s_14,
			borderRadius: size.s_14
		},
		userInfo: {
			flex: 1,
			flexDirection: 'row' as const,
			gap: size.s_10,
			alignItems: 'center' as const
		},
		displayName: {
			color: themeValue.white
		},
		username: {
			color: themeValue.text
		},
		rolesSection: {
			marginHorizontal: size.s_14,
			marginTop: size.s_20
		},
		sectionTitle: {
			fontSize: verticalScale(13),
			color: themeValue.text
		},
		roleListContainer: {
			borderRadius: size.s_10,
			overflow: 'hidden' as const,
			marginTop: size.s_8
		},
		roleItemContainer: {
			backgroundColor: themeValue.secondary,
			padding: size.s_14,
			borderBottomWidth: 1,
			borderBottomColor: themeValue.tertiary,
			flexDirection: 'row' as const,
			gap: size.s_10
		},
		roleDisplayContainer: {
			backgroundColor: themeValue.secondary,
			padding: size.s_14,
			borderBottomWidth: 1,
			borderBottomColor: themeValue.tertiary
		},
		checkboxContainer: {
			height: size.s_20,
			width: size.s_20
		},
		editButtonContainer: {
			backgroundColor: themeValue.secondary,
			padding: size.s_14
		},
		editButtonText: {
			fontSize: verticalScale(13)
		},
		actionsSection: {
			marginHorizontal: size.s_14,
			marginTop: size.s_20
		},
		actionItemContainer: {
			backgroundColor: themeValue.secondary,
			padding: size.s_14,
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			gap: size.s_12
		},
		actionText: {
			fontSize: verticalScale(13),
			color: baseColor.red
		},
		roleCircle: {
			height: size.s_12,
			width: size.s_12,
			borderRadius: size.s_12,
			backgroundColor: themeValue.bgInfor
		},
		roleInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		roleTitle: {
			maxWidth: '80%',
			fontSize: verticalScale(16),
			color: themeValue.white
		},
		roleIcon: {
			height: size.s_20,
			width: size.s_20
		}
	});
