import { captureSentryError } from '@mezon/logger';
import type { IChannelMember, IUserStream, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelType } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
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
	streamChannelMembersCache?: Record<string, CacheMetadata>;
}

export const userStreamAdapter = createEntityAdapter({
	selectId: (user: UsersStreamEntity) => user.userId || ''
});

type fetchStreamChannelMembersPayload = {
	clanId: string;
	channelId: string;
	channelType: ChannelType;
	noCache?: boolean;
};

type FetchStreamChannelMembersResult = {
	streams: IChannelMember[];
	clanId: string;
	channelId: string;
	channelType: ChannelType;
	fromCache?: boolean;
	time?: number;
};

const STREAM_CHANNEL_MEMBERS_CACHED_TIME = 1000 * 60 * 5;

const fetchStreamChannelMembersCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	clanId: string,
	channelId: string,
	channelType: ChannelType,
	noCache = false
): Promise<FetchStreamChannelMembersResult> => {
	const usersStreamState = (getState() as RootState)[USERS_STREAM_FEATURE_KEY];
	const cacheKey = channelId ? `${clanId}_${channelId}_${channelType}` : `${clanId}_${channelType}`;
	const apiKey = createApiKey('fetchStreamChannelMembers', clanId, channelId || 'all', channelType.toString());
	const channelCache = usersStreamState.streamChannelMembersCache?.[cacheKey];
	const shouldForceCall = shouldForceApiCall(apiKey, channelCache, noCache);

	if (!shouldForceCall && channelCache) {
		return {
			streams: usersStreamState.streamChannelMember,
			clanId,
			channelId,
			channelType,
			fromCache: true,
			time: channelCache.lastFetched || Date.now()
		};
	}

	const response = await withRetry(() => mezon.client.listStreamingChannelUsers(mezon.session, clanId, channelId, channelType, 1, 100, ''), {
		scope: 'ListStreamingChannelUsers'
	});

	markApiFirstCalled(apiKey);

	return {
		streams: response.streamingChannelUsers || [],
		clanId,
		channelId,
		channelType,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchStreamChannelMembers = createAsyncThunk<FetchStreamChannelMembersResult, fetchStreamChannelMembersPayload>(
	'stream/fetchStreamChannelMembers',
	async ({ clanId, channelId, channelType, noCache }: fetchStreamChannelMembersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const result = await fetchStreamChannelMembersCached(
				thunkAPI.getState as () => RootState,
				mezon,
				clanId,
				channelId,
				channelType,
				Boolean(noCache)
			);

			if (!result.fromCache && result.streams.length > 0) {
				const members = result.streams.map((channelRes: IChannelMember) => {
					return {
						userId: channelRes.userId || '',
						clanId,
						streamingChannelId: channelRes.channelId || '',
						clanName: '',
						participant: channelRes.participant || '',
						streamingChannelLabel: '',
						id: channelRes.id || ''
					};
				});

				thunkAPI.dispatch(usersStreamActions.addMany(members));
			}

			return result;
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
			.addCase(fetchStreamChannelMembers.fulfilled, (state: UsersStreamState, action: PayloadAction<FetchStreamChannelMembersResult>) => {
				const { streams, clanId, channelId, channelType, fromCache } = action.payload;

				if (!fromCache) {
					state.streamChannelMember = streams;
					const cacheKey = channelId ? `${clanId}_${channelId}_${channelType}` : `${clanId}_${channelType}`;
					if (!state.streamChannelMembersCache) {
						state.streamChannelMembersCache = {};
					}
					state.streamChannelMembersCache[cacheKey] = createCacheMetadata(STREAM_CHANNEL_MEMBERS_CACHED_TIME);
				}

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
