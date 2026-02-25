import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { appActions, useAppDispatch } from '@mezon/store-mobile';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { toastConfig } from '../../../../configs/toastConfig';
import { IconCDN } from '../../../../constants/icon_cdn';
import { useImage } from '../../../../hooks/useImage';
import { Sharing } from '../../../settings/Sharing';
import { style } from '../styles';

type ConfirmSuccessModalProps = {
	tokenCount: string;
	note: string;
	successTime: string;
	selectedUser?: {
		username?: Array<string>;
	};
	jsonObject?: {
		wallet_address?: string;
		receiver_name?: string;
	};
	directMessageId?: string;
	onConfirm: () => void;
	onSendNewToken: () => void;
};

export const ConfirmSuccessModal: React.FC<ConfirmSuccessModalProps> = ({
	tokenCount,
	note,
	successTime,
	selectedUser,
	jsonObject,
	directMessageId,
	onConfirm,
	onSendNewToken
}) => {
	const { t } = useTranslation(['token', 'common']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const viewToSnapshotRef = useRef<ViewShot>(null);
	const [fileShared, setFileShared] = React.useState<any>();
	const [isShowModalShare, setIsShowModalShare] = React.useState<boolean>(false);
	const { saveMediaToCameraRoll } = useImage();
	const dispatch = useAppDispatch();

	const handleShare = async () => {
		console.log('🚀 ~hoang log handleShare ~hoang log fileShared:', fileShared);
		try {
			if (fileShared) {
				setIsShowModalShare(true);
				return;
			}
			if (viewToSnapshotRef?.current) {
				const dataUri = await viewToSnapshotRef?.current?.capture?.();
				if (!dataUri) {
					Toast.show({
						type: 'error',
						text1: t('toast.error.failedToShare')
					});
					return;
				}
				const shareData = {
					subject: null,
					mimeType: 'image/png',
					fileName: `share${Date.now()}.png`,
					text: null,
					weblink: null,
					contentUri: dataUri,
					filePath: dataUri
				};
				setFileShared([shareData]);
				setIsShowModalShare(true);
			}
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('toast.error.failedToShare')
			});
		}
	};

	const handleSaveImage = async () => {
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const dataUri = await viewToSnapshotRef?.current?.capture?.();
			if (!dataUri) {
				Toast.show({
					type: 'error',
					text1: t('common:saveFailed')
				});
				return;
			}
			await saveMediaToCameraRoll(`file://${dataUri}`, 'png');
		} catch (error) {
			dispatch(appActions.setLoadingMainMobile(false));
		} finally {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const onCloseFileShare = (isSent = false) => {
		if (isSent) {
			onConfirm();
		} else {
			setIsShowModalShare(false);
		}
	};

	return (
		<View style={styles.main}>
			{fileShared && isShowModalShare ? (
				<Sharing data={fileShared} topUserSuggestionId={directMessageId} onClose={onCloseFileShare} />
			) : (
				<ViewShot
					ref={viewToSnapshotRef}
					options={{ fileName: 'send_money_success_mobile', format: 'png', quality: 1 }}
					style={styles.modalWrapper}
				>
					<View style={styles.fullscreenModal}>
						<View style={styles.modalHeader}>
							<View>
								<MezonIconCDN icon={IconCDN.tickIcon} color={baseColor.bgSuccess} width={100} height={100} />
							</View>
							<Text style={styles.successText}>{t('toast.success.sendSuccess')}</Text>
							<Text style={styles.amountText}>{tokenCount} ₫</Text>
						</View>

						<View>
							<View style={styles.infoRow}>
								<Text style={styles.label}>{t('receiver')}</Text>
								<Text style={[styles.value, { fontSize: size.s_20 }]} numberOfLines={1}>
									{jsonObject?.wallet_address || selectedUser?.username || jsonObject?.receiver_name}
								</Text>
							</View>

							<View style={styles.infoRow}>
								<Text style={styles.label}>{t('note')}</Text>
								<ScrollView style={styles.noteScrollContainer} showsVerticalScrollIndicator={false}>
									<Text style={styles.note}>{note?.replace?.(/\s+/g, ' ')?.trim() || ''}</Text>
								</ScrollView>
							</View>

							<View style={styles.infoRow}>
								<Text style={styles.label}>{t('date')}</Text>
								<Text style={styles.value}>{successTime}</Text>
							</View>
						</View>
						<View style={styles.action}>
							<View style={styles.actionMore}>
								<TouchableOpacity activeOpacity={1} style={styles.buttonActionMore} onPress={handleShare}>
									<MezonIconCDN icon={IconCDN.shareIcon} width={size.s_24} height={size.s_24} color={themeValue.textStrong} />
									<Text style={styles.textActionMore}>{t('share')}</Text>
								</TouchableOpacity>
								<TouchableOpacity activeOpacity={1} style={styles.buttonActionMore} onPress={handleSaveImage}>
									<MezonIconCDN icon={IconCDN.downloadIcon} width={size.s_24} height={size.s_24} color={themeValue.textStrong} />
									<Text style={styles.textActionMore}>{t('saveImage')}</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.buttonActionMore} onPress={onSendNewToken}>
									<MezonIconCDN icon={IconCDN.arrowLeftRightIcon} color={themeValue.textStrong} />
									<Text style={styles.textActionMore}>{t('sendNewToken')}</Text>
								</TouchableOpacity>
							</View>

							<TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
								<Text style={styles.confirmText}>{t('complete')}</Text>
							</TouchableOpacity>
						</View>
					</View>
					<Toast config={toastConfig} />
				</ViewShot>
			)}
		</View>
	);
};
