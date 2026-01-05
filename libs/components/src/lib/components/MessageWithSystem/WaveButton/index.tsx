import { useChatSending } from '@mezon/core';
import type { RootState } from '@mezon/store';
import { getStore, selectBanMeInChannel, selectCurrentChannel, selectCurrentDM } from '@mezon/store';
import type { IMessage, IMessageSendPayload } from '@mezon/utils';
import { MEZON_AVATAR_URL, STICKER_WAVE, WAVE_SENDER_NAME } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiChannelDescription } from 'mezon-js/api.gen';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface IWaveButtonProps {
	message: IMessage;
}

const WaveButton = ({ message }: IWaveButtonProps) => {
	const { t } = useTranslation('dmMessage');
	const currenChannel = useSelector(selectCurrentChannel);
	const currentDm = useSelector(selectCurrentDM);
	const mode = useMemo(() => {
		return message?.clanId === '0' ? ChannelStreamMode.STREAM_MODE_GROUP : ChannelStreamMode.STREAM_MODE_CHANNEL;
	}, [message?.clanId]);
	const channelOrDirect = useMemo(() => {
		return mode === ChannelStreamMode.STREAM_MODE_GROUP ? currentDm : currenChannel;
	}, [currenChannel, currentDm, mode]);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect: channelOrDirect as ApiChannelDescription
	});

	const urlIcon = useMemo(() => {
		if (!message.createTimeSeconds) {
			return STICKER_WAVE.LIST_STICKER[0];
		}

		return STICKER_WAVE.LIST_STICKER[message.createTimeSeconds % STICKER_WAVE.LIST_STICKER.length];
	}, [message.createTimeSeconds]);

	const handleSendWaveSticker = () => {
		const store = getStore();
		const appState = store.getState() as RootState;
		const isBanned = selectBanMeInChannel(appState, currenChannel?.id);

		if (isBanned) {
			return null;
		}
		try {
			const content: IMessageSendPayload = { t: '' };
			const ref = {
				messageId: '',
				messageRefId: message.id,
				refType: 0,
				messageSenderId: message?.senderId,
				messageSenderUsername: WAVE_SENDER_NAME,
				mesagesSenderAvatar: MEZON_AVATAR_URL,
				messageSenderClanNick: WAVE_SENDER_NAME,
				messageSenderDisplayName: WAVE_SENDER_NAME,
				content: JSON.stringify(message.content),
				hasAttachment: false,
				channelId: message.channelId ?? '',
				mode: message.mode ?? 0,
				channelLabel: message.channelLabel
			};
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

			sendMessage(content, [], attachments, [ref], false, false, false);
		} catch (error) {
			console.error('Error sending wave sticker:', error);
		}
	};

	return (
		<div className="flex gap-2 mt-2 ml-[72px] ">
			<button
				className="bg-theme-primary py-1 px-3 rounded flex flex-row items-center gap-2 hover:scale-102 transition-all duration-200 ease-in-out hover:shadow-md"
				onClick={handleSendWaveSticker}
			>
				<img src={urlIcon} alt="Wave Icon" className="object-contain mb-1" width={32} height={32} />
				<p className="text-theme-secondary text-sm font-medium text-center">{t('waveWelcome')}</p>
			</button>
		</div>
	);
};

export default memo(WaveButton);
