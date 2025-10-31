import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperProfile: {
			height: size.s_70,
			flexDirection: 'row',
			paddingHorizontal: size.s_20,
			alignItems: 'center',
			gap: size.s_16,
			backgroundColor: colors.secondary,
			justifyContent: 'space-between'
		},
		imageWrapper: {
			height: size.s_40,
			width: size.s_40,
			borderRadius: size.s_40,
			overlayColor: colors.secondary,
			overflow: 'hidden'
		},
		userInfo: {
			justifyContent: 'center'
		},
		username: {
			color: colors.white,
			fontSize: size.s_18
		},
		status: {
			color: colors.text,
			fontSize: size.s_14,
			maxWidth: '90%'
		},
		profileWrapper: {
			flexDirection: 'row',
			gap: size.s_8,
			flexShrink: 1
		},
		settingButton: {
			alignItems: 'center',
			justifyContent: 'center',
			padding: size.s_6
		}
	});
