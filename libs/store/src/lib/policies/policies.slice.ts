import type { IPermissionUser, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiPermission, ApiRole } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { ThunkConfigWithError } from '../errors';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const POLICIES_FEATURE_KEY = 'policies';

/*
 * Update these interfaces according to your requirements.
 */

export interface PermissionUserEntity extends IPermissionUser {
	id: string; // Primary ID
	max_level_permission?: number;
}

export const mapPermissionUserToEntity = (userPermissions: ApiPermission) => {
	const id = (userPermissions as unknown as any).id;
	return { ...userPermissions, id };
};

export interface PoliciesState extends EntityState<PermissionUserEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	PermissionsUserId?: string | null;
	cache?: CacheMetadata;
	maxPermissionUser: number;
}

export const policiesAdapter = createEntityAdapter<PermissionUserEntity>();

type fetchPermissionsUserPayload = {
	clanId: string;
};

export const fetchPermissionsUser = createAsyncThunk<any, fetchPermissionsUserPayload, ThunkConfigWithError>(
	'policies/fetchPermissionsUser',
	async ({ clanId }: fetchPermissionsUserPayload, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchDataWithSocketFallback(
			mezon,
			{
				api_name: 'GetRoleOfUserInTheClan',
				permission_user_req: {
					clan_id: clanId
				}
			},
			() => mezon.client.GetRoleOfUserInTheClan(mezon.session, clanId),
			'role_list'
		);

		if (!response.roles) {
			return [];
		}
		return response.max_level_permission || 0;
	}
);

const LIST_PERMISSION_CACHED_TIME = 1000 * 60 * 60;

export const fetchPermissionCached = async (getState: () => RootState, mezon: MezonValueContext, noCache = false) => {
	const currentState = getState();
	const policiesData = currentState[POLICIES_FEATURE_KEY];
	const apiKey = createApiKey('fetchPermission', mezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, policiesData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			permissions: Object.values(policiesData.entities),
			fromCache: true,
			time: policiesData.cache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		mezon,
		{
			api_name: 'GetListPermission'
		},
		() => mezon.client.getListPermission(mezon.session),
		'permission_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

type fetchPermissionPayload = {
	noCache?: boolean;
};

export const fetchPermission = createAsyncThunk('policies/fetchPermission', async ({ noCache }: fetchPermissionPayload = {}, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchPermissionCached(thunkAPI.getState as () => RootState, mezon, Boolean(noCache));

		if (response.fromCache) {
			return {
				fromCache: true,
				permissions: []
			};
		}

		return {
			fromCache: response.fromCache,
			permissions: response.permissions?.map(mapPermissionUserToEntity) || []
		};
	} catch (error) {
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialPoliciesState: PoliciesState = policiesAdapter.getInitialState({
	loadingStatus: 'not loaded',
	maxPermissionUser: 0,
	error: null
});

export const policiesSlice = createSlice({
	name: POLICIES_FEATURE_KEY,
	initialState: initialPoliciesState,
	reducers: {
		addOne: policiesAdapter.addOne,
		removeOne: policiesAdapter.removeOne,
		updateOne: (state, action: PayloadAction<{ id: string; changes: Partial<PermissionUserEntity> }>) => {
			const { id, changes } = action.payload;
			const existingItem = state.entities[id];
			if (existingItem) {
				if (changes.title === existingItem.title) {
					policiesAdapter.removeOne(state, id);
				} else {
					policiesAdapter.updateOne(state, { id, changes });
				}
			} else {
				policiesAdapter.addOne(state, {
					id,
					max_level_permission: changes.max_level_permission,
					title: changes.title,
					slug: changes.slug
				});
			}
		},
		updateCache: (state) => {
			state.cache = createCacheMetadata(LIST_PERMISSION_CACHED_TIME);
		},
		addPermissionCurrentClan: (state, action: PayloadAction<ApiRole>) => {
			const role = action.payload;
			if (role.max_level_permission && role.max_level_permission > state.maxPermissionUser) {
				state.maxPermissionUser = role.max_level_permission;
			}
			state.cache = createCacheMetadata(LIST_PERMISSION_CACHED_TIME);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPermissionsUser.pending, (state: PoliciesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchPermissionsUser.fulfilled, (state: PoliciesState, action: PayloadAction<number>) => {
				state.maxPermissionUser = action.payload;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchPermissionsUser.rejected, (state: PoliciesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchPermission.pending, (state: PoliciesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchPermission.fulfilled,
				(state: PoliciesState, action: PayloadAction<{ fromCache?: boolean; permissions: IPermissionUser[] }>) => {
					const { fromCache, permissions } = action.payload;
					if (!fromCache) {
						policiesAdapter.setAll(state, permissions);
						state.cache = createCacheMetadata(LIST_PERMISSION_CACHED_TIME);
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchPermission.rejected, (state: PoliciesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const policiesReducer = policiesSlice.reducer;

export const policiesActions = { ...policiesSlice.actions, fetchPermissionsUser, fetchPermission };

const { selectAll, selectEntities } = policiesAdapter.getSelectors();

export const getPoliciesState = (rootState: { [POLICIES_FEATURE_KEY]: PoliciesState }): PoliciesState => rootState[POLICIES_FEATURE_KEY];

export const selectAllPermissionsUser = createSelector(getPoliciesState, selectAll);

export const selectUserMaxPermissionLevel = createSelector([getPoliciesState], (state) => {
	return state.maxPermissionUser ?? null;
});

export const selectAllPermissionsDefault = createSelector(getPoliciesState, selectAll);
export const selectAllPermissionsDefaultEntities = createSelector(getPoliciesState, selectEntities);

export const selectPermissionChannel = createSelector(selectAllPermissionsDefault, (permissions) => {
	return permissions.filter((permission) => permission.scope === 2);
});
