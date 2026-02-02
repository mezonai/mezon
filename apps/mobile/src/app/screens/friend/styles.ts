import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		friendContainer: {
			backgroundColor: colors.primary,
			flex: 1,
			padding: size.s_18,
			gap: size.s_14
		},
		searchFriend: {
			backgroundColor: colors.secondary,
			borderRadius: 40,
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			flexDirection: 'row'
		},
		searchInput: {
			marginLeft: 5,
			width: '93%',
			borderRadius: 20,
			color: colors.textStrong,
			paddingVertical: 0,
			height: size.s_50
		},
		requestFriendWrapper: {
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_8,
			borderRadius: size.s_8,
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: 10,
			alignItems: 'center'
		},
		fill: {
			flex: 1
		},
		requestContentWrapper: {
			flexDirection: 'row',
			gap: size.s_4
		},
		defaultText: {
			color: colors.text
		}
	});