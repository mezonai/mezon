import { ModalInputMessageBuzz } from '@mezon/components';
import { useChatSending } from '@mezon/core';
import { ChannelsEntity } from '@mezon/store-mobile';
import { TypeMessage } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChannelMessages from './ChannelMessages';

type ChannelMediaProps = {
	currentChannel: ChannelsEntity | null;
};

export const ChannelMedia = ({ currentChannel }: ChannelMediaProps) => {
	const mode =
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL;
	if (
		currentChannel?.type === ChannelType.CHANNEL_TYPE_CHANNEL ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_STREAMING ||
		currentChannel?.type === ChannelType.CHANNEL_TYPE_APP
	) {
		return (
			<>
				<KeyPressListener currentChannel={currentChannel} mode={mode} />
				<ChannelMessages
					clanId={currentChannel?.clan_id || ''}
					channelId={currentChannel?.id}
					channelLabel={currentChannel.channel_label}
					isPrivate={currentChannel.channel_private}
					type={currentChannel?.type}
					mode={mode}
				/>
			</>
		);
	}
	return <ChannelMessages.Skeleton />;
};

type KeyPressListenerProps = {
	currentChannel: ChannelsEntity | null;
	mode: ChannelStreamMode;
};

const KeyPressListener = ({ currentChannel, mode }: KeyPressListenerProps) => {
	const { sendMessage } = useChatSending({ channelOrDirect: currentChannel || undefined, mode });
	const isListenerAttached = useRef(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [messageText, setMessageText] = useState('');

	useEffect(() => {
		if (isListenerAttached.current) return;
		isListenerAttached.current = true;

		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.ctrlKey && (event.key === 'g' || event.key === 'G')) {
				event.preventDefault();
				setIsModalOpen(true);
			}
		};

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
			isListenerAttached.current = false;
		};
	}, [isModalOpen]);

	const handleSend = useCallback(() => {
		if (messageText.trim()) {
			sendMessage({ t: messageText }, [], [], [], undefined, undefined, undefined, TypeMessage.MessageBuzz);
		}
		setIsModalOpen(false);
		setMessageText('');
	}, [messageText, sendMessage, setIsModalOpen, setMessageText]);

	return (
		<>
			{isModalOpen && (
				<ModalInputMessageBuzz
					messageText={messageText}
					setMessageText={setMessageText}
					onClose={() => {
						setIsModalOpen(false);
						setMessageText('');
					}}
					onSend={handleSend}
				/>
			)}
		</>
	);
};
