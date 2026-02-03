import type { Attributes } from '@mezon/mobile-ui';
import { size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: '#f04e4e'
		},
		scrollView: {
			flex: 1
		},
		header: {
			alignItems: 'center',
			paddingTop: size.s_60,
			paddingBottom: size.s_24,
			paddingHorizontal: size.s_20
		},
		qrContainer: {
			backgroundColor: 'white',
			padding: size.s_8,
			borderRadius: size.s_8,
			marginBottom: size.s_16
		},
		qrPlaceholder: {
			width: 80,
			height: 80,
			alignItems: 'center',
			justifyContent: 'center'
		},
		headerTitle: {
			fontSize: size.s_16,
			color: 'white',
			marginBottom: size.s_12,
			textAlign: 'center'
		},
		receivedAmount: {
			fontSize: size.s_48,
			fontWeight: '700',
			color: '#FDD835',
			marginBottom: size.s_8
		},
		totalAmount: {
			fontSize: size.s_16,
			color: 'white',
			opacity: 0.9
		},
		contentCard: {
			backgroundColor: '#FFF8E1',
			marginHorizontal: size.s_16,
			borderRadius: size.s_16,
			padding: size.s_16,
			marginBottom: size.s_16
		},
		messageContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'flex-start',
			paddingBottom: size.s_12,
			borderBottomWidth: 1,
			borderBottomColor: '#FFD54F',
			marginBottom: size.s_12
		},
		messageText: {
			flex: 1,
			fontSize: size.s_14,
			color: '#f04e4e',
			lineHeight: 20,
			fontStyle: 'italic'
		},
		brandLogo: {
			width: 40,
			height: 20,
			marginLeft: size.s_8
		},
		statsContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingBottom: size.s_12,
			borderBottomWidth: 1,
			borderBottomColor: '#FFD54F',
			marginBottom: size.s_16
		},
		statsText: {
			fontSize: size.s_13,
			color: '#666'
		},
		statsAmount: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: '#f04e4e'
		},
		recipientsList: {
			gap: size.s_12
		},
		recipientItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: size.s_8
		},
		recipientAvatar: {
			width: 40,
			height: 40,
			borderRadius: 20,
			marginRight: size.s_12
		},
		recipientInfo: {
			flex: 1
		},
		recipientName: {
			fontSize: size.s_15,
			fontWeight: '600',
			color: '#333',
			marginBottom: size.s_2
		},
		recipientTime: {
			fontSize: size.s_12,
			color: '#999'
		},
		recipientAmountContainer: {
			alignItems: 'flex-end'
		},
		recipientAmount: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: '#333',
			marginBottom: size.s_4
		},
		luckiestBadge: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_4
		},
		luckiestText: {
			fontSize: size.s_12,
			color: '#FDD835',
			fontWeight: '500'
		},
		footerText: {
			fontSize: size.s_14,
			color: 'white',
			textAlign: 'center',
			paddingHorizontal: size.s_32,
			marginBottom: size.s_24
		},
		actionButtons: {
			flexDirection: 'row',
			paddingHorizontal: size.s_32,
			gap: size.s_16
		},
		balanceButton: {
			flex: 1,
			paddingVertical: size.s_14,
			borderRadius: size.s_24,
			borderWidth: 2,
			borderColor: 'white',
			alignItems: 'center'
		},
		balanceButtonText: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: 'white'
		},
		sendBackButton: {
			flex: 1,
			paddingVertical: size.s_14,
			borderRadius: size.s_24,
			borderWidth: 2,
			borderColor: 'white',
			alignItems: 'center'
		},
		sendBackButtonText: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: 'white'
		},
		bottomSpacer: {
			height: 80
		},
		closeButton: {
			position: 'absolute',
			top: size.s_50,
			right: size.s_16,
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: 'rgba(0, 0, 0, 0.3)',
			alignItems: 'center',
			justifyContent: 'center'
		}
	});
