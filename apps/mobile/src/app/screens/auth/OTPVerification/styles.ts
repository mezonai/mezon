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
			alignItems: 'center',
			justifyContent: 'center'
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
			marginBottom: size.s_30,
			opacity: 0.9
		},
		instructionSection: {
			alignItems: 'center',
			marginBottom: size.s_30
		},
		instructionText: {
			fontSize: size.s_14,
			color: '#e0e7ff',
			textAlign: 'center',
			marginBottom: size.s_4
		},
		emailText: {
			fontSize: size.s_14,
			color: '#ffffff',
			textAlign: 'center',
			fontWeight: '500'
		},
		inputSection: {
			marginBottom: size.s_24,
			width: '100%',
			gap: size.s_4,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		otpInput: {
			width: '100%',
			height: size.s_50,
			backgroundColor: '#000000',
			borderRadius: size.s_8,
			paddingHorizontal: size.s_16,
			fontSize: size.s_16,
			color: '#ffffff',
			textAlign: 'center',
			letterSpacing: 2
		},
		placeholder: {
			color: '#6b7280'
		},
		verifyButton: {
			width: '100%',
			height: size.s_50,
			borderRadius: size.s_8,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: size.s_40
		},
		verifyButtonActive: {
			backgroundColor: '#2563eb'
		},
		verifyButtonDisabled: {
			backgroundColor: '#6b7280'
		},
		verifyButtonText: {
			color: '#ffffff',
			fontSize: size.s_16,
			fontWeight: '600'
		},
		alternativeSection: {
			alignItems: 'center',
			marginBottom: size.s_20
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
			marginHorizontal: size.s_8
		},
		resendButton: {
			paddingVertical: size.s_12,
			paddingHorizontal: size.s_20
		},
		resendButtonText: {
			fontSize: size.s_14,
			color: '#463be8',
			textDecorationLine: 'underline',
			fontWeight: '500'
		},
		input: {
			width: size.s_48,
			height: size.s_48,
			borderRadius: size.s_8,
			textAlign: 'center',
			fontSize: size.s_18,
			fontWeight: '600',
			backgroundColor: '#ffffff'
		},
		inputEmpty: {
			borderWidth: size.s_2,
			borderColor: '#d1d5db',
			color: '#374151'
		},
		inputFilled: {
			borderWidth: 2,
			borderColor: '#2563eb',
			color: '#1f2937'
		},
		inputFirst: {
			borderColor: '#2563eb',
			borderWidth: size.s_2
		},
		inputError: {
			borderColor: '#ca0000',
			borderWidth: size.s_2
		}
	});
