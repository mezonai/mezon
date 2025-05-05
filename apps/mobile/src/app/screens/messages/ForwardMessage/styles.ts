import { Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	listContainer: {
		height: '100%',
		paddingHorizontal: 16
	},
	inputSearch: {
		borderRadius: 8,
		height: 36
	},
	btn: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.bgViolet,
		paddingVertical: size.s_16,
		borderRadius: 50,
		marginHorizontal: size.s_10,
		marginBottom: size.s_24
	},
	btnText: {
		color: Colors.white,
		fontSize: size.medium
	}
});
