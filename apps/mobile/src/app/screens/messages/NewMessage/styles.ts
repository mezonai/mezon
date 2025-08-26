import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		newMessageContainer: {
			backgroundColor: colors.primary,
			flex: 1,
			padding: size.s_18,
			gap: size.s_18
		},
		searchFriend: {
			backgroundColor: colors.secondary,
			borderRadius: 40,
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			flexDirection: 'row'
		},
		searchInput: {
			width: '93%',
			borderRadius: 20,
			color: colors.textStrong,
			paddingVertical: size.s_6,
			height: size.s_40
		},
		defaultText: {
			color: colors.text
		},
		actionsWrapper: {
			borderRadius: size.s_12,
			overflow: 'hidden'
		},
		actionItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_12,
			backgroundColor: colors.secondary,
			padding: size.s_10
		},
		actionTitle: {
			flex: 1,
			color: colors.text
		},
		actionIconWrapper: {
			padding: size.s_8,
			borderRadius: 50
		},
		bgAddFriendIcon: {
			backgroundColor: baseColor.pink
		},
		bgNewGroupIcon: {
			backgroundColor: colors.bgViolet
		}
	});
