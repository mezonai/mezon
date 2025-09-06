import { Attributes, Metrics } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1
		},
		main: {
			padding: Metrics.size.xl
		},

		box: {
			height: 80,
			width: 55,
			borderRadius: 10,
			borderWidth: 1
		}
	});
