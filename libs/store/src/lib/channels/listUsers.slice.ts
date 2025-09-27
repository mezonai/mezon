import { captureSentryError } from '@mezon/logger';
import { IUsers, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiUser } from 'mezon-js/api.gen';
import { CacheMetadata, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { RootState } from '../store';

export const LIST_USERS_BY_USER_FEATURE_KEY = 'listusersbyuserid';

/*
 * Update these interfaces according to your requirements.
 */
export interface UsersEntity extends IUsers {
	id: string; // Primary ID
}

export const mapUsersToEntity = (userRes: ApiUser) => {
	return { ...userRes, id: userRes.id || '' };
};

export interface ListUsersState extends EntityState<UsersEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	cache?: CacheMetadata;
}

export const listUsersAdapter = createEntityAdapter<UsersEntity>();

export interface ListUsersRootState {
	[LIST_USERS_BY_USER_FEATURE_KEY]: ListUsersState;
}

export const fetchListUsersByUserCached = async (getState: () => RootState, mezon: MezonValueContext, noCache = false) => {
	const currentState = getState();
	const usersData = currentState[LIST_USERS_BY_USER_FEATURE_KEY];
	const apiKey = createApiKey('fetchListUsersByUser', mezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, usersData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			users: selectAll(usersData),
			fromCache: true,
			time: usersData.cache?.lastFetched || Date.now()
		};
	}

	const response = await mezon.client.listUserClansByUserId(mezon.session);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchListUsersByUser = createAsyncThunk(
	'usersByUser/fetchListUsersByUser',
	async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchListUsersByUserCached(thunkAPI.getState as () => RootState, mezon, Boolean(noCache));

			if (response?.fromCache) {
				return {
					fromCache: true,
					users: []
				};
			}

			if (!response?.users) {
				return { users: [], fromCache: response.fromCache };
			}

			const users = response?.users.map(mapUsersToEntity);
			return { users, fromCache: response.fromCache };
		} catch (error) {
			captureSentryError(error, 'usersByUser/fetchListUsersByUser');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialListUsersByUserState: ListUsersState = listUsersAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const listUsersByUserSlice = createSlice({
	name: LIST_USERS_BY_USER_FEATURE_KEY,
	initialState: initialListUsersByUserState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListUsersByUser.pending, (state: ListUsersState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchListUsersByUser.fulfilled,
				(state: ListUsersState, action: PayloadAction<{ users: UsersEntity[]; fromCache?: boolean }>) => {
					const { users, fromCache } = action.payload;

					if (!fromCache) {
						listUsersAdapter.setAll(state, users);
						state.cache = createCacheMetadata();
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchListUsersByUser.rejected, (state: ListUsersState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const listUsersByUserReducer = listUsersByUserSlice.reducer;

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
 *   dispatch(channelsActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */

export const listUsersByUserActions = {
	...listUsersByUserSlice.actions,
	fetchListUsersByUser
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
import { channel } from 'process';
import { mess } from '@mezon/store';
 *
 * // ...
 *
 * const entities = useSelector(selectAllChannels);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities, selectById } = listUsersAdapter.getSelectors();

export const getUsersByUserState = (rootState: { [LIST_USERS_BY_USER_FEATURE_KEY]: ListUsersState }): ListUsersState =>
	rootState[LIST_USERS_BY_USER_FEATURE_KEY];

export const selectAllUsersByUser = createSelector(getUsersByUserState, selectAll);

export const selectAllUsesInAllClansEntities = createSelector(getUsersByUserState, selectEntities);

export const selectUserById = createSelector([getUsersByUserState, (_: RootState, userId: string) => userId], (state, userId) =>
	selectById(state, userId)
);
