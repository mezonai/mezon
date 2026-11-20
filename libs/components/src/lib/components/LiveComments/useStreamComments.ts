import { getStore, selectMemberByIdAndClanId, selectMemberClanByUserId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { VoiceReactionSend } from 'mezon-js';
import { useCallback, useEffect } from 'react';
import { formatStreamCommentToken, parseStreamCommentToken, resolveClanMemberSender } from './liveCommentSender';
import { useLiveCommentQueue } from './useLiveCommentQueue';
import { subscribeVoiceReaction } from './voiceReactionFanout';

export const useStreamComments = (channelId: string, clanId?: string) => {
	const { clientRef, sessionRef } = useMezon();
	const { comments, hidden, hasUnseen, add, hide, show, toggle, reset } = useLiveCommentQueue();

	useEffect(() => {
		reset();
	}, [channelId, reset]);

	useEffect(() => {
		const currentSocket = clientRef.current;
		if (!currentSocket || !channelId || channelId === '0') return;

		return subscribeVoiceReaction(currentSocket, (message: VoiceReactionSend) => {
			if (message.channel_id !== channelId) return;
			const firstToken = message.emojis?.[0];
			const content = parseStreamCommentToken(firstToken);
			if (!content) return;

			const state = getStore().getState();
			const member = clanId ? selectMemberByIdAndClanId(state, clanId, message.sender_id) : selectMemberClanByUserId(state, message.sender_id);
			const sender = resolveClanMemberSender(message.sender_id, member);
			if (!sender) return;

			add({
				senderId: sender.userId,
				name: sender.name,
				avatar: sender.avatar,
				content
			});
		});
	}, [add, channelId, clanId, clientRef]);

	const sendComment = useCallback(
		async (rawText: string): Promise<boolean> => {
			const token = formatStreamCommentToken(rawText);
			const client = clientRef.current;
			const session = sessionRef.current;
			if (!token || !channelId || channelId === '0' || !client || !session) return false;
			try {
				await client.writeVoiceReaction(session, [token], channelId);
				return true;
			} catch (error) {
				console.error('Failed to send stream comment:', error);
				return false;
			}
		},
		[channelId, clientRef, sessionRef]
	);

	return {
		comments,
		hidden,
		hasUnseen,
		hide,
		show,
		toggle,
		reset,
		sendComment
	};
};
