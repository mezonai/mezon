import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		addFriendContainer: {
			backgroundColor: colors.primary,
			flex: 1,
			padding: size.s_18,
			gap: size.s_18
		},
		groupWrapper: {
			borderRadius: size.s_8,
			overflow: 'hidden'
		},
		whiteText: {
			color: colors.text,
			fontSize: size.medium
		},
		addFriendItem: {
			padding: size.s_10,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: colors.secondary
		},
		addFriendText: {
			flexShrink: 1,
			color: colors.textStrong,
			fontSize: size.medium
		}
	});
