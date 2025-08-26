import { baseColor, Fonts, Metrics } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		gap: Metrics.size.s,
		borderRadius: 50,
		backgroundColor: baseColor.gray,
		paddingHorizontal: 7,
		paddingVertical: Metrics.size.xs
	},

	containerSuccess: {
		backgroundColor: baseColor.green
	},

	containerDanger: {
		backgroundColor: baseColor.redStrong
	},

	containerWarning: {
		backgroundColor: '#5a62f4'
	},

	title: {
		color: 'white',
		fontSize: Fonts.size.tiny
	}
});

export default styles;
