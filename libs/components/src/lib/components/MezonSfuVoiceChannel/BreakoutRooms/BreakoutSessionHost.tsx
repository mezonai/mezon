import type { RootState } from '@mezon/store';
import {
	BREAKOUT_UNOBSERVED_RECHECK_SECS,
	channelsActions,
	getStore,
	observeHostedRooms,
	planHostedBreakout,
	selectBreakoutInvite,
	selectBreakoutPending,
	selectClosingBreakoutIds,
	selectCurrentUserId,
	selectHasHostedBreakouts,
	selectHostedBreakouts,
	selectListVoiceMemberByClan,
	selectVoiceMembersLoadedByClan,
	useAppDispatch,
	voiceActions,
	voiceMembersByChannelId
} from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { memo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { BreakoutInviteModal } from './BreakoutInviteModal';

const HostedBreakoutWatcher = () => {
	const dispatch = useAppDispatch();
	const hostedBreakouts = useSelector(selectHostedBreakouts);
	const breakoutPending = useSelector(selectBreakoutPending);
	const closingBreakoutIds = useSelector(selectClosingBreakoutIds);
	const voiceMembersLoadedByClan = useSelector(selectVoiceMembersLoadedByClan);
	const listVoiceMemberByClan = useSelector(selectListVoiceMemberByClan);
	const hostedClanChannelsReady = useSelector((s: RootState) =>
		Object.values(s.voice.hostedBreakouts)
			.map((h) => `${h.clanId}:${Boolean(s.channels?.byClans?.[h.clanId]?.fetchChannelSuccess)}`)
			.join(',')
	);
	const [recheckTick, setRecheckTick] = useState(0);
	const fetchedHostedClansRef = useRef<Map<string, number>>(new Map());

	useEffect(() => {
		const hostedList = Object.values(hostedBreakouts);
		if (hostedList.length === 0 || breakoutPending) {
			return;
		}
		const state = getStore().getState() as RootState;
		const nowUnixSecs = Math.floor(Date.now() / 1000);
		let earliestRecheckAt: number | null = null;

		for (const hosted of hostedList) {
			const clanId = hosted.clanId;
			if (!clanId || clanId === '0' || hosted.roomIds.length === 0) {
				continue;
			}
			const clanChannelsState = state.channels?.byClans?.[clanId];
			const channelsLoaded = Boolean(clanChannelsState?.fetchChannelSuccess) && (clanChannelsState?.entities?.ids?.length ?? 0) > 0;
			const voiceMembersLoaded = Boolean(voiceMembersLoadedByClan[clanId]);
			const isClanReady = channelsLoaded && voiceMembersLoaded;

			if (!isClanReady) {
				const lastFetchAt = fetchedHostedClansRef.current.get(clanId) ?? 0;
				if (nowUnixSecs - lastFetchAt >= BREAKOUT_UNOBSERVED_RECHECK_SECS) {
					fetchedHostedClansRef.current.set(clanId, nowUnixSecs);
					if (!channelsLoaded) {
						void dispatch(channelsActions.fetchChannels({ clanId }));
					}
					if (!voiceMembersLoaded) {
						void dispatch(
							voiceActions.fetchVoiceChannelMembers({
								clanId,
								channelId: hosted.parentChannelId,
								channelType: ChannelType.CHANNEL_TYPE_MEZON_VOICE
							})
						);
					}
				}
				const unobservedRecheckAt = nowUnixSecs + BREAKOUT_UNOBSERVED_RECHECK_SECS;
				earliestRecheckAt = earliestRecheckAt === null ? unobservedRecheckAt : Math.min(earliestRecheckAt, unobservedRecheckAt);
			}

			const observation = observeHostedRooms(hosted, isClanReady, voiceMembersByChannelId(listVoiceMemberByClan[clanId]));
			const { next, dirty, plan } = planHostedBreakout(hosted, observation, nowUnixSecs);

			if (
				dirty ||
				next.emptySinceUnixSecs !== hosted.emptySinceUnixSecs ||
				next.hadOccupants !== hosted.hadOccupants ||
				next.pendingInvitees.length !== hosted.pendingInvitees.length
			) {
				dispatch(
					voiceActions.updateHostedBreakoutState({
						parentChannelId: hosted.parentChannelId,
						hosted: next,
						persist: dirty
					})
				);
			}

			if (plan.kind === 'Close') {
				if (!closingBreakoutIds.includes(hosted.breakoutId)) {
					void dispatch(
						voiceActions.autoCloseHostedBreakout({
							parentChannelId: hosted.parentChannelId,
							breakoutId: hosted.breakoutId
						})
					);
				}
			} else if (plan.kind === 'RecheckAt') {
				earliestRecheckAt = earliestRecheckAt === null ? plan.atUnixSecs : Math.min(earliestRecheckAt, plan.atUnixSecs);
			}
		}

		if (earliestRecheckAt === null) {
			return;
		}
		const delayMs = Math.max(1, earliestRecheckAt - nowUnixSecs) * 1000;
		const timer = window.setTimeout(() => {
			setRecheckTick((tick) => tick + 1);
		}, delayMs);
		return () => {
			window.clearTimeout(timer);
		};
	}, [
		breakoutPending,
		closingBreakoutIds,
		dispatch,
		hostedBreakouts,
		hostedClanChannelsReady,
		listVoiceMemberByClan,
		recheckTick,
		voiceMembersLoadedByClan
	]);

	return null;
};

export const BreakoutSessionHost = memo(() => {
	const dispatch = useAppDispatch();
	const userId = useSelector(selectCurrentUserId);
	const hasHostedBreakouts = useSelector(selectHasHostedBreakouts);
	const hasInvite = useSelector(selectBreakoutInvite) !== null;
	const voiceClanId = useSelector((s: RootState) => s.voice.voiceInfo?.clanId);

	useEffect(() => {
		dispatch(voiceActions.syncHostedBreakoutsOwner(userId || null));
	}, [dispatch, userId]);

	return (
		<>
			{hasHostedBreakouts && <HostedBreakoutWatcher key={userId} />}
			{hasInvite && voiceClanId && <BreakoutInviteModal clanId={voiceClanId} />}
		</>
	);
});
