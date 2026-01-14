import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		searchInput: {
			padding: size.s_16,
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8
		},

		inputWrapper: {
			flex: 1,
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_10,
			borderRadius: size.s_24
		},

		iconLeftInput: {
			marginRight: size.s_8,
			width: size.s_18,
			borderRadius: size.s_18,
			height: size.s_18,
			resizeMode: 'contain'
		},
		iconRightInput: {
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
			height: size.s_42,
			color: colors.white
		},
		textChannelSelected: {
			flex: 1,
			alignItems: 'center',
			paddingVertical: 0,
			lineHeight: size.s_36,
			color: colors.white
		},

		filterButton: {
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_10,
			height: size.s_42,
			width: size.s_42,
			borderRadius: size.s_42,
			justifyContent: 'center',
			alignItems: 'center'
		},

		filterBadge: {
			marginRight: size.s_6,
			backgroundColor: colors.borderDim,
			borderRadius: size.s_16,
			paddingHorizontal: size.s_4,
			paddingVertical: size.s_4
		},

		tooltipContainer: {
			backgroundColor: colors.primary,
			borderRadius: size.s_10,
			paddingVertical: size.s_4
		},
		tooltipTitle: {
			color: colors.white,
			padding: size.s_10,
			borderBottomWidth: 2,
			borderBottomColor: colors.borderDim,
			fontSize: size.s_14
		},

		tooltipUser: {
			borderBottomWidth: 1,
			borderBottomColor: colors.borderDim
		},

		filterOptionItem: {
			backgroundColor: colors.primary,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_10,
			gap: size.s_10
		},
		filterOptionText: {
			backgroundColor: colors.primary,
			fontSize: size.s_14,
			color: colors.white
		},

		groupAvatarImage: {
			width: '100%',
			height: '100%'
		},
		avatarGroupImage: {
			width: size.s_18,
			height: size.s_18,
			borderRadius: size.s_18,
			overflow: 'hidden'
		},
		tooltipContent: {
			minWidth: size.s_150,
			padding: 0,
			borderRadius: size.s_10,
			backgroundColor: colors.primary
		}
	});
