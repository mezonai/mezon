import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		totalTime: {
			color: colors.text,
			fontSize: size.s_12
		},
		currentTime: {
			color: 'white',
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		soundLottie: {
			width: Platform.OS === 'ios' ? size.s_80 : size.s_100,
			height: Platform.OS === 'ios' ? size.s_14 : size.s_4
		},
		container: {
			backgroundColor: 'rgba(78,80,87,0.6)',
			padding: size.s_6,
			borderRadius: size.s_30,
			marginVertical: size.s_2,
			paddingRight: size.s_12
		},
		wrapper: {
			flex: 1,
			flexDirection: 'row'
		},
		innerContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		},
		playButton: {
			backgroundColor: baseColor.bgDeepLavender,
			borderRadius: size.s_30,
			padding: size.s_8,
			alignItems: 'center',
			gap: size.s_10,
			justifyContent: 'center'
		},
		currentTimeHidden: {
			opacity: 0
		}
	});
