import { useChatSending } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentChannel, selectDmGroupCurrent } from '@mezon/store-mobile';
import type { IMessage, IMessageSendPayload } from '@mezon/utils';
import { MEZON_AVATAR_URL, STICKER_WAVE, WAVE_SENDER_NAME } from '@mezon/utils';
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
	const currentDmGroup = useSelector(selectDmGroupCurrent(message?.channel_id ?? ''));

	const mode = useMemo(() => {
		if (!currentDmGroup) return ChannelStreamMode.STREAM_MODE_CHANNEL;

		return currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP;
	}, [currentDmGroup]);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect: currentDmGroup || currenChannel
	});

	const handleSendWaveSticker = async () => {
		try {
			const content: IMessageSendPayload = { t: '' };
			const ref = {
				message_id: '',
				message_ref_id: message.id,
				ref_type: 0,
				message_sender_id: message?.sender_id,
				message_sender_username: WAVE_SENDER_NAME,
				mesages_sender_avatar: MEZON_AVATAR_URL,
				message_sender_clan_nick: WAVE_SENDER_NAME,
				message_sender_display_name: WAVE_SENDER_NAME,
				content: JSON.stringify(message.content),
				has_attachment: false,
				channel_id: message.channel_id ?? '',
				mode: message.mode ?? 0,
				channel_label: message.channel_label
			};
			const attachments = [
				{
					url: STICKER_WAVE.URL,
					filetype: 'image/gif',
					filename: STICKER_WAVE.NAME,
					size: 374892,
					width: 150,
					height: 150
				}
			];

			sendMessage(content, [], attachments, [ref], false, false, true);
		} catch (error) {
			console.error('Error sending wave sticker:', error);
		}
	};

	return (
		<TouchableOpacity style={styles.waveButton} onPress={handleSendWaveSticker}>
			<ImageNative url={STICKER_WAVE.URL} style={styles.waveIcon} resizeMode="contain" />
			<Text style={styles.waveButtonText}>{t('waveWelcome')}</Text>
		</TouchableOpacity>
	);
};

export default memo(WaveButton);
