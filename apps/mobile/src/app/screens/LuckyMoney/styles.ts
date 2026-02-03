import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.secondary
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: size.s_16,
			paddingTop: size.s_50,
			paddingBottom: size.s_16,
			backgroundColor: theme.secondary
		},
		backButton: {
			marginRight: size.s_16
		},
		headerTitle: {
			fontSize: size.s_20,
			fontWeight: '700',
			color: 'white'
		},
		scrollView: {
			flex: 1
		},
		envelopeContainer: {
			backgroundColor: '#f04e4e',
			marginHorizontal: size.s_16,
			marginTop: size.s_24,
			borderRadius: size.s_20,
			padding: size.s_24,
			shadowColor: '#000',
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 8
		},
		iconCircle: {
			width: 80,
			height: 80,
			borderRadius: 40,
			backgroundColor: 'white',
			alignItems: 'center',
			justifyContent: 'center',
			alignSelf: 'center',
			marginBottom: size.s_20
		},
		distributionToggle: {
			flexDirection: 'row',
			marginBottom: size.s_24,
			gap: size.s_16
		},
		toggleButton: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: size.s_10,
			gap: size.s_8
		},
		toggleButtonActive: {
			// Active state is handled by icon color
		},
		toggleText: {
			fontSize: size.s_16,
			color: 'white',
			fontWeight: '500'
		},
		formContainer: {
			backgroundColor: 'white',
			borderRadius: size.s_16,
			padding: size.s_16,
			marginBottom: size.s_20
		},
		inputGroup: {
			marginBottom: size.s_16
		},
		inputLabel: {
			fontSize: size.s_14,
			color: '#666',
			marginBottom: size.s_8
		},
		inputWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			borderBottomWidth: 1,
			borderBottomColor: '#E0E0E0',
			paddingVertical: size.s_8
		},
		input: {
			flex: 1,
			fontSize: size.s_24,
			fontWeight: '600',
			color: '#333',
			padding: 0
		},
		currency: {
			fontSize: size.s_20,
			fontWeight: '600',
			color: '#333',
			marginLeft: size.s_8
		},
		clearButton: {
			marginLeft: size.s_8,
			padding: size.s_4
		},
		messageContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			paddingTop: size.s_12,
			borderTopWidth: 1,
			borderTopColor: '#F0F0F0'
		},
		messageInput: {
			flex: 1,
			fontSize: size.s_14,
			color: '#333',
			padding: 0
		},
		sendButton: {
			backgroundColor: '#FDD835',
			paddingVertical: size.s_16,
			borderRadius: size.s_28,
			alignItems: 'center'
		},
		sendButtonText: {
			fontSize: size.s_18,
			fontWeight: '700',
			color: '#f04e4e'
		},
		historyLink: {
			alignItems: 'center',
			marginTop: size.s_32,
			paddingVertical: size.s_12
		},
		historyLinkText: {
			fontSize: size.s_16,
			color: 'white',
			textDecorationLine: 'underline'
		},
		bottomSpacer: {
			height: 60
		}
	});
