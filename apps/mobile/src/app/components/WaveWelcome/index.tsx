import { useChatSending } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannel, selectDmGroupCurrent } from '@mezon/store-mobile';
import type { IMessage, IMessageSendPayload } from '@mezon/utils';
import { MEZON_AVATAR_URL, STICKER_WAVE, WAVE_SENDER_NAME, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import ImageNative from '../ImageNative';
import { style } from './styles';
interface IWaveButtonProps {
	message: IMessage;
}

const WaveButton = ({ message }: IWaveButtonProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('dmMessage');
	const currenChannel = useSelector(selectCurrentChannel);
	const currentDmGroup = useSelector(selectDmGroupCurrent(message?.channelId ?? ''));

	const isDM = useMemo(() => {
		return currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM;
	}, [currentDmGroup?.type]);

	const mode = useMemo(() => {
		if (!currentDmGroup) return ChannelStreamMode.STREAM_MODE_CHANNEL;

		return isDM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	}, [currentDmGroup, isDM]);

	const displayName = useMemo(() => {
		if (!isDM) return '';
		return currentDmGroup?.channelLabel || currentDmGroup?.displayNames?.[0] || currentDmGroup?.usernames?.[0] || '';
	}, [currentDmGroup?.channelLabel, currentDmGroup?.displayNames?.[0], currentDmGroup?.usernames?.[0], isDM]);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect: currentDmGroup || currenChannel
	});

	const urlIcon = useMemo(() => {
		if (!message?.createTimeSeconds) {
			return STICKER_WAVE.LIST_STICKER[0];
		}

		return STICKER_WAVE.LIST_STICKER[message.createTimeSeconds % STICKER_WAVE.LIST_STICKER.length];
	}, [message?.createTimeSeconds]);

	const handleSendWaveSticker = async () => {
		try {
			const content: IMessageSendPayload = { t: '' };
			const ref = isDM
				? []
				: [
						{
							messageId: '',
							messageRefId: message?.id,
							refType: 0,
							messageSenderId: message?.senderId,
							messageSenderUsername: WAVE_SENDER_NAME,
							mesagesSenderAvatar: MEZON_AVATAR_URL,
							messageSenderClanNick: WAVE_SENDER_NAME,
							messageSenderDisplayName: WAVE_SENDER_NAME,
							content: JSON.stringify(message?.content),
							hasAttachment: false,
							channelId: message?.channelId ?? '',
							mode: message?.mode ?? 0,
							channelLabel: message?.channelLabel
						}
					];
			const attachments = [
				{
					url: urlIcon,
					filetype: 'image/gif',
					filename: STICKER_WAVE.NAME,
					size: 374892,
					width: 150,
					height: 150
				}
			];

			sendMessage(content, [], attachments, ref, false, false, true);
		} catch (error) {
			console.error('Error sending wave sticker:', error);
		}
	};

	return (
		<TouchableOpacity style={isDM ? styles.waveButtonDM : styles.waveButton} onPress={handleSendWaveSticker}>
			<ImageNative
				url={createImgproxyUrl(urlIcon, { width: 100, height: 100, resizeType: 'fit' })}
				style={styles.waveIcon}
				resizeMode="contain"
			/>
			<Text numberOfLines={1} style={[styles.waveButtonText, isDM && styles.waveButtonTextDM]}>
				{isDM ? t('waveWelcomeDM', { username: displayName }) : t('waveWelcome')}
			</Text>
		</TouchableOpacity>
	);
};

export default memo(WaveButton);
