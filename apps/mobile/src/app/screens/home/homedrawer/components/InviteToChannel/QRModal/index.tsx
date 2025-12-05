import { ActionEmitEvent, inviteLinkRegex } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentClanLogo, selectCurrentClanName } from '@mezon/store-mobile';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import RNQRGenerator from 'rn-qr-generator';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { useImage } from '../../../../../../hooks/useImage';
import type { CustomQRInviteRef } from '../CustomQRInvite';
import CustomQRInvite from '../CustomQRInvite';
import { style } from './styles';

interface IQRModalProps {
	inviteLink: string;
}

export const QRModal = memo(({ inviteLink }: IQRModalProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['inviteToChannel']);
	const [qrCodeUri, setQrCodeUri] = useState<string>('');
	const { saveMediaToCameraRoll } = useImage();
	const currentClanLogo = useSelector(selectCurrentClanLogo);
	const currentClanName = useSelector(selectCurrentClanName);
	const qrCodeCache = useRef<Map<string, string>>(new Map());
	const customQRRef = useRef<CustomQRInviteRef>(null);

	const generateQRCode = useCallback(async () => {
		if (!inviteLink) return;

		if (qrCodeCache.current.has(inviteLink)) {
			const cachedUri = qrCodeCache.current.get(inviteLink);
			setQrCodeUri(cachedUri);
			return;
		}

		try {
			const res = await RNQRGenerator.generate({
				value: inviteLink,
				height: 200,
				width: 200,
				correctionLevel: 'Q'
			});

			qrCodeCache.current.set(inviteLink, res?.uri);
			setQrCodeUri(res?.uri || '');
		} catch (error) {
			console.error('Error generating QR code:', error);
			setQrCodeUri('');
		}
	}, [inviteLink]);

	const handleDownloadQRCode = useCallback(async () => {
		try {
			const brandedUri = await customQRRef.current?.capture();
			if (!brandedUri) return;

			const filePath = brandedUri.startsWith('file://') ? brandedUri : `file://${brandedUri}`;
			await saveMediaToCameraRoll(filePath, 'image', true, false);
		} catch (error) {
			console.error('Error downloading QR code:', error);
		}
	}, []);

	const handleShareQRCode = useCallback(async () => {
		try {
			const brandedUri = await customQRRef.current?.capture();
			if (!brandedUri) return;

			const baseDir = `${RNFetchBlob.fs.dirs.CacheDir}/mezon_qr`;
			const exists = await RNFetchBlob.fs.exists(baseDir);
			if (!exists) await RNFetchBlob.fs.mkdir(baseDir);

			const match = inviteLink?.match(inviteLinkRegex);
			const inviteId = match ? match[1] : Date.now().toString();

			const shareFilePath = `${baseDir}/qr_share_${inviteId}.png`;
			const fileExists = await RNFetchBlob.fs.exists(shareFilePath);
			if (!fileExists) await RNFetchBlob.fs.cp(brandedUri.replace('file://', ''), shareFilePath);

			await Share.open({
				url: `file://${shareFilePath}`,
				type: 'image/png',
				title: `QR_Invite_${inviteLink}`,
				message: `Join ${currentClanName ? currentClanName : 'Clan'} on Mezon with me: ${inviteLink}`,
				failOnCancel: false
			});
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('qrModal.shareError')
			});
			console.error('Error sharing QR code:', error);
		}
	}, [currentClanName, inviteLink]);

	const handleCloseModal = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, []);

	useEffect(() => {
		if (inviteLink) {
			generateQRCode();
		}
	}, [inviteLink, generateQRCode]);

	const clanInfo = useMemo(
		() => (
			<View style={styles.clanInfo}>
				{currentClanLogo ? (
					<View style={styles.clanAvatarWrapper}>
						<FastImage style={styles.clanAvatar} resizeMode={FastImage.resizeMode.contain} source={{ uri: currentClanLogo }} />
					</View>
				) : (
					<View style={styles.defaultAvatar}>
						<Text style={styles.defaultAvatarText}>{currentClanName?.charAt(0)?.toUpperCase() || ''}</Text>
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
					{!!qrCodeUri && <CustomQRInvite ref={customQRRef} qrCodeUri={qrCodeUri} clanLogo={currentClanLogo} clanName={currentClanName} />}
				</View>
				{actionButtons}
			</View>
		</View>
	);
});
