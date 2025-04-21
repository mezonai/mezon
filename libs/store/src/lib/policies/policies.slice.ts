import { IPermissionUser, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiPermission } from 'mezon-js/api.gen';
import { ThunkConfigWithError } from '../errors';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
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
}

export const policiesAdapter = createEntityAdapter<PermissionUserEntity>();

type fetchPermissionsUserPayload = {
	clanId: string;
};

export const fetchPermissionsUser = createAsyncThunk<any, fetchPermissionsUserPayload, ThunkConfigWithError>(
	'policies/fetchPermissionsUser',
	async ({ clanId }: fetchPermissionsUserPayload, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.GetRoleOfUserInTheClan(mezon.session, clanId);
		if (!response.roles) {
			return [];
		}
		return response.roles.map(mapPermissionUserToEntity);
	}
);
const LIST_PERMISSION_CACHED_TIME = 1000 * 60 * 60;
export const fetchPermissionCached = memoizeAndTrack((mezon: MezonValueContext) => mezon.client.getListPermission(mezon.session), {
	promise: true,
	maxAge: LIST_PERMISSION_CACHED_TIME,
	normalizer: (args) => {
		return args[0].session.username ?? '';
	}
});

export const fetchPermission = createAsyncThunk('policies/fetchPermission', async (_, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await fetchPermissionCached(mezon);
	if (!response.permissions) {
		return [];
	}
	return response.permissions?.map(mapPermissionUserToEntity);
});

export const initialPoliciesState: PoliciesState = policiesAdapter.getInitialState({
	loadingStatus: 'not loaded',
	PermissionsUser: [],
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
					id: id,
					max_level_permission: changes.max_level_permission,
					title: changes.title,
					slug: changes.slug
				});
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPermissionsUser.pending, (state: PoliciesState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchPermissionsUser.fulfilled, (state: PoliciesState, action: PayloadAction<IPermissionUser[]>) => {
				policiesAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchPermissionsUser.rejected, (state: PoliciesState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const policiesDefaultSlice = createSlice({
	name: 'policiesDefaultSlice',
	initialState: initialPoliciesState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(fetchPermission.fulfilled, (state: PoliciesState, action: PayloadAction<IPermissionUser[]>) => {
			policiesAdapter.setAll(state, action.payload);
			state.loadingStatus = 'loaded';
		});
	}
});
/*
 * Export reducer for store configuration.
 */
export const policiesReducer = policiesSlice.reducer;

export const policiesDefaultReducer = policiesDefaultSlice.reducer;

export const policiesActions = { ...policiesSlice.actions, fetchPermissionsUser, fetchPermission };

const { selectAll } = policiesAdapter.getSelectors();

export const getPoliciesState = (rootState: { [POLICIES_FEATURE_KEY]: PoliciesState }): PoliciesState => rootState[POLICIES_FEATURE_KEY];

export const getPoliciesDefaultState = (rootState: { ['policiesDefaultSlice']: PoliciesState }): PoliciesState => rootState['policiesDefaultSlice'];

export const selectAllPermissionsUser = createSelector(getPoliciesState, selectAll);

export const selectUserMaxPermissionLevel = createSelector(selectAllPermissionsUser, (userPermissions) => {
	let maxPermissionLevel: number | null = null;
	for (const permission of userPermissions) {
		if (Number.isInteger(permission?.max_level_permission)) {
			const permissionLevel = permission.max_level_permission as number;
			maxPermissionLevel = maxPermissionLevel === null ? permissionLevel : Math.max(maxPermissionLevel, permissionLevel);
		}
	}

	return maxPermissionLevel ?? null;
});

export const selectAllPermissionsDefault = createSelector(getPoliciesDefaultState, selectAll);

export const selectPermissionChannel = createSelector(selectAllPermissionsDefault, (permissions) => {
	return permissions.filter((permission) => permission.scope === 2);
});
