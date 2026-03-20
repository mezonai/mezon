import type { Attributes } from '@mezon/mobile-ui';
import { Fonts, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			padding: size.s_10,
			height: '100%'
		},
		tabContainer: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			gap: 10,
			padding: 6,
			backgroundColor: colors.secondary,
			borderRadius: 50
		},
		selected: {
			borderRadius: 50,
			paddingHorizontal: 20,
			paddingVertical: 6
		},
		textInput: {
			color: colors.text,
			flexGrow: 1,
			flexBasis: 10,
			fontSize: size.medium,
			height: size.s_40
		},
		textInputWrapper: {
			flex: 1,
			display: 'flex',
			flexDirection: 'row',
			marginVertical: 10,
			alignItems: 'center',
			paddingHorizontal: 10,
			borderRadius: 10,
			gap: 10,
			backgroundColor: colors.tertiary
		},
		tabFlexContainer: {
			flex: 1,
			height: size.s_30
		},
		tabPressable: {
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%'
		},
		searchRow: {
			flexDirection: 'row',
			gap: size.s_10,
			width: '100%',
			alignItems: 'center'
		},
		stickerModeButton: {
			paddingVertical: size.s_10,
			backgroundColor: colors.bgViolet,
			padding: size.s_10,
			borderRadius: size.s_4
		},
		tabText: {
			fontSize: Fonts.size.small,
			textAlign: 'center'
		}
	});
