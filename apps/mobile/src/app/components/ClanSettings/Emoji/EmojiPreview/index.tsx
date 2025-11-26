import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'react-native-image-crop-picker';
import MezonSwitch from '../../../../componentUI/MezonSwitch';
import useTabletLandscape from '../../../../hooks/useTabletLandscape';
import ImageNative from '../../../ImageNative';
import { style } from './style';

interface IShareEventModalProps {
	isSticker?: boolean;
	image: Image;
	onConfirm?: (image: Image, emojiName: string, isForSale: boolean) => void;
}
export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 64;
export const CLAN_MEDIA_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const EmojiPreview = memo(({ isSticker = false, image, onConfirm }: IShareEventModalProps) => {
	const isTabletLandscape = useTabletLandscape();
	const { themeValue } = useTheme();
	const styles = style(themeValue, isTabletLandscape);
	const [isForSale, setIsForSale] = useState<boolean>(false);
	const [emojiName, setEmojiName] = useState<string>(`${isSticker ? 'sticker' : 'emoji'}_${Date.now()}`);
	const [error, setError] = useState<string>('');
	const { t } = useTranslation(['common']);

	function handleClose() {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}

	function handleUploadConfirm() {
		if (emojiName?.trim()?.length >= MIN_NAME_LENGTH && emojiName?.length <= MAX_NAME_LENGTH - 2 && CLAN_MEDIA_NAME_REGEX.test(emojiName)) {
			setError('');
			if (onConfirm) {
				onConfirm(image, emojiName, isForSale);
				handleClose();
			}
		} else {
			setError(
				t('itemClanPreview.lenghtError', {
					max: MAX_NAME_LENGTH - 2,
					min: MIN_NAME_LENGTH,
					type: isSticker ? t('itemClanPreview.sticker') : t('itemClanPreview.emoji')
				})
			);
			return;
		}
	}

	const handleTextChange = (text: string) => {
		setError('');
		setEmojiName(text);
	};

	return (
		<View style={styles.main}>
			<View style={styles.container}>
				<Text style={styles.title}>
					{t('itemClanPreview.preview', { type: isSticker ? t('itemClanPreview.sticker') : t('itemClanPreview.emoji') })}
				</Text>
				<ImageNative url={image?.path} style={{ height: size.s_40, width: size.s_40 }} />
				<Text style={styles.title}>
					{t('itemClanPreview.name', { type: isSticker ? t('itemClanPreview.sticker') : t('itemClanPreview.emoji') })}
				</Text>
				<TextInput style={styles.textInput} value={emojiName} onChangeText={handleTextChange} />
				{error && <Text style={styles.error}>{error}</Text>}
				<View style={styles.row}>
					<MezonSwitch value={isForSale} onValueChange={setIsForSale} />
					<Text style={styles.title}>{t('itemClanPreview.forSale')}</Text>
				</View>

				<TouchableOpacity style={styles.sendButton} onPress={handleUploadConfirm}>
					<Text style={styles.buttonText}>{t('itemClanPreview.upload')}</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={handleClose} />
		</View>
	);
});
