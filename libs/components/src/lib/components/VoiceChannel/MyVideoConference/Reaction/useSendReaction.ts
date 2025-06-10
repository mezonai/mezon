import { useMezon } from '@mezon/transport';
import { useCallback } from 'react';
import { UseSendReactionParams } from './types';

export const useSendReaction = ({ currentChannel }: UseSendReactionParams) => {
	const { socketRef } = useMezon();

	const sendEmojiReaction = useCallback(
		(emoji: string, emojiId: string) => {
			if (!socketRef.current || !currentChannel?.channel_id) return;
			socketRef.current.writeVoiceReaction([emojiId], currentChannel.channel_id);
		},
		[socketRef, currentChannel]
	);

	return sendEmojiReaction;
};
