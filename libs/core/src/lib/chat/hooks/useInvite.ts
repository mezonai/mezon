import { inviteActions, useAppDispatch } from '@mezon/store';
import { ApiInviteUserRes, ApiLinkInviteUser } from 'mezon-js/types';
import React, { useMemo } from 'react';

export function useInvite() {
	const dispatch = useAppDispatch();

	const createLinkInviteUser = React.useCallback(
		async (clanId: string, channelId: string, expiryTime: number) => {
			const action = await dispatch(
				inviteActions.createLinkInviteUser({
					clanId: clanId,
					channelId: channelId,
					expiryTime: expiryTime
				})
			);
			const payload = action.payload as ApiLinkInviteUser;
			return payload;
		},
		[dispatch]
	);

	const inviteUser = React.useCallback(
		async (inviteId: string) => {
			const action = await dispatch(inviteActions.inviteUser({ inviteId: inviteId }));
			const payload = action.payload as ApiInviteUserRes;
			return payload;
		},
		[dispatch]
	);

	const getLinkInvite = React.useCallback(
		async (inviteId: string) => {
			const action = await dispatch(inviteActions.getLinkInvite({ inviteId: inviteId }));
			const payload = action.payload as ApiInviteUserRes;
			return payload;
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			createLinkInviteUser,
			inviteUser,
			getLinkInvite
		}),
		[createLinkInviteUser, inviteUser, getLinkInvite]
	);
}
