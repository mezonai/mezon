import { selectCurrentChannelId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

const REACTION_THROTTLE_MS = 150;

export const useSendReaction = () => {
	const { socketRef } = useMezon();
	const channelId = useSelector(selectCurrentChannelId);
	const lastSentRef = useRef(0);

	const canSend = useCallback(() => {
		const now = Date.now();
		if (now - lastSentRef.current < REACTION_THROTTLE_MS) {
			return false;
		}
		lastSentRef.current = now;
		return true;
	}, []);

	const sendEmojiReaction = useCallback(
		(emoji: string, emojiId: string) => {
			if (!socketRef.current || !channelId || !canSend()) return;
			socketRef.current.writeVoiceReaction([emojiId], channelId);
		},
		[socketRef, channelId, canSend]
	);

	const sendSoundReaction = useCallback(
		(soundId: string) => {
			if (!socketRef.current || !channelId || !canSend()) return;
			socketRef.current.writeVoiceReaction([`sound:${soundId}`], channelId);
		},
		[socketRef, channelId, canSend]
	);

	const sendRaisingHand = useCallback(
		(userId: string, hand: boolean) => {
			if (!socketRef.current || !channelId || !canSend()) return;
			socketRef.current.writeVoiceReaction([hand ? `raising-up:${userId}` : `raising-down:${userId}`], channelId);
		},
		[socketRef, channelId, canSend]
	);

	return { sendEmojiReaction, sendSoundReaction, sendRaisingHand };
};
