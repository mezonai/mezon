import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		btnScrollDown: {
			position: 'absolute',
			right: size.s_10,
			bottom: size.s_28,
			backgroundColor: colors.textDisabled,
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			justifyContent: 'center',
			alignItems: 'center'
		},
		badgeCountMessage: {
			position: 'absolute',
			width: size.s_22,
			left: size.s_20,
			height: size.s_22,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_20,
			top: -size.s_6,
			backgroundColor: baseColor.bgDanger
		},
		badgeCountMessageText: {
			fontSize: size.s_10,
			fontWeight: 'bold',
			color: baseColor.white
		}
	});
