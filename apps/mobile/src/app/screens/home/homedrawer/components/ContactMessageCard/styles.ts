import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTablet: boolean) =>
	StyleSheet.create({
		container: {
			width: isTablet ? '50%' : '90%',
			alignSelf: 'flex-start',
			borderRadius: size.s_12,
			borderWidth: 1,
			borderColor: colors.borderDim,
			marginRight: size.s_100,
			backgroundColor: colors.secondary,
			marginTop: size.s_4,
			overflow: 'hidden'
		},
		avatarWrapper: {
			flexDirection: 'row',
			gap: size.s_12,
			paddingVertical: size.s_16,
			paddingLeft: size.s_12
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
			flexShrink: 1,
			paddingRight: size.s_10,
			gap: size.s_2
		},
		displayName: {
			fontSize: size.s_14,
			color: colors.white,
			fontWeight: '600'
		},
		username: {
			fontSize: size.s_12,
			color: colors.text
		},
		actionContainer: {
			flexDirection: 'row',
			backgroundColor: colors.secondaryWeight,
			borderTopWidth: 1,
			borderTopColor: colors.borderDim
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
