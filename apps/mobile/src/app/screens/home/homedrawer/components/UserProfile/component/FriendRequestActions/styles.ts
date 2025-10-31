import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		friendRequestContainer: {
			marginTop: size.s_16
		},
		friendRequestActions: {
			flexDirection: 'row',
			gap: size.s_10,
			marginTop: size.s_10
		},
		receivedFriendRequestTitle: {
			color: colors.text,
			fontSize: size.h7,
			fontWeight: 'bold'
		},
		defaultText: {
			color: 'white',
			textAlign: 'center'
		},
		button: {
			flex: 1,
			paddingVertical: size.s_6,
			borderRadius: size.s_2
		},
		acceptButton: {
			backgroundColor: baseColor.green
		},
		ignoreButton: {
			backgroundColor: baseColor.bgButtonSecondary
		}
	});
