import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		totalTime: {
			color: colors.text,
			fontSize: size.s_12
		},
		currentTime: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		soundLottie: { width: Platform.OS === 'ios' ? size.s_80 : size.s_100, height: Platform.OS === 'ios' ? size.s_14 : size.s_4 },
		container: { width: '65%', backgroundColor: baseColor.bgDeepLavender, padding: size.s_6, borderRadius: size.s_30, marginVertical: size.s_2 }
	});
