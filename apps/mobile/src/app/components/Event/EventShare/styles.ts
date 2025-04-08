import { Attributes, baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes, isTabletLandscape: boolean) =>
	StyleSheet.create({
		main: {
			flex: 1,
			width: '100%',
			height: '100%',
			alignItems: 'center',
			justifyContent: 'center'
		},
		container: {
			height: '90%',
			backgroundColor: colors.secondary,
			padding: Metrics.size.xl,
			margin: Metrics.size.l,
			borderRadius: 10,
			overflow: 'hidden',
			width: '90%',
			marginHorizontal: isTabletLandscape ? '30%' : 0,
			zIndex: 100
		},

		title: {
			color: colors.textStrong,
			fontSize: Fonts.size.h7,
			fontWeight: 'bold'
		},

		header: {
			paddingBottom: Metrics.size.m,
			borderBottomColor: colors.border,
			borderBottomWidth: 1,
			marginBottom: Metrics.size.xl
		},

		textInput: {
			backgroundColor: colors.primary,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_4,
			height: size.s_50,
			color: colors.text,
			borderRadius: size.s_6,
			width: '82%'
		},

		row: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			gap: 10,
			marginBottom: size.s_10
		},

		copyButton: {
			width: '15%',
			height: size.s_50,
			backgroundColor: colors.bgViolet,
			borderRadius: size.s_6,
			padding: size.s_10,
			justifyContent: 'center',
			alignItems: 'center'
		},

		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0,0,0,0.5)'
		},
		sendButton: {
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_30,
			padding: size.s_10,
			backgroundColor: baseColor.blurple
		},
		buttonText: {
			color: baseColor.white
		}
	});
