import { inviteActions, useAppDispatch } from '@mezon/store';
import type { ApiInviteUserRes, ApiLinkInviteUser } from 'mezon-js/api.gen';
import React, { useMemo } from 'react';

export function useInvite() {
	const dispatch = useAppDispatch();

	const createLinkInviteUser = React.useCallback(
		async (clan_id: string, channel_id: string, expiry_time: number) => {
			const action = await dispatch(
				inviteActions.createLinkInviteUser({
					clan_id,
					channel_id,
					expiry_time
				})
			);
			const payload = action.payload as ApiLinkInviteUser;
			return payload;
		},
		[dispatch]
	);

	const inviteUser = React.useCallback(
		async (invite_id: string) => {
			const action = await dispatch(inviteActions.inviteUser({ inviteId: invite_id }));
			const payload = action.payload as ApiInviteUserRes;
			return payload;
		},
		[dispatch]
	);

	const getLinkInvite = React.useCallback(
		async (invite_id: string) => {
			const action = await dispatch(inviteActions.getLinkInvite({ inviteId: invite_id }));
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
