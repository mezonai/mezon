import { captureSentryError } from '@mezon/logger';
import type { IChannelMember, IUserStream, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelType } from 'mezon-js';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';

export const USERS_STREAM_FEATURE_KEY = 'usersstream';

/*
 * Update these interfaces according to your requirements.
 */
export interface UsersStreamEntity extends IUserStream {
	id: string; // Primary ID
}

export interface UsersStreamState extends EntityState<UsersStreamEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	streamChannelMember: IChannelMember[];
}

export const userStreamAdapter = createEntityAdapter({
	selectId: (user: UsersStreamEntity) => user.userId || ''
});

type fetchStreamChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
};

export const fetchStreamChannelMembers = createAsyncThunk(
	'stream/fetchStreamChannelMembers',
	async ({ clanId, channelId, channelType }: fetchStreamChannelMembersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchDataWithSocketFallback(
				mezon,
				{
					api_name: 'ListStreamingChannelUsers',
					list_channel_users_req: {
						limit: 100,
						state: 1,
						channelType: channelType,
						clanId: clanId
					}
				},
				() => mezon.client.listStreamingChannelUsers(mezon.session, clanId, channelId, channelType, 1, 100, ''),
				'voice_user_list'
			);

			if (!response.streamingChannelUsers) {
				return [];
			}

			const members = response.streamingChannelUsers.map((channelRes) => {
				return {
					userId: channelRes.userId || '',
					clanId: clanId,
					streamingChannelId: channelRes.channelId || '',
					clanName: '',
					participant: channelRes.participant || '',
					streamingChannelLabel: '',
					id: channelRes.id || ''
				};
			});

			thunkAPI.dispatch(usersStreamActions.addMany(members));
			const streams = response.streamingChannelUsers;
			return streams;
		} catch (error) {
			captureSentryError(error, 'stream/fetchStreamChannelMembers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialUsersStreamState: UsersStreamState = userStreamAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	streamChannelMember: []
});

export const usersStreamSlice = createSlice({
	name: USERS_STREAM_FEATURE_KEY,
	initialState: initialUsersStreamState,
	reducers: {
		add: (state, action: PayloadAction<UsersStreamEntity>) => {
			userStreamAdapter.addOne(state, action.payload);
		},
		remove: (state, action: PayloadAction<string>) => {
			userStreamAdapter.removeOne(state, action.payload);
		},
		addMany: userStreamAdapter.addMany,
		streamEnded: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			const idsToRemove = Object.values(state.entities)
				.filter((member) => member?.streamingChannelId === channelId)
				.map((member) => member?.id);
			userStreamAdapter.removeMany(state, idsToRemove);
		}
		// ...
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchStreamChannelMembers.pending, (state: UsersStreamState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchStreamChannelMembers.fulfilled, (state: UsersStreamState, action: PayloadAction<any>) => {
				state.streamChannelMember = action.payload;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchStreamChannelMembers.rejected, (state: UsersStreamState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const usersStreamReducer = usersStreamSlice.reducer;

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
export const usersStreamActions = {
	...usersStreamSlice.actions,
	fetchStreamChannelMembers
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
const { selectAll } = userStreamAdapter.getSelectors();

export const getUsersStreamState = (rootState: { [USERS_STREAM_FEATURE_KEY]: UsersStreamState }): UsersStreamState =>
	rootState[USERS_STREAM_FEATURE_KEY];

export const selectAllUsersStream = createSelector(getUsersStreamState, selectAll);

export const selectStreamMembersByChannelId = createSelector([selectAllUsersStream, (_, channelId: string) => channelId], (entities, channelId) => {
	return entities.filter((member) => member && member.streamingChannelId === channelId);
});
