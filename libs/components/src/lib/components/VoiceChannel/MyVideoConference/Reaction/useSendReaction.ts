import { getStore, selectVoiceInfo } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { useCallback, useRef } from 'react';

const REACTION_THROTTLE_MS = 150;

export const useSendReaction = () => {
	const { clientRef, sessionRef } = useMezon();
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
			if (!clientRef.current || !channelId || !canSend() || !sessionRef.current) return;
			clientRef.current.writeVoiceReaction(sessionRef.current, [emojiId], channelId);
		},
		[clientRef, canSend]
	);

	const sendSoundReaction = useCallback(
		(soundId: string) => {
			const channelId = selectVoiceInfo(getStore().getState())?.channelId;
			if (!clientRef.current || !channelId || !canSend() || !sessionRef.current) return;
			clientRef.current.writeVoiceReaction(sessionRef.current, [`sound:${soundId}`], channelId);
		},
		[clientRef, canSend]
	);

	const sendRaisingHand = useCallback(
		(userId: string, hand: boolean) => {
			const channelId = selectVoiceInfo(getStore().getState())?.channelId;
			if (!clientRef.current || !channelId || !canSend() || !sessionRef.current) return;
			clientRef.current.writeVoiceReaction(sessionRef.current, [hand ? `raising-up:${userId}` : `raising-down:${userId}`], channelId);
		},
		[clientRef, canSend]
	);

	return { sendEmojiReaction, sendSoundReaction, sendRaisingHand };
};
