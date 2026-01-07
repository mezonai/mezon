import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		description: {
			marginBottom: size.s_8,
			color: colors.text,
			fontSize: size.s_12,
			lineHeight: size.s_15
		},
		containerLoading: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			paddingTop: size.s_10
		},
		padding: {
			paddingHorizontal: size.s_16
		},
		noDevices: {
			justifyContent: 'center',
			alignItems: 'center',
			fontSize: size.s_18,
			color: colors.textDisabled,
			width: '100%',
			textAlign: 'center',
			marginVertical: size.s_20
		}
	});
