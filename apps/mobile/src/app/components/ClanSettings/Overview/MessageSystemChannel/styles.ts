import { Attributes, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		channelItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_10,
			padding: size.s_16
		},
		channelItemText: {
			color: colors.text,
			fontSize: Metrics.size.l,
			fontWeight: '500',
			width: 200
		}
	});
