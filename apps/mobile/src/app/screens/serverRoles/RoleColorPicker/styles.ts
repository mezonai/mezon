import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			paddingHorizontal: size.s_20
		},
		header: {
			width: '100%',
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: size.s_20
		},
		headerSpacer: {
			width: size.s_60
		},
		colorGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_20,
			alignItems: 'center',
			justifyContent: 'center',
			gap: size.s_20
		},
		colorItem: {
			alignItems: 'center',
			justifyContent: 'center',
			height: size.s_40,
			width: size.s_40,
			borderRadius: size.s_20
		},
		footerContainer: {
			width: '100%',
			alignItems: 'center',
			marginVertical: size.s_20
		},
		checkedIcon: {
			color: colors.black
		},
		textBtn: {
			fontSize: size.label,
			fontWeight: '500',
			color: colors.white,
			textAlign: 'center'
		},
		title: {
			fontSize: size.h6,
			fontWeight: '600',
			color: colors.white,
			flex: 1,
			textAlign: 'center'
		},
		headerRightBtn: {
			backgroundColor: colors.charcoal,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6,
			borderRadius: size.s_20,
			width: size.s_60
		},
		footerBtn: {
			backgroundColor: colors.charcoal,
			paddingHorizontal: size.s_10,
			paddingVertical: size.s_6,
			borderRadius: size.s_20,
			width: size.s_80,
			alignItems: 'center',
			justifyContent: 'center'
		},

		activeSaveButton: {
			backgroundColor: baseColor.blurple
		}
	});
