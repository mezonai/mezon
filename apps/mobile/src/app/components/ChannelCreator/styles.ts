import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapper: {
			flex: 1,
			backgroundColor: colors.primary
		},
		container: {
			backgroundColor: colors.primary,
			paddingVertical: Metrics.size.xl,
			display: 'flex',
			flexDirection: 'column',
			paddingHorizontal: Metrics.size.xl
		},
		headerCreateButton: {
			color: baseColor.blurple,
			fontWeight: 'bold',
			paddingHorizontal: size.s_20
		},
		headerBackButton: {
			padding: size.s_20
		}
	});
