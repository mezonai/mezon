import type { Attributes } from '@mezon/mobile-ui';
import { size, verticalScale } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';
export const style = (colors: Attributes) =>
	StyleSheet.create({
		fileViewer: {
			gap: size.s_6,
			marginVertical: size.s_6,
			paddingHorizontal: size.s_10,
			width: '80%',
			minHeight: verticalScale(50),
			alignItems: 'center',
			borderRadius: size.s_6,
			flexDirection: 'row',
			backgroundColor: colors.secondaryLight
		},
		fileName: {
			fontSize: size.small,
			color: colors.text
		},
		typeFile: {
			fontSize: size.small,
			color: '#c7c7c7',
			textTransform: 'uppercase'
		},
		fileNameContainer: {
			maxWidth: '75%'
		},
		uploadingOverlay: {
			backgroundColor: 'rgba(0,0,0,0.5)',
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			alignItems: 'flex-end',
			justifyContent: 'center',
			paddingRight: 10
		}
	});
