import {
	channelMembersActions,
	clansActions,
	getStoreAsync,
	handleParticipantVoiceState,
	selectCurrentClanId,
	selectVoiceInfo,
	useAppDispatch
} from '@mezon/store';
import { ParticipantMeetState, type RemoveChannelUsers, type RemoveClanUsers } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';

export type UseChannelMembersActionsOptions = {
	channelId?: string | null;
};

export function useChannelMembersActions() {
	const dispatch = useAppDispatch();
	const { userId, userProfile } = useAuth();
	const currentClanId = useSelector(selectCurrentClanId);
	const removeMemberChannel = useCallback(
		async ({ channelId, userIds }: RemoveChannelUsers) => {
			await dispatch(channelMembersActions.removeMemberChannel({ channelId, userIds }));
		},
		[dispatch]
	);

	const removeMemberClan = useCallback(
		async ({ clanId, channelId, userIds }: RemoveClanUsers) => {
			const state = (await getStoreAsync()).getState();
			const currentVoice = selectVoiceInfo(state);
			if (currentVoice?.clanId === clanId) {
				await dispatch(
					handleParticipantVoiceState({
						clan_id: clanId,
						channel_id: currentVoice.channelId,
						display_name: userProfile?.user?.displayName ?? '',
						state: ParticipantMeetState.LEAVE,
						room_name: currentVoice.roomId || 'leave'
					})
				);
			}
			if (userIds.length > 0) {
				await dispatch(clansActions.removeClanUsers({ clanId, userIds }));
			} else {
				await dispatch(clansActions.removeClanUsers({ clanId, userIds: [userId as string] }));
			}

			return currentClanId;
		},
		[dispatch, userId, currentClanId]
	);

	return useMemo(
		() => ({
			removeMemberChannel,
			removeMemberClan
		}),
		[removeMemberChannel, removeMemberClan]
	);
}
