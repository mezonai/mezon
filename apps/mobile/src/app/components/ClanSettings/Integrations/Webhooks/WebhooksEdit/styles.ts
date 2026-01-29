import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		image: { width: size.s_60, height: size.s_60, borderRadius: size.s_30 },
		textRecommend: {
			fontSize: size.s_14,
			color: colors.textDisabled,
			fontWeight: '500',
			marginTop: size.s_20
		},
		label: {
			fontSize: size.small,
			color: colors.text,
			fontWeight: '600',
			marginBottom: size.s_10
		},
		btnLink: {
			backgroundColor: colors.secondary,
			padding: size.s_10,
			borderRadius: size.s_10,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			overflow: 'hidden'
		},
		textBtnLink: {
			fontSize: size.s_14,
			color: colors.text,
			fontWeight: '500',
			flex: 1,
			textAlign: 'left',
			height: size.s_100
		},
		btnResetToken: {
			backgroundColor: baseColor.bgSuccess,
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_10,
			borderRadius: size.s_14,
			marginTop: size.s_20
		},
		btnDelete: {
			backgroundColor: baseColor.bgDanger,
			paddingVertical: size.s_10,
			paddingHorizontal: size.s_10,
			borderRadius: size.s_14,
			marginTop: size.s_20
		},
		textBtnDelete: {
			fontSize: size.s_14,
			color: baseColor.white,
			fontWeight: '500',
			textAlign: 'center'
		},
		textLink: {
			fontSize: size.s_14,
			color: colors.textLink,
			fontWeight: '400',
			paddingLeft: size.s_10,
			flexShrink: 0
		},
		headerBs: {
			fontSize: size.s_16,
			color: colors.white,
			fontWeight: '600',
			textAlign: 'center'
		},
		uploadIcon: { position: 'absolute', right: 0, top: -2 },
		upload: {
			position: 'relative'
		},
		textHeader: {
			fontSize: size.s_16,
			color: baseColor.blurple,
			fontWeight: '500'
		},
		wrapper: {
			backgroundColor: colors.primary,
			width: '100%',
			height: '100%',
			padding: size.s_16
		},
		headerContainer: {
			alignItems: 'center',
			justifyContent: 'center',
			width: '100%',
			height: '20%'
		},
		headerButton: {
			paddingRight: size.s_14
		},
		headerButtonDisabled: {
			opacity: 0.7
		},
		headerLeftButton: {
			paddingLeft: size.s_14
		},
		backButton: {
			padding: 20
		},
		confirmText: {
			color: colors.white
		}
	});
