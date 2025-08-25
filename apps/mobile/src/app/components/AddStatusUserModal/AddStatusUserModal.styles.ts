import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	headerModal: {
		backgroundColor: 'transparent',
		paddingHorizontal: size.s_20
	},
	titleHeader: {
		width: '76%',
		textAlign: 'center'
	},
	option: {
		backgroundColor: '#242427'
	},
	durationText: {
		fontSize: size.label,
		color: '#c7c7c7',
		fontWeight: '600',
		marginBottom: size.s_10,
		marginTop: size.s_30
	},
	titleModal: {
		flex: 1,
		textAlign: 'center',
		position: 'absolute',
		alignSelf: 'center',
		left: 0,
		right: 0,
		zIndex: -1
	}
});
