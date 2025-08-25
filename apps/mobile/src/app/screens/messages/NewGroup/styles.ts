import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		newGroupContainer: {
			backgroundColor: colors.primary,
			flex: 1
		},
		contentWrapper: {
			flex: 1,
			padding: size.s_18
		},
		headerWrapper: {
			flexDirection: 'row',
			padding: size.s_14,
			gap: size.s_14,
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.primary
		},
		screenTitleWrapper: {
			flex: 1,
			alignItems: 'center'
		},
		screenTitle: {
			color: colors.text,
			fontSize: size.label,
			fontWeight: '600'
		},
		actions: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			gap: size.s_20,
			width: size.s_70
		},
		actionText: {
			color: '#5a62f4',
			fontSize: size.medium
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
			borderRadius: size.s_20,
			height: size.s_40,
			color: colors.textStrong,
			paddingVertical: size.s_6,
			marginLeft: 5
		},
		friendListWrapper: {
			flex: 1,
			paddingTop: size.s_10
		}
	});
