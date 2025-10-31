import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		backdrop: {
			height: 120,
			position: 'relative',
			marginBottom: size.s_20
		},
		userAvatar: {
			position: 'absolute',
			bottom: '-25%',
			paddingLeft: size.s_14
		},
		statusUser: {
			right: size.s_8,
			bottom: size.s_4
		},
		badgeStatusTemp: {
			position: 'absolute',
			left: size.s_100,
			bottom: size.s_30,
			width: size.s_12,
			height: size.s_12,
			borderRadius: size.s_12,
			backgroundColor: colors.badgeHighlight
		},
		badgeStatus: {
			position: 'absolute',
			gap: size.s_6,
			flexDirection: 'row',
			left: size.s_100,
			top: isTabletLandscape ? size.s_100 : size.s_90,
			minHeight: size.s_40,
			minWidth: size.s_50,
			borderRadius: size.s_16,
			maxWidth: '70%',
			backgroundColor: colors.badgeHighlight,
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_8,
			overflow: 'visible'
		},
		badgeStatusInside: {
			position: 'absolute',
			left: size.s_16,
			top: -size.s_8,
			width: size.s_20,
			height: size.s_20,
			borderRadius: size.s_20,
			backgroundColor: colors.badgeHighlight
		},
		customStatusText: {
			color: colors.text,
			fontSize: size.medium,
			fontWeight: '400'
		},
		rowContainer: {
			flexDirection: 'row'
		},
		topActionButton: {
			position: 'absolute',
			right: size.s_10,
			top: size.s_10,
			padding: size.s_6,
			borderRadius: size.s_20,
			backgroundColor: colors.primary
		},
		transferFundsButton: {
			position: 'absolute',
			right: size.s_50,
			top: size.s_10,
			padding: size.s_6,
			borderRadius: size.s_20,
			backgroundColor: colors.primary
		}
	});
