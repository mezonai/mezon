import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		aboutMe: {
			color: colors.textStrong,
			fontSize: size.label,
			fontWeight: '600',
			marginBottom: size.s_10
		},
		aboutMeText: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '500',
			marginBottom: size.s_10,
			fontStyle: 'italic'
		},
		aboutMeContainer: {
			paddingVertical: size.s_16
		},
		roles: {
			flexDirection: 'row',
			gap: size.s_10,
			flexWrap: 'wrap'
		},
		roleItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			backgroundColor: colors.charcoal,
			minWidth: size.s_80,
			maxWidth: size.s_200,
			padding: size.s_6,
			borderRadius: size.s_8,
			overflow: 'hidden'
		},
		textRole: {
			color: colors.white,
			fontSize: size.medium,
			fontWeight: '400',
			maxWidth: '85%'
		},
		title: {
			color: colors.white,
			fontSize: size.label,
			fontWeight: '600',
			marginBottom: size.s_10
		},
		memberSince: {
			marginVertical: size.s_8
		},
		subUserName: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '400'
		},
		roleIcon: {
			width: size.s_15,
			height: size.s_15,
			borderRadius: size.s_50
		},
		roleColorDot: {
			width: size.s_15,
			height: size.s_15,
			borderRadius: size.s_50
		}
	});
