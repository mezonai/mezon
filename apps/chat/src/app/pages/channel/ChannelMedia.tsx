import { ModalInputMessageBuzz } from '@mezon/components';
import { EmojiSuggestionProvider } from '@mezon/core';
import { selectBanMeInChannel, selectTimelineViewMode, useAppSelector, type ChannelsEntity } from '@mezon/store';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import ChannelMessages from './ChannelMessages';
import TimelineMessages from './TimelineMessages';

type ChannelMediaProps = {
	currentChannel: ChannelsEntity | null;
};

export const ChannelMedia = ({ currentChannel }: ChannelMediaProps) => {
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;

	const isTimelineViewMode = useAppSelector(selectTimelineViewMode);

	if (
		currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_APP ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
	) {
		return (
			<>
				<KeyPressListener currentChannel={currentChannel} mode={mode} />
				{isTimelineViewMode ? (
					<TimelineMessages
						clanId={currentChannel?.clan_id || '0'}
						channelId={currentChannel?.id}
						channelLabel={currentChannel.channel_label}
						isPrivate={currentChannel.channel_private}
						type={currentChannel?.type as ChannelType}
						mode={mode}
					/>
				) : (
					<ChannelMessages
						clanId={currentChannel?.clan_id || '0'}
						channelId={currentChannel?.id}
						channelLabel={currentChannel.channel_label}
						isPrivate={currentChannel.channel_private}
						type={currentChannel?.type as ChannelType}
						mode={mode}
					/>
				)}
			</>
		);
	}

	return null;
};

type KeyPressListenerProps = {
	currentChannel: ChannelsEntity | null;
	mode: ChannelStreamMode;
};

const KeyPressListener = ({ currentChannel, mode }: KeyPressListenerProps) => {
	const isListenerAttached = useRef(false);
	const isBanned = useAppSelector((state) => selectBanMeInChannel(state, currentChannel?.id));

	useEffect(() => {
		if (isListenerAttached.current || isBanned) return;
		isListenerAttached.current = true;

		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.ctrlKey && (event.key === 'g' || event.key === 'G')) {
				event.preventDefault();
				openModalBuzz();
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
			isListenerAttached.current = false;
		};
	}, [isBanned]);

	const [openModalBuzz, closeModalBuzz] = useModal(
		() => (
			<EmojiSuggestionProvider>
				<ModalInputMessageBuzz currentChannel={currentChannel} mode={mode} closeBuzzModal={closeModalBuzz} />
			</EmojiSuggestionProvider>
		),
		[currentChannel]
	);

	return null;
};
