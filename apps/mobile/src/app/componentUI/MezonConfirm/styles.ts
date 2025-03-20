import { Attributes, Colors, Fonts, Metrics } from '@mezon/mobile-ui';
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

		btnWrapper: {
			display: 'flex',
			gap: Metrics.size.m,
			paddingVertical: Metrics.size.m,
			paddingTop: Metrics.size.xl
		},

		btn: {
			borderRadius: 20,
			padding: Metrics.size.m,
			backgroundColor: colors.primary
		},
		btnDanger: {
			backgroundColor: Colors.red
		},
		btnText: {
			color: colors.textStrong,
			fontSize: Fonts.size.h8,
			textAlign: 'center'
		},

		contentText: {
			color: colors.text,
			fontSize: Fonts.size.h8,
			textAlign: 'center'
		},
		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0,0,0,0.5)'
		}
	});
