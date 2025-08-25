import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		bottomSheetWrapper: {
			minHeight: '100%',
			overflow: 'hidden',
			borderTopLeftRadius: size.s_14,
			borderTopRightRadius: size.s_14
		},
		messageActionsWrapper: {
			paddingVertical: size.s_20,
			gap: size.s_10,
			backgroundColor: colors.primary
		},
		reactWrapper: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			paddingHorizontal: size.s_12,
			paddingBottom: size.s_6,
			alignItems: 'center'
		},
		messageActionGroup: {
			backgroundColor: colors.secondary,
			marginHorizontal: size.s_10,
			borderRadius: size.s_10,
			overflow: 'hidden',
			gap: 1
		},
		actionItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_12,
			backgroundColor: colors.secondary
		},
		icon: {
			width: size.s_40,
			height: size.s_20
		},
		warningIcon: {
			height: size.s_32,
			width: size.s_32,
			backgroundColor: colors.tertiary,
			borderRadius: 50,
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: size.s_10
		},
		favouriteIconItem: {
			backgroundColor: colors.secondary,
			padding: size.s_10,
			borderRadius: 50
		},
		reactIcon: {
			fontSize: size.h4,
			color: 'white'
		},
		actionText: {
			color: colors.text,
			fontSize: size.h8
		},
		warningActionText: {
			color: baseColor.redStrong,
			fontSize: size.h8
		},
		actionIcon: {
			color: 'white'
		},
		bottomSheetBar: {
			width: size.s_30,
			height: size.s_4,
			borderRadius: 20,
			backgroundColor: colors.textStrong
		},
		bottomSheetBarWrapper: {
			height: 20,
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: 'transparent',
			position: 'absolute'
		},
		bottomSheet: {
			borderTopLeftRadius: size.s_14,
			borderTopRightRadius: size.s_14,
			overflow: 'hidden'
		},
		emojiButton: {
			height: size.s_28,
			width: size.s_34
		},
		reactionImage: {
			width: size.s_22,
			height: size.s_22
		}
	});
