import { captureSentryError } from '@mezon/logger';
import type { EOverriddenPermission } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiPermission } from 'mezon-js/api.gen';
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

export type OverriddenPermissionState = {
	channelPermissions: EntityState<ChannelPermission, string>;
	byChannels: Record<
		string,
		{
			channelPermission?: ChannelPermission | null;
			cache?: CacheMetadata;
		}
	>;
};

const overriddenPermissionAdapter = createEntityAdapter({
	selectId: (overriddenPolicy: ChannelPermission) => overriddenPolicy.channelId
});

const getInitialChannelState = () => ({
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
			const maxPermissions = permissions.reduce<Record<EOverriddenPermission, ApiPermission>>(
				(acc, perm) => {
					if (perm.slug) {
						acc[perm.slug] = {
							id: perm.id,
							slug: perm.slug,
							active: perm.active
						};
					}
					return acc;
				},
				{} as Record<EOverriddenPermission, ApiPermission>
			);

			const channelPermission: ChannelPermission = {
				channelId,
				maxPermissions
			};

			overriddenPermissionAdapter.upsertOne(state.channelPermissions, channelPermission);

			if (!state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}
			state.byChannels[channelId].channelPermission = channelPermission;
			state.byChannels[channelId].cache = createCacheMetadata();
		}
	},
	extraReducers: (builder) => {
		builder.addCase(fetchMaxChannelPermission.fulfilled, (state, action) => {
			const { channelId, fromCache, channelPermission } = action.payload;

			if (!state.byChannels[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}

			if (!fromCache && channelPermission && 'maxPermissions' in channelPermission) {
				overriddenPermissionAdapter.upsertOne(state.channelPermissions, channelPermission);
				state.byChannels[channelId].channelPermission = channelPermission;
				state.byChannels[channelId].cache = createCacheMetadata();
			}
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

	const apiKey = createApiKey('fetchMaxChannelPermission', channelId, clanId, mezon.session.username || '');

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
		() => mezon.client.listUserPermissionInChannel(mezon.session, clanId, channelId),
		'user_permission_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

const pendingPermissionRequests = new Map<string, Promise<any>>();

export const fetchMaxChannelPermission = createAsyncThunk(
	`${OVERRIDDEN_POLICIES_FEATURE_KEY}/fetchMaxPermissionRoleChannel`,
	async ({ clanId, channelId, noCache }: FetchMaxPermissionChannelsArgs, thunkAPI) => {
		const requestKey = `${clanId}:${channelId}`;
		const pendingRequest = pendingPermissionRequests.get(requestKey);
		if (pendingRequest) {
			try {
				return await pendingRequest;
			} catch (error) {
				//
			}
		}
		const requestPromise = (async () => {
			try {
				const mezon = await ensureSession(getMezonCtx(thunkAPI));
				const response = await fetchMaxChannelPermissionCached(
					thunkAPI.getState as () => RootState,
					mezon,
					clanId,
					channelId,
					Boolean(noCache)
				);

				if (!response) {
					return thunkAPI.rejectWithValue('Invalid fetchMaxChannelPermission');
				}

				if (response.fromCache) {
					return {
						channelId,
						channelPermission: response as ChannelPermission,
						fromCache: true
					};
				}

				if (response && 'permissions' in response && response.permissions?.permissions) {
					const channelPermission: ChannelPermission = {
						channelId,
						maxPermissions: (response.permissions.permissions as ApiPermission[]).reduce(
							(acc: Record<EOverriddenPermission, ApiPermission>, perm: ApiPermission) => {
								if (perm.slug) {
									acc[perm.slug as EOverriddenPermission] = perm;
								}
								return acc;
							},
							{} as Record<EOverriddenPermission, ApiPermission>
						)
					};

					return {
						channelId,
						channelPermission,
						fromCache: false
					};
				}
				return thunkAPI.rejectWithValue(null);
			} catch (error) {
				captureSentryError(error, 'overriddenPolicies/fetchMaxChannelPermission');
				return thunkAPI.rejectWithValue(error);
			} finally {
				pendingPermissionRequests.delete(requestKey);
			}
		})();

		pendingPermissionRequests.set(requestKey, requestPromise);

		return requestPromise;
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
