import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentClanLogo, selectCurrentClanName } from '@mezon/store-mobile';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import RNQRGenerator from 'rn-qr-generator';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { useImage } from '../../../../../hooks/useImage';

interface QRModalProps {
	inviteLink: string;
}

const QRModalComponent: React.FC<QRModalProps> = ({ inviteLink }) => {
	const { themeValue } = useTheme();
	const { t } = useTranslation(['inviteToChannel']);
	const [qrCodeUri, setQrCodeUri] = useState<string>('');
	const { saveMediaToCameraRoll } = useImage();
	const currentClanLogo = useSelector(selectCurrentClanLogo);
	const currentClanName = useSelector(selectCurrentClanName);
	const qrCodeCache = useRef<Map<string, string>>(new Map());

	const generateQRCode = useCallback(async () => {
		if (!inviteLink) return;

		if (qrCodeCache.current.has(inviteLink)) {
			const cachedUri = qrCodeCache.current.get(inviteLink)!;
			setQrCodeUri(cachedUri);
			return;
		}

		try {
			const res = await RNQRGenerator.generate({
				value: inviteLink,
				height: 200,
				width: 200,
				correctionLevel: 'L'
			});

			qrCodeCache.current.set(inviteLink, res.uri);
			setQrCodeUri(res.uri);
		} catch (error) {
			console.error('Error generating QR code:', error);
			setQrCodeUri('');
		}
	}, [inviteLink]);

	const handleDownloadQRCode = useCallback(async () => {
		try {
			if (!qrCodeUri) return;
			const filePath = qrCodeUri.startsWith('file://') ? qrCodeUri : `file://${qrCodeUri}`;
			await saveMediaToCameraRoll(filePath, 'image', true);
		} catch (e) {
			console.log(t('qrModal.downloadError'), e);
		}
	}, [qrCodeUri]);

	const handleShareQRCode = useCallback(async () => {
		try {
			if (!qrCodeUri) return;
			await Share.share({
				url: qrCodeUri,
				message: inviteLink || ''
			});
		} catch (e) {
			console.log(t('qrModal.shareError'), e);
		}
	}, [qrCodeUri, inviteLink]);

	const handleCloseModal = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, []);

	useEffect(() => {
		if (inviteLink) {
			generateQRCode();
		}
	}, [inviteLink, generateQRCode]);

	const styles = useMemo(() => createStyles(themeValue), [themeValue]);

	const clanInfo = useMemo(
		() => (
			<View style={styles.clanInfo}>
				{currentClanLogo ? (
					<View style={styles.clanAvatarWrapper}>
						<FastImage style={styles.clanAvatar} resizeMode={FastImage.resizeMode.contain} source={{ uri: currentClanLogo }} />
					</View>
				) : (
					<View style={styles.defaultAvatar}>
						<Text style={styles.defaultAvatarText}>{currentClanName?.charAt(0)?.toUpperCase()}</Text>
					</View>
				)}

				<Text style={styles.clanName} numberOfLines={2}>
					{currentClanName || t('qrModal.clanDefaultName')}
				</Text>
			</View>
		),
		[currentClanLogo, currentClanName, styles, t]
	);

	const qrNoteText = useMemo(() => {
		if (currentClanName) {
			return t('qrModal.scanToJoin', { clanName: currentClanName });
		}
		return t('qrModal.scanToJoinDefault');
	}, [currentClanName, t]);

	const actionButtons = useMemo(
		() => (
			<View style={styles.actionsRow}>
				<TouchableOpacity style={styles.actionButton} onPress={handleDownloadQRCode}>
					<MezonIconCDN icon={IconCDN.downloadIcon} color={themeValue.primary} />
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton} onPress={handleShareQRCode}>
					<MezonIconCDN icon={IconCDN.shareIcon} color={themeValue.primary} />
				</TouchableOpacity>
			</View>
		),
		[handleDownloadQRCode, handleShareQRCode]
	);

	return (
		<View style={styles.modalContainer}>
			<View style={styles.modalContent}>
				<TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
					<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.white} height={20} width={20} />
				</TouchableOpacity>
				<Text style={styles.modalTitle}>{t('qrModal.title')}</Text>
				{clanInfo}
				<Text style={styles.qrNote}>{qrNoteText}</Text>
				<View style={styles.qrContainer}>
					<View style={styles.qrCodeWrapper}>
						{!!qrCodeUri && <FastImage source={{ uri: qrCodeUri }} style={styles.qrCode} resizeMode={FastImage.resizeMode.contain} />}
					</View>
				</View>
				{actionButtons}
			</View>
		</View>
	);
};

export const QRModal = React.memo(QRModalComponent);

const createStyles = (themeValue: any) =>
	StyleSheet.create({
		modalContainer: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},
		modalContent: {
			backgroundColor: themeValue.primary,
			borderRadius: size.s_16,
			width: '90%',
			alignItems: 'center',
			padding: size.s_20,
			position: 'relative'
		},
		closeButton: {
			width: size.s_24,
			height: size.s_24,
			borderRadius: size.s_12,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: themeValue.secondary,
			position: 'absolute',
			top: size.s_12,
			right: size.s_12,
			zIndex: 1
		},
		modalTitle: {
			fontSize: size.s_16,
			fontWeight: 'bold',
			color: themeValue.white,
			marginBottom: size.s_16,
			textAlign: 'center'
		},
		clanInfo: {
			alignItems: 'center'
		},
		clanAvatarWrapper: {
			borderRadius: size.s_10,
			overflow: 'hidden',
			marginBottom: size.s_16
		},
		clanAvatar: {
			width: size.s_60,
			height: size.s_60
		},
		defaultAvatar: {
			width: size.s_60,
			height: size.s_60,
			borderRadius: size.s_30,
			backgroundColor: themeValue.secondary,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: size.s_12
		},
		defaultAvatarText: {
			fontSize: size.s_24,
			fontWeight: 'bold',
			color: themeValue.white
		},
		clanName: {
			fontSize: size.s_18,
			fontWeight: '600',
			color: themeValue.white,
			textAlign: 'center',
			maxWidth: size.s_200
		},
		qrContainer: {
			marginTop: size.s_20,
			marginBottom: size.s_20,
			justifyContent: 'center',
			alignItems: 'center',
			borderRadius: size.s_16
		},
		qrCodeWrapper: {
			width: size.s_200,
			height: size.s_200,
			backgroundColor: themeValue.white,
			borderRadius: size.s_8,
			overflow: 'hidden'
		},
		qrCode: {
			height: size.s_200,
			width: size.s_200
		},
		qrPlaceholder: {
			width: size.s_200,
			height: size.s_200,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: themeValue.secondary,
			borderRadius: size.s_8
		},
		qrPlaceholderText: {
			color: themeValue.textGray,
			fontSize: size.s_14
		},
		actionsRow: {
			flexDirection: 'row',
			gap: size.s_12,
			marginBottom: size.s_12,
			justifyContent: 'center',
			paddingHorizontal: size.s_16
		},
		actionButton: {
			paddingVertical: size.s_8,
			paddingHorizontal: size.s_16,
			borderRadius: size.s_8,
			backgroundColor: themeValue.white
		},
		actionButtonDisabled: {
			opacity: 0.5
		},
		actionButtonText: {
			color: themeValue.primary,
			fontSize: size.s_14,
			fontWeight: '600'
		},
		qrDescription: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: themeValue.white,
			textAlign: 'center',
			marginBottom: size.s_12
		},
		qrNote: {
			fontSize: size.s_12,
			color: themeValue.white,
			textAlign: 'center',
			lineHeight: size.s_20
		},
		loadingContainer: {
			paddingVertical: size.s_40,
			paddingHorizontal: size.s_20,
			alignItems: 'center',
			justifyContent: 'center'
		},
		loadingText: {
			fontSize: size.s_14,
			color: themeValue.textGray,
			textAlign: 'center'
		}
	});
