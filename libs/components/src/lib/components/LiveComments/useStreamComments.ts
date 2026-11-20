import {
	getStore,
	getUsersClanState,
	selectAllAccount,
	selectClanMemberByClanId,
	selectClanRosterCapped,
	selectCurrentClanId,
	selectMemberByIdAndClanId,
	selectStreamMembersByChannelId
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { VoiceReactionSend } from 'mezon-js';
import { useCallback, useEffect } from 'react';
import {
	canAcceptLiveCommentSender,
	findMemberInAnyLoadedClan,
	formatStreamCommentToken,
	isClanRosterLoaded,
	parseStreamCommentToken,
	resolveLiveCommentSender
} from './liveCommentSender';
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
			const senderId = typeof message.sender_id === 'string' ? message.sender_id.trim() : '';
			const resolvedClanId = clanId && clanId !== '0' ? clanId : selectCurrentClanId(state) || '';
			const hasClanId = Boolean(resolvedClanId && resolvedClanId !== '0');
			const clanRoster = hasClanId ? selectClanMemberByClanId(state, resolvedClanId) : undefined;
			const rosterLoaded = isClanRosterLoaded(clanRoster);
			const rosterCapped = hasClanId ? selectClanRosterCapped(state, resolvedClanId) : false;
			const clanMember = hasClanId ? selectMemberByIdAndClanId(state, resolvedClanId, senderId) : null;
			if (!canAcceptLiveCommentSender({ userId: senderId, inClanRoster: Boolean(clanMember), rosterLoaded, rosterCapped })) return;

			const account = selectAllAccount(state);
			const fallbackMember = clanMember
				? null
				: (findMemberInAnyLoadedClan(getUsersClanState(state)?.byClans, senderId, resolvedClanId) ??
					(account?.user?.id === senderId ? { user: account.user } : null));
			const streamMember = clanMember ? undefined : selectStreamMembersByChannelId(state, channelId).find((item) => item.user_id === senderId);
			const fallbackName = streamMember?.user_name || streamMember?.participant;
			const sender = resolveLiveCommentSender({
				userId: senderId,
				clanMember,
				rosterLoaded,
				rosterCapped,
				fallbackMember,
				fallbackName
			});
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
