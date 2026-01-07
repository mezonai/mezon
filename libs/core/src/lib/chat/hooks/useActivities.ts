import { acitvitiesActions, useAppDispatch } from '@mezon/store';
import type { ActivitiesInfo } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

export function useActivities() {
	const dispatch = useAppDispatch();
	const setUserActivity = useCallback(
		(info: ActivitiesInfo) => {
			const body = {
				activityDescription: info?.windowTitle,
				activityName: info?.appName,
				activityType: info?.typeActivity,
				applicationId: '0',
				startTime: info?.startTime,
				status: 1
			};
			dispatch(acitvitiesActions.createActivity(body));
		},
		[dispatch]
	);
	const setUserAFK = useCallback(
		(status: number) => {
			const body = {
				activityName: 'AFK',
				activityType: 4,
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
