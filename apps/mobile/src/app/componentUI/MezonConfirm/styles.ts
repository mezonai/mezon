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
			backgroundColor: colors.secondary,
			padding: size.s_16,
			margin: size.s_16,
			borderRadius: size.s_16,
			overflow: 'hidden',
			width: '90%',
			marginHorizontal: isTabletLandscape ? '30%' : 0,
			zIndex: 100
		},

		title: {
			color: colors.textStrong,
			fontSize: size.h4,
			fontWeight: 'bold',
			textAlign: 'center'
		},

		header: {
			paddingBottom: size.s_12,
			borderBottomColor: colors.border,
			borderBottomWidth: 1,
			marginBottom: Metrics.size.xl
		},

		btnWrapper: {
			display: 'flex',
			gap: size.s_12,
			paddingVertical: size.s_12,
			paddingTop: Metrics.size.xl
		},

		btn: {
			borderRadius: size.s_20,
			padding: size.s_10,
			backgroundColor: colors.primary
		},
		btnDefault: {
			backgroundColor: colors.bgViolet
		},
		btnDanger: {
			backgroundColor: baseColor.buzzRed
		},
		btnText: {
			color: colors.textStrong,
			fontSize: Fonts.size.h8,
			textAlign: 'center'
		},

		contentText: {
			color: colors.text,
			fontSize: size.h6,
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
