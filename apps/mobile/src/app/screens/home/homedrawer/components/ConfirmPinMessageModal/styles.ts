import { Colors, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	container: {
		overflow: 'hidden',
		backgroundColor: Colors.bgDarkCharcoal,
		alignSelf: 'center',
		borderRadius: size.s_10,
		padding: size.s_10,
		maxHeight: '40%',
		maxWidth: '90%',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		gap: size.s_10
	},
	noButton: {
		paddingVertical: size.s_10,
		borderRadius: 50,
		backgroundColor: Colors.bgGrayDark
	},
	yesButton: {
		paddingVertical: size.s_10,
		borderRadius: 50,
		backgroundColor: Colors.bgViolet
	},
	buttonText: {
		color: Colors.white,
		textAlign: 'center'
	},
	buttonsWrapper: {
		maxHeight: 90,
		gap: size.s_10
	},
	title: {
		fontSize: size.h6,
		color: Colors.white,
		paddingBottom: size.s_10
	},
	descriptionText: {
		color: Colors.tertiary
	},
	messageBox: {
		paddingVertical: size.s_4,
		minHeight: size.s_60,
		maxHeight: size.s_100
	}
});
