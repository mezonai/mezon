import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		// Main wrapper
		wrapper: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.primary,
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			zIndex: 1000
		},

		// Header section
		header: {
			width: '100%',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingTop: size.s_10,
			paddingBottom: size.s_10,
			paddingHorizontal: size.s_10,
			position: 'relative'
		},
		titleHeader: {
			fontSize: size.s_20,
			fontWeight: 'bold',
			color: colors.white,
			position: 'absolute',
			left: 0,
			right: 0,
			zIndex: -1,
			textAlign: 'center'
		},

		// Content container
		container: {
			backgroundColor: colors.secondary,
			flex: 1,
			padding: size.s_16,
			marginHorizontal: size.s_16,
			borderRadius: size.s_12,
			borderBottomColor: colors.primary,
			borderBottomWidth: 1
		},
		title: {
			fontSize: size.s_13,
			fontWeight: '600',
			paddingBottom: size.s_10,
			color: colors.white,
			textTransform: 'uppercase'
		},

		// Media attachment styles
		wrapperItemMedia: {
			width: size.s_70,
			height: size.s_70,
			borderRadius: size.s_6,
			marginRight: size.s_10
		},
		itemMedia: {
			width: '100%',
			height: '100%',
			borderRadius: size.s_6
		},
		iconRemoveMedia: {
			position: 'absolute',
			backgroundColor: 'rgba(000, 000, 000, 0.5)',
			top: 2,
			right: 2,
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_50,
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 2
		},
		videoOverlay: {
			position: 'absolute',
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			alignItems: 'center',
			justifyContent: 'center',
			bottom: 0,
			height: '100%',
			width: '100%',
			borderRadius: size.s_6
		},
		errorIconWrapper: {
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: baseColor.white,
			width: size.s_16,
			height: size.s_16,
			borderRadius: size.s_50
		},

		// Chat input area
		chatArea: {
			width: '100%',
			padding: size.s_16,
			backgroundColor: colors.secondary
		},
		chatInput: {
			backgroundColor: colors.primary,
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
			paddingHorizontal: size.s_16,
			borderRadius: size.s_30
		},
		textInput: {
			flex: 1,
			alignItems: 'center',
			paddingVertical: 0,
			height: size.s_42,
			color: colors.white
		},
		iconRightInput: {
			backgroundColor: colors.borderDim,
			padding: size.s_4,
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_24,
			justifyContent: 'center',
			alignItems: 'center'
		},
		sendButton: {
			height: size.s_40,
			width: size.s_40,
			backgroundColor: baseColor.blurple,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_50
		},

		// Layout helpers
		inputRow: {
			flexDirection: 'row',
			gap: size.s_8
		},
		attachmentRow: {
			marginBottom: size.s_16,
			flexDirection: 'row'
		}
	});
