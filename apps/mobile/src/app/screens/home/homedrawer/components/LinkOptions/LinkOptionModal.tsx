import { BottomSheetView } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import Clipboard from '@react-native-clipboard/clipboard';
import MezonIconCDN from 'apps/mobile/src/app/componentUI/MezonIconCDN';
import { IconCDN } from 'apps/mobile/src/app/constants/icon_cdn';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Linking, Pressable, Share, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { style } from './styles';

export interface LinkOptionModalProps {
	visible: boolean;
	link: string;
}

const LinkOptionModal: React.FC<LinkOptionModalProps> = ({ visible, link }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['message']);

	if (!visible) return null;

	const closeModal = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const handleOpen = () => {
		Linking.openURL(link);
		closeModal();
	};

	const handleCopy = () => {
		Clipboard.setString(link);
		Toast.show({
			type: 'success',
			props: {
				text2: t('actions.copyLinkSuccess', 'Copied link to clipboard'),
				leadingIcon: <MezonIconCDN icon={IconCDN.copyIcon} width={size.s_20} height={size.s_20} color={'#676b73'} />
			}
		});
		closeModal();
	};

	const handleShare = () => {
		Share.share({ message: link });
		closeModal();
	};

	return (
		<BottomSheetView style={styles.bottomSheetWrapper}>
			<View style={styles.bottomSheetBarWrapper}>
				<View style={styles.bottomSheetBar} />
			</View>
			<View style={styles.headerWrapper}>
				<Text numberOfLines={2} style={styles.headerTitle}>
					{t('actions.linkOptions', 'Link Options')}
				</Text>
				<Text numberOfLines={1} style={styles.headerLink}>
					{link}
				</Text>
			</View>
			<View style={styles.messageActionGroup}>
				<Pressable android_ripple={{ color: themeValue.secondaryLight }} style={styles.actionItem} onPress={handleOpen}>
					<Text style={styles.actionText}>{t('actions.openLink', 'Open Link')}</Text>
				</Pressable>
				<Pressable android_ripple={{ color: themeValue.secondaryLight }} style={styles.actionItem} onPress={handleCopy}>
					<Text style={styles.actionText}>{t('actions.copyLink', 'Copy Link')}</Text>
				</Pressable>
				<Pressable android_ripple={{ color: themeValue.secondaryLight }} style={styles.actionItem} onPress={handleShare}>
					<Text style={styles.actionText}>{t('share.share', 'Share Link')}</Text>
				</Pressable>
			</View>
		</BottomSheetView>
	);
};

export default LinkOptionModal;
