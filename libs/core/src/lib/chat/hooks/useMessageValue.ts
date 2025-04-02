import { channelsActions, getStore, selectCurrentChannel, selectDmGroupCurrentId, selectModeResponsive, useAppDispatch } from '@mezon/store';
import { ModeResponsive, RequestInput } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

export function useMessageValue() {
	const dispatch = useAppDispatch();
	const setRequestInput = useCallback((request: RequestInput, isThread?: boolean) => {
		const store = getStore();
		const mode = selectModeResponsive(store.getState());
		const currentChannel = selectCurrentChannel(store.getState());
		const currentDmGroupId = selectDmGroupCurrentId(store.getState());

		if (mode === ModeResponsive.MODE_CLAN) {
			dispatch(
				channelsActions.setRequestInput({
					clanId: mode === ModeResponsive.MODE_CLAN ? (currentChannel?.clan_id as string) : '0',
					channelId: isThread ? currentChannel?.id + String(isThread) : (currentChannel?.id as string),
					request
				})
			);
		} else {
			dispatch(
				channelsActions.setRequestInput({
					clanId: '0',
					channelId: currentDmGroupId || '',
					request
				})
			);
		}
	}, []);

	return useMemo(
		() => ({
			setRequestInput
		}),
		[setRequestInput]
	);
}
