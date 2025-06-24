import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes, isTabletLandscape: boolean) =>
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
		playButton: {
			backgroundColor: baseColor.white,
			borderRadius: size.s_30,
			padding: size.s_8,
			alignItems: 'center',
			gap: size.s_10,
			justifyContent: 'center'
		},
		container: {
			width: isTabletLandscape ? '35%' : '65%',
			backgroundColor: baseColor.bgDeepLavender,
			padding: size.s_6,
			borderRadius: size.s_30,
			marginVertical: size.s_2
		},
		audioField: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		}
	});
