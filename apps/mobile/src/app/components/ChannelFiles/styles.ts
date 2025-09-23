import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { Dimensions, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		containerPinMessage: {
			paddingHorizontal: size.s_12
		},
		container: {
			paddingHorizontal: size.s_10,
			flex: 1
		},
		listContent: {
			paddingBottom: size.s_6
		},
		sectionHeader: {
			padding: size.s_10,
			backgroundColor: colors.primary,
			width: Dimensions.get('screen').width
		},
		sectionYearHeaderTitle: {
			color: colors.textStrong,
			fontSize: 16,
			fontWeight: '700',
			marginBottom: size.s_4
		},
		sectionDayHeaderTitle: {
			color: colors.text,
			fontSize: 14,
			fontWeight: '600'
		}
	});
