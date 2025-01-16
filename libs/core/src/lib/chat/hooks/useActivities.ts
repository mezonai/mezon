import { acitvitiesActions, useAppDispatch } from '@mezon/store';
import { ActivitiesInfo } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

export function useActivities() {
	const dispatch = useAppDispatch();
	const setUserActivity = useCallback(
		(info: ActivitiesInfo) => {
			const body = {
				activity_description: info?.windowTitle,
				activity_name: info?.appName,
				activity_type: info?.typeActivity,
				application_id: '0',
				start_time: info?.startTime,
				status: 1
			};
			dispatch(acitvitiesActions.createActivity(body));
		},
		[dispatch]
	);
	return useMemo(
		() => ({
			setUserActivity
		}),
		[setUserActivity]
	);
}
