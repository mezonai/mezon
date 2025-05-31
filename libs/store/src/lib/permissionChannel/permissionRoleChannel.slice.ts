import { IPermissionRoleChannel, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import { ApiPermissionUpdate } from 'mezon-js/api.gen';
import { ApiPermissionRoleChannelListEventResponse } from 'mezon-js/dist/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { overriddenPoliciesActions } from '../policies/overriddenPolicies.slice';

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
}

export const permissionRoleChannelAdapter = createEntityAdapter<PermissionRoleChannelsEntity>();

type fetchChannelsArgs = {
	roleId: string;
	channelId: string;
	userId: string;
	noCache?: boolean;
};

export const fetchPermissionRoleChannelCached = memoizeAndTrack(
	async (mezon: MezonValueContext, roleId: string, channelId: string, userId: string) => {
		const response = await mezon.client.getPermissionByRoleIdChannelId(mezon.session, roleId, channelId, userId);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: 1000 * 60 * 60,
		normalizer: (args) => {
			const username = args[0]?.session?.username || '';
			return args[3] + args[2] + args[1] + username;
		}
	}
);

export const fetchPermissionRoleChannel = createAsyncThunk(
	'permissionrolechannel/fetchPermissionRoleChannel',
	async ({ roleId, channelId, userId, noCache }: fetchChannelsArgs, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (noCache) {
			fetchPermissionRoleChannelCached.delete(mezon, roleId, channelId, userId);
		}

		const response = await fetchPermissionRoleChannelCached(mezon, roleId, channelId, userId);
		if (!response || !response.permission_role_channel) {
			return [];
		}

		const updatedPermissionRoleChannel = response.permission_role_channel.map((channel) => {
			if (channel.permission_id && channel.active === undefined) {
				return { ...channel, active: false };
			}
			return channel;
		});
		return { ...response, permission_role_channel: updatedPermissionRoleChannel };
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
				await thunkAPI.dispatch(fetchPermissionRoleChannel({ channelId: channelId, roleId: roleId, userId: userId, noCache: true }));
				thunkAPI.dispatch(overriddenPoliciesActions.fetchMaxChannelPermission({ clanId: clanId, channelId, noCache: true }));
			}
		} catch (error) {
			return thunkAPI.rejectWithValue([]);
		}
	}
);

export const initialPermissionRoleChannelState: PermissionRoleChannelState = permissionRoleChannelAdapter.getInitialState({
	loadingStatus: 'not loaded',
	channelPermissions: [],
	error: null,
	permission: null
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
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPermissionRoleChannel.pending, (state: PermissionRoleChannelState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchPermissionRoleChannel.fulfilled, (state: PermissionRoleChannelState, action: PayloadAction<any>) => {
				state.permission = action.payload;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchPermissionRoleChannel.rejected, (state: PermissionRoleChannelState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
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
const { selectAll, selectEntities } = permissionRoleChannelAdapter.getSelectors();

export const getPermissionRoleChannelState = (rootState: {
	[LIST_PERMISSION_ROLE_CHANNEL_FEATURE_KEY]: PermissionRoleChannelState;
}): PermissionRoleChannelState => rootState[LIST_PERMISSION_ROLE_CHANNEL_FEATURE_KEY];

export const selectPermissionRoleChannelsEntities = createSelector(getPermissionRoleChannelState, selectEntities);

export const selectAllPermissionRoleChannel = createSelector(getPermissionRoleChannelState, (state) => state.permission);
