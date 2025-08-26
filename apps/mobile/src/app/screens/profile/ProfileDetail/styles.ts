import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			backgroundColor: colors.primary,
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		profileContainer: {
			width: '90%',
			backgroundColor: colors.secondary,
			borderRadius: size.s_12,
			padding: size.s_12,
			paddingVertical: size.s_20
		},

		profileTitle: {
			color: colors.textDisabled,
			fontSize: size.h8,
			marginBottom: size.s_20,
			fontWeight: '600',
			letterSpacing: 0.5,
			textAlign: 'center'
		},

		userInfo: {
			alignItems: 'center',
			marginBottom: size.s_20
		},

		profileImage: {
			width: size.s_65,
			height: size.s_65,
			borderRadius: size.s_40
		},

		defaultAvatar: {
			width: size.s_65,
			height: size.s_65,
			borderRadius: size.s_40,
			backgroundColor: baseColor.blurple,
			alignItems: 'center',
			justifyContent: 'center'
		},

		defaultAvatarText: {
			color: 'white',
			fontSize: size.s_26,
			fontWeight: '600'
		},

		username: {
			color: colors.text,
			fontSize: size.s_20,
			fontWeight: '700'
		},

		userStatus: {
			color: colors.textDisabled,
			fontSize: size.small,
			fontWeight: '500',
			letterSpacing: 0.5,
			textAlign: 'center',
			maxWidth: '80%'
		},
		actionButton: {
			marginTop: size.s_10,
			backgroundColor: baseColor.blurple,
			borderRadius: size.s_100,
			paddingVertical: size.s_12,
			paddingHorizontal: size.s_12,
			alignItems: 'center'
		},

		actionButtonText: {
			color: 'white',
			fontSize: size.s_14,
			fontWeight: '600',
			letterSpacing: 0.5
		},

		dismissButton: {
			backgroundColor: colors.textDisabled
		},

		cancelButton: {
			backgroundColor: baseColor.bgDanger
		},

		acceptButton: {
			backgroundColor: baseColor.bgSuccess
		}
	});
