import { directActions, useAppDispatch } from '@mezon/store';
import { ChannelType } from 'mezon-js';
import { ApiCreateChannelDescRequest } from 'mezon-js/types';
import { useCallback, useMemo } from 'react';

type UseDirectParams = {
	autoFetch: boolean;
};

export function useDirect({ autoFetch = false }: UseDirectParams = { autoFetch: false }) {
	const dispatch = useAppDispatch();
	const createDirectMessageWithUser = useCallback(
		async (userId: string, displayNames?: string, username?: string, avatar?: string) => {
			const bodyCreateDm: ApiCreateChannelDescRequest = {
				type: ChannelType.CHANNEL_TYPE_DM,
				channelPrivate: 1,
				userIds: [userId],
				clanId: '0'
			};
			const response = await dispatch(directActions.createNewDirectMessage({ body: bodyCreateDm, username, avatar, displayNames }));
			const resPayload = response.payload as ApiCreateChannelDescRequest;

			return resPayload;
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			createDirectMessageWithUser
		}),
		[createDirectMessageWithUser]
	);
}
