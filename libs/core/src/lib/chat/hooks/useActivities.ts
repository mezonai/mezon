import { acitvitiesActions, selectIsActivityTrackingEnabled, useAppDispatch, useAppSelector } from '@mezon/store';
import type { ActivitiesInfo } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

export function useActivities() {
	const dispatch = useAppDispatch();
	const isActivityTrackingEnabled = useAppSelector(selectIsActivityTrackingEnabled);

	const setUserActivity = useCallback(
		(info: ActivitiesInfo) => {
			if (!isActivityTrackingEnabled) return;
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
		[dispatch, isActivityTrackingEnabled]
	);
	const setUserAFK = useCallback(
		(status: number) => {
			if (!isActivityTrackingEnabled) return;
			const body = {
				activity_name: 'AFK',
				activity_type: 4,
				status
			};
			dispatch(acitvitiesActions.createActivity(body));
		},
		[dispatch, isActivityTrackingEnabled]
	);
	return useMemo(
		() => ({
			setUserActivity,
			setUserAFK
		}),
		[setUserActivity, setUserAFK]
	);
}
