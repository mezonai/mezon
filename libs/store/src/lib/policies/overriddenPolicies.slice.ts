import { captureSentryError } from '@mezon/logger';
import { EOverriddenPermission } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ApiPermission } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { RootState } from '../store';
export const OVERRIDDEN_POLICIES_FEATURE_KEY = 'overriddenPolicies';
export interface ChannelPermission {
	channelId: string;
	maxPermissions: Record<EOverriddenPermission, ApiPermission>;
}

export type OverriddenPermissionState = {
	channelPermissions: EntityState<ChannelPermission, string>;
};

const overriddenPermissionAdapter = createEntityAdapter({
	selectId: (overriddenPolicy: ChannelPermission) => overriddenPolicy.channelId
});

const initialState: OverriddenPermissionState = {
	channelPermissions: overriddenPermissionAdapter.getInitialState()
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

			overriddenPermissionAdapter.upsertOne(state.channelPermissions, {
				channelId,
				maxPermissions
			});
		}
	},
	extraReducers: (builder) => {
		builder.addCase(fetchMaxChannelPermission.fulfilled, (state, action) => {
			overriddenPermissionAdapter.upsertOne(state?.channelPermissions, action.payload);
		});
	}
});

// ============== Public APIs ============
interface FetchMaxPermissionChannelsArgs {
	channelId: string;
	clanId: string;
	noCache?: boolean;
}

/**
 * Fetch highest permission for a channel.
 * These permissions override clan's permissions
 */

export const fetchMaxChannelPermissionCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string, channelId: string) => {
		const response = await mezon.client.listUserPermissionInChannel(mezon.session, clanId, channelId);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: 1000 * 60 * 60,
		normalizer: (args) => {
			const username = args[0]?.session?.username || '';
			return args[1] + args[2] + username;
		}
	}
);

export const fetchMaxChannelPermission = createAsyncThunk(
	`${OVERRIDDEN_POLICIES_FEATURE_KEY}/fetchMaxPermissionRoleChannel`,
	async ({ clanId, channelId, noCache }: FetchMaxPermissionChannelsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchMaxChannelPermissionCached.clear(mezon, clanId, channelId);
			}
			const response = await fetchMaxChannelPermissionCached(mezon, clanId, channelId);
			if (response && response.permissions?.permissions) {
				return {
					channelId,
					maxPermissions: response.permissions.permissions.reduce<Record<EOverriddenPermission, ApiPermission>>(
						(acc, perm) => {
							if (perm.slug) {
								acc[perm.slug as EOverriddenPermission] = perm;
							}
							return acc;
						},
						{} as Record<EOverriddenPermission, ApiPermission>
					)
				};
			}
			return thunkAPI.rejectWithValue(null);
		} catch (error) {
			captureSentryError(error, 'messages/writeMessageReaction');
			return thunkAPI.rejectWithValue(error);
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
	[selectAllChannelsWithMaxPermissionEntities, (_: RootState, channelId: string) => channelId],
	(permissionEntities, channelId) => {
		const channelPermissions = permissionEntities[channelId]?.maxPermissions;
		const permissionsMap = {} as Record<EOverriddenPermission, boolean>;
		for (const permission in channelPermissions) {
			const isActive = Boolean(channelPermissions[permission as EOverriddenPermission]?.active);
			permissionsMap[permission as EOverriddenPermission] = isActive;
		}
		return permissionsMap;
	}
);
