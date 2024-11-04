import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		activityAppContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			paddingVertical: size.s_10
		},
		activityAppLabel: {
			fontSize: size.s_18,
			fontWeight: '600',
			color: colors.white
		},
		activityAppText: {
			fontSize: size.s_14,
			fontWeight: '400',
			color: colors.white
		}
	});
