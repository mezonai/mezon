import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary,
			padding: Metrics.size.xl,
			flexDirection: 'row',
			alignItems: 'center',
			borderWidth: 1,
			borderColor: colors.border,
			marginVertical: size.s_4,
			borderRadius: size.s_12
		},
		itemInfo: {
			gap: size.s_4,
			paddingHorizontal: size.s_12
		},
		platformInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4
		},
		deviceName: {
			backgroundColor: baseColor.blurple,
			borderRadius: size.s_4,
			alignItems: 'center',
			justifyContent: 'center',
			padding: size.s_4
		},
		deviceText: {
			color: baseColor.white
		},
		text: {
			color: colors.text
		},
		platformName: {
			color: colors.textStrong,
			fontWeight: '500'
		}
	});
