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
		clanName: {
			color: colors.text,
			fontSize: size.s_20,
			fontWeight: '700'
		},

		inviteContainer: {
			width: '90%',
			backgroundColor: colors.secondary,
			borderRadius: size.s_12,
			padding: size.s_12,
			paddingVertical: size.s_20,
			gap: size.s_10
		},

		inviteTitle: {
			color: colors.textDisabled,
			fontSize: size.h8,
			marginBottom: size.s_20,
			fontWeight: '600',
			letterSpacing: 0.5,
			textAlign: 'center'
		},

		clanInfo: {
			alignItems: 'center',
			gap: size.s_10,
			marginBottom: size.s_20
		},

		clanAvatar: {
			width: size.s_65,
			height: size.s_65,
			borderRadius: size.s_14,
			backgroundColor: colors.secondary,
			overflow: 'hidden'
		},

		defaultAvatar: {
			width: size.s_65,
			height: size.s_65,
			borderRadius: size.s_14,
			backgroundColor: baseColor.blurple,
			alignItems: 'center',
			justifyContent: 'center'
		},

		defaultAvatarText: {
			color: 'white',
			fontSize: size.s_26,
			fontWeight: '600'
		},

		clanTextInfo: {
			flex: 1,
			gap: size.s_2
		},

		channelName: {
			color: colors.textDisabled,
			fontSize: size.small,
			fontWeight: '500',
			letterSpacing: 0.5
		},

		joinButton: {
			backgroundColor: baseColor.blurple,
			borderRadius: size.s_100,
			paddingVertical: size.s_12,
			paddingHorizontal: size.s_12,
			alignItems: 'center'
		},

		joinButtonText: {
			color: 'white',
			fontSize: size.s_14,
			fontWeight: '600',
			letterSpacing: 0.5
		},

		disMissButton: {
			backgroundColor: colors.textDisabled
		},

		clanNameRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_2
		}
	});
