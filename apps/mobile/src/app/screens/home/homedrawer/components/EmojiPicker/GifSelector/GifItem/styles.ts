import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		marginTop: 20,
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'space-around',
		gap: 10
	},

	content: {
		position: 'relative',
		height: 100,
		flex: 1,
		flexBasis: 170,
		borderRadius: 10,
		overflow: 'hidden',
		backgroundColor: 'black'
	},
	fastImage: {
		height: '100%',
		width: '100%'
	},
	containerLoading: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: size.s_10
	}
});

export default styles;
