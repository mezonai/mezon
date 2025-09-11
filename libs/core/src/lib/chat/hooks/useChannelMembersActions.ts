import { channelMembersActions, clansActions, directActions, selectCurrentClanId, toastActions, useAppDispatch } from '@mezon/store';
import type { RemoveChannelUsers, RemoveClanUsers } from '@mezon/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../auth/hooks/useAuth';

export type UseChannelMembersActionsOptions = {
	channelId?: string | null;
};

export function useChannelMembersActions() {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const currentClanId = useSelector(selectCurrentClanId);
	const removeMemberChannel = useCallback(
		async ({ channelId, userIds }: RemoveChannelUsers) => {
			await dispatch(channelMembersActions.removeMemberChannel({ channelId, userIds }));
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
		},
		[dispatch]
	);

	const removeMemberClan = useCallback(
		async ({ clanId, channelId, userIds }: RemoveClanUsers) => {
			if (userIds.length > 0) {
				await dispatch(clansActions.removeClanUsers({ clanId, userIds }));
				dispatch(
					toastActions.addToast({
						message: 'Member removed successfully',
						type: 'success'
					})
				);
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
