import { Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	wrapper: {
		height: '100%',
		width: '82%',
		borderTopLeftRadius: 20,
		overflow: 'hidden',
		backgroundColor: Colors.secondary,
		paddingHorizontal: size.s_20,
		paddingVertical: size.s_10
	},
	headerText: {
		fontSize: size.s_20,
		color: Colors.white,
		fontWeight: '600'
	},
	imageBg: {
		width: '90%',
		height: '35%',
		marginVertical: size.s_30
	},
	title: {
		fontSize: size.label,
		color: Colors.white,
		fontWeight: '700',
		textAlign: 'center'
	},
	description: {
		fontSize: size.s_15,
		color: Colors.textGray,
		fontWeight: '500',
		textAlign: 'center'
	},
	joinClan: {
		width: '100%',
		padding: size.s_10,
		backgroundColor: Colors.bgButton,
		borderRadius: size.s_50,
		marginBottom: size.s_10
	},
	createClan: {
		width: '100%',
		padding: size.s_10,
		backgroundColor: Colors.transparent,
		borderWidth: 2,
		borderColor: Colors.bgDarkCharcoal,
		borderRadius: size.s_50
	},
	textCreateClan: {
		fontSize: size.s_15,
		color: Colors.textGray,
		fontWeight: '600',
		textAlign: 'center'
	},
	textJoinClan: {
		fontSize: size.s_15,
		color: Colors.white,
		fontWeight: '600',
		textAlign: 'center'
	}
});
