import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		buttonCircle: {
			backgroundColor: colors.tertiary,
			padding: size.s_8,
			borderRadius: size.s_22
		},
		text: { fontSize: size.s_20, fontWeight: '600', color: colors.text },
		textDisable: { fontSize: size.s_16, fontWeight: '400', color: colors.textDisabled, textAlign: 'center' },
		lineBtn: { width: '100%', alignItems: 'center', padding: size.s_10 },
		btnJoinVoice: {
			borderRadius: size.s_40,
			backgroundColor: baseColor.green,
			height: size.s_50,
			width: size.s_200,
			justifyContent: 'center',
			alignItems: 'center'
		},
		textBtnJoinVoice: { fontSize: size.s_16, fontWeight: '600', color: baseColor.white },
		avatarCircle: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden',
			marginLeft: -5,
			borderWidth: 1,
			borderColor: colors.white,
			backgroundColor: colors.white
		},
		badgeContainer: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_50,
			borderWidth: 1,
			borderColor: colors.white,
			backgroundColor: colors.tertiary,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: -5
		},
		textBadge: {
			fontSize: size.s_12,
			fontWeight: '600',
			textAlign: 'center',
			color: colors.text
		},
		iconVoice: {
			padding: size.s_20,
			borderRadius: '100%',
			backgroundColor: colors.tertiary,
			justifyContent: 'center',
			alignItems: 'center'
		},
		controlContainerOuter: {
			borderRadius: size.s_40,
			marginTop: size.s_20,
			marginBottom: size.s_10,
			paddingBottom: size.s_30
		},
		controlContainerInner: {
			gap: size.s_20,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingBottom: size.s_16
		},
		controlContainer: {
			justifyContent: 'center',
			alignItems: 'center',
			position: 'relative',
			width: size.s_50,
			height: size.s_50,
			backgroundColor: 'transparent',
			borderRadius: size.s_30
		},
		btnJoinVoiceContainer: {
			flexDirection: 'column',
			flex: 1,
			paddingHorizontal: size.s_16,
			alignItems: 'center'
		},
		container: {
			width: '100%',
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_10
		},
		headerRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: 10
		},
		headerLeftContent: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			gap: 10,
			flexGrow: 1,
			flexShrink: 1
		},
		textFlexible: {
			flexGrow: 1,
			flexShrink: 1
		},
		inviteButton: {
			backgroundColor: colors.tertiary,
			padding: size.s_8,
			borderRadius: size.s_22
		},
		centerContent: {
			alignItems: 'center',
			gap: size.s_6,
			marginTop: size.s_20
		},
		avatarContainer: {
			paddingVertical: size.s_10,
			justifyContent: 'center',
			alignItems: 'center'
		},
		avatarRow: {
			flexDirection: 'row'
		},
		controlContainerTertiary: {
			backgroundColor: colors.tertiary
		},
		chatButtonContainer: {
			position: 'relative'
		},
		chatBadgeWrapper: {
			position: 'absolute',
			top: -size.s_4,
			right: -size.s_4,
			zIndex: 1
		}
	});
