/* eslint-disable prettier/prettier */
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (theme: any) =>
	StyleSheet.create({
		container: {
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: size.s_20,
			gap: size.s_8
		},
		icon: {
			fontSize: size.s_50,
			marginBottom: size.s_4
		},
		title: {
			fontSize: size.s_15,
			color: theme.textDisabled,
			textAlign: 'center',
			lineHeight: size.s_20,
			maxWidth: 280
		}
	});
