import type { IPermissionRoleChannel, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiPermissionRoleChannel, ApiPermissionRoleChannelListEventResponse, ApiPermissionUpdate } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
import type { RootState } from '../store';

export const LIST_PERMISSION_ROLE_CHANNEL_FEATURE_KEY = 'listpermissionroleschannel';

/*
 * Update these interfaces according to your requirements.
 */
export interface PermissionRoleChannelsEntity extends IPermissionRoleChannel {
	id: string; // Primary ID
}

export interface PermissionRoleChannelState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	cacheByChannels: Record<
		string,
		{
			permissionRoleChannel: EntityState<ApiPermissionRoleChannelListEventResponse, string>;
			cache?: CacheMetadata;
		}
	>;
}

export const permissionRoleChannelAdapter = createEntityAdapter({
	selectId: (permission: ApiPermissionRoleChannelListEventResponse) => permission.userId || permission.roleId || ''
});

type fetchChannelsArgs = {
	roleId: string;
	channelId: string;
	userId: string;
	noCache?: boolean;
};

const getInitialChannelState = () => ({
	permissionRoleChannel: null
});

export const fetchPermissionRoleChannelCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	roleId: string,
	channelId: string,
	userId: string,
	noCache = false
) => {
	const state = getState();
	const permissionRoleChannelState = state[LIST_PERMISSION_ROLE_CHANNEL_FEATURE_KEY];
	const channelData = permissionRoleChannelState.cacheByChannels[channelId] || getInitialChannelState();

	const apiKey = createApiKey('fetchPermissionRoleChannel', channelId, roleId, userId);
	const shouldForceCall = shouldForceApiCall(apiKey, channelData.cache, noCache);

	if (!shouldForceCall) {
		return {
			...channelData.permissionRoleChannel.entities[roleId || userId],
			fromCache: true,
			time: channelData.cache?.lastFetched || Date.now()
		};
	}

	const response = await withRetry(() => ensuredMezon.client.getPermissionByRoleIdChannelId(ensuredMezon.session, roleId, channelId, userId), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'channel-permissions'
	});

	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

export const fetchPermissionRoleChannel = createAsyncThunk(
	'permissionrolechannel/fetchPermissionRoleChannel',
	async ({ roleId, channelId, userId, noCache }: fetchChannelsArgs, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await fetchPermissionRoleChannelCached(thunkAPI.getState as () => RootState, mezon, roleId, channelId, userId, noCache);
		if (!response || !response?.permissionRoleChannel) {
			return [];
		}

		const updatedPermissionRoleChannel = response.permissionRoleChannel.map((channel) => {
			if (channel.permissionId && channel.active === undefined) {
				return { ...channel, active: false };
			}
			return channel;
		});
		return { ...response, permissionRoleChannel: updatedPermissionRoleChannel, fromCache: response?.fromCache };
	}
);

export type SetPermissionRoleChannel = {
	channelId: string;
	roleId: string;
	permission: Array<ApiPermissionUpdate>;
	maxPermissionId: string;
	userId: string;
	clanId: string;
};

export const setPermissionRoleChannel = createAsyncThunk(
	'permissionrolechannel/setPermissionRoleChannel',
	async ({ channelId, roleId, permission, maxPermissionId, userId, clanId }: SetPermissionRoleChannel, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				channelId: channelId,
				roleId: roleId,
				permissionUpdate: permission,
				maxPermissionId: maxPermissionId,
				userId: userId
			};
			const response = await mezon.client.setRoleChannelPermission(mezon.session, body);
			if (response) {
				return {
					userId,
					permission,
					roleId,
					channelId
				};
			}
			return null;
		} catch (error) {
			return thunkAPI.rejectWithValue([]);
		}
	}
);

export const initialPermissionRoleChannelState: PermissionRoleChannelState = permissionRoleChannelAdapter.getInitialState({
	loadingStatus: 'not loaded',
	channelPermissions: [],
	error: null,
	permission: null,
	cacheByChannels: {}
});

export const permissionRoleChannelSlice = createSlice({
	name: LIST_PERMISSION_ROLE_CHANNEL_FEATURE_KEY,
	initialState: initialPermissionRoleChannelState,
	reducers: {
		updatePermission: (state, action: PayloadAction<{ roleId: string; channelId: string; permissionRole?: ApiPermissionUpdate[] }>) => {
			const { roleId, channelId, permissionRole } = action.payload;

			if (state.cacheByChannels[channelId]?.permissionRoleChannel) {
				const channelPermission = state.cacheByChannels[channelId]?.permissionRoleChannel;
				if (!state.cacheByChannels?.[channelId]?.permissionRoleChannel) {
					state.cacheByChannels[channelId].permissionRoleChannel = permissionRoleChannelAdapter.getInitialState();
				}
				if (channelPermission && channelPermission.entities[roleId]) {
					permissionRoleChannelAdapter.updateOne(channelPermission, {
						id: roleId,
						changes: {
							permissionRoleChannel: permissionRole
						}
					});
				}
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPermissionRoleChannel.pending, (state: PermissionRoleChannelState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchPermissionRoleChannel.fulfilled, (state: PermissionRoleChannelState, action: PayloadAction<any>) => {
				const { channelId, fromCache } = action.payload;

				if (!state.cacheByChannels[channelId]) {
					state.cacheByChannels[channelId] = {
						permissionRoleChannel: permissionRoleChannelAdapter.getInitialState()
					};
				}

				if (!fromCache) {
					state.cacheByChannels[channelId].permissionRoleChannel = permissionRoleChannelAdapter.addOne(
						state.cacheByChannels[channelId].permissionRoleChannel,
						action.payload
					);

					state.cacheByChannels[channelId].cache = createCacheMetadata();
				}
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchPermissionRoleChannel.rejected, (state: PermissionRoleChannelState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(setPermissionRoleChannel.fulfilled, (state: PermissionRoleChannelState, action) => {
				if (!action.payload) {
					return;
				}
				const { userId, roleId, permission, channelId } = action.payload;

				const listUpdate: ApiPermissionRoleChannel[] = permission
					.filter((item) => item.type)
					.map((role) => ({
						active: role.type === 1 ? true : false,
						permissionId: role.permissionId
					}));
				if (state.cacheByChannels[channelId]?.permissionRoleChannel) {
					permissionRoleChannelAdapter.upsertOne(state.cacheByChannels[channelId]?.permissionRoleChannel, {
						roleId: roleId,
						userId: userId,
						channelId: channelId,
						permissionRoleChannel: listUpdate
					});
				}
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const permissionRoleChannelReducer = permissionRoleChannelSlice.reducer;

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

export const permissionRoleChannelActions = {
	...permissionRoleChannelSlice.actions,
	fetchPermissionRoleChannel,
	// fetchMaxPermissionRoleChannel,
	setPermissionRoleChannel
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

export const getPermissionRoleChannelState = (rootState: {
	[LIST_PERMISSION_ROLE_CHANNEL_FEATURE_KEY]: PermissionRoleChannelState;
}): PermissionRoleChannelState => rootState[LIST_PERMISSION_ROLE_CHANNEL_FEATURE_KEY];

const { selectById } = permissionRoleChannelAdapter.getSelectors();
export const selectAllPermissionRoleChannel = createSelector(
	[getPermissionRoleChannelState, (state: RootState, channelId: string, roleId?: string, userId?: string) => ({ channelId, roleId, userId })],
	(state, { channelId, roleId, userId }) => {
		if (!state.cacheByChannels?.[channelId]?.permissionRoleChannel) return null;
		const idSelect = userId ?? roleId;
		if (idSelect == null) return null;
		const currentPermission = selectById(state.cacheByChannels[channelId]?.permissionRoleChannel, idSelect);
		return currentPermission ?? null;
	}
);
