import { captureSentryError } from '@mezon/logger';
import type { IRolesClan, LoadingStatus, UsersClanEntity } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiUpdateRoleRequest } from 'mezon-js';
import type { ApiRole, ApiRoleListEventResponse, ApiUpdateRoleOrderRequest, RoleUserListRoleUser } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { selectEntitesUserClans } from '../clanMembers/clan.members';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx, withRetry } from '../helpers';
import type { PermissionUserEntity } from '../policies/policies.slice';
import { selectAllPermissionsDefaultEntities } from '../policies/policies.slice';
import type { RootState } from '../store';

export const ROLES_CLAN_FEATURE_KEY = 'rolesclan';
export const ROLE_FEATURE_KEY = 'roleId';

const ROLES_CLAN_CACHE_TIME = 1000 * 60 * 60;

/*
 * Update these interfaces according to your requirements.
 */

export interface RolesClanEntity extends IRolesClan {
	id: string; // Primary ID
}

export const mapRolesClanToEntity = (RolesClanRes: ApiRole) => {
	const id = (RolesClanRes as unknown as any).id;
	return { ...RolesClanRes, id };
};

export interface RolesClanState extends EntityState<RolesClanEntity, string> {
	byClans: Record<
		string,
		{
			roles: Record<string, RolesClanEntity>;
			roleMembers: Record<string, RoleUserListRoleUser[]>;
			loadingStatus: LoadingStatus;
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentRoleId?: string | null;
}

const getInitialClanState = () => ({
	roles: {},
	roleMembers: {},
	loadingStatus: 'not loaded' as LoadingStatus
});

export const RolesClanAdapter = createEntityAdapter({
	selectId: (role: RolesClanEntity) => role.id
});

type GetRolePayload = {
	clanId?: string;
	repace?: boolean;
	channelId?: string;
	noCache?: boolean;
};

type FetchRoleClanPayload = {
	roles: IRolesClan[];
	clanId: string;
	fromCache?: boolean;
};

const { selectEntities } = RolesClanAdapter.getSelectors();

const selectCachedRolesClanByClan = createSelector(
	[(state: RootState) => state[ROLES_CLAN_FEATURE_KEY].byClans, (state: RootState, clanId: string) => clanId],
	(byClans, clanId) => {
		const clanData = byClans[clanId];
		return clanData ? Object.values(clanData.roles) : [];
	}
);

export const fetchRolesClanCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, clanId: string, noCache = false) => {
	const state = getState();
	const roleClanData = state[ROLES_CLAN_FEATURE_KEY].byClans[clanId];
	const apiKey = createApiKey('fetchRolesClan', clanId);
	const shouldForceCall = shouldForceApiCall(apiKey, roleClanData?.cache, noCache);
	const roles = selectCachedRolesClanByClan(state, clanId);

	if (!shouldForceCall) {
		return {
			clanId: clanId,
			roles: {
				roles: roles || []
			},
			fromCache: true
		};
	}

	const response = (await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListRoles',
			role_list_event_req: {
				limit: 500,
				state: 1,
				clanId: clanId
			}
		},
		() => ensuredMezon.client.listRoles(ensuredMezon.session, clanId, 500, 1, ''),
		'role_event_list'
	)) as ApiRoleListEventResponse;

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

export const fetchRolesClan = createAsyncThunk(
	'RolesClan/fetchRolesClan',
	async ({ clanId, repace = false, channelId, noCache }: GetRolePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchRolesClanCached(thunkAPI.getState as () => RootState, mezon, clanId || '', noCache);
			if (!response?.roles?.roles) {
				return {
					roles: [],
					clanId: clanId || '',
					fromCache: !!response?.fromCache
				};
			}
			if (repace) {
				thunkAPI.dispatch(rolesClanActions.removeRoleByChannel({ channelId: channelId ?? '', clanId: clanId || '' }));
			}
			const roles: IRolesClan[] = response?.roles.roles
				.filter((role) => role?.active)
				.map((role, index) => ({ ...role, originalIndex: index }))
				.sort((role_1, role_2) => {
					// If both roles have 'orderRole', sort by its value
					if (role_1.orderRole !== undefined && role_2.orderRole !== undefined) {
						return role_1.orderRole - role_2.orderRole;
					}

					// If neither role has 'orderRole', maintain their original order
					if (role_1.orderRole === undefined && role_2.orderRole === undefined) {
						return role_1.originalIndex - role_2.originalIndex;
					}

					// If only one role has 'orderRole', prioritize it
					return role_1.orderRole !== undefined ? -1 : 1;
				})
				.map(mapRolesClanToEntity);

			const payload: FetchRoleClanPayload = {
				roles,
				clanId: clanId || '',
				fromCache: !!response?.fromCache
			};
			return payload;
		} catch (error) {
			captureSentryError(error, 'RolesClan/fetchRolesClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type FetchReturnMembersRole = {
	roleID: string;
	members: RoleUserListRoleUser[];
};

type FetchMembersRolePayload = {
	roleId: string;
	clanId: string;
};
export const fetchMembersRole = createAsyncThunk('MembersRole/fetchMembersRole', async ({ roleId, clanId }: FetchMembersRolePayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await withRetry(() => mezon.client.listRoleUsers(mezon.session, roleId, 100, ''), {
			maxRetries: 3,
			initialDelay: 1000,
			scope: 'clan-role-users'
		});
		if (!response.roleUsers) {
			return thunkAPI.rejectWithValue([]);
		}
		return {
			roleID: roleId,
			clanId,
			members: response.roleUsers
		} as FetchReturnMembersRole & { clanId: string };
	} catch (error) {
		captureSentryError(error, 'MembersRole/fetchMembersRole');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchDeleteRole = createAsyncThunk(
	'DeleteRole/fetchDeleteRole',

	async ({ roleId, clanId }: FetchMembersRolePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteRole(mezon.session, roleId, clanId);
			thunkAPI.dispatch(rolesClanActions.remove({ roleId, clanId }));
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return response;
		} catch (error) {
			captureSentryError(error, 'MembersRole/fetchDeleteRole');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type CreateRolePayload = {
	clanId: string;
	title: string | undefined;
	color: string | undefined;
	addUserIds: string[];
	activePermissionIds: string[];
	maxPermissionId: string;
};

export const fetchCreateRole = createAsyncThunk(
	'CreatRole/fetchCreateRole',
	async ({ clanId, title, color, addUserIds, activePermissionIds, maxPermissionId }: CreateRolePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				activePermissionIds: activePermissionIds || [],
				addUserIds: addUserIds || [],
				allowMention: 0,
				clanId: clanId,
				color: color ?? '',
				description: '',
				displayOnline: 0,
				title: title ?? '',
				maxPermissionId: maxPermissionId
			};
			const response = await mezon.client.createRole(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return response;
		} catch (error) {
			captureSentryError(error, 'CreatRole/fetchCreateRole');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type UpdateRolePayload = {
	roleId: string;
	title: string | undefined;
	color: string | undefined;
	addUserIds: string[];
	activePermissionIds: string[];
	removeUserIds: string[];
	removePermissionIds: string[];
	clanId: string;
	maxPermissionId: string;
	roleIcon?: string;
};

export const updateRole = createAsyncThunk(
	'UpdateRole/fetchUpdateRole',
	async (
		{
			roleId,
			title,
			color,
			addUserIds,
			activePermissionIds,
			removeUserIds,
			removePermissionIds,
			clanId,
			maxPermissionId,
			roleIcon
		}: UpdateRolePayload,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body: ApiUpdateRoleRequest = {
				roleId: roleId,
				title: title ?? '',
				color: color ?? '',
				roleIcon: roleIcon,
				description: '',
				displayOnline: 0,
				allowMention: 0,
				addUserIds: addUserIds || [],
				activePermissionIds: activePermissionIds || [],
				removeUserIds: removeUserIds || [],
				removePermissionIds: removePermissionIds || [],
				clanId: clanId,
				maxPermissionId: maxPermissionId
			};
			const response = await mezon.client.updateRole(mezon.session, roleId, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			const store = thunkAPI.getState() as RootState;
			const roles = store.rolesclan.entities;
			const permission = selectAllPermissionsDefaultEntities(store);
			const listUserClan = selectEntitesUserClans(store);
			const role = roles[roleId];

			const updateRoleData = handleMapUpdateRole(role, body, permission, listUserClan);

			return updateRoleData;
		} catch (error) {
			captureSentryError(error, 'UpdateRole/fetchUpdateRole');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateRoleOrder = createAsyncThunk('UpdateRole/updateRolesOrder', async ({ clanId, roles }: ApiUpdateRoleOrderRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		await mezon.client.updateRoleOrder(mezon.session, { clanId, roles });
	} catch (e) {
		console.error('Error', e);
	}
});

type updatePermission = {
	roleId: string;
	userId: string;
};

export const updatePermissionUserByRoleId = createAsyncThunk(
	'UpdateRole/updatePermissionUserByRoleId',
	async ({ roleId, userId }: updatePermission, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as { rolesclan: RolesClanState };
			const roles = state.rolesclan.entities;
			const role = roles[roleId];
			if (role?.roleUserList?.roleUsers) {
				const userExists = role.roleUserList.roleUsers.some((user) => user.id === userId);
				return userExists;
			}
			return false;
		} catch (error) {
			captureSentryError(error, 'UpdateRole/updatePermissionUserByRoleId');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialRolesClanState: RolesClanState = RolesClanAdapter.getInitialState({
	byClans: {},
	loadingStatus: 'not loaded',
	error: null
});

export const RolesClanSlice = createSlice({
	name: ROLES_CLAN_FEATURE_KEY,
	initialState: initialRolesClanState,
	reducers: {
		add: (state, action: PayloadAction<{ role: RolesClanEntity; clanId: string }>) => {
			const { role, clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].roles[role.id] = role;
			RolesClanAdapter.addOne(state, role);
		},
		remove: (state, action: PayloadAction<{ roleId: string; clanId: string }>) => {
			const { roleId, clanId } = action.payload;
			if (state.byClans[clanId]?.roles[roleId]) {
				delete state.byClans[clanId].roles[roleId];
			}
			RolesClanAdapter.removeOne(state, roleId);
		},
		update: (state, action: PayloadAction<{ role: ApiRole; clanId: string }>) => {
			const { role, clanId } = action.payload;
			const changes: Partial<{
				title: string;
				color: string;
				permissionList: typeof role.permissionList;
				roleUserList: typeof role.roleUserList;
			}> = {};
			changes.title = role.title;
			changes.color = role.color;
			if (role.permissionList?.permissions) {
				changes.permissionList = role.permissionList;
			}
			if (role.roleUserList?.roleUsers) {
				changes.roleUserList = role.roleUserList;
			}

			if (state.byClans[clanId]?.roles[role.id || '']) {
				state.byClans[clanId].roles[role.id || ''] = {
					...state.byClans[clanId].roles[role.id || ''],
					...changes
				};
			}

			RolesClanAdapter.updateOne(state, {
				id: role.id || '',
				changes
			});
		},
		setAll: (state, action: PayloadAction<{ roles: RolesClanEntity[]; clanId: string }>) => {
			const { roles, clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}

			state.byClans[clanId].roles = {};

			roles.forEach((role) => {
				state.byClans[clanId].roles[role.id] = role;
			});

			RolesClanAdapter.setAll(state, roles);
		},
		updateCache: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].cache = createCacheMetadata(ROLES_CLAN_CACHE_TIME);
		},
		updateRemoveUserRole: (state, action: PayloadAction<{ userId: string; clanId: string }>) => {
			const { userId, clanId } = action.payload;
			const clanData = state.byClans[clanId];
			if (!clanData) return;

			Object.values(clanData.roles).forEach((role) => {
				if (role && role.roleUserList?.roleUsers) {
					const updatedRoleUsers = role.roleUserList.roleUsers.filter((user) => user.id !== userId);
					if (updatedRoleUsers.length !== role.roleUserList.roleUsers.length) {
						clanData.roles[role.id] = {
							...role,
							roleUserList: {
								...role.roleUserList,
								roleUsers: updatedRoleUsers
							}
						};

						RolesClanAdapter.updateOne(state, {
							id: role.id,
							changes: {
								roleUserList: {
									...role.roleUserList,
									roleUsers: updatedRoleUsers
								}
							}
						});
					}
				}
			});
		},
		removeRoleByChannel: (state, action: PayloadAction<{ channelId: string; clanId: string }>) => {
			const { channelId, clanId } = action.payload;
			const clanData = state.byClans[clanId];
			if (!clanData) return;

			const updatedRoles = Object.values(clanData.roles).filter((role) => {
				if (role.channelIds) {
					return !role.channelIds.includes(channelId);
				}
				return true;
			});

			clanData.roles = {};
			updatedRoles.forEach((role) => {
				clanData.roles[role.id] = role;
			});

			return RolesClanAdapter.setAll(state, updatedRoles);
		},
		addRoleByChannel: (state, action: PayloadAction<{ channelId: string; roleIds: string[]; clanId: string }>) => {
			const { channelId, roleIds, clanId } = action.payload;
			const clanData = state?.byClans?.[clanId];
			if (!clanData?.roles || !Array.isArray(roleIds)) return;

			for (const roleId of roleIds) {
				const role = clanData?.roles?.[roleId];
				if (!role) continue;

				const channels = Array.isArray(role?.channelIds) ? role?.channelIds : [];
				if (!channels?.includes(channelId)) {
					role.channelIds = [...channels, channelId];
				}
			}
		},
		removeChannelRole: (state, action: PayloadAction<{ channelId: string; roleId: string; clanId: string }>) => {
			const { channelId, roleId, clanId } = action.payload;
			const role = state?.byClans?.[clanId]?.roles?.[roleId];
			if (!role) return;

			role.channelIds = Array.isArray(role?.channelIds) ? role?.channelIds?.filter((id) => id && id !== channelId) : [];
		},
		setCurrentRoleId: (state, action: PayloadAction<string>) => {
			state.currentRoleId = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchRolesClan.pending, (state: RolesClanState, action) => {
				const clanId = action.meta.arg.clanId;
				if (clanId) {
					if (!state.byClans[clanId]) {
						state.byClans[clanId] = getInitialClanState();
					}
					state.byClans[clanId].loadingStatus = 'loading';
				}
				state.loadingStatus = 'loading';
			})
			.addCase(fetchRolesClan.fulfilled, (state: RolesClanState, action: PayloadAction<FetchRoleClanPayload>) => {
				const { roles, clanId, fromCache } = action.payload;

				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}

				if (!fromCache) {
					state.byClans[clanId].roles = {};

					roles.forEach((role) => {
						state.byClans[clanId].roles[role.id] = role;
					});

					state.byClans[clanId].cache = createCacheMetadata(ROLES_CLAN_CACHE_TIME);
				}

				state.byClans[clanId].loadingStatus = 'loaded';
				RolesClanAdapter.setMany(state, roles);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchRolesClan.rejected, (state: RolesClanState, action) => {
				const clanId = action.meta.arg.clanId;
				if (clanId) {
					if (!state.byClans[clanId]) {
						state.byClans[clanId] = getInitialClanState();
					}
					state.byClans[clanId].loadingStatus = 'error';
				}
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(fetchMembersRole.fulfilled, (state: RolesClanState, action: PayloadAction<FetchReturnMembersRole & { clanId: string }>) => {
				const { roleID, members, clanId } = action.payload;
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}
				state.byClans[clanId].roleMembers[roleID] = members;
			})
			.addCase(updateRole.fulfilled, (state: RolesClanState, action: PayloadAction<RolesClanEntity>) => {
				const role = action.payload;
				const clanId = role.clanId;

				if (clanId && state.byClans[clanId]?.roles[role.id]) {
					state.byClans[clanId].roles[role.id] = role;
				}

				RolesClanAdapter.updateOne(state, {
					id: role.id,
					changes: role
				});
			});
	}
});

export type RoleState = {
	selectedRoleId: string;
	nameRoleNew: string;
	colorRoleNew: string;
	selectedPermissions: string[];
	addPermissions: string[];
	addMemberRoles: string[];
	removePermissions: string[];
	removeMemberRoles: string[];
	currentRoleIcon: string;
	newRoleIcon: string | null;
};

const roleStateInitialState: RoleState = {
	selectedRoleId: '',
	nameRoleNew: '',
	colorRoleNew: '',
	selectedPermissions: [],
	addPermissions: [],
	addMemberRoles: [],
	removePermissions: [],
	removeMemberRoles: [],
	currentRoleIcon: '',
	newRoleIcon: ''
};

export const roleSlice = createSlice({
	name: ROLE_FEATURE_KEY,
	initialState: roleStateInitialState,
	reducers: {
		setSelectedRoleId: (state, action) => {
			state.selectedRoleId = action.payload;
		},
		setNameRoleNew: (state, action) => {
			state.nameRoleNew = action.payload;
		},
		setColorRoleNew: (state, action) => {
			state.colorRoleNew = action.payload;
		},
		setSelectedPermissions: (state, action) => {
			state.selectedPermissions = action.payload;
		},
		setAddPermissions: (state, action) => {
			state.addPermissions = action.payload;
		},
		setAddMemberRoles: (state, action) => {
			state.addMemberRoles = action.payload;
		},
		setRemovePermissions: (state, action) => {
			state.removePermissions = action.payload;
		},
		setRemoveMemberRoles: (state, action) => {
			state.removeMemberRoles = action.payload;
		},
		setCurrentRoleIcon: (state, action) => {
			state.currentRoleIcon = action.payload;
		},
		setNewRoleIcon: (state, action) => {
			state.newRoleIcon = action.payload;
		}
	}
});

export const roleIdReducer = roleSlice.reducer;

export const {
	setSelectedRoleId,
	setNameRoleNew,
	setColorRoleNew,
	setAddPermissions,
	setAddMemberRoles,
	setRemovePermissions,
	setRemoveMemberRoles,
	setSelectedPermissions,
	setCurrentRoleIcon,
	setNewRoleIcon
} = roleSlice.actions;

export const getRoleState = (rootState: { [ROLE_FEATURE_KEY]: RoleState }): RoleState => rootState[ROLE_FEATURE_KEY];
export const getSelectedRoleId = (state: RootState) => state.roleId.selectedRoleId;

export const getNewNameRole = (state: RootState) => state.roleId.nameRoleNew;

export const getNewColorRole = (state: RootState) => state.roleId.colorRoleNew;

export const getNewSelectedPermissions = (state: RootState) => state.roleId.selectedPermissions;

export const getNewAddPermissions = (state: RootState) => state.roleId.addPermissions;

export const getNewAddMembers = (state: RootState) => state.roleId.addMemberRoles;

export const getRemovePermissions = (state: RootState) => state.roleId.removePermissions;

export const getRemoveMemberRoles = (state: RootState) => state.roleId.removeMemberRoles;

export const getNewRoleIcon = (state: RootState) => state.roleId.newRoleIcon;

export const selectCurrentRoleIcon = createSelector(getRoleState, (state) => state.currentRoleIcon);

export const updateRoleSlice = createSlice({
	name: 'isshow',
	initialState: {
		isShow: false
	},
	reducers: {
		toggleIsShowTrue: (state) => {
			state.isShow = true;
		},
		toggleIsShowFalse: (state) => {
			state.isShow = false;
		}
	}
});

export const IsShowReducer = updateRoleSlice.reducer;

export const { toggleIsShowTrue, toggleIsShowFalse } = updateRoleSlice.actions;

export const getIsShow = (state: RootState) => state.isshow.isShow;

/*
 * Export reducer for store configuration.
 */
export const RolesClanReducer = RolesClanSlice.reducer;
export const rolesClanActions = {
	...RolesClanSlice.actions,
	fetchRolesClan,
	fetchMembersRole,
	fetchDeleteRole,
	fetchCreateRole,
	updateRole,
	updatePermissionUserByRoleId,
	updateRoleOrder
};

export const getRolesClanState = (rootState: { [ROLES_CLAN_FEATURE_KEY]: RolesClanState }): RolesClanState => rootState[ROLES_CLAN_FEATURE_KEY];

export const selectAllRolesClan = createSelector([getRolesClanState, (state: RootState) => state.clans.currentClanId as string], (state, clanId) =>
	Object.values(state.byClans[clanId]?.roles || {})
);

export const selectRolesByChannelId = (channelId?: string | null) =>
	createSelector(selectAllRolesClan, (roles) => {
		return roles.filter((role) => role?.channelIds?.includes(channelId!));
	});

export const selectCurrentRoleId = createSelector(getRolesClanState, (state) => state.currentRoleId);

export const selectCurrentRole = createSelector(
	[selectAllRolesClan, selectCurrentRoleId],
	(roles, roleId) => roles.find((role) => role.id === roleId) || null
);

export const selectRolesClanEntities = createSelector(
	[getRolesClanState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		const clanData = state.byClans[clanId];
		return clanData ? clanData.roles : {};
	}
);
export const selectRolesByClanId = createSelector([getRolesClanState, (state: RootState, clanId: string) => clanId], (state, clanId) => {
	const clanData = state.byClans[clanId];
	return clanData ? clanData.roles : {};
});
const handleMapUpdateRole = (
	role: RolesClanEntity,
	body: ApiUpdateRoleRequest,
	permissions: Record<string, PermissionUserEntity>,
	users: Record<string, UsersClanEntity>
): RolesClanEntity => {
	const {
		activePermissionIds = [],
		removePermissionIds = [],
		addUserIds = [],
		removeUserIds = [],
		title,
		color,
		roleIcon,
		description,
		displayOnline,
		allowMention
	} = body;

	const removePermissionSet = new Set(removePermissionIds);
	// const activePermissionSet = new Set(activePermissionIds);

	const permissionUpdate = (role.permissionList?.permissions || [])
		.filter((p) => (p.id ? !removePermissionSet.has(p.id) : false))
		.concat(activePermissionIds.map((id) => permissions[id]).filter((p): p is PermissionUserEntity => !!p && !removePermissionSet.has(p.id)));

	const removeUserSet = new Set(removeUserIds);
	const existingUsers = role.roleUserList?.roleUsers || [];

	const userUpdate = existingUsers.filter((u) => (u.id ? !removeUserSet.has(u.id) : false));
	const existingUserIdSet = new Set(userUpdate.map((u) => u.id).filter((id): id is string => Boolean(id)));
	for (const id of addUserIds) {
		if (removeUserSet.has(id)) continue;
		if (existingUserIdSet.has(id)) continue;
		const u = users[id];
		if (!u) continue;

		userUpdate.push({
			id: u.id,
			avatarUrl: u.clanAvatar || u.user?.avatarUrl,
			displayName: u.prioritizeName,
			username: u.user?.username,
			langTag: u.user?.langTag,
			location: u.user?.location,
			online: u.user?.online
		});
		existingUserIdSet.add(id);
	}

	return {
		...role,
		title: title ?? role.title,
		color: color ?? role.color,
		roleIcon: roleIcon ?? role.roleIcon,
		description: description ?? role.description,
		displayOnline: displayOnline ?? role.displayOnline,
		allowMention: allowMention ?? role.allowMention,
		permissionList: { permissions: permissionUpdate },
		roleUserList: { roleUsers: userUpdate }
	};
};
