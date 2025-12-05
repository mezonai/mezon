import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount, useWallet } from '@mezon/store-mobile';
import { CURRENCY, createImgproxyUrl, formatBalanceToString } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { Grid } from 'react-native-animated-spinkit';
import FastImage from 'react-native-fast-image';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import RNQRGenerator from 'rn-qr-generator';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { useImage } from '../../../hooks/useImage';
import type { CustomQRInviteRef } from '../../home/homedrawer/components/InviteToChannel/CustomQRInvite';
import CustomQRInvite from '../../home/homedrawer/components/InviteToChannel/CustomQRInvite';
import { style } from './styles';

type TabType = 'profile' | 'transfer';

interface QRCode {
	profile: string;
	transfer: string;
}

export const MyQRCode = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['profile', 'inviteToChannel']);
	const userProfile = useSelector(selectAllAccount);
	const { saveMediaToCameraRoll } = useImage();
	const [activeTab, setActiveTab] = useState<TabType>('profile');
	const [isGenerating, setIsGenerating] = useState<boolean>(true);
	const [qrCode, setQrCode] = useState<QRCode>({ profile: '', transfer: '' });
	const { walletDetail } = useWallet();
	const profileQRRef = useRef<CustomQRInviteRef>(null);
	const transferQRRef = useRef<CustomQRInviteRef>(null);

	const tokenInWallet = useMemo(() => {
		return walletDetail?.balance || '0';
	}, [walletDetail?.balance]);

	const profilePayload = useMemo(() => {
		try {
			const encodedPayload = btoa(
				encodeURIComponent(
					JSON.stringify({
						id: userProfile?.user?.id,
						avatar: userProfile?.user?.avatar_url,
						name: userProfile?.user?.display_name
					})
				)
			);
			return `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/${userProfile?.user?.username}?data=${encodedPayload}`;
		} catch (error) {
			console.error('Error QR Profile Payload', error);
			return '';
		}
	}, [userProfile?.user?.id, userProfile?.user?.avatar_url, userProfile?.user?.username, userProfile?.user?.display_name]);

	const transferPayload = useMemo(() => {
		return JSON.stringify({
			receiver_name: userProfile?.user?.username,
			receiver_id: userProfile?.user?.id
		});
	}, [userProfile?.user?.id, userProfile?.user?.username]);

	const isShowActionButton = useMemo(() => {
		return !isGenerating && qrCode?.[activeTab] && activeTab === 'profile';
	}, [activeTab, isGenerating, qrCode]);

	const generateQRCode = async (type: TabType) => {
		try {
			setIsGenerating(true);
			const res = await RNQRGenerator.generate({
				value: type === 'profile' ? profilePayload : transferPayload,
				height: Math.ceil(type === 'profile' ? size.s_400 : size.s_220),
				width: Math.ceil(type === 'profile' ? size.s_400 : size.s_220),
				correctionLevel: 'Q'
			});
			setQrCode((pre) => ({
				...pre,
				[type]: res?.uri?.toString() || ''
			}));
			setIsGenerating(false);
		} catch (error) {
			console.error('Error generating QR code:', error);
		}
	};

	const handleDownloadQRProfile = useCallback(async () => {
		try {
			const qrRef = activeTab === 'profile' ? profileQRRef : transferQRRef;
			const brandedUri = await qrRef.current?.capture();
			if (!brandedUri) return;

			const filePath = brandedUri.startsWith('file://') ? brandedUri : `file://${brandedUri}`;
			await saveMediaToCameraRoll(filePath, 'image', true, false);
		} catch (error) {
			console.error('QR Code download error:', error);
		}
	}, [activeTab, saveMediaToCameraRoll]);

	const handleShareQRProfile = useCallback(async () => {
		try {
			const brandedUri = await profileQRRef.current?.capture();
			if (!brandedUri) return;

			const baseDir = `${RNFetchBlob.fs.dirs.CacheDir}/mezon_qr`;
			const exists = await RNFetchBlob.fs.exists(baseDir);
			if (!exists) await RNFetchBlob.fs.mkdir(baseDir);

			const shareFilePath = `${baseDir}/qr_share_profile.png`;
			const fileExists = await RNFetchBlob.fs.exists(shareFilePath);
			if (!fileExists) await RNFetchBlob.fs.cp(brandedUri.replace('file://', ''), shareFilePath);

			await Share.open({
				url: `file://${shareFilePath}`,
				type: 'image/png',
				title: `QR_Profile`,
				message: 'Scan QR code to chat with me on Mezon',
				failOnCancel: false
			});
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('inviteToChannel:qrModal.shareError')
			});
			console.error('Error sharing QR code:', error);
		}
	}, []);

	useEffect(() => {
		if (!qrCode?.[activeTab]) {
			generateQRCode(activeTab);
		}
	}, [activeTab, qrCode]);

	const renderTabButton = useCallback(
		(tab: TabType, label: string) => (
			<TouchableOpacity style={[styles.tabButton, activeTab === tab && styles.activeTabButton]} onPress={() => setActiveTab(tab)}>
				<Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>{label}</Text>
			</TouchableOpacity>
		),
		[activeTab, styles]
	);

	const userInfo = useMemo(
		() => ({
			avatarUrl: userProfile?.user?.avatar_url || '',
			username: userProfile?.user?.username || '',
			displayName: userProfile?.user?.display_name || userProfile?.user?.username || ''
		}),
		[userProfile?.user?.avatar_url, userProfile?.user?.username, userProfile?.user?.display_name]
	);

	return (
		<View style={styles.container}>
			<View style={styles.tabContainer}>
				{renderTabButton('profile', t('qr_profile'))}
				{renderTabButton('transfer', t('qr_transfer'))}
			</View>

			<View style={[styles.card]}>
				<View style={styles.headerCard}>
					{userInfo.avatarUrl ? (
						<FastImage
							source={{
								uri: createImgproxyUrl(userInfo.avatarUrl, { width: 200, height: 200, resizeType: 'fit' })
							}}
							style={styles.avatar}
						/>
					) : (
						<View style={styles.defaultAvatar}>
							<Text style={styles.textAvatar}>{userInfo.username?.charAt?.(0)?.toUpperCase() || ''}</Text>
						</View>
					)}

					<View>
						<Text style={styles.nameProfile}>{userInfo.displayName}</Text>
						<Text style={styles.tokenProfile}>
							{activeTab === 'profile'
								? `${t('shareWithOthers')}`
								: `${t('token')} ${formatBalanceToString(tokenInWallet)} ${CURRENCY.SYMBOL}`}
						</Text>
					</View>
				</View>

				<View style={styles.qrContainer}>
					{isGenerating ? (
						<Grid color={themeValue.text} size={size.s_50} />
					) : qrCode?.[activeTab] ? (
						<CustomQRInvite
							ref={activeTab === 'profile' ? profileQRRef : transferQRRef}
							qrCodeUri={qrCode[activeTab]}
							clanLogo={userInfo.avatarUrl}
							clanName={userInfo.username}
						/>
					) : null}
				</View>

				{isShowActionButton && (
					<View style={styles.actionsRow}>
						<TouchableOpacity style={styles.actionButton} onPress={handleDownloadQRProfile}>
							<MezonIconCDN icon={IconCDN.downloadIcon} color={themeValue.text} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={handleShareQRProfile}>
							<MezonIconCDN icon={IconCDN.shareIcon} color={themeValue.text} />
						</TouchableOpacity>
					</View>
				)}
				<View style={styles.descriptionContainer}>
					<Text style={styles.descriptionText}>{activeTab === 'profile' ? t('qr_profile_description') : t('qr_transfer_description')}</Text>
				</View>
			</View>
		</View>
	);
};
