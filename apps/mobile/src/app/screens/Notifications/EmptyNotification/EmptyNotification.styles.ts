import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		title: {
			fontSize: size.regular,
			fontWeight: '600',
			color: colors.white
		},
		description: {
			fontSize: size.medium,
			fontWeight: '300',
			color: colors.text,
			textAlign: 'center',
			maxWidth: '80%',
			marginBottom: size.s_20
		},
		container: {
			position: 'relative',
			width: '100%',
			height: '100%'
		},
		contentWrapper: {
			position: 'absolute',
			left: size.s_10,
			right: size.s_10,
			top: '8%',
			flexDirection: 'column',
			alignItems: 'center',
			gap: size.s_10
		}
	});
