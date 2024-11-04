import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {},
		video: {
			width: '100%',
			height: '100%'
		},
		fullScreenVideo: {
			width: '100%',
			height: '100%'
		},
		fullScreenButton: {
			position: 'absolute',
			bottom: size.s_10,
			right: size.s_10,
			padding: size.s_10,
			backgroundColor: 'rgba(0,0,0,0.5)',
			borderRadius: 25
		},
		loadingOverlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0,0,0,0.7)'
		},
		errorContainer: {
			justifyContent: 'center',
			alignItems: 'center',
			width: '100%',
			height: 250,
			backgroundColor: baseColor.black
		},
		errorText: {
			color: colors.white,
			fontSize: size.s_20,
			fontWeight: '600'
		}
	});
