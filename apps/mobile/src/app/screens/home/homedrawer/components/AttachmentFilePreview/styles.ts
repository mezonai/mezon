import { Colors, horizontalScale, size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		backgroundColor: Colors.secondary,
		borderTopColor: Colors.gray72,
		padding: size.s_16
	},
	attachmentItem: {
		marginRight: size.s_14,
		borderRadius: size.s_6,
		height: verticalScale(80),
		paddingTop: size.s_10
	},
	attachmentItemImage: {
		width: verticalScale(70),
		height: '100%',
		borderRadius: size.s_6
	},
	iconClose: {
		position: 'absolute',
		top: 0,
		right: -size.s_10,
		backgroundColor: Colors.tertiary,
		borderWidth: 2,
		borderColor: Colors.secondary,
		borderRadius: size.s_20,
		padding: size.s_2,
		zIndex: 2
	},
	videoOverlay: {
		position: 'absolute',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		alignItems: 'center',
		justifyContent: 'center',
		bottom: 0,
		height: '100%',
		width: '100%',
		borderRadius: size.s_6
	},
	fileViewer: {
		gap: size.s_6,
		paddingHorizontal: size.s_10,
		maxWidth: horizontalScale(150),
		height: '100%',
		alignItems: 'center',
		borderRadius: size.s_6,
		flexDirection: 'row',
		backgroundColor: Colors.bgPrimary
	},
	fileName: {
		fontSize: size.small,
		color: Colors.white
	},
	typeFile: {
		fontSize: size.small,
		color: Colors.textGray,
		textTransform: 'uppercase'
	}
});

export default styles;
