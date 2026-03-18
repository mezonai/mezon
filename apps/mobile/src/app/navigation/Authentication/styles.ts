import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	flexContainer: {
		flex: 1
	},
	tabBarIconContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		gap: size.s_4,
		paddingVertical: size.s_4,
		width: size.s_90
	},
	tabBarText: {
		fontSize: size.s_10,
		fontWeight: '600'
	}
});
