import { getStore, selectVoiceInfo } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { useCallback, useRef } from 'react';

const REACTION_THROTTLE_MS = 150;

export const useSendReaction = () => {
	const { socketRef } = useMezon();
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
			const channelId = selectVoiceInfo(getStore().getState())?.channelId;
			if (!socketRef.current || !channelId || !canSend()) return;
			socketRef.current.writeVoiceReaction([emojiId], channelId);
		},
		[socketRef, canSend]
	);

	const sendSoundReaction = useCallback(
		(soundId: string) => {
			const channelId = selectVoiceInfo(getStore().getState())?.channelId;
			if (!socketRef.current || !channelId || !canSend()) return;
			socketRef.current.writeVoiceReaction([`sound:${soundId}`], channelId);
		},
		[socketRef, canSend]
	);

	const sendRaisingHand = useCallback(
		(userId: string, hand: boolean) => {
			const channelId = selectVoiceInfo(getStore().getState())?.channelId;
			if (!socketRef.current || !channelId || !canSend()) return;
			socketRef.current.writeVoiceReaction([hand ? `raising-up:${userId}` : `raising-down:${userId}`], channelId);
		},
		[socketRef, canSend]
	);

	return { sendEmojiReaction, sendSoundReaction, sendRaisingHand };
};
