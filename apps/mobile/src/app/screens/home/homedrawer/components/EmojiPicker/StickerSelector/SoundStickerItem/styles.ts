import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		totalTime: {
			color: colors.text,
			fontSize: size.s_12
		},
		currentTime: {
			color: baseColor.white,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		container: {
			borderRadius: size.s_30,
			marginVertical: size.s_2,
			backgroundColor: baseColor.white,
			padding: size.s_8,
			alignItems: 'center',
			gap: size.s_10,
			justifyContent: 'center'
		},
		audioField: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		}
	});
