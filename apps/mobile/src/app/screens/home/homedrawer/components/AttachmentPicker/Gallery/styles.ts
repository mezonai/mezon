import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapperRequesting: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		titleRequesting: {
			fontSize: size.medium,
			color: 'white'
		},
		iconSelected: {
			position: 'absolute',
			top: size.s_6,
			right: size.s_6,
			backgroundColor: colors.secondary,
			borderRadius: size.s_20,
			padding: size.s_4,
			zIndex: 2
		},
		selectedOverlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: colors.selectedOverlay
		},
		disable: {
			opacity: 0.5
		},
		limitedPermissionBanner: {
			padding: size.s_12,
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: size.s_8
		},
		limitedPermissionText: {
			fontSize: size.s_14,
			color: colors.text,
			fontWeight: '600',
			textAlign: 'center'
		},
		galleryContainer: {
			flex: 1,
			paddingTop: 0
		}
	});
