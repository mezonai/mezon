import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		addFriendModalContainer: {
			paddingHorizontal: size.s_4,
			gap: size.s_18,
			flex: 1
		},
		whiteText: {
			color: colors.text
		},
		searchInput: {
			borderRadius: size.s_10,
			color: colors.textStrong,
			paddingVertical: size.s_12,
			fontSize: size.medium,
			flex: 1
		},
		searchUsernameWrapper: {
			backgroundColor: colors.secondary,
			borderRadius: size.s_10,
			alignItems: 'center',
			paddingHorizontal: size.s_12,
			flexDirection: 'row'
		},
		fill: {
			flex: 1
		},
		headerTitle: {
			color: colors.textStrong,
			fontSize: size.h5,
			textAlign: 'center'
		},
		defaultText: {
			color: colors.text,
			paddingVertical: size.s_14,
			fontSize: size.medium
		},
		byTheWayText: {
			flexDirection: 'row',
			gap: size.s_4,
			alignItems: 'center'
		},
		buttonWrapper: {
			marginBottom: size.s_40
		},
		sendButton: {
			paddingVertical: size.s_14,
			backgroundColor: baseColor.blurple,
			borderRadius: 50
		}
	});
