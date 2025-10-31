import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	textWrapper: {
		height: '100%',
		width: '100%',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#00000060',
		position: 'absolute',
		top: 0,
		left: 0
	},
	textTitle: {
		color: 'white'
	},
	content: {
		position: 'relative',
		height: 100,
		flex: 1,
		flexBasis: 170,
		borderRadius: 10,
		overflow: 'hidden'
	},
	fastImage: {
		height: '100%',
		width: '100%'
	},
	container: {
		marginTop: 20,
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'space-around',
		gap: 10
	},
	containerLoading: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: size.s_10
	}
});

export default styles;
