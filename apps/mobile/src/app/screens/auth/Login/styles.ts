import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = () =>
	StyleSheet.create({
		container: {
			flex: 1,
			paddingHorizontal: size.s_30
		},
		content: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		title: {
			fontSize: size.s_26,
			fontWeight: 'bold',
			color: '#ffffff',
			textAlign: 'center',
			marginBottom: size.s_16
		},
		subtitle: {
			fontSize: size.s_16,
			color: '#e0e7ff',
			textAlign: 'center',
			marginBottom: size.s_40,
			opacity: 0.9
		},
		inputSection: {
			width: '100%',
			marginBottom: size.s_24
		},
		inputLabel: {
			fontSize: size.s_14,
			color: '#e0e7ff',
			marginBottom: size.s_12,
			textAlign: 'center'
		},
		emailInput: {
			width: '100%',
			height: size.s_50,
			backgroundColor: '#000000',
			borderRadius: size.s_8,
			paddingHorizontal: size.s_16,
			fontSize: size.s_16,
			color: '#ffffff'
		},
		placeholder: {
			color: '#6b7280'
		},
		showPasswordContainer: {
			marginTop: size.s_12,
			width: '100%'
		},
		checkboxContainer: {
			flexDirection: 'row',
			alignItems: 'center'
		},
		checkbox: {
			width: size.s_18,
			height: size.s_18,
			borderWidth: 1,
			borderColor: '#e0e7ff',
			backgroundColor: 'transparent',
			justifyContent: 'center',
			alignItems: 'center',
			marginRight: size.s_8,
			borderRadius: size.s_2
		},
		checkboxChecked: {
			backgroundColor: '#2563eb',
			borderColor: '#2563eb'
		},
		showPasswordText: {
			fontSize: size.s_14,
			color: '#e0e7ff'
		},
		otpButton: {
			width: '100%',
			height: size.s_50,
			borderRadius: size.s_8,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: size.s_40
		},
		otpButtonActive: {
			backgroundColor: '#2563eb'
		},
		otpButtonDisabled: {
			backgroundColor: '#6b7280'
		},
		otpButtonText: {
			color: '#ffffff',
			fontSize: size.s_16,
			fontWeight: '600'
		},
		alternativeSection: {
			alignItems: 'center'
		},
		alternativeText: {
			fontSize: size.s_14,
			color: '#e0e7ff',
			textAlign: 'center',
			marginBottom: size.s_12
		},
		alternativeOptions: {
			flexDirection: 'row',
			alignItems: 'center',
			flexWrap: 'wrap',
			justifyContent: 'center'
		},
		linkText: {
			fontSize: size.s_14,
			color: '#463be8'
		},
		orText: {
			fontSize: size.s_14,
			color: '#e0e7ff',
			textTransform: 'uppercase',
			marginHorizontal: size.s_4
		}
	});
