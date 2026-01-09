import { captureSentryError } from '@mezon/logger';
import type { IActivity, LoadingStatus } from '@mezon/utils';
import { FOR_24_HOURS_SEC } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiCreateActivityRequest, ApiUserActivity } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';

export const ACTIVITIES_API_FEATURE_KEY = 'activitiesapi';

const ACTIVITIES_CACHE_TIME = FOR_24_HOURS_SEC;

/*
 * Update these interfaces according to your requirements.
 */
export interface ActivitiesEntity extends IActivity {
	id: string; // Primary ID
}

export const mapActivityEntity = (activitiesRes: ApiUserActivity) => {
	return { ...activitiesRes, id: activitiesRes.userId || '' };
};

export interface ActivityState extends EntityState<ActivitiesEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	cache?: CacheMetadata;
	isActivityTrackingEnabled: boolean;
}

export const activityAdapter = createEntityAdapter({
	selectId: (activity: ActivitiesEntity) => activity.id || ''
});

export const createActivity = createAsyncThunk('activity/createActiviy', async (body: ApiCreateActivityRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const bodyWithTypeName = {
			$typeName: 'mezon.api.CreateActivityRequest' as const,
			activityName: body.activityName || '',
			activityType: body.activityType ?? 0,
			activityDescription: body.activityDescription || '',
			applicationId: body.applicationId || '',
			status: body.status ?? 0,
			...(body.startTime ? { startTime: body.startTime as any } : {})
		};
		const response = await mezon.client.createActiviy(mezon.session, bodyWithTypeName);

		return {
			...response,
			id: response.userId
		};
	} catch (error) {
		return null;
	}
});

export const fetchActivitiesCached = async (getState: () => any, mezon: MezonValueContext, noCache = false) => {
	const currentState = getState();
	const activitiesState = currentState[ACTIVITIES_API_FEATURE_KEY];
	const apiKey = createApiKey('listActivities');

	const shouldForceCall = shouldForceApiCall(apiKey, activitiesState?.cache, noCache);

	if (!shouldForceCall) {
		return {
			activities: selectAll(activitiesState),
			fromCache: true,
			time: activitiesState.cache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		mezon,
		{
			api_name: 'ListActivity'
		},
		() => mezon.client.listActivity(mezon.session),
		'userActivityList'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

type listActivitiesArgs = {
	noCache?: boolean;
};

export const listActivities = createAsyncThunk('activity/listActivities', async ({ noCache }: listActivitiesArgs = {}, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await fetchActivitiesCached(thunkAPI.getState, mezon, Boolean(noCache));

		if (!response) {
			return thunkAPI.rejectWithValue('Invalid listActivities response');
		}

		if (response.fromCache && Date.now() - response.time > 100) {
			return {
				fromCache: true
			};
		}

		if (!response.activities) {
			return [];
		}

		const activities = (response.activities as ApiUserActivity[]).map(mapActivityEntity);
		thunkAPI.dispatch(acitvitiesActions.addMany(activities));
		return { activities, fromCache: response.fromCache };
	} catch (error) {
		captureSentryError(error, 'activity/listActivities');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialActivityState: ActivityState = activityAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	isActivityTrackingEnabled: true
});

export const activitiesSlice = createSlice({
	name: ACTIVITIES_API_FEATURE_KEY,
	initialState: initialActivityState,
	reducers: {
		add: activityAdapter.addOne,
		addMany: activityAdapter.addMany,
		remove: activityAdapter.removeOne,
		updateListActivity: (state: ActivityState, action: PayloadAction<ActivitiesEntity[]>) => {
			activityAdapter.setAll(state, action.payload);
		},
		setActivityTrackingEnabled: (state: ActivityState, action: PayloadAction<boolean>) => {
			state.isActivityTrackingEnabled = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(createActivity.pending, (state: ActivityState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(createActivity.fulfilled, (state: ActivityState, action: PayloadAction<any>) => {
				state.loadingStatus = 'loaded';
				// acitvitiesActions.add(action.payload);
				if (action.payload?.activityName) {
					activityAdapter.upsertOne(state, action.payload);
				} else {
					activityAdapter.removeOne(state, action.payload?.id);
				}
			})
			.addCase(createActivity.rejected, (state: ActivityState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(listActivities.pending, (state: ActivityState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(listActivities.fulfilled, (state: ActivityState, action: PayloadAction<any>) => {
				const { fromCache } = action.payload || {};

				if (!fromCache) {
					state.cache = createCacheMetadata(ACTIVITIES_CACHE_TIME);
				}

				state.loadingStatus = 'loaded';
			})
			.addCase(listActivities.rejected, (state: ActivityState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const activitiesAPIReducer = activitiesSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(usersActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const acitvitiesActions = {
	...activitiesSlice.actions,
	createActivity,
	listActivities
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllUsers);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectById } = activityAdapter.getSelectors();

export const getActivityState = (rootState: { [ACTIVITIES_API_FEATURE_KEY]: ActivityState }): ActivityState => rootState[ACTIVITIES_API_FEATURE_KEY];

export const selectAllActivities = createSelector(getActivityState, selectAll);

export const selectIsActivityTrackingEnabled = createSelector(getActivityState, (state) => state.isActivityTrackingEnabled);

export const selectActivityByUserId = createSelector([getActivityState, (state, userId: string) => userId], (state, userId) =>
	selectById(state, userId)
);
