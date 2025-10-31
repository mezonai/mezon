import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		userInfo: {
			backgroundColor: colors.secondary,
			marginBottom: size.s_20,
			padding: size.s_16,
			borderRadius: 8
		},
		userInfoGap: {
			gap: size.s_10
		},
		title: {
			color: colors.white,
			fontSize: size.label,
			fontWeight: '600',
			marginBottom: size.s_10
		},
		mediumFontSize: {
			fontSize: size.medium
		},
		wrapManageVoice: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_12
		},
		actionItem: {
			flexDirection: 'column',
			alignItems: 'center',
			padding: size.s_10,
			minWidth: size.s_80,
			gap: size.s_6,
			backgroundColor: colors.primary,
			borderRadius: 8
		},
		actionItemRow: {
			flexDirection: 'row',
			gap: size.s_6
		},
		actionText: {
			color: colors.text,
			fontSize: size.medium
		}
	});
