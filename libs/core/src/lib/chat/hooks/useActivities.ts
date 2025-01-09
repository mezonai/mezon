import { acitvitiesActions, useAppDispatch } from '@mezon/store';
import { ActivitiesInfo, ActivitiesName, ActivitiesType } from '@mezon/utils';
import { useCallback, useMemo } from 'react';

const activityTypeMap: Record<ActivitiesName, ActivitiesType> = {
	[ActivitiesName.CODE]: ActivitiesType.VISUAL_STUDIO_CODE,
	[ActivitiesName.VISUAL_STUDIO_CODE]: ActivitiesType.VISUAL_STUDIO_CODE,
	[ActivitiesName.CURSOR]: ActivitiesType.VISUAL_STUDIO_CODE,
	[ActivitiesName.XCODE]: ActivitiesType.VISUAL_STUDIO_CODE,
	[ActivitiesName.SPOTIFY]: ActivitiesType.SPOTIFY,
	[ActivitiesName.LOL]: ActivitiesType.LOL,
	[ActivitiesName.LOL_MACOS]: ActivitiesType.LOL
};

export function useActivities() {
	const dispatch = useAppDispatch();
	const setUserActivity = useCallback(
		(info: ActivitiesInfo) => {
			const body = {
				activity_description: info?.windowTitle,
				activity_name: info?.appName,
				activity_type: activityTypeMap[info?.appName as ActivitiesName],
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
