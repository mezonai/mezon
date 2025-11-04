import { selectCurrentChannelId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

export const useSendReaction = () => {
	const { socketRef } = useMezon();
	const channelId = useSelector(selectCurrentChannelId);

	const sendEmojiReaction = useCallback(
		(emoji: string, emojiId: string) => {
			if (!socketRef.current || !channelId) return;
			socketRef.current.writeVoiceReaction([emojiId], channelId);
		},
		[socketRef, channelId]
	);

	const sendSoundReaction = useCallback(
		(soundId: string) => {
			if (!socketRef.current || !channelId) return;
			socketRef.current.writeVoiceReaction([`sound:${soundId}`], channelId);
		},
		[socketRef, channelId]
	);

	return { sendEmojiReaction, sendSoundReaction };
};
