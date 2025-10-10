import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		categoryItem: {
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_8,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			borderBottomColor: colors.border,
			borderBottomWidth: 1,
			gap: size.s_10
		},
		categoryLabel: {
			fontSize: size.medium,
			color: colors.white,
			fontWeight: '600',
			flexShrink: 1
		},
		categorySubtext: {
			fontSize: size.medium,
			color: colors.textDisabled,
			fontWeight: '400'
		},
		customStatus: {
			fontSize: size.medium,
			color: colors.textDisabled,
			fontWeight: '600'
		},
		channelTitle: {
			flexDirection: 'row',
			gap: size.s_10,
			alignItems: 'center',
			flexShrink: 1,
			width: '60%',
			minWidth: 0
		},
		notificationType: {
			flexDirection: 'row',
			gap: size.s_10,
			alignItems: 'center'
		}
	});
