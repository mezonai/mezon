import { captureSentryError } from '@mezon/logger';
import type { IChannelMember, IUserStream, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiStreamingChannelUser, ChannelType } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const USERS_STREAM_FEATURE_KEY = 'usersstream';

// One user can be a speaker/audience in multiple stream channels at once (cross-clan).
// Entity id must include the channel or join B overwrites join A and leave A wipes B.
export const streamMemberEntityId = (userId?: string | null, channelId?: string | null) => `${userId || ''}:${channelId || ''}`;

const streamPublisherOf = <T extends { is_publisher?: boolean }>(members: T[]) => members.find((member) => member.is_publisher) ?? members[0];

/*
 * Update these interfaces according to your requirements.
 */
export interface UsersStreamEntity extends IUserStream {
	id: string; // Primary ID
	user_avatar: string;
	user_name: string;
}

export interface UsersStreamState extends EntityState<UsersStreamEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	streamChannelMember: IChannelMember[];
	cacheByClans: Record<string, CacheMetadata>;
	presenceRevisionByClan: Record<string, number>;
}

export const userStreamAdapter = createEntityAdapter({
	selectId: (user: UsersStreamEntity) => streamMemberEntityId(user.user_id, user.streaming_channel_id)
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
	presenceRevision: number;
};

const selectCachedStreamMembers = createSelector(
	[(state: RootState) => state[USERS_STREAM_FEATURE_KEY], (_: RootState, clanId: string) => clanId],
	(streamState, clanId) => {
		const entities = selectAllUsersStreamEntities(streamState).filter((entity) => entity.clan_id === clanId);
		return entities.map(
			(entity): ApiStreamingChannelUser => ({
				user_id: entity.user_id,
				channel_id: entity.streaming_channel_id,
				participant: entity.participant,
				id: entity.id,
				is_publisher: entity.is_publisher
			})
		);
	}
);

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
	const shouldForceCall = shouldForceApiCall(apiKey, streamState?.cacheByClans?.[clanId], noCache);

	if (!shouldForceCall) {
		const streamMembers = selectCachedStreamMembers(state, clanId);
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
			const revisionOf = () => (thunkAPI.getState() as RootState)[USERS_STREAM_FEATURE_KEY].presenceRevisionByClan[clanId] ?? 0;
			for (let attempt = 0; attempt < 3; attempt++) {
				const presenceRevision = revisionOf();
				const response = await fetchStreamChannelMembersCached(
					thunkAPI.getState as () => RootState,
					mezon,
					clanId,
					channelId,
					channelType,
					noCache || attempt > 0
				);
				if (revisionOf() !== presenceRevision) continue;
				const payload: FetchStreamChannelMembersResponse = {
					streams: response.streaming_channel_users ?? [],
					fromCache: response.fromCache,
					presenceRevision
				};
				return payload;
			}
			throw new Error('Stream presence changed during snapshot refresh');
		} catch (error) {
			captureSentryError(error, 'stream/fetchStreamChannelMembers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialUsersStreamState: UsersStreamState = userStreamAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	streamChannelMember: [],
	cacheByClans: {},
	presenceRevisionByClan: {}
});

export const usersStreamSlice = createSlice({
	name: USERS_STREAM_FEATURE_KEY,
	initialState: initialUsersStreamState,
	reducers: {
		add: (state, action: PayloadAction<UsersStreamEntity>) => {
			const { clan_id, user_id, streaming_channel_id, is_publisher } = action.payload;
			if (!state.entities[streamMemberEntityId(user_id, streaming_channel_id)]?.is_publisher || is_publisher) {
				userStreamAdapter.setOne(state, action.payload);
			}
			state.presenceRevisionByClan[clan_id] = (state.presenceRevisionByClan[clan_id] ?? 0) + 1;
		},
		leave: (state, action: PayloadAction<{ userId: string; channelId: string; clanId: string }>) => {
			const { userId, channelId, clanId } = action.payload;
			const members = state.ids.map((id) => state.entities[id]).filter((member) => member.streaming_channel_id === channelId);
			if (streamPublisherOf(members)?.user_id === userId) {
				userStreamAdapter.removeMany(
					state,
					members.map((member) => streamMemberEntityId(member.user_id, member.streaming_channel_id))
				);
			} else {
				userStreamAdapter.removeOne(state, streamMemberEntityId(userId, channelId));
			}
			state.presenceRevisionByClan[clanId] = (state.presenceRevisionByClan[clanId] ?? 0) + 1;
		}
		// ...
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchStreamChannelMembers.pending, (state: UsersStreamState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchStreamChannelMembers.fulfilled, (state: UsersStreamState, action) => {
				const { streams, fromCache, presenceRevision } = action.payload;
				state.loadingStatus = 'loaded';

				if (fromCache) return;

				const { clanId } = action.meta.arg;
				const members = streams.map((stream) => {
					const channelId = stream.channel_id || '0';
					const known = state.entities[streamMemberEntityId(stream.user_id, channelId)];
					return {
						user_id: stream.user_id || '',
						clan_id: clanId,
						streaming_channel_id: channelId,
						clan_name: '',
						participant: stream.participant || '',
						streaming_channel_label: '',
						id: stream.id || '',
						user_name: stream.participant || known?.user_name || '',
						user_avatar: known?.user_avatar || '',
						is_publisher: stream.is_publisher
					};
				});
				if (presenceRevision === (state.presenceRevisionByClan[clanId] ?? 0)) {
					const liveIds = new Set(members.map((member) => streamMemberEntityId(member.user_id, member.streaming_channel_id)));
					const staleIds = state.ids.filter((id) => state.entities[id].clan_id === clanId && !liveIds.has(id));
					userStreamAdapter.removeMany(state, staleIds);
				}
				userStreamAdapter.setMany(state, members);

				state.streamChannelMember = streams.map((stream) => ({
					id: stream.id || '',
					user_id: stream.user_id,
					participant: stream.participant
				}));
				state.cacheByClans[clanId] = createCacheMetadata();
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
	const listStreamChannelUser = entities.filter((member) => member && member.streaming_channel_id === channelId);
	const publisher = streamPublisherOf(listStreamChannelUser);
	return publisher ? [publisher, ...listStreamChannelUser.filter((member) => member !== publisher)] : listStreamChannelUser;
});

export const selectStreamViewerCount = createSelector([selectStreamMembersByChannelId], (members) => Math.max(0, members.length - 1));
