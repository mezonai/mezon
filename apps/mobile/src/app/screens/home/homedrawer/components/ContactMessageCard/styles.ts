import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			width: size.s_200 + size.s_40,
			borderRadius: size.s_12,
			backgroundColor: colors.secondary,
			marginVertical: size.s_4,
			overflow: 'hidden'
		},
		cardGradient: {
			paddingHorizontal: size.s_14,
			paddingTop: size.s_14,
			paddingBottom: size.s_50
		},
		avatarWrapper: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: size.s_12
		},
		avatarContainer: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden',
			borderWidth: 2,
			borderColor: colors.white
		},
		displayNameWrapper: {
			flexDirection: 'column',
			gap: size.s_2,
			flex: 1
		},
		displayName: {
			fontSize: size.s_14,
			color: colors.white,
			fontWeight: '600',
			width: '90%'
		},
		username: {
			fontSize: size.s_12,
			color: colors.text,
			width: '90%'
		},
		actionContainer: {
			flexDirection: 'row',
			backgroundColor: colors.secondaryWeight,
			borderTopWidth: 1,
			borderTopColor: colors.border
		},
		actionButton: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			paddingVertical: size.s_10,
			gap: size.s_6
		},
		actionText: {
			fontSize: size.s_14,
			color: colors.textStrong,
			fontWeight: '500'
		},
		messageButtonText: {
			color: baseColor.blurple
		},
		divider: {
			width: 1,
			backgroundColor: colors.border
		}
	});
