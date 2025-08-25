import { StyleSheet } from 'react-native';

export const style = () =>
	StyleSheet.create({
		closeIcon: {
			color: 'white'
		},
		modalOverlay: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(0, 0, 0, 0.5)'
		},
		modalContainer: {
			width: 300,
			padding: 20,
			backgroundColor: 'white',
			borderRadius: 10,
			alignItems: 'center'
		},
		title: {
			fontSize: 18,
			fontWeight: 'bold',
			marginBottom: 10
		},
		message: {
			fontSize: 16,
			marginBottom: 20,
			textAlign: 'center'
		},
		buttonContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			width: '100%'
		}
	});
