import { captureSentryError } from '@mezon/logger';
import { IUsers, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiUser } from 'mezon-js/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';

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
}

export const listUsersAdapter = createEntityAdapter<UsersEntity>();

export interface ListUsersRootState {
	[LIST_USERS_BY_USER_FEATURE_KEY]: ListUsersState;
}

export const fetchListUsersByUserCached = memoizeAndTrack(
	async (mezon: MezonValueContext) => {
		const response = await mezon.client.listUserClansByUserId(mezon.session);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: 1000 * 60 * 60,
		normalizer: (args) => {
			return args[0].session.username || '';
		}
	}
);

export const fetchListUsersByUser = createAsyncThunk(
	'usersByUser/fetchListUsersByUser',
	async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchListUsersByUserCached.delete(mezon);
			}
			const response = await fetchListUsersByUserCached(mezon);
			if (!response?.users) {
				return [];
			}
			const users = response?.users.map(mapUsersToEntity);
			return users;
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
	reducers: {
		add: listUsersAdapter.addOne,
		removeAll: listUsersAdapter.removeAll,
		remove: listUsersAdapter.removeOne,
		update: listUsersAdapter.updateOne
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListUsersByUser.pending, (state: ListUsersState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListUsersByUser.fulfilled, (state: ListUsersState, action: PayloadAction<UsersEntity[]>) => {
				listUsersAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
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
const { selectAll, selectEntities } = listUsersAdapter.getSelectors();

export const getUsersByUserState = (rootState: { [LIST_USERS_BY_USER_FEATURE_KEY]: ListUsersState }): ListUsersState =>
	rootState[LIST_USERS_BY_USER_FEATURE_KEY];

export const selectAllUsersByUser = createSelector(getUsersByUserState, selectAll);

export const selectAllUsesInAllClansEntities = createSelector(getUsersByUserState, selectEntities);
