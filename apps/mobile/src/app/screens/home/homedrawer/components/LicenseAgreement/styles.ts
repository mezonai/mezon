import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)'
	},
	sheetContainer: {
		overflow: 'hidden',
		backgroundColor: 'white',
		alignSelf: 'center',
		borderRadius: size.s_10,
		paddingVertical: size.s_10,
		maxHeight: '70%',
		maxWidth: '85%',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between'
	},
	headerModal: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: size.s_14,
		paddingTop: size.s_10
	},
	headerText: {
		color: 'black',
		fontSize: size.label,
		paddingBottom: size.label,
		textAlign: 'center',
		flex: 1,
		fontWeight: '600'
	},
	btn: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#5a62f4',
		paddingVertical: 10,
		borderRadius: 50,
		marginHorizontal: size.s_10,
		marginBottom: size.s_18
	},
	btnText: {
		color: 'white'
	},
	content: {
		backgroundColor: 'white',
		paddingHorizontal: size.s_14
	},
	header: {
		color: 'black',
		fontSize: size.s_12,
		fontWeight: 'bold',
		marginBottom: size.s_12
	},
	text: {
		color: 'black',
		fontSize: size.s_12,
		marginBottom: size.s_12
	},
	bulletPoint: {
		color: 'black',
		fontSize: size.s_12,
		marginLeft: size.s_20,
		marginBottom: size.s_12
	},
	link: {
		fontSize: size.s_12,
		color: baseColor.link,
		paddingBottom: size.s_20
	}
});
