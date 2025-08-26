import { Attributes, baseColor, Metrics, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (colors: Attributes) =>
	StyleSheet.create({
		addButton: {
			position: 'absolute',
			right: size.s_20,
			bottom: size.s_30,
			padding: size.s_12,
			justifyContent: 'center',
			alignItems: 'center'
		},
		modalContainer: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			justifyContent: 'center',
			alignItems: 'center'
		},
		modalBox: {
			backgroundColor: colors.secondary,
			padding: size.s_20,
			borderRadius: size.s_10,
			top: -size.s_50,
			zIndex: 10,
			width: '90%'
		},
		modalTitle: {
			fontSize: size.s_18,
			fontWeight: 'bold',
			color: colors.textStrong,
			marginBottom: size.s_20,
			textAlign: 'center'
		},
		input: {
			borderWidth: 1,
			borderColor: colors.border,
			backgroundColor: colors.bgInputPrimary,
			borderRadius: size.s_6,
			padding: size.s_10,
			color: colors.text,
			marginBottom: size.s_12
		},
		inputGroup: {
			marginBottom: size.s_16
		},
		labelContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: size.s_8
		},
		inputLabel: {
			color: colors.textStrong,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		requiredAsterisk: {
			color: baseColor.red,
			fontSize: size.s_14,
			fontWeight: 'bold'
		},
		helperText: {
			color: colors.text,
			fontSize: size.s_12,
			marginTop: size.s_6
		},
		infoBox: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			backgroundColor: colors.bgInfor,
			borderWidth: 1,
			borderColor: colors.borderInfor,
			padding: size.s_12,
			borderRadius: size.s_8,
			marginBottom: size.s_20,
			gap: size.s_8
		},
		infoIcon: {
			marginTop: size.s_4,
			height: size.s_14,
			width: size.s_14
		},
		infoContent: {
			flex: 1
		},
		infoTitle: {
			color: colors.headerInfor,
			fontSize: size.s_14,
			fontWeight: 'bold',
			marginBottom: size.s_4
		},
		infoDescription: {
			color: colors.descInfor,
			fontSize: size.s_12
		},
		buttonContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			gap: size.s_12
		},
		cancelButton: {
			flex: 1,
			backgroundColor: colors.tertiary,
			padding: size.s_12,
			borderRadius: size.s_6,
			borderWidth: 1,
			borderColor: colors.border
		},
		cancelButtonText: {
			textAlign: 'center',
			color: colors.textStrong,
			fontWeight: 'bold'
		},
		createButton: {
			flex: 1,
			backgroundColor: baseColor.blurple,
			padding: size.s_12,
			borderRadius: size.s_6
		},
		createButtonText: {
			textAlign: 'center',
			color: 'white',
			fontWeight: 'bold'
		},
		backdrop: {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			backgroundColor: 'rgba(0,0,0,0.5)'
		},
		toggleWrapper: {
			backgroundColor: colors.tertiary,
			padding: Metrics.size.s,
			flexDirection: 'row',
			borderRadius: size.s_16,
			gap: size.s_6,
			marginBottom: size.s_12
		},
		tab: {
			paddingVertical: size.s_6,
			borderRadius: size.s_16,
			flex: 1
		},
		activeTab: {
			backgroundColor: baseColor.blurple
		},
		tabTitle: {
			textAlign: 'center',
			color: colors.text
		},
		activeTabTitle: {
			color: 'white'
		}
	});
