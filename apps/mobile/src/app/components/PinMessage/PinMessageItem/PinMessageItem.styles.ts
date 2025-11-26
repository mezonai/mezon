import type { Attributes } from '@mezon/mobile-ui';
import { Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		pinMessageItemWrapper: {
			flexDirection: 'row',
			gap: size.s_10,
			marginBottom: size.s_10,
			justifyContent: 'space-between',
			alignItems: 'flex-start',
			backgroundColor: colors.secondary,
			padding: Metrics.size.l,
			borderRadius: size.s_10
		},
		pinMessageItemBox: {
			flex: 1,
			overflow: 'hidden'
		},
		pinMessageItemName: {
			fontSize: size.s_16,
			color: colors.textStrong,
			fontWeight: '600'
		},
		pinMessageItemClose: {
			borderRadius: 50
		},
		avatarWrapper: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			overflow: 'hidden'
		}
	});
