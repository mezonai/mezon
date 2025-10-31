import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		listUserByAlphabetContainer: {
			flex: 1,
			overflow: 'scroll',
			paddingBottom: size.s_10
		},
		groupByAlphabetWrapper: {
			borderRadius: size.s_8
		},
		findingFriendWrapper: {
			paddingTop: size.s_20
		},
		groupFriendTitle: {
			color: colors.text,
			paddingVertical: size.s_6
		},
		groupWrapper: {
			borderRadius: size.s_12
		},
		friendText: {
			color: colors.text,
			paddingVertical: size.s_18
		}
	});
