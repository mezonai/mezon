import { Dimensions, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
		flex: 1
	},
	widthTab: { width: Dimensions.get('window').width },
	wrapper: {
		flex: 1
	}
});

export default styles;
