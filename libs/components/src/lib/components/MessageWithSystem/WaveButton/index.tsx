import { useChatSending } from '@mezon/core';
import type { RootState } from '@mezon/store';
import { getStore, selectBanMeInChannel, selectCurrentChannel, selectCurrentDM } from '@mezon/store';
import type { IMessage, IMessageSendPayload } from '@mezon/utils';
import { MEZON_AVATAR_URL, STICKER_WAVE, WAVE_SENDER_NAME } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import type { ApiChannelDescription } from 'mezon-js/api.gen';
import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

interface IWaveButtonProps {
	message: IMessage;
}

const WaveButton = ({ message }: IWaveButtonProps) => {
	const currenChannel = useSelector(selectCurrentChannel);
	const currentDm = useSelector(selectCurrentDM);
	const mode = useMemo(() => {
		return message?.clan_id === '0' ? ChannelStreamMode.STREAM_MODE_GROUP : ChannelStreamMode.STREAM_MODE_CHANNEL;
	}, [message?.clan_id]);
	const channelOrDirect = useMemo(() => {
		return mode === ChannelStreamMode.STREAM_MODE_GROUP ? currentDm : currenChannel;
	}, [currenChannel, currentDm, mode]);

	const { sendMessage } = useChatSending({
		mode,
		channelOrDirect: channelOrDirect as ApiChannelDescription
	});

	const handleSendWaveSticker = () => {
		const store = getStore();
		const appState = store.getState() as RootState;
		const isBanned = selectBanMeInChannel(appState, currenChannel?.id || '');

		if (isBanned) {
			return null;
		}
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

			sendMessage(content, [], attachments, [ref], false, false, false);
		} catch (error) {
			console.error('Error sending wave sticker:', error);
		}
	};

	return (
		<button
			className="bg-theme-primary py-1 px-3 rounded mt-2 flex flex-row items-center ml-[72px] gap-2 hover:scale-102 transition-all duration-200 ease-in-out hover:shadow-md"
			onClick={handleSendWaveSticker}
		>
			<img src={STICKER_WAVE.URL} alt="Wave Icon" className="object-contain mb-1" width={32} height={32} />
			<p className="text-theme-secondary text-sm font-medium text-center">Wave to say hi!</p>
		</button>
	);
};

export default memo(WaveButton);
