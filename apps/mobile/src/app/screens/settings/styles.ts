import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		settingContainer: {
			backgroundColor: colors.secondary,
			flex: 1
		},
		settingScroll: {
			padding: size.s_20
		},
		webViewHidden: {
			height: 0,
			position: 'absolute',
			zIndex: -1
		},
		backButton: {
			height: size.s_24,
			width: size.s_24
		},
		title: {
			color: colors.textStrong,
			fontSize: size.s_16,
			fontWeight: 'bold'
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_6,
			gap: size.s_10
		}
	});
