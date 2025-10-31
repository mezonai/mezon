import { Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	scrollViewStyle: {
		maxHeight: Metrics.screenHeight / 1.07
	},
	scrollViewContent: {
		paddingBottom: size.s_10 * 2
	}
});

export default styles;
