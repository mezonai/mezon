import { Attributes, baseColor, horizontalScale, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		wrapper: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.secondary,
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			zIndex: 1000
		},
		container: {
			backgroundColor: colors.borderHighlight,
			flex: 1,
			padding: size.s_16,
			marginHorizontal: size.s_16,
			borderRadius: size.s_12
		},
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
		title: {
			fontSize: size.s_13,
			fontWeight: '600',
			paddingBottom: size.s_10,
			color: colors.white,
			textTransform: 'uppercase'
		},
		rowItem: {
			marginBottom: size.s_24
		},
		inputWrapper: {
			backgroundColor: colors.primary,
			flexDirection: 'row',
			alignItems: 'center',
			width: '100%',
			paddingHorizontal: size.s_8,
			borderRadius: size.s_10
		},
		iconLeftInput: {
			marginHorizontal: size.s_10,
			width: size.s_18,
			borderRadius: size.s_18,
			height: size.s_18,
			resizeMode: 'contain'
		},
		iconRightInput: {
			marginLeft: size.s_4,
			backgroundColor: colors.borderDim,
			padding: size.s_4,
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_24,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textInput: {
			flex: 1,
			alignItems: 'center',
			paddingVertical: 0,
			height: size.s_50,
			color: colors.white
		},
		textChannelSelected: {
			flex: 1,
			alignItems: 'center',
			paddingVertical: 0,
			lineHeight: size.s_50,
			color: colors.white
		},
		itemSuggestion: {
			paddingVertical: size.s_10,
			flexDirection: 'row',
			gap: size.s_18,
			alignItems: 'center'
		},
		logoSuggestion: {
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_24,
			resizeMode: 'cover'
		},
		titleSuggestion: {
			fontSize: size.label,
			color: colors.tertiary
		},
		wrapperItemMedia: {
			width: size.s_70,
			height: size.s_70,
			borderRadius: size.s_6,
			marginRight: size.s_10
		},
		wrapperMedia: {
			paddingHorizontal: size.s_4
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
			justifyContent: 'center'
		},
		fileViewer: {
			gap: size.s_6,
			paddingHorizontal: size.s_10,
			maxWidth: horizontalScale(150),
			height: '100%',
			alignItems: 'center',
			borderRadius: size.s_6,
			flexDirection: 'row',
			backgroundColor: colors.bgInputPrimary
		},
		fileName: {
			fontSize: size.small,
			color: colors.white
		},
		typeFile: {
			fontSize: size.small,
			color: colors.textNormal,
			textTransform: 'uppercase'
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
		sendButton: {
			height: size.s_40,
			width: size.s_40,
			backgroundColor: baseColor.blurple,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_50
		},
		inputRow: {
			flexDirection: 'row',
			gap: size.s_8
		},
		attachmentRow: {
			marginBottom: size.s_16,
			flexDirection: 'row'
		},
		searchInput: {
			padding: size.s_16,
			width: '100%'
		}
	});
