import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (customDimension?: number | undefined) =>
	StyleSheet.create({
		channelDotWrapper: {
			backgroundColor: baseColor.redStrong,
			height: customDimension ?? size.s_18,
			width: customDimension ?? size.s_18,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: customDimension ?? size.s_18
		},

		channelDot: {
			color: baseColor.white,
			fontSize: size.s_10,
			fontWeight: 'bold'
		}
	});
