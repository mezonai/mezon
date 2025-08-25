import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	wrapper: {
		width: '100%',
		backgroundColor: 'transparent',
		paddingHorizontal: size.s_20,
		marginTop: size.s_60
	},
	headerText: {
		fontSize: size.s_20,
		color: 'white',
		fontWeight: '600'
	},
	imageBg: {
		width: '100%',
		height: '40%'
	},
	title: {
		fontSize: size.label,
		color: 'white',
		fontWeight: '700',
		textAlign: 'center'
	},
	description: {
		fontSize: size.small,
		color: '#c7c7c7',
		fontWeight: '500',
		textAlign: 'center',
		marginTop: size.s_10
	},
	addFriendsBtn: {
		width: '100%',
		padding: size.s_10,
		backgroundColor: '#5865f2',
		borderRadius: size.s_50
	},
	textAddFriends: {
		fontSize: size.medium,
		color: 'white',
		fontWeight: '600',
		textAlign: 'center'
	}
});
