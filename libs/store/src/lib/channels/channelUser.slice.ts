import { captureSentryError } from '@mezon/logger';
import type { IChannel, IChannelUser, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelDescription } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';

export const LIST_CHANNELS_USER_FEATURE_KEY = 'listchannelbyusers';

interface RootState {
	[LIST_CHANNELS_USER_FEATURE_KEY]: ListChannelsByUserState;
}

/*
 * Update these interfaces according to your requirements.
 */
export interface ChannelUsersEntity extends IChannelUser {
	id: string; // Primary ID
}

export const mapChannelsByUserToEntity = (channelRes: ChannelDescription) => {
	return { ...channelRes, id: channelRes.channel_id || '0', status: channelRes.channel_id ? 1 : 0 };
};

export interface ListChannelsByUserState extends EntityState<ChannelUsersEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	cache?: CacheMetadata;
	channelDetails: Record<string, IChannel | null>;
}

export const listChannelsByUserAdapter = createEntityAdapter({
	selectId: (channelByUser: ChannelUsersEntity) => channelByUser.id
});

export interface ListChannelsByUserRootState {
	[LIST_CHANNELS_USER_FEATURE_KEY]: ListChannelsByUserState;
}

const selectAllChannelsByUserEntities = listChannelsByUserAdapter.getSelectors().selectAll;

const selectCachedChannelsByUser = createSelector([(state: RootState) => state[LIST_CHANNELS_USER_FEATURE_KEY]], (channelsByUserState) => {
	return selectAllChannelsByUserEntities(channelsByUserState);
});

export const fetchListChannelsByUserCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, noCache = false) => {
	const currentState = getState();
	const channelsByUserState = currentState[LIST_CHANNELS_USER_FEATURE_KEY];

	const apiKey = createApiKey('fetchChannelsByUser', ensuredMezon.session?.token || '');

	const shouldForceCall = shouldForceApiCall(apiKey, channelsByUserState?.cache, noCache);

	if (!shouldForceCall) {
		const channels = selectCachedChannelsByUser(currentState);
		return {
			channeldesc: channels,
			time: Date.now(),
			fromCache: true
		};
	}

	const response = await withRetry((session) => ensuredMezon.client.listChannelByUserId(session), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'user-channels',
		mezon: ensuredMezon
	});

	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

type fetchUserChannelsPayload = {
	noCache?: boolean;
	isClearChannel?: boolean;
};

type FetchMessagesPayloadAction = {
	channels: ChannelUsersEntity[];
	isClearChannel?: boolean;
	fromCache: boolean;
};

export const fetchListChannelsByUser = createAsyncThunk<
	{ channels: ChannelUsersEntity[]; isClearChannel: boolean; fromCache: boolean },
	fetchUserChannelsPayload
>('channelsByUser/fetchListChannelsByUser', async ({ noCache = false, isClearChannel = false }: fetchUserChannelsPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchListChannelsByUserCached(thunkAPI.getState as () => RootState, mezon, noCache);
		if (!response?.channeldesc) {
			return { channels: [], isClearChannel, fromCache: response?.fromCache || false };
		}

		const channels = response.channeldesc.map(mapChannelsByUserToEntity);

		return { channels, isClearChannel, fromCache: response.fromCache };
	} catch (error) {
		captureSentryError(error, 'channelsByUser/fetchListChannelsByUser');
		return thunkAPI.rejectWithValue(error);
	}
});

const channelDetailsInFlight = new Set<string>();
const CHANNEL_DETAIL_MAX_CONCURRENT = 2;
const CHANNEL_DETAIL_MAX_PER_MINUTE = 10;
const CHANNEL_DETAIL_WINDOW_MS = 60_000;
const channelDetailStarts: number[] = [];
const channelDetailWaiting: Array<() => void> = [];
let channelDetailRunning = 0;
let channelDetailTimer: ReturnType<typeof setTimeout> | undefined;

const pumpChannelDetailQueue = () => {
	const now = Date.now();
	while (channelDetailStarts.length && now - channelDetailStarts[0] >= CHANNEL_DETAIL_WINDOW_MS) {
		channelDetailStarts.shift();
	}
	while (
		channelDetailWaiting.length &&
		channelDetailRunning < CHANNEL_DETAIL_MAX_CONCURRENT &&
		channelDetailStarts.length < CHANNEL_DETAIL_MAX_PER_MINUTE
	) {
		channelDetailRunning += 1;
		channelDetailStarts.push(now);
		channelDetailWaiting.shift()?.();
	}
	if (channelDetailWaiting.length && channelDetailStarts.length >= CHANNEL_DETAIL_MAX_PER_MINUTE && !channelDetailTimer) {
		channelDetailTimer = setTimeout(
			() => {
				channelDetailTimer = undefined;
				pumpChannelDetailQueue();
			},
			channelDetailStarts[0] + CHANNEL_DETAIL_WINDOW_MS - now
		);
	}
};

const withChannelDetailSlot = async <T>(request: () => Promise<T>): Promise<T> => {
	await new Promise<void>((resolve) => {
		channelDetailWaiting.push(resolve);
		pumpChannelDetailQueue();
	});
	try {
		return await request();
	} finally {
		channelDetailRunning -= 1;
		pumpChannelDetailQueue();
	}
};

const isServerRejection = (error: unknown) => typeof (error as { code?: unknown })?.code === 'number';

const channelDetailListeners = new Map<string, Set<() => void>>();

export const subscribeChannelDetail = (channelId: string, listener: () => void) => {
	const listeners = channelDetailListeners.get(channelId) ?? new Set<() => void>();
	listeners.add(listener);
	channelDetailListeners.set(channelId, listeners);
	return () => {
		listeners.delete(listener);
		if (!listeners.size) channelDetailListeners.delete(channelId);
	};
};

export const fetchChannelDetail = createAsyncThunk(
	'channelsByUser/fetchChannelDetail',
	async ({ channelId }: { channelId: string }, thunkAPI) => {
		channelDetailsInFlight.add(channelId);
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const sessionToken = mezon.sessionRef.current?.token;
			let detail: IChannel | null = null;
			try {
				const response = await withChannelDetailSlot(() =>
					withRetry((session) => mezon.client.listChannelDetail(session, channelId), { mezon })
				);
				detail = response?.channel_id ? { ...response, id: response.channel_id } : null;
			} catch (error) {
				if (!isServerRejection(error)) {
					return thunkAPI.rejectWithValue(error);
				}
			}
			if (getMezonCtx(thunkAPI).sessionRef.current?.token !== sessionToken) {
				return thunkAPI.rejectWithValue('session changed');
			}
			thunkAPI.dispatch(listChannelsByUserSlice.actions.setChannelDetail({ channelId, detail }));
			channelDetailListeners.get(channelId)?.forEach((listener) => listener());
			return detail;
		} catch (error) {
			return thunkAPI.rejectWithValue(error);
		} finally {
			channelDetailsInFlight.delete(channelId);
		}
	},
	{
		condition: ({ channelId }, { getState }) =>
			!channelDetailsInFlight.has(channelId) && !(channelId in (getState() as RootState)[LIST_CHANNELS_USER_FEATURE_KEY].channelDetails)
	}
);

export const initialListChannelsByUserState: ListChannelsByUserState = listChannelsByUserAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	cache: undefined,
	channelDetails: {}
});

export const listChannelsByUserSlice = createSlice({
	name: LIST_CHANNELS_USER_FEATURE_KEY,
	initialState: initialListChannelsByUserState,
	reducers: {
		add: listChannelsByUserAdapter.addOne,
		removeAll: (state) => {
			listChannelsByUserAdapter.removeAll(state);
			state.channelDetails = {};
		},
		setChannelDetail: (state, action: PayloadAction<{ channelId: string; detail: IChannel | null }>) => {
			state.channelDetails[action.payload.channelId] = action.payload.detail;
		},
		remove: listChannelsByUserAdapter.removeOne,
		update: listChannelsByUserAdapter.updateOne,
		upsertOne: listChannelsByUserAdapter.upsertOne,
		upsertMany: listChannelsByUserAdapter.upsertMany,
		removeByClanId: (state, action: PayloadAction<{ clanId: string }>) => {
			const channels = listChannelsByUserAdapter.getSelectors().selectAll(state);
			const channelsToRemove = channels.filter((channel) => channel.clan_id === action.payload.clanId).map((channel) => channel.id);
			listChannelsByUserAdapter.removeMany(state, channelsToRemove);
		},
		updateLastSentTime: (state, action: PayloadAction<{ channelId: string }>) => {
			const payload = action.payload;
			const timestamp = Math.floor(Date.now() / 1000);
			listChannelsByUserAdapter.updateOne(state, {
				id: payload.channelId,
				changes: {
					last_sent_message: {
						timestamp_seconds: timestamp
					}
				}
			});
		},
		updateLastSeenTime: (state, action: PayloadAction<{ channelId: string }>) => {
			const payload = action.payload;
			const timestamp = Math.floor(Date.now() / 1000);
			listChannelsByUserAdapter.updateOne(state, {
				id: payload.channelId,
				changes: {
					last_seen_message: {
						timestamp_seconds: timestamp
					}
				}
			});
		},
		resetBadgeCount: (state, action: PayloadAction<{ channelId: string }>) => {
			const payload = action.payload;
			const existingChannel = listChannelsByUserAdapter.getSelectors().selectById(state, payload.channelId);

			if (existingChannel && existingChannel.count_mess_unread !== undefined) {
				listChannelsByUserAdapter.updateOne(state, {
					id: payload.channelId,
					changes: {
						count_mess_unread: undefined
					}
				});
			}
		},

		updateChannelBadgeCount: (state: ListChannelsByUserState, action: PayloadAction<{ channelId: string; count: number; isReset?: boolean }>) => {
			const { channelId, count, isReset = false } = action.payload;
			if (state.entities) {
				const entity = state.entities[channelId];
				if (entity) {
					const newCountMessUnread = isReset ? 0 : Math.max(0, (entity.count_mess_unread ?? 0) + count);
					if (entity.count_mess_unread !== newCountMessUnread || isReset) {
						const last_sent_message = state.entities[state.ids[state.ids.length - 1]]?.last_sent_message;
						listChannelsByUserAdapter.updateOne(state, {
							id: channelId,
							changes: {
								count_mess_unread: newCountMessUnread,
								last_seen_message:
									newCountMessUnread === 0
										? {
												id: last_sent_message?.id,
												timestamp_seconds: Math.floor(Date.now() / 1000)
											}
										: entity.last_seen_message
							}
						});
					}
				}
			}
		},
		addOneChannel: (state, action: PayloadAction<ChannelUsersEntity>) => {
			listChannelsByUserAdapter.addOne(state, action.payload);
		},
		markAsReadChannel: (state, action: PayloadAction<string[]>) => {
			const updateList = action.payload.map((id) => {
				const last_sent_message = state.entities[id]?.last_sent_message;
				return {
					id,
					changes: {
						count_mess_unread: 0,
						last_seen_message: {
							id: last_sent_message?.id,
							timestamp_seconds: Math.floor(Date.now() / 1000)
						}
					}
				};
			});
			listChannelsByUserAdapter.updateMany(state, updateList);
		},

		bulkRemove: (state, action: PayloadAction<string[]>) => {
			listChannelsByUserAdapter.removeMany(state, action.payload);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListChannelsByUser.pending, (state: ListChannelsByUserState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListChannelsByUser.fulfilled, (state: ListChannelsByUserState, action: PayloadAction<FetchMessagesPayloadAction>) => {
				const { channels, isClearChannel, fromCache } = action.payload;
				if (!fromCache) {
					if (isClearChannel) {
						listChannelsByUserAdapter.setAll(state, channels);
					} else {
						listChannelsByUserAdapter.upsertMany(state, channels);
					}
					state.cache = createCacheMetadata();
				}

				state.loadingStatus = 'loaded';
			})
			.addCase(fetchListChannelsByUser.rejected, (state: ListChannelsByUserState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const listchannelsByUserReducer = listChannelsByUserSlice.reducer;

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

export const listChannelsByUserActions = {
	...listChannelsByUserSlice.actions,
	fetchListChannelsByUser,
	fetchChannelDetail
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
const { selectAll, selectEntities, selectById } = listChannelsByUserAdapter.getSelectors();

export const getChannelsByUserState = (rootState: { [LIST_CHANNELS_USER_FEATURE_KEY]: ListChannelsByUserState }): ListChannelsByUserState =>
	rootState[LIST_CHANNELS_USER_FEATURE_KEY];

export const selectAllChannelsByUser = createSelector(getChannelsByUserState, selectAll);
export const selectEntitiesChannelsByUser = createSelector(getChannelsByUserState, selectEntities);
export const selectSearchChannelById = createSelector([getChannelsByUserState, (_, id: string) => id], (state, id) => selectById(state, id));
export const selectChannelDetailById = createSelector(
	[getChannelsByUserState, (_, channelId: string) => channelId],
	(state, channelId) => state.channelDetails[channelId]
);

export const selectAllInfoChannels = createSelector(selectAllChannelsByUser, (channels = []) =>
	channels?.map(({ channel_id, channel_label, channel_private, clan_name, clan_id, type, parent_id, id }) => ({
		channel_id,
		channel_label,
		channel_private,
		clan_name,
		clan_id,
		type,
		parent_id,
		id
	}))
);
