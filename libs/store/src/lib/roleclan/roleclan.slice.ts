import { captureSentryError } from '@mezon/logger';
import { EVERYONE_ROLE_ID, IRolesClan, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiUpdateRoleRequest } from 'mezon-js';
import { ApiRole, ApiUpdateRoleOrderRequest, RoleUserListRoleUser } from 'mezon-js/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { RootState } from '../store';

export const ROLES_CLAN_FEATURE_KEY = 'rolesclan';
export const ROLE_FEATURE_KEY = 'roleId';

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
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentRoleId?: string | null;
	roleMembers: Record<string, RoleUserListRoleUser[]>;
	roles: IRolesClan[];
}

export const RolesClanAdapter = createEntityAdapter({
	selectId: (role: RolesClanEntity) => role.id
});

type GetRolePayload = {
	clanId?: string;
	repace?: boolean;
	channelId?: string;
	noCache?: boolean;
};

export const fetchRolesClanCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string) => {
		const response = await mezon.client.listRoles(mezon.session, clanId, 500, 1, '');
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: 1000 * 60 * 60,
		normalizer: (args) => {
			const username = args[0]?.session?.username || '';
			return args[1] + username;
		}
	}
);

export const fetchRolesClan = createAsyncThunk(
	'RolesClan/fetchRolesClan',
	async ({ clanId, repace = false, channelId, noCache }: GetRolePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchRolesClanCached.delete(mezon, clanId || '');
			}
			const response = await fetchRolesClanCached(mezon, clanId || '');
			if (!response?.roles?.roles) {
				return [];
			}
			if (repace) {
				thunkAPI.dispatch(rolesClanActions.removeRoleByChannel(channelId ?? ''));
			}
			const roles = response?.roles.roles
				.filter((role) => role?.active)
				.map((role, index) => ({ ...role, originalIndex: index }))
				.sort((role_1, role_2) => {
					// If both roles have 'order_role', sort by its value
					if (role_1.order_role !== undefined && role_2.order_role !== undefined) {
						return role_1.order_role - role_2.order_role;
					}

					// If neither role has 'order_role', maintain their original order
					if (role_1.order_role === undefined && role_2.order_role === undefined) {
						return role_1.originalIndex - role_2.originalIndex;
					}

					// If only one role has 'order_role', prioritize it
					return role_1.order_role !== undefined ? -1 : 1;
				})
				.map(mapRolesClanToEntity);

			return roles;
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
export const fetchMembersRole = createAsyncThunk('MembersRole/fetchMembersRole', async ({ roleId }: FetchMembersRolePayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listRoleUsers(mezon.session, roleId, 100, '');
		if (!response.role_users) {
			return thunkAPI.rejectWithValue([]);
		}
		return {
			roleID: roleId,
			members: response.role_users
		} as FetchReturnMembersRole;
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
			thunkAPI.dispatch(rolesClanActions.remove(roleId));
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
				active_permission_ids: activePermissionIds || [],
				add_user_ids: addUserIds || [],
				allow_mention: 0,
				clan_id: clanId,
				color: color ?? '',
				description: '',
				display_online: 0,
				title: title ?? '',
				max_permission_id: maxPermissionId
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
				role_id: roleId,
				title: title ?? '',
				color: color ?? '',
				role_icon: roleIcon,
				description: '',
				display_online: 0,
				allow_mention: 0,
				add_user_ids: addUserIds || [],
				active_permission_ids: activePermissionIds || [],
				remove_user_ids: removeUserIds || [],
				remove_permission_ids: removePermissionIds || [],
				clan_id: clanId,
				max_permission_id: maxPermissionId
			};
			const response = await mezon.client.updateRole(mezon.session, roleId, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			const store = thunkAPI.getState() as RootState;
			const roles = store.rolesclan.entities;
			const role = roles[roleId];

			const updateRoleData = handleMapUpdateRole(role, body);
			console.log('updateRoleData: ', updateRoleData);

			console.log('role: ', role);
			return body;
		} catch (error) {
			captureSentryError(error, 'UpdateRole/fetchUpdateRole');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateRoleOrder = createAsyncThunk('UpdateRole/updateRolesOrder', async ({ clan_id, roles }: ApiUpdateRoleOrderRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		await mezon.client.updateRoleOrder(mezon.session, { clan_id, roles });
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
			if (role?.role_user_list?.role_users) {
				const userExists = role.role_user_list.role_users.some((user) => user.id === userId);
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
	loadingStatus: 'not loaded',
	RolesClan: [],
	roleMembers: {},
	roles: [],
	error: null
});

export const RolesClanSlice = createSlice({
	name: ROLES_CLAN_FEATURE_KEY,
	initialState: initialRolesClanState,
	reducers: {
		add: RolesClanAdapter.addOne,
		remove: RolesClanAdapter.removeOne,
		update: (state, action: PayloadAction<ApiRole>) => {
			const changes: Partial<{
				title: string;
				color: string;
				permission_list: typeof action.payload.permission_list;
				role_user_list: typeof action.payload.role_user_list;
			}> = {};
			changes.title = action.payload.title;
			changes.color = action.payload.color;
			if (action.payload.permission_list?.permissions) {
				changes.permission_list = action.payload.permission_list;
			}
			if (action.payload.role_user_list?.role_users) {
				changes.role_user_list = action.payload.role_user_list;
			}
			RolesClanAdapter.updateOne(state, {
				id: action.payload.id || '',
				changes: changes
			});
		},
		setAll: (state, action: PayloadAction<RolesClanEntity[]>) => {
			RolesClanAdapter.setAll(state, action.payload);
		},
		updateRemoveUserRole: (state, action: PayloadAction<{ userId: string }>) => {
			const { userId } = action.payload;
			const roles = Object.values(state.entities);
			roles.forEach((role) => {
				if (role && role.role_user_list?.role_users) {
					const updatedRoleUsers = role.role_user_list.role_users.filter((user) => user.id !== userId);
					if (updatedRoleUsers.length !== role.role_user_list.role_users.length) {
						RolesClanAdapter.updateOne(state, {
							id: role.id,
							changes: {
								role_user_list: {
									...role.role_user_list,
									role_users: updatedRoleUsers
								}
							}
						});
					}
				}
			});
		},
		removeRoleByChannel: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			const updatedRoles = Object.values(state.entities).filter((role) => {
				if (role.channel_ids) {
					return !role.channel_ids.includes(channelId);
				}
			});
			return RolesClanAdapter.setAll(state, updatedRoles);
		},
		setCurrentRoleId: (state, action: PayloadAction<string>) => {
			state.currentRoleId = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchRolesClan.pending, (state: RolesClanState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchRolesClan.fulfilled, (state: RolesClanState, action: PayloadAction<IRolesClan[]>) => {
				RolesClanAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
			})

			.addCase(fetchRolesClan.rejected, (state: RolesClanState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder
			.addCase(fetchMembersRole.fulfilled, (state: RolesClanState, action: PayloadAction<FetchReturnMembersRole>) => {
				state.roleMembers[action.payload.roleID] = action.payload.members;
			})
			.addCase(updateRole.fulfilled, (state: RolesClanState, action: PayloadAction<ApiUpdateRoleRequest>) => {
				const { add_user_ids, remove_user_ids } = action.payload;
				RolesClanAdapter.updateOne(state, {
					id: action.payload.role_id,
					changes: {
						color: action.payload.color,
						allow_mention: action.payload.allow_mention,
						role_icon: action.payload.role_icon,
						title: action.payload.title,
						description: action.payload.description
					}
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
	currentRoleIcon: ''
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
	setCurrentRoleIcon
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

const { selectAll, selectEntities } = RolesClanAdapter.getSelectors();

export const getRolesClanState = (rootState: { [ROLES_CLAN_FEATURE_KEY]: RolesClanState }): RolesClanState => rootState[ROLES_CLAN_FEATURE_KEY];

export const selectAllRolesClan = createSelector(getRolesClanState, selectAll);
export const selectEveryoneRole = createSelector(selectAllRolesClan, (state) => state.find((role) => role?.id === EVERYONE_ROLE_ID));
export const selectRoleByRoleId = (roleID: string) => createSelector(selectAllRolesClan, (allRoleClan) => allRoleClan?.find((r) => r?.id === roleID));

export const selectCurrentRoleId = createSelector(getRolesClanState, (state) => state.currentRoleId);

export const selectRolesClanEntities = createSelector(getRolesClanState, selectEntities);

export const selectRolesByChannelId = (channelId?: string | null) =>
	createSelector(selectRolesClanEntities, (entities) => {
		const roles = Object.values(entities);
		return roles.filter((role) => role?.channel_ids?.includes(channelId!));
	});

export const selectCurrentRole = createSelector(selectRolesClanEntities, selectCurrentRoleId, (RolesClanEntities, RoleId) =>
	RoleId ? RolesClanEntities[RoleId] : null
);
export const selectAllRoleMember = createSelector(getRolesClanState, (state) => state.roleMembers);
export const selectMembersByRoleID = (roleID: string) => {
	createSelector(selectAllRoleMember, (roleMembers) => {
		return roleMembers[roleID];
	});
};
export const selectAllRoleIds = createSelector(selectAllRolesClan, (roles) => roles.map((role) => role.id));

const handleMapUpdateRole = (role: RolesClanEntity, body: ApiUpdateRoleRequest) => {
	const changes: RolesClanEntity = {
		...role,
		title: body.title ? body.title : role.title,
		color: body.color ? body.color : role.color,
		role_icon: body.role_icon ? body.role_icon : role.role_icon,
		description: body.description ? body.description : role.description,
		display_online: body.display_online ? body.display_online : role.display_online,
		allow_mention: body.allow_mention ? body.allow_mention : role.allow_mention
	};

	return changes;
};
