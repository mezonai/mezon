import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		fileViewer: {
			width: size.s_60,
			height: size.s_60,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: size.s_6,
			backgroundColor: colors.borderDim
		},
		fileName: {
			fontSize: size.small,
			color: colors.text
		},
		typeFile: {
			fontSize: size.small,
			color: '#c7c7c7',
			textTransform: 'uppercase'
		},
		videoOverlay: {
			position: 'absolute',
			height: size.s_60,
			width: size.s_60,
			borderRadius: size.s_6,
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			alignItems: 'center',
			justifyContent: 'center'
		},
		countOverlay: {
			position: 'absolute',
			height: size.s_20,
			width: size.s_20,
			borderRadius: size.s_10,
			right: -size.s_2,
			bottom: -size.s_2,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.bgViolet
		},
		countText: {
			fontSize: size.small,
			color: baseColor.white
		},
		image: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: size.s_6
		},
		video: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: size.s_6
		}
	});
