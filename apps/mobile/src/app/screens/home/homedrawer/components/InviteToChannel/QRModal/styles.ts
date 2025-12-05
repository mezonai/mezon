import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (themeValue: Attributes) =>
	StyleSheet.create({
		modalContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		modalContent: {
			backgroundColor: themeValue.primary,
			borderRadius: size.s_16,
			width: '90%',
			alignItems: 'center',
			padding: size.s_20,
			position: 'relative'
		},
		closeButton: {
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_12,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: themeValue.secondary,
			position: 'absolute',
			top: size.s_12,
			right: size.s_12,
			zIndex: 1
		},
		modalTitle: {
			fontSize: size.s_16,
			fontWeight: 'bold',
			color: themeValue.white,
			marginBottom: size.s_16,
			textAlign: 'center'
		},
		clanInfo: {
			alignItems: 'center'
		},
		clanAvatarWrapper: {
			borderRadius: size.s_10,
			overflow: 'hidden',
			marginBottom: size.s_16
		},
		clanAvatar: {
			width: size.s_60,
			height: size.s_60
		},
		defaultAvatar: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: size.s_30,
			backgroundColor: themeValue.secondary,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: size.s_12
		},
		defaultAvatarText: {
			fontSize: size.s_24,
			fontWeight: 'bold',
			color: themeValue.white
		},
		clanName: {
			fontSize: size.s_18,
			fontWeight: '600',
			color: themeValue.white,
			textAlign: 'center',
			maxWidth: size.s_200
		},
		qrContainer: {
			marginTop: size.s_20,
			marginBottom: size.s_20,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_16
		},
		qrCode: {
			height: size.s_200,
			width: size.s_200
		},
		qrPlaceholder: {
			width: size.s_200,
			height: size.s_200,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: themeValue.secondary,
			borderRadius: size.s_8
		},
		qrPlaceholderText: {
			color: themeValue.textDisabled,
			fontSize: size.s_14
		},
		actionsRow: {
			flexDirection: 'row',
			gap: size.s_12,
			marginBottom: size.s_12,
			justifyContent: 'center',
			paddingHorizontal: size.s_16
		},
		actionButton: {
			paddingVertical: size.s_8,
			paddingHorizontal: size.s_16,
			borderRadius: size.s_8,
			backgroundColor: themeValue.white
		},
		actionButtonDisabled: {
			opacity: 0.5
		},
		actionButtonText: {
			color: themeValue.primary,
			fontSize: size.s_14,
			fontWeight: '600'
		},
		qrDescription: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: themeValue.white,
			textAlign: 'center',
			marginBottom: size.s_12
		},
		qrNote: {
			fontSize: size.s_12,
			color: themeValue.white,
			textAlign: 'center',
			lineHeight: size.s_20
		},
		loadingContainer: {
			paddingVertical: size.s_40,
			paddingHorizontal: size.s_20,
			alignItems: 'center',
			justifyContent: 'center'
		},
		loadingText: {
			fontSize: size.s_14,
			color: themeValue.textDisabled,
			textAlign: 'center'
		}
	});
