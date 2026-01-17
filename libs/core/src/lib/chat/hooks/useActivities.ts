import { acitvitiesActions, useAppDispatch } from '@mezon/store';
import type { ActivitiesInfo } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

export function useActivities() {
	const dispatch = useAppDispatch();
	const setUserActivity = useCallback(
		(info: ActivitiesInfo) => {
			const body = {
				activity_description: info?.windowTitle,
				activity_name: info?.appName,
				activity_type: info?.typeActivity,
				application_id: BigInt(0),
				start_time: info?.startTime,
				status: 1
			};
			dispatch(acitvitiesActions.createActivity(body));
		},
		[dispatch]
	);
	const setUserAFK = useCallback(
		(status: number) => {
			const body = {
				activity_name: 'AFK',
				activity_type: 4,
				status
			};
			dispatch(acitvitiesActions.createActivity(body));
		},
		[dispatch]
	);
	return useMemo(
		() => ({
			setUserActivity,
			setUserAFK
		}),
		[setUserActivity, setUserAFK]
	);
}
