import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = () =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: '#ffffff'
		},
		content: {
			flex: 1,
			paddingTop: size.s_100
		},
		title: {
			fontSize: size.s_24,
			fontWeight: 'bold',
			color: '#000000',
			textAlign: 'center',
			marginBottom: size.s_20
		},
		instructionSection: {
			alignItems: 'center',
			marginBottom: size.s_30
		},
		instructionText: {
			fontSize: size.s_14,
			color: '#505050',
			textAlign: 'center',
			marginBottom: size.s_4
		},
		emailText: {
			fontSize: size.s_14,
			color: '#505050',
			textAlign: 'center',
			fontWeight: 'bold'
		},
		inputSection: {
			marginBottom: size.s_24,
			gap: size.s_8,
			flexDirection: 'row',
			flexWrap: 'wrap',
			alignSelf: 'center',
			alignItems: 'center',
			justifyContent: 'center'
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
			height: size.s_50,
			borderRadius: size.s_10,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: size.s_30,
			overflow: 'hidden'
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
			fontWeight: '600',
			zIndex: 10
		},
		alternativeSection: {
			alignItems: 'center',
			marginBottom: size.s_20
		},
		alternativeText: {
			fontSize: size.s_14,
			color: '#5e5e5e',
			textAlign: 'center',
			marginBottom: size.s_6
		},
		alternativeOptions: {
			flexDirection: 'row',
			alignItems: 'center',
			flexWrap: 'wrap',
			justifyContent: 'center'
		},
		linkText: {
			fontSize: size.s_14,
			color: '#2e22ff'
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
			paddingHorizontal: size.s_16,
			height: size.s_48,
			borderRadius: size.s_8,
			textAlign: 'center',
			fontSize: size.s_18,
			color: '#000000',
			fontWeight: '600',
			backgroundColor: '#ffffff',
			borderWidth: 2
		},
		inputEmpty: {
			borderColor: '#d1d5db',
			color: '#374151'
		},
		inputFilled: {
			borderWidth: 2,
			borderColor: '#1661ff',
			backgroundColor: 'rgba(0,82,255,0.1)',
			color: '#000000'
		},
		inputFirst: {
			borderColor: '#2563eb'
		},
		inputError: {
			borderColor: '#ca0000',
			backgroundColor: 'rgba(202,0,0,0.1)',
		}
	});
