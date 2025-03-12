import { Attributes, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			padding: size.s_10,
			minHeight: Metrics.screenHeight * 0.8
		},
		wrapperHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: size.s_10,
			marginBottom: size.s_16
		},
		buttonHeader: {
			width: '30%',
			gap: size.s_6,
			paddingVertical: size.s_14,
			borderRadius: size.s_20,
			backgroundColor: colors.secondaryLight,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center'
		},
		buttonAlbum: {
			width: '35%',
			gap: size.s_6,
			paddingVertical: size.s_14,
			borderRadius: size.s_20,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center'
		},
		titleButtonHeader: {
			fontSize: size.medium,
			fontWeight: '600',
			color: colors.text
		},
		albumButtonGroup: {
			flexDirection: 'row',
			gap: size.s_4,
			alignItems: 'center'
		},
		albumTitle: {
			color: colors.textStrong,
			fontWeight: 'bold'
		}
	});
