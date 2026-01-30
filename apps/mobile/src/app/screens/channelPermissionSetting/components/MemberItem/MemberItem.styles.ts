import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			gap: size.s_10,
			flexDirection: 'row',
			padding: size.s_10,
			alignItems: 'center'
		},
		checkboxContainer: {
			height: size.s_20,
			width: size.s_20
		},
		userInfoContainer: {
			flex: 1
		},
		nameRow: {
			flexDirection: 'row',
			gap: size.s_4,
			alignItems: 'center'
		},
		nameText: {
			fontSize: size.s_14,
			marginLeft: 0,
			marginRight: 0,
			color: colors.white
		},
		usernameText: {
			marginLeft: 0,
			marginRight: 0,
			color: colors.textDisabled
		},
		avatarWrapper: {
			width: size.s_36,
			height: size.s_36,
			borderRadius: size.s_36,
			overflow: 'hidden'
		}
	});
