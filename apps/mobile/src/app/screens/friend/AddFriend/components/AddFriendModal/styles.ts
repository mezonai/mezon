import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		addFriendModalContainer: {
			backgroundColor: colors.primary,
			paddingBottom: size.s_100,
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
		form: {
			flex: 1,
			paddingHorizontal: size.s_10,
			paddingBottom: size.s_30
		},
		fill: {
			flex: 1,
			paddingHorizontal: size.s_10
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
			marginHorizontal: size.s_10,
			backgroundColor: baseColor.blurple,
			borderRadius: 50
		},
		buttonTitleStyle: {
			color: baseColor.white,
			fontSize: size.medium
		},
		heightAuto: {
			height: size.s_50
		},
		header: {
			width: '100%',
			zIndex: 10,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			position: 'relative'
		},
		btnClose: {
			padding: size.s_10,
			zIndex: 10,
			paddingRight: size.s_50,
			width: size.s_100
		},
		titleHeader: {
			marginHorizontal: size.s_50,
			top: -size.s_34,
			alignSelf: 'center',
			fontWeight: 'bold',
			fontSize: size.s_18,
			color: colors.text,
			textAlign: 'center'
		}
	});
