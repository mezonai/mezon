import { StyleSheet } from 'react-native';

export const style = () =>
	StyleSheet.create({
		container: {
			flex: 1,
			position: 'absolute',
			top: 0,
			left: 0,
			height: '100%',
			width: '100%',
			zIndex: 999999
		}
	});
