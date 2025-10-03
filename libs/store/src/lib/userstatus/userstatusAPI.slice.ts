import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus, UserStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiUserStatus, ApiUserStatusUpdate } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const USER_STATUS_API_FEATURE_KEY = 'userstatusapi';

/*
 * Update these interfaces according to your requirements.
 */
export interface UserStatusEntity extends UserStatus {
	id: string; // Primary ID
}

export interface UserStatusState extends EntityState<UserStatusEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	userStatus?: ApiUserStatus;
	cache?: CacheMetadata;
}

export const userStatusAdapter = createEntityAdapter({
	selectId: (status: UserStatusEntity) => status.id || ''
});

export const fetchUserStatusCached = async (getState: () => RootState, mezon: MezonValueContext, noCache = false) => {
	const currentState = getState();
	const userStatusState = currentState[USER_STATUS_API_FEATURE_KEY];

	const apiKey = createApiKey('fetchUserStatus', mezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, userStatusState.cache, noCache);

	if (!shouldForceCall && userStatusState.userStatus) {
		return {
			...userStatusState.userStatus,
			fromCache: true,
			time: userStatusState.cache?.lastFetched || Date.now()
		};
	}

	const response = await mezon.client.getUserStatus(mezon.session);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const updateUserStatus = createAsyncThunk('userstatusapi/updateUserStatus', async (request: ApiUserStatusUpdate, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.updateUserStatus(mezon.session, request);
		if (!response) {
			return '';
		}
		return request.status || '';
	} catch (error) {
		captureSentryError(error, 'userstatusapi/updateUserStatus');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialUserStatusState: UserStatusState = userStatusAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const userStatusSlice = createSlice({
	name: USER_STATUS_API_FEATURE_KEY,
	initialState: initialUserStatusState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(updateUserStatus.pending, (state: UserStatusState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(updateUserStatus.fulfilled, (state: UserStatusState, action: PayloadAction<string>) => {
				state.loadingStatus = 'loaded';
				state.userStatus = { ...state.userStatus, status: action.payload };
			})
			.addCase(updateUserStatus.rejected, (state: UserStatusState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const userStatusAPIReducer = userStatusSlice.reducer;

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
export const userStatusActions = {
	...userStatusSlice.actions,
	updateUserStatus
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

export const getUserStatusState = (rootState: { [USER_STATUS_API_FEATURE_KEY]: UserStatusState }): UserStatusState =>
	rootState[USER_STATUS_API_FEATURE_KEY];

export const selectUserStatus = createSelector(getUserStatusState, (state) => state.userStatus);
