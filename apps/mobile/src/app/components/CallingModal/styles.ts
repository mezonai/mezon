import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { Platform, StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		centeredView: {
			flex: 1,
			flexDirection: 'row',
			paddingHorizontal: size.s_20,
			paddingVertical: size.s_20,
			position: 'absolute',
			top: Platform.OS === 'ios' ? size.s_20 : 0,
			width: '90%',
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: colors.secondaryLight,
			borderRadius: size.s_10
		},
		btnControl: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_40,
			alignItems: 'center',
			justifyContent: 'center'
		},
		btnDenied: {
			backgroundColor: baseColor.redStrong
		},
		btnAccept: {
			backgroundColor: colors.reactionBorder
		},
		headerTitle: {
			fontSize: size.medium,
			color: colors.white,
			marginBottom: size.s_10,
			marginRight: size.s_2
		},
		username: {
			fontSize: size.regular,
			fontWeight: 'bold',
			color: colors.white
		},
		threeDot: {
			color: colors.white,
			width: size.s_20,
			height: size.s_20
		},
		headerContainer: {
			flex: 1,
			paddingRight: size.s_10
		},
		headerRow: {
			alignItems: 'center',
			flexDirection: 'row'
		},
		buttonContainer: {
			gap: size.s_10,
			flexDirection: 'row'
		}
	});
