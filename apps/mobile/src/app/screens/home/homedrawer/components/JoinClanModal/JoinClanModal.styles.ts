import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	headerModal: { backgroundColor: 'transparent' },
	title: {
		fontSize: size.h5,
		fontWeight: '600',
		color: 'white',
		textAlign: 'center',
		marginBottom: size.s_10
	},
	textInviteBtn: {
		fontSize: size.label,
		fontWeight: '500',
		color: 'white',
		textAlign: 'center'
	},
	btnInvite: {
		width: '100%',
		padding: size.s_10,
		backgroundColor: '#5865f2',
		borderRadius: size.s_50,
		position: 'absolute',
		bottom: size.s_60,
		left: size.s_20
	},
	description: {
		fontSize: size.medium,
		fontWeight: '500',
		color: '#c7c7c7',
		textAlign: 'center'
	},
	textExample: {
		fontSize: size.small,
		fontWeight: '400',
		color: '#c7c7c7'
	}
});
