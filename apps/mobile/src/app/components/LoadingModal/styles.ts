import { StyleSheet } from 'react-native';

export const style = (isTransparent: boolean) =>
	StyleSheet.create({
		centeredView: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: isTransparent ? 'transparent' : 'rgba(0,0,0,0.7)',
			position: 'absolute',
			zIndex: 2,
			top: 0,
			left: 0,
			width: '100%',
			height: '100%'
		}
	});
