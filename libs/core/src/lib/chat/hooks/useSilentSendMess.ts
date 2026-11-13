import { directActions, useAppDispatch } from '@mezon/store';
import type { ApiCreateChannelDescRequest } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { useCallback, useMemo } from 'react';

export function useSilentSendMess() {
	const dispatch = useAppDispatch();
	const createSilentSendMess = useCallback(
		async (userId: string) => {
			const bodyCreateDm: ApiCreateChannelDescRequest = {
				type: ChannelType.CHANNEL_TYPE_DM,
				channel_private: 1,
				user_ids: [userId],
				clan_id: '0'
			};
			const response = await dispatch(directActions.createNewDirectMessage({ body: bodyCreateDm }));
			if (directActions.createNewDirectMessage.fulfilled.match(response)) {
				return response.payload;
			}
			return undefined;
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			createSilentSendMess
		}),
		[createSilentSendMess]
	);
}
