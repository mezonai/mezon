import { captureSentryError } from '@mezon/logger';
import type { IChannelMember, IUserStream, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelType } from 'mezon-js';
import type { ApiStreamingChannelUser } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

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
	cache?: CacheMetadata;
}

export const userStreamAdapter = createEntityAdapter({
	selectId: (user: UsersStreamEntity) => user.user_id || ''
});

const { selectAll: selectAllUsersStreamEntities } = userStreamAdapter.getSelectors();

type fetchStreamChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
	noCache?: boolean;
};

export type FetchStreamChannelMembersResponse = {
	streams: ApiStreamingChannelUser[];
	fromCache?: boolean;
};

const selectCachedStreamMembers = createSelector([(state: RootState) => state[USERS_STREAM_FEATURE_KEY]], (streamState) => {
	const entities = selectAllUsersStreamEntities(streamState);
	return entities.map(
		(entity): ApiStreamingChannelUser => ({
			user_id: entity.user_id,
			channel_id: entity.streaming_channel_id,
			participant: entity.participant,
			id: entity.id
		})
	);
});

export const fetchStreamChannelMembersCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	clanId: string,
	channelId: string,
	channelType: ChannelType,
	noCache = false
) => {
	const state = getState();
	const streamState = state[USERS_STREAM_FEATURE_KEY];
	const apiKey = createApiKey('fetchStreamChannelMembers', clanId, 'streaming_user_list');
	const shouldForceCall = shouldForceApiCall(apiKey, streamState?.cache, noCache);

	if (!shouldForceCall) {
		const streamMembers = selectCachedStreamMembers(state);
		return {
			streaming_channel_users: streamMembers,
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListStreamingChannelUsers',
			list_channel_users_req: {
				limit: 100,
				state: 1,
				channel_type: channelType,
				clan_id: clanId
			}
		},
		(session) => ensuredMezon.client.listStreamingChannelUsers(session, clanId, channelId, channelType, 1, 100, ''),
		'voice_user_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

export const fetchStreamChannelMembers = createAsyncThunk(
	'stream/fetchStreamChannelMembers',
	async ({ clanId, channelId, channelType, noCache }: fetchStreamChannelMembersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchStreamChannelMembersCached(
				thunkAPI.getState as () => RootState,
				mezon,
				clanId,
				channelId,
				channelType,
				noCache
			);

			if (!response.streaming_channel_users) {
				return { streams: [], fromCache: false };
			}

			const members = response.streaming_channel_users.map((channelRes) => {
				return {
					user_id: channelRes.user_id || '',
					clan_id: clanId,
					streaming_channel_id: channelRes.channel_id || '0',
					clan_name: '',
					participant: channelRes.participant || '',
					streaming_channel_label: '',
					id: channelRes.id || ''
				};
			});

			if (!response.fromCache) {
				thunkAPI.dispatch(usersStreamActions.addMany(members));
			}

			const payload: FetchStreamChannelMembersResponse = {
				streams: response.streaming_channel_users,
				fromCache: response.fromCache
			};

			return payload;
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
				.filter((member) => member?.streaming_channel_id === channelId)
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
			.addCase(fetchStreamChannelMembers.fulfilled, (state: UsersStreamState, action: PayloadAction<FetchStreamChannelMembersResponse>) => {
				const { streams, fromCache } = action.payload;
				state.loadingStatus = 'loaded';

				if (fromCache) return;

				state.streamChannelMember = streams.map((stream) => ({
					id: stream.id || '',
					user_id: stream.user_id,
					participant: stream.participant
				}));
				state.cache = createCacheMetadata();
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
export const getUsersStreamState = (rootState: { [USERS_STREAM_FEATURE_KEY]: UsersStreamState }): UsersStreamState =>
	rootState[USERS_STREAM_FEATURE_KEY];

export const selectAllUsersStream = createSelector(getUsersStreamState, selectAllUsersStreamEntities);

export const selectStreamMembersByChannelId = createSelector([selectAllUsersStream, (_, channelId: string) => channelId], (entities, channelId) => {
	const listStreamChannelUser = entities.filter((member) => member && member.streaming_channel_id === channelId).map((user) => user.user_id);
	return listStreamChannelUser;
});
