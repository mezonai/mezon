import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		// Search input container
		searchInput: {
			padding: size.s_16,
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8
		},

		// Input wrapper for search
		inputWrapper: {
			flex: 1,
			backgroundColor: colors.secondary,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_10,
			borderRadius: size.s_24,
		},

		// Input icons
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

		// Text inputs
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

		// Filter button
		filterButton: {
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_10,
			height: size.s_42,
			width: size.s_42,
			borderRadius: size.s_42,
			justifyContent: 'center',
			alignItems: 'center'
		},

		// Filter badge
		filterBadge: {
			marginRight: size.s_6,
			backgroundColor: colors.borderDim,
			borderRadius: size.s_8,
			paddingHorizontal: size.s_8,
			paddingVertical: size.s_2
		},
		filterBadgeText: {
			fontSize: size.small,
			color: colors.white
		},

		// Tooltip styles
		tooltipContainer: {
			backgroundColor: colors.primary,
			borderRadius: size.s_10,
			paddingVertical: size.s_4,
		},
		tooltipTitle: {
			color: colors.white,
			padding: size.s_10,
			borderBottomWidth: 2,
			borderBottomColor: colors.borderDim
		},

		// Filter options
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

		groupAvatarWrapper: {
			width: size.s_18,
			height: size.s_18,
			borderRadius: size.s_12,
			overflow: 'hidden'
		}
	});
