import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors?: Attributes) =>
	StyleSheet.create({
		userInfoBox: { flexDirection: 'row', gap: size.s_14, alignItems: 'center', height: size.s_60 },
		username: {
			fontSize: size.s_16,
			marginBottom: size.s_4,
			color: colors?.text || '#FFFFFF',
			fontWeight: '600'
		},
		subUserName: {
			fontSize: size.s_12,
			color: colors?.textDisabled || '#999999',
			fontWeight: '600'
		},
		container: {
			paddingHorizontal: size.s_20,
			width: '100%',
			height: '100%'
		},
		listContainer: {
			height: '100%',
			width: '100%',
			paddingBottom: size.s_100
		}
	});
