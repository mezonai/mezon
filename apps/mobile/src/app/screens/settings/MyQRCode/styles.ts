import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		tabContainer: {
			flexDirection: 'row',
			marginHorizontal: size.s_30,
			marginTop: size.s_20,
			backgroundColor: colors.secondary,
			borderRadius: size.s_20,
			padding: size.s_4
		},
		tabButton: {
			flex: 1,
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_10,
			borderRadius: size.s_20,
			alignItems: 'center',
			justifyContent: 'center'
		},
		activeTabButton: {
			backgroundColor: colors.primary
		},
		tabButtonText: {
			color: colors.textDisabled,
			fontSize: size.s_12,
			fontWeight: '500'
		},
		activeTabButtonText: {
			color: colors.text,
			fontWeight: '600'
		},
		card: {
			marginTop: size.s_30,
			marginHorizontal: size.s_30,
			padding: size.s_10,
			borderRadius: size.s_10,
			backgroundColor: colors.secondary
		},
		headerCard: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingBottom: size.s_14,
			gap: size.s_14,
			borderBottomColor: colors.border,
			borderBottomWidth: 1
		},
		avatar: {
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_10
		},
		defaultAvatar: {
			backgroundColor: colors.colorAvatarDefault,
			overflow: 'hidden',
			width: size.s_50,
			height: size.s_50,
			borderRadius: size.s_8,
			alignItems: 'center',
			justifyContent: 'center'
		},
		textAvatar: {
			textAlign: 'center',
			fontSize: size.h4,
			color: baseColor.white,
			fontWeight: 'bold'
		},
		nameProfile: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '600'
		},
		tokenProfile: {
			color: colors.textDisabled,
			marginTop: size.s_4,
			fontSize: size.s_14
		},
		qrContainer: {
			alignItems: 'center',
			justifyContent: 'center',
			marginVertical: size.s_20
		},
		imageQR: {
			width: size.s_220,
			height: size.s_220,
			borderRadius: size.s_6
		},
		descriptionContainer: {
			alignItems: 'center',
			paddingHorizontal: size.s_20,
			marginBottom: size.s_20
		},
		descriptionText: {
			color: colors.textDisabled,
			fontSize: size.s_12,
			textAlign: 'center',
			lineHeight: size.s_16
		},
		navigateButton: {
			alignSelf: 'center',
			backgroundColor: colors.primary,
			borderColor: colors.border,
			borderWidth: 1,
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_20,
			borderRadius: size.s_8
		},
		navigateButtonText: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '600'
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
			backgroundColor: colors.primary
		}
	});
