import { captureSentryError } from '@mezon/logger';
import { LoadingStatus, UsersClanEntity } from '@mezon/utils';
import { EntityState, PayloadAction, Update, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ClanUserListClanUser } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';
import { RootState } from '../store';
import { clanMembersMetaActions, extracMeta, selectClanMembersMetaEntities } from './clan.members.meta';
export const USERS_CLANS_FEATURE_KEY = 'usersClan';

/*
 * Update these interfaces according to your requirements.
 */

export const mapUsersClanToEntity = (UsersClanRes: ClanUserListClanUser) => {
	const id = (UsersClanRes as unknown as any).user.id;
	return { ...UsersClanRes, id };
};

export interface UsersClanState extends EntityState<UsersClanEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const UsersClanAdapter = createEntityAdapter<UsersClanEntity>();

type UsersClanPayload = {
	clanId: string;
};
export const fetchUsersClan = createAsyncThunk('UsersClan/fetchUsersClan', async ({ clanId }: UsersClanPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listClanUsers(mezon.session, clanId);
		const users = response?.clan_users?.map(mapUsersClanToEntity) || [];
		thunkAPI.dispatch(usersClanActions.setAll(users));
		const state = thunkAPI.getState() as RootState;
		thunkAPI.dispatch(clanMembersMetaActions.updateBulkMetadata(users.map((item) => extracMeta(item, state))));
	} catch (error) {
		captureSentryError(error, 'UsersClan/fetchUsersClan');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialUsersClanState: UsersClanState = UsersClanAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const UsersClanSlice = createSlice({
	name: USERS_CLANS_FEATURE_KEY,
	initialState: initialUsersClanState,
	reducers: {
		setAll: UsersClanAdapter.setAll,
		add: UsersClanAdapter.addOne,
		upsertMany: UsersClanAdapter.upsertMany,
		updateMany: UsersClanAdapter.updateMany,
		remove: UsersClanAdapter.removeOne,
		updateUserClan: (state, action: PayloadAction<{ userId: string; clanNick: string; clanAvt: string }>) => {
			const { userId, clanNick, clanAvt } = action.payload;
			UsersClanAdapter.updateOne(state, {
				id: userId,
				changes: {
					clan_nick: clanNick,
					clan_avatar: clanAvt
				}
			});
		},
		updateManyRoleIds: (state, action: PayloadAction<Array<{ userId: string; roleId: string }>>) => {
			const updates = action.payload.map(({ userId, roleId }) => ({
				id: userId,
				changes: {
					role_id: state.entities[userId]?.role_id ? [...new Set([...(state.entities[userId].role_id || []), roleId])] : [roleId]
				}
			}));
			UsersClanAdapter.updateMany(state, updates);
		},
		removeManyRoleIds: (state, action: PayloadAction<Array<{ userId: string; roleId: string }>>) => {
			const updates = action.payload
				.map(({ userId, roleId }) => {
					const existingMember = state.entities[userId];
					if (existingMember) {
						return {
							id: userId,
							changes: {
								role_id: existingMember.role_id?.filter((id) => id !== roleId) || []
							}
						};
					}
					return null;
				})
				.filter(Boolean) as Update<UsersClanEntity, string>[];
			UsersClanAdapter.updateMany(state, updates);
		},
		updateUserChannel: (state, action: PayloadAction<{ userId: string; clanId: string; clanNick: string; clanAvt: string }>) => {
			const { userId, clanId, clanNick, clanAvt } = action.payload;
			const channelsToUpdate = Object.values(state.entities).filter((channel) => channel?.clan_id === clanId && channel?.user?.id === userId);
			channelsToUpdate.forEach((channel) => {
				if (channel) {
					UsersClanAdapter.updateOne(state, {
						id: userId,
						changes: {
							clan_nick: clanNick,
							clan_avatar: clanAvt
						}
					});
				}
			});
		},
		addRoleIdUser: (state, action) => {
			const { userId, id } = action.payload;
			const existingMember = state.entities[userId];

			if (existingMember) {
				const roleIds = existingMember.role_id || [];
				const updatedRoleIds = [...roleIds, id];
				existingMember.role_id = updatedRoleIds;
			}
		},
		removeRoleIdUser: (state, action) => {
			const { userId, id } = action.payload;
			const existingMember = state.entities[userId];

			if (existingMember) {
				const roleIds = existingMember.role_id || [];
				const updatedRoleIds = roleIds.filter((roleId) => roleId !== id);
				existingMember.role_id = updatedRoleIds;
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUsersClan.pending, (state: UsersClanState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchUsersClan.fulfilled, (state: UsersClanState) => {
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchUsersClan.rejected, (state: UsersClanState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const usersClanReducer = UsersClanSlice.reducer;
export const usersClanActions = { ...UsersClanSlice.actions, fetchUsersClan };

const { selectAll, selectById, selectEntities } = UsersClanAdapter.getSelectors();

export const getUsersClanState = (rootState: { [USERS_CLANS_FEATURE_KEY]: UsersClanState }): UsersClanState => rootState[USERS_CLANS_FEATURE_KEY];

export const selectAllUserClans = createSelector(getUsersClanState, selectAll);

export const selectEntitesUserClans = createSelector(getUsersClanState, selectEntities);

// with DM group use selector: selectMembeGroupByUserId
/**
 * @deprecated will be removed to use selectMemberClanByUserId2
 */
export const selectMemberClanByUserId = (userId: string) => createSelector(getUsersClanState, (state) => selectById(state, userId));

export const selectMemberClanByUserId2 = createSelector(
	[selectEntitesUserClans, (state, userId: string) => userId],
	(entities, userId) => entities[userId]
);

export const selectMemberClanByGoogleId = createSelector([selectAllUserClans, (_, googleId: string) => googleId], (members, googleId) => {
	return members.find((member) => member.user?.google_id === googleId);
});
export const selectMembersClanCount = createSelector(getUsersClanState, (state) => {
	return state.ids.length;
});

const getName = (user: UsersClanEntity) =>
	user.clan_nick?.toLowerCase() || user.user?.display_name?.toLowerCase() || user.user?.username?.toLowerCase() || '';

export const selectClanMemberWithStatusIds = createSelector(selectAllUserClans, selectClanMembersMetaEntities, (members, metas) => {
	if (!metas || !members) {
		return {
			online: [],
			offline: []
		};
	}

	const users = members.map((item) => ({
		...item,
		user: {
			...item.user,
			online: !!metas[item.id]?.online,
			is_mobile: !!metas[item.id]?.isMobile
		}
	})) as UsersClanEntity[];

	users.sort((a, b) => {
		if (a.user?.online === b.user?.online) {
			return getName(a).localeCompare(getName(b));
		}
		return a.user?.online ? -1 : 1;
	});
	const firstOfflineIndex = users.findIndex((user) => !user.user?.online);
	const onlineUsers = firstOfflineIndex === -1 ? users : users?.slice(0, firstOfflineIndex);
	const offlineUsers = firstOfflineIndex === -1 ? [] : users?.slice(firstOfflineIndex);

	return {
		online: onlineUsers?.map((item) => item?.id),
		offline: offlineUsers?.map((item) => item?.id)
	};
});
