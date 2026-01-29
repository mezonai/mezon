import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		card: {
			borderRadius: size.s_10,
			overflow: 'hidden',
			elevation: 3,
			width: isTabletLandscape ? '75%' : '100%'
		},
		map: {
			width: '100%',
			height: size.s_150
		},
		avatarWrapper: {
			borderWidth: 2,
			borderColor: colors.white,
			borderRadius: size.s_30,
			width: size.s_30,
			height: size.s_30,
			overflow: 'hidden'
		},
		info: {
			padding: size.s_10,
			backgroundColor: colors.secondaryLight
		},
		title: {
			fontWeight: 'bold',
			fontSize: size.s_14,
			color: colors.text
		}
	});
