import type { IPermissionRoleChannel, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import type { ApiPermissionRoleChannel, ApiPermissionUpdate } from 'mezon-js/api.gen';
import type { ApiPermissionRoleChannelListEventResponse } from 'mezon-js/dist/api.gen';
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

export interface PermissionRoleChannelState extends EntityState<PermissionRoleChannelsEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	permission: ApiPermissionRoleChannelListEventResponse | null;
	cacheByChannels: Record<
		string,
		{
			permissionRoleChannel?: ApiPermissionRoleChannelListEventResponse | null;
			cache?: CacheMetadata;
		}
	>;
}

export const permissionRoleChannelAdapter = createEntityAdapter<PermissionRoleChannelsEntity>();

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
			...channelData.permissionRoleChannel,
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
		if (!response || !response?.permission_role_channel) {
			return [];
		}

		const updatedPermissionRoleChannel = response.permission_role_channel.map((channel) => {
			if (channel.permission_id && channel.active === undefined) {
				return { ...channel, active: false };
			}
			return channel;
		});
		return { ...response, permission_role_channel: updatedPermissionRoleChannel, fromCache: response?.fromCache };
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
				channel_id: channelId,
				role_id: roleId,
				permission_update: permission,
				max_permission_id: maxPermissionId,
				user_id: userId
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
		add: permissionRoleChannelAdapter.addOne,
		removeAll: permissionRoleChannelAdapter.removeAll,
		remove: permissionRoleChannelAdapter.removeOne,
		update: permissionRoleChannelAdapter.updateOne,
		updatePermission: (state, action: PayloadAction<{ roleId: string; channelId: string; permissionRole?: ApiPermissionUpdate[] }>) => {
			const { roleId, channelId, permissionRole } = action.payload;
			let permission;
			if (typeof state.permission === 'string') {
				permission = safeJSONParse(state.permission);
			} else {
				permission = state.permission;
			}

			if (permission && permission.role_id === roleId && permission.channel_id === channelId) {
				permission.permission_role_channel = permissionRole;
			}

			if (state.cacheByChannels[channelId]?.permissionRoleChannel) {
				const channelPermission = state.cacheByChannels[channelId].permissionRoleChannel;
				if (channelPermission && channelPermission.role_id === roleId && channelPermission.channel_id === channelId) {
					channelPermission.permission_role_channel = permissionRole;
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
				const { channel_id, fromCache } = action.payload;

				if (!state.cacheByChannels[channel_id]) {
					state.cacheByChannels[channel_id] = getInitialChannelState();
				}

				if (!fromCache) {
					state.cacheByChannels[channel_id].permissionRoleChannel = action.payload;
					state.cacheByChannels[channel_id].cache = createCacheMetadata();
				}
				state.permission = action.payload;
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
						permission_id: role.permission_id
					}));
				state.cacheByChannels[channelId] = {
					permissionRoleChannel: {
						role_id: roleId,
						user_id: userId,
						channel_id: channelId,
						permission_role_channel: listUpdate
					},
					cache: createCacheMetadata()
				};
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

export const selectAllPermissionRoleChannel = createSelector(
	[getPermissionRoleChannelState, (state: RootState, channelId: string, roleId?: string, userId?: string) => ({ channelId, roleId, userId })],
	(state, { channelId, roleId, userId }) => {
		if (!roleId && !userId) {
			return state.permission;
		}
		const currentPermission = state.cacheByChannels[channelId]?.permissionRoleChannel || state.permission;

		if (currentPermission) {
			const isMatchingRole = roleId && currentPermission.role_id === roleId;
			const isMatchingUser = userId && currentPermission.user_id === userId;

			if (isMatchingRole || isMatchingUser) {
				return currentPermission;
			}
		}
		return null;
	}
);
