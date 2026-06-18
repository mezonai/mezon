import { MediaChannel, ModalInputMessageBuzz } from '@mezon/components';
import { EmojiSuggestionProvider } from '@mezon/core';
import {
	getStore,
	selectBanMeInChannel,
	selectClickedOnThreadBoxStatus,
	selectMediaChannelViewMode,
	selectThreadCurrentChannel,
	useAppSelector,
	type ChannelsEntity
} from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useEffect, useRef } from 'react';
import { useModal } from 'react-modal-hook';
import ChannelMessages from './ChannelMessages';

const THREAD_BOX_SELECTOR = `[data-e2e="${generateE2eId('discussion.box.thread')}"]`;

type ChannelMediaProps = {
	currentChannel: ChannelsEntity | null;
};

export const ChannelMedia = ({ currentChannel }: ChannelMediaProps) => {
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;

	const isMediaChannelViewMode = useAppSelector(selectMediaChannelViewMode);

	if (
		currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_APP ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE
	) {
		if (isMediaChannelViewMode) {
			return <MediaChannel channelId={currentChannel?.id} clanId={currentChannel?.clan_id || '0'} />;
		}

		return (
			<>
				<KeyPressListener currentChannel={currentChannel} mode={mode} />
				<ChannelMessages
					clanId={currentChannel?.clan_id || '0'}
					channelId={currentChannel?.id}
					channelLabel={currentChannel.channel_label}
					isPrivate={currentChannel.channel_private}
					type={currentChannel?.type as ChannelType}
					mode={mode}
				/>
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
	const isBanned = useAppSelector((state) => selectBanMeInChannel(state, currentChannel?.id));
	const buzzTargetRef = useRef({ channel: currentChannel, mode });

	const [openModalBuzz, closeModalBuzz] = useModal(
		() => (
			<EmojiSuggestionProvider>
				<ModalInputMessageBuzz
					currentChannel={buzzTargetRef.current.channel}
					mode={buzzTargetRef.current.mode}
					closeBuzzModal={closeModalBuzz}
				/>
			</EmojiSuggestionProvider>
		),
		[]
	);

	useEffect(() => {
		if (isBanned) return;

		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.ctrlKey && (event.key === 'g' || event.key === 'G')) {
				event.preventDefault();
				const state = getStore().getState();
				const thread = selectThreadCurrentChannel(state);
				const inThreadBox = document.activeElement?.closest(THREAD_BOX_SELECTOR);
				if (inThreadBox && !thread) return;

				const useThread = thread && (selectClickedOnThreadBoxStatus(state) || inThreadBox);
				buzzTargetRef.current = {
					channel: useThread ? thread : currentChannel,
					mode: useThread ? ChannelStreamMode.STREAM_MODE_THREAD : mode
				};
				openModalBuzz();
			}
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [isBanned, openModalBuzz, currentChannel, mode]);

	return null;
};
