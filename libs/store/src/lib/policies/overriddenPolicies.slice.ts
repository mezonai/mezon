import { captureSentryError } from '@mezon/logger';
import type { EOverriddenPermission } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import isEqual from 'lodash.isequal';
import type { ApiPermission } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const OVERRIDDEN_POLICIES_FEATURE_KEY = 'overriddenPolicies';

export interface ChannelPermission {
	channelId: string;
	maxPermissions: Record<EOverriddenPermission, ApiPermission>;
}

interface ChannelPermissionCache {
	channelPermission?: ChannelPermission | null;
	cache?: CacheMetadata;
	permissionVersion?: number;
}

export type OverriddenPermissionState = {
	channelPermissions: EntityState<ChannelPermission, string>;
	byChannels: Record<string, ChannelPermissionCache>;
};

const overriddenPermissionAdapter = createEntityAdapter({
	selectId: (overriddenPolicy: ChannelPermission) => overriddenPolicy.channelId
});

const getInitialChannelState = (): ChannelPermissionCache => ({
	channelPermission: null
});

const initialState: OverriddenPermissionState = {
	channelPermissions: overriddenPermissionAdapter.getInitialState(),
	byChannels: {}
};

interface UpdateChannelPermissionsPayload {
	channelId: string;
	permissions: Array<{
		id: string;
		slug: EOverriddenPermission;
		active: number;
	}>;
}

const overriddenPoliciesSlice = createSlice({
	name: OVERRIDDEN_POLICIES_FEATURE_KEY,
	initialState,
	reducers: {
		updateChannelPermissions: (state, action: PayloadAction<UpdateChannelPermissionsPayload>) => {
			const { channelId, permissions } = action.payload;
			const channelData = (state.byChannels[channelId] ??= getInitialChannelState());
			const maxPermissions = { ...channelData.channelPermission?.maxPermissions } as ChannelPermission['maxPermissions'];
			for (const permission of permissions) {
				if (permission.slug) maxPermissions[permission.slug] = permission;
			}

			const channelPermission: ChannelPermission = {
				channelId,
				maxPermissions
			};

			overriddenPermissionAdapter.upsertOne(state.channelPermissions, channelPermission);

			channelData.channelPermission = channelPermission;
			channelData.cache = createCacheMetadata();
			channelData.permissionVersion = (channelData.permissionVersion ?? 0) + 1;
		}
	},
	extraReducers: (builder) => {
		builder.addCase(fetchMaxChannelPermission.fulfilled, (state, action) => {
			const { channelId, fromCache, channelPermission, permissionVersion } = action.payload;

			if (fromCache) return;
			const channelData = (state.byChannels[channelId] ??= getInitialChannelState());
			if (permissionVersion !== (channelData.permissionVersion ?? 0)) return;
			if (!isEqual(channelData.channelPermission?.maxPermissions, channelPermission.maxPermissions)) {
				overriddenPermissionAdapter.upsertOne(state.channelPermissions, channelPermission);
				channelData.channelPermission = channelPermission;
			}
			channelData.cache = createCacheMetadata();
		});
	}
});

// ============== Public APIs ============
interface FetchMaxPermissionChannelsArgs {
	channelId: string;
	clanId: string;
	noCache?: boolean;
}

export const fetchMaxChannelPermissionCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	clanId: string,
	channelId: string,
	noCache = false
) => {
	const currentState = getState();
	const overriddenPoliciesState = currentState[OVERRIDDEN_POLICIES_FEATURE_KEY];
	const channelData = overriddenPoliciesState.byChannels[channelId] || getInitialChannelState();

	const apiKey = createApiKey('fetchMaxChannelPermission', channelId, clanId, mezon.session?.token || currentState.auth?.session?.token || '');

	const shouldForceCall = shouldForceApiCall(apiKey, channelData.cache, noCache);

	if (!shouldForceCall && channelData.channelPermission) {
		return {
			...channelData.channelPermission,
			fromCache: true,
			time: channelData.cache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		mezon,
		{
			api_name: 'ListUserPermissionInChannel',
			user_permission_req: {
				channel_id: channelId,
				clan_id: clanId
			}
		},
		(session) => mezon.client.listUserPermissionInChannel(session, clanId || '0', channelId || '0'),
		'user_permission_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

interface FetchMaxPermissionResult {
	channelId: string;
	permissionVersion: number;
	channelPermission: ChannelPermission;
	fromCache: boolean;
}

const pendingPermissionRequests = new Map<string, Promise<FetchMaxPermissionResult>>();

export const fetchMaxChannelPermission = createAsyncThunk<FetchMaxPermissionResult, FetchMaxPermissionChannelsArgs>(
	`${OVERRIDDEN_POLICIES_FEATURE_KEY}/fetchMaxPermissionRoleChannel`,
	async ({ clanId, channelId, noCache }, thunkAPI) => {
		const requestKey = `${clanId}:${channelId}`;
		let request = pendingPermissionRequests.get(requestKey);
		if (!request) {
			const permissionVersion =
				(thunkAPI.getState() as RootState)[OVERRIDDEN_POLICIES_FEATURE_KEY].byChannels[channelId]?.permissionVersion ?? 0;
			request = (async (): Promise<FetchMaxPermissionResult> => {
				const mezon = await ensureSession(getMezonCtx(thunkAPI));
				const response = await fetchMaxChannelPermissionCached(
					thunkAPI.getState as () => RootState,
					mezon,
					clanId,
					channelId,
					Boolean(noCache)
				);
				if (!response) throw new Error('Invalid fetchMaxChannelPermission response');
				let channelPermission: ChannelPermission;
				if (response.fromCache) {
					channelPermission = response as ChannelPermission;
				} else if ('permissions' in response && response.permissions?.permissions) {
					const maxPermissions = {} as ChannelPermission['maxPermissions'];
					for (const permission of response.permissions.permissions as ApiPermission[]) {
						if (permission.slug) maxPermissions[permission.slug as EOverriddenPermission] = permission;
					}
					channelPermission = { channelId, maxPermissions };
				} else {
					throw new Error('Invalid fetchMaxChannelPermission response');
				}
				return { channelId, permissionVersion, channelPermission, fromCache: response.fromCache };
			})();
			pendingPermissionRequests.set(requestKey, request);
		}
		try {
			return await request;
		} catch (error) {
			captureSentryError(error, 'overriddenPolicies/fetchMaxChannelPermission');
			return thunkAPI.rejectWithValue(error instanceof Error ? error.message : error);
		} finally {
			if (pendingPermissionRequests.get(requestKey) === request) pendingPermissionRequests.delete(requestKey);
		}
	}
);

export const overriddenPoliciesReducer = overriddenPoliciesSlice.reducer;

export const overriddenPoliciesActions = {
	...overriddenPoliciesSlice.actions,
	fetchMaxChannelPermission
};

export const selectOverriddenPoliciesState = (state: { [OVERRIDDEN_POLICIES_FEATURE_KEY]: OverriddenPermissionState }) =>
	state[OVERRIDDEN_POLICIES_FEATURE_KEY];

const maxChannelPermissionsAdapters = overriddenPermissionAdapter.getSelectors();

export const selectAllChannelsWithMaxPermissionEntities = createSelector(selectOverriddenPoliciesState, (state) =>
	maxChannelPermissionsAdapters.selectEntities(state?.channelPermissions)
);

export const selectMaxPermissionForChannel = createSelector(
	[selectOverriddenPoliciesState, (_: RootState, channelId: string) => channelId],
	(state, channelId) => {
		const channelPermissions = state?.byChannels[channelId]?.channelPermission?.maxPermissions;
		const permissionsMap = {} as Record<EOverriddenPermission, boolean>;

		if (channelPermissions) {
			for (const permission in channelPermissions) {
				const isActive = Boolean(channelPermissions[permission as EOverriddenPermission]?.active);
				permissionsMap[permission as EOverriddenPermission] = isActive;
			}
		}

		return permissionsMap;
	}
);
