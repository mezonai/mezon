import { Attributes, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		bottomSheetContainer: {
			padding: Metrics.size.xl,
			borderRadius: 10,
			overflow: 'hidden'
		},
		clanItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			gap: size.s_12,
			backgroundColor: colors.secondary,
			padding: size.s_10
		},
		selectClanWrapper: {},
		actionItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_12,
			backgroundColor: colors.secondary,
			padding: size.s_10
		},
		clanAvatarWrapper: {
			borderRadius: size.s_10,
			overflow: 'hidden',
			width: size.s_40,
			height: size.s_40
		},
		avatar: {
			height: size.s_30,
			width: size.s_30,
			alignItems: 'center',
			justifyContent: 'center'
		},
		textAvatar: {
			color: 'white'
		},
		clanName: {
			color: colors.text,
			fontSize: size.label
		},
		btnIcon: {
			padding: size.s_8,
			borderRadius: size.s_10,
			backgroundColor: colors.bgViolet
		},
		btnGroup: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			paddingHorizontal: size.s_10,
			marginTop: -20
		},
		clanProfileDetail: {
			backgroundColor: colors.secondary,
			marginHorizontal: 20,
			borderRadius: 10,
			marginTop: 20,
			padding: 20
		},
		displayNameText: {
			color: colors.textStrong,
			fontWeight: '700',
			fontSize: size.h5
		},
		usernameText: {
			color: colors.text,
			fontSize: size.small
		},
		nameWrapper: {
			marginBottom: 20
		},
		optionTitle: {
			flexDirection: 'row',
			gap: size.s_10,
			alignItems: 'center'
		}
	});
