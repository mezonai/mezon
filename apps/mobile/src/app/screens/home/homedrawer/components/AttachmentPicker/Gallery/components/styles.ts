import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		cameraPicker: {
			backgroundColor: colors.border,
			borderRadius: size.s_6,
			marginRight: size.s_14,
			alignItems: 'center',
			justifyContent: 'center'
		},
		itemGallery: {
			marginRight: size.s_14,
			borderRadius: size.s_6,
			overflow: 'hidden'
		},
		imageGallery: {
			zIndex: 10,
			resizeMode: 'cover',
			borderRadius: size.s_6
		},
		videoOverlay: {
			position: 'absolute',
			left: size.s_4,
			bottom: size.s_4,
			backgroundColor: 'rgba(0,0,0,0.55)',
			borderRadius: size.s_6,
			paddingHorizontal: size.s_6,
			paddingVertical: size.s_2,
			flexDirection: 'row',
			alignItems: 'center',
			zIndex: 10
		},
		videoDuration: {
			color: baseColor.white,
			marginLeft: size.s_4,
			fontSize: size.s_12,
			fontWeight: '600'
		},
		iconSelected: {
			position: 'absolute',
			top: size.s_6,
			right: size.s_6,
			backgroundColor: colors.secondary,
			borderRadius: size.s_20,
			padding: size.s_4,
			zIndex: 11
		},
		selectedOverlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: colors.selectedOverlay,
			zIndex: 10
		},
		disable: {
			opacity: 0.5
		},
		loadingContainer: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.selectedOverlay
		},
		itemGallerySkeleton: {
			width: '100%',
			position: 'absolute',
			top: 0,
			left: 0,
			height: '100%',
			borderRadius: size.s_6,
			overflow: 'hidden'
		}
	});
