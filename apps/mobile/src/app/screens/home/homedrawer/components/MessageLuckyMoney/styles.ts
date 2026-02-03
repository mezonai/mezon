import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const style = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			maxWidth: 280,
			marginVertical: size.s_8
		},
		envelope: {
			backgroundColor: '#f04e4e',
			borderRadius: size.s_20,
			padding: size.s_20,
			position: 'relative',
			overflow: 'visible',
			shadowColor: '#D32F2F',
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 8
		},
		decorativeTop: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			height: 100,
			overflow: 'visible'
		},
		goldCoin: {
			position: 'absolute',
			width: 24,
			height: 24,
			borderRadius: 12,
			backgroundColor: '#FFD54F',
			borderWidth: 2,
			borderColor: '#FDD835',
			shadowColor: '#FFC107',
			shadowOffset: {
				width: 0,
				height: 2
			},
			shadowOpacity: 0.4,
			shadowRadius: 4,
			elevation: 3
		},
		firework: {
			position: 'absolute',
			width: 20,
			height: 20
		},
		centerSeal: {
			alignItems: 'center',
			marginTop: size.s_40,
			marginBottom: size.s_20
		},
		sealOuter: {
			width: 60,
			height: 60,
			borderRadius: 30,
			backgroundColor: '#FDD835',
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: '#F57C00',
			shadowOffset: {
				width: 0,
				height: 2
			},
			shadowOpacity: 0.5,
			shadowRadius: 4,
			elevation: 4
		},
		sealInner: {
			width: 48,
			height: 48,
			borderRadius: 24,
			backgroundColor: 'white',
			alignItems: 'center',
			justifyContent: 'center'
		},
		diamondShape: {
			width: 16,
			height: 16,
			backgroundColor: '#E57373',
			transform: [{ rotate: '45deg' }]
		},
		textContent: {
			alignItems: 'center',
			marginBottom: size.s_20
		},
		title: {
			fontSize: size.s_18,
			fontWeight: '600',
			color: 'white',
			marginBottom: size.s_8
		},
		message: {
			fontSize: size.s_15,
			color: 'white',
			textAlign: 'center',
			opacity: 0.95,
			paddingHorizontal: size.s_16
		},
		openButton: {
			backgroundColor: '#FFF8E1',
			paddingVertical: size.s_14,
			paddingHorizontal: size.s_32,
			borderRadius: size.s_24,
			marginBottom: size.s_16
		},
		openButtonText: {
			fontSize: size.s_16,
			fontWeight: '700',
			color: '#D84315',
			textAlign: 'center'
		},
		footer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		brandContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		brandText: {
			fontSize: size.s_13,
			color: 'white',
			fontWeight: '600'
		},
		expiryText: {
			fontSize: size.s_13,
			color: 'white',
			opacity: 0.9
		},
		particle: {
			position: 'absolute',
			top: '50%',
			left: '50%',
			marginLeft: -6,
			marginTop: -6
		},
		// Opened state styles
		openedContainer: {
			backgroundColor: 'white',
			borderRadius: size.s_20,
			padding: size.s_24,
			alignItems: 'center',
			borderWidth: 3,
			borderColor: '#E57373',
			shadowColor: '#D32F2F',
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.2,
			shadowRadius: 8,
			elevation: 8
		},
		celebrationContainer: {
			marginBottom: size.s_16
		},
		congratsText: {
			fontSize: size.s_16,
			color: '#666',
			marginBottom: size.s_8
		},
		amountText: {
			fontSize: size.s_48,
			fontWeight: '700',
			color: '#D84315',
			marginBottom: size.s_16
		},
		openedMessageContainer: {
			backgroundColor: '#FFF8E1',
			paddingVertical: size.s_12,
			paddingHorizontal: size.s_16,
			borderRadius: size.s_12,
			marginBottom: size.s_16,
			width: '100%'
		},
		openedMessage: {
			fontSize: size.s_14,
			color: '#D84315',
			textAlign: 'center',
			fontStyle: 'italic'
		},
		openedFooter: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_6
		},
		openedFooterText: {
			fontSize: size.s_13,
			color: '#999'
		}
	});
