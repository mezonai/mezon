import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		clanName: {
			color: colors.text,
			fontSize: size.s_14,
			fontWeight: '700',
			maxWidth: '91%'
		},

		inviteContainer: {
			backgroundColor: colors.secondary,
			borderRadius: size.s_12,
			padding: size.s_12,
			marginVertical: size.s_12,
			alignSelf: 'flex-start',
			flex: 1,
			gap: size.s_16,
			width: size.s_220 + size.s_40
		},

		inviteTitle: {
			color: colors.textDisabled,
			fontSize: size.h8,
			fontWeight: '600',
			letterSpacing: 0.5,
			marginVertical: -size.s_2,
			marginBottom: -size.s_6
		},

		clanInfoRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10
		},

		clanAvatar: {
			width: size.s_48,
			height: size.s_48,
			borderRadius: size.s_14,
			backgroundColor: colors.secondary
		},

		defaultAvatar: {
			width: size.s_48,
			height: size.s_48,
			borderRadius: size.s_8,
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
			borderRadius: size.s_4,
			paddingVertical: size.s_6,
			paddingHorizontal: size.s_12,
			alignItems: 'center'
		},

		joinButtonText: {
			color: 'white',
			fontSize: size.s_14,
			fontWeight: '600',
			letterSpacing: 0.5
		},

		clanNameRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_2
		}
	});
