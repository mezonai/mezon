import { Attributes, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		loading: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center'
		},
		pool: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			flexDirection: 'row',
			gap: size.s_10,
			marginTop: -size.s_10
		}
	});
