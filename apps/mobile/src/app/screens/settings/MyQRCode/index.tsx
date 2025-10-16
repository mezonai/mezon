import { size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount, useWallet } from '@mezon/store-mobile';
import { CURRENCY, createImgproxyUrl, formatBalanceToString } from '@mezon/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Share, Text, TouchableOpacity, View } from 'react-native';
import { Grid } from 'react-native-animated-spinkit';
import FastImage from 'react-native-fast-image';
import { useSelector } from 'react-redux';
import RNQRGenerator from 'rn-qr-generator';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { useImage } from '../../../hooks/useImage';
import { style } from './styles';

type TabType = 'profile' | 'transfer';

interface QRCode {
	profile: string;
	transfer: string;
}

export const MyQRCode = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue) as any;
	const { t } = useTranslation(['profile']);
	const userProfile = useSelector(selectAllAccount);
	const { saveImageToCameraRoll } = useImage();
	const [activeTab, setActiveTab] = useState<TabType>('profile');
	const [isGenerating, setIsGenerating] = useState<boolean>(true);
	const [qrCode, setQrCode] = useState<QRCode>({ profile: '', transfer: '' });
	const { walletDetail } = useWallet();

	const tokenInWallet = useMemo(() => {
		return walletDetail?.balance || 0;
	}, [walletDetail?.balance]);

	const profilePayload = useMemo(() => {
		try {
			const payload = {
				id: userProfile?.user?.id,
				avatar: userProfile?.user?.avatar_url,
				name: userProfile?.user?.display_name
			};

			const encodedPayload = btoa(encodeURIComponent(JSON.stringify(payload)));
			return `${process.env.NX_CHAT_APP_REDIRECT_URI}/chat/${userProfile?.user?.username}?data=${encodedPayload}`;
		} catch (error) {
			console.error('Error QR Profile Payload', error);
			return '';
		}
	}, [userProfile?.user?.id, userProfile?.user?.avatar_url, userProfile?.user?.username, userProfile?.user?.display_name]);

	const transferPayload = useMemo(() => {
		const data = {
			receiver_name: userProfile?.user?.username,
			receiver_id: userProfile?.user?.id
		};
		return JSON.stringify(data);
	}, [userProfile?.user?.id, userProfile?.user?.username]);

	const generateQRCode = async (type: TabType) => {
		try {
			const payload = type === 'profile' ? profilePayload : transferPayload;
			setIsGenerating(true);
			const res = await RNQRGenerator.generate({
				value: payload,
				height: Math.ceil(activeTab === 'profile' ? size.s_400 : size.s_220),
				width: Math.ceil(activeTab === 'profile' ? size.s_400 : size.s_220),
				correctionLevel: 'L'
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

	const handleDownloadQRCode = useCallback(async () => {
		try {
			const qrCodeUri = qrCode?.['profile'];
			if (!qrCodeUri) return;
			const filePath = qrCodeUri.startsWith('file://') ? qrCodeUri : `file://${qrCodeUri}`;
			await saveImageToCameraRoll(filePath, 'image', true, false);
		} catch (e) {
			console.error('QR Code download error:', e);
		}
	}, [qrCode, saveImageToCameraRoll]);

	const handleShareQRCode = useCallback(async () => {
		try {
			const qrCodeUri = qrCode?.['profile'];
			if (!qrCodeUri) return;
			await Share.share({
				url: qrCodeUri,
				message: profilePayload || ''
			});
		} catch (e) {
			console.error('QR Code share error:', e);
		}
	}, [profilePayload, qrCode]);

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
			avatarUrl: userProfile?.user?.avatar_url,
			username: userProfile?.user?.username,
			displayName: userProfile?.user?.display_name
		}),
		[userProfile?.user?.avatar_url, userProfile?.user?.username, userProfile?.user?.display_name]
	);

	return (
		<View style={styles.container}>
			<View style={styles.tabContainer}>
				{renderTabButton('profile', t('qr_profile', 'QR Profile'))}
				{renderTabButton('transfer', t('qr_transfer', 'QR Transfer'))}
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
							<Text style={styles.textAvatar}>{userInfo.username?.charAt?.(0)?.toUpperCase()}</Text>
						</View>
					)}

					<View>
						<Text style={styles.nameProfile}>{userInfo.username || userInfo.displayName}</Text>
						<Text style={styles.tokenProfile}>
							{activeTab === 'profile'
								? `${t('shareWithOthers')}`
								: `${t('token')} ${formatBalanceToString(tokenInWallet || '0')?.toString()} ${CURRENCY.SYMBOL}`}
						</Text>
					</View>
				</View>

				<View style={styles.qrContainer}>
					{isGenerating ? (
						<Grid color={themeValue.text} size={size.s_50} />
					) : (
						<View style={styles.qrWrapper}>
							<Image source={{ uri: qrCode?.[activeTab] }} style={styles.imageQR} />
						</View>
					)}
				</View>

				{!isGenerating && qrCode?.[activeTab] && activeTab === 'profile' && (
					<View style={styles.actionsRow}>
						<TouchableOpacity style={styles.actionButton} onPress={handleDownloadQRCode}>
							<MezonIconCDN icon={IconCDN.downloadIcon} color={themeValue.text} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={handleShareQRCode}>
							<MezonIconCDN icon={IconCDN.shareIcon} color={themeValue.text} />
						</TouchableOpacity>
					</View>
				)}
				<View style={styles.descriptionContainer}>
					<Text style={styles.descriptionText}>
						{activeTab === 'profile'
							? t('qr_profile_description', 'Scan this QR code to chat with me or view my profile')
							: t('qr_transfer_description', 'Scan this QR code to transfer funds')}
					</Text>
				</View>
			</View>
		</View>
	);
};
