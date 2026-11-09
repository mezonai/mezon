import { directActions, useAppDispatch } from '@mezon/store';
import type { ApiCreateChannelDescRequest } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { useCallback, useMemo } from 'react';

export function useDirect({ suppressDeniedToast = false }: { suppressDeniedToast?: boolean } = {}) {
	const dispatch = useAppDispatch();
	const createDirectMessageWithUser = useCallback(
		async (userId: string, display_names?: string, username?: string, avatar?: string) => {
			const bodyCreateDm: ApiCreateChannelDescRequest = {
				type: ChannelType.CHANNEL_TYPE_DM,
				channel_private: 1,
				user_ids: [userId],
				clan_id: '0'
			};
			const response = await dispatch(
				directActions.createNewDirectMessage({ body: bodyCreateDm, username, avatar, display_names, suppressDeniedToast })
			);
			if (directActions.createNewDirectMessage.fulfilled.match(response)) {
				return response.payload;
			}
			return undefined;
		},
		[dispatch, suppressDeniedToast]
	);

	return useMemo(
		() => ({
			createDirectMessageWithUser
		}),
		[createDirectMessageWithUser]
	);
}
