import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, Fonts, Metrics, size } from '@mezon/mobile-ui';
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
			width: isTabletLandscape ? '60%' : '90%',
			marginHorizontal: isTabletLandscape ? '30%' : 0,
			maxHeight: '95%',
			zIndex: 100
		},

		title: {
			color: colors.textStrong,
			fontSize: size.h7,
			fontWeight: 'bold',
			textAlign: 'center'
		},

		headerTitle: {
			color: colors.textStrong,
			fontSize: size.h4,
			fontWeight: 'bold',
			textAlign: 'center',
			width: '100%',
			zIndex: -1,
			position: 'absolute'
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
			paddingTop: size.s_12
		},

		btn: {
			borderRadius: size.s_20,
			padding: size.s_10,
			backgroundColor: colors.bgViolet
		},
		btnCancel: {
			borderRadius: size.s_20,
			padding: size.s_10,
			backgroundColor: colors.primary
		},
		btnText: {
			color: colors.textStrong,
			fontSize: Fonts.size.h8,
			textAlign: 'center'
		},
		btnWhiteText: {
			color: baseColor.white,
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
		},
		description: {
			color: colors.text,
			fontSize: Fonts.size.h7,
			paddingRight: size.s_12,
			textAlign: 'left'
		},
		row: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: size.s_10,
			marginBottom: size.s_6,
			width: '50%'
		},
		field: {
			alignItems: 'flex-start',
			width: '100%'
		},
		detail: {
			flexDirection: 'row',
			flexWrap: 'wrap'
		},
		touchableRow: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			height: size.s_24,
			marginBottom: 0
		},
		copyIconWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			marginLeft: size.s_4
		},
		copyButton: {
			padding: 4
		},
		noteContainer: {
			maxHeight: size.s_100,
			borderColor: colors.borderRadio,
			borderWidth: 1,
			borderRadius: size.s_4,
			padding: size.s_8,
			width: '100%'
		},
		noteText: {
			color: colors.text,
			fontSize: Fonts.size.h8,
			textAlign: 'left'
		},
		loading: {
			height: size.s_80,
			justifyContent: 'center',
			alignItems: 'center',
			padding: size.s_20
		}
	});
