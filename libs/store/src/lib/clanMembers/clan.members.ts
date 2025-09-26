import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus, UsersClanEntity } from '@mezon/utils';
import { EUserStatus } from '@mezon/utils';
import type { EntityState, PayloadAction, Update } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import type { ClanUserListClanUser } from 'mezon-js/api.gen';
import { selectAllAccount } from '../account/account.slice';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';
import { clanMembersMetaActions, extracMeta, selectClanMembersMetaEntities } from './clan.members.meta';
export const USERS_CLANS_FEATURE_KEY = 'usersClan';

/*
 * Update these interfaces according to your requirements.
 */

export const mapUsersClanToEntity = (UsersClanRes: ClanUserListClanUser) => {
	const id = (UsersClanRes as unknown as any)?.user.id;
	return { ...UsersClanRes, id };
};

export interface UsersClanState {
	byClans: Record<
		string,
		{
			entities: EntityState<UsersClanEntity, string>;
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const UsersClanAdapter = createEntityAdapter<UsersClanEntity>();

type UsersClanPayload = {
	clanId: string;
};

const selectCachedMembersByClan = createSelector(
	[(state: RootState, clanId: string) => state[USERS_CLANS_FEATURE_KEY].byClans[clanId]?.entities],
	(entitiesState) => {
		return entitiesState ? UsersClanAdapter.getSelectors().selectAll(entitiesState) : [];
	}
);

export const fetchUsersClanCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const clanData = currentState[USERS_CLANS_FEATURE_KEY].byClans[clanId];

	const apiKey = createApiKey('fetchUsersClan', clanId, ensuredMezon.session.username || '');
	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.cache, noCache);

	if (!shouldForceCall) {
		const cachedUsers = selectCachedMembersByClan(currentState, clanId);
		return {
			users: cachedUsers,
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListClanUsers',
			list_clan_user_req: {
				clan_id: clanId
			}
		},
		() => ensuredMezon.client.listClanUsers(ensuredMezon.session, clanId),
		'clan_user_list'
	);

	const users = response?.clan_users?.map(mapUsersClanToEntity) || [];

	markApiFirstCalled(apiKey);

	return {
		users,
		fromCache: false
	};
};

type FetchUsersClanPayload = UsersClanPayload & {
	noCache?: boolean;
};

export const fetchUsersClan = createAsyncThunk('UsersClan/fetchUsersClan', async ({ clanId, noCache }: FetchUsersClanPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchUsersClanCached(thunkAPI.getState as () => RootState, mezon, clanId, noCache);
		const { users, fromCache } = response;
		if (!fromCache) {
			const state = thunkAPI.getState() as RootState;
			thunkAPI.dispatch(clanMembersMetaActions.updateBulkMetadata(users.map((item) => extracMeta(item, state))));
		}

		return { users, fromCache, clanId };
	} catch (error) {
		captureSentryError(error, 'UsersClan/fetchUsersClan');
		return thunkAPI.rejectWithValue(error);
	}
});

const getInitialClanState = () => {
	return {
		entities: UsersClanAdapter.getInitialState()
	};
};

export const initialUsersClanState: UsersClanState = {
	byClans: {},
	loadingStatus: 'not loaded',
	error: null
};

export const UsersClanSlice = createSlice({
	name: USERS_CLANS_FEATURE_KEY,
	initialState: initialUsersClanState,
	reducers: {
		add: (state, action: PayloadAction<{ clanId: string; user: UsersClanEntity }>) => {
			const { clanId, user } = action.payload;

			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}

			UsersClanAdapter.addOne(state.byClans[clanId].entities, user);
		},
		upsertMany: (state, action: PayloadAction<{ clanId: string; users: UsersClanEntity[] }>) => {
			const { clanId, users } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			UsersClanAdapter.upsertMany(state.byClans[clanId].entities, users);
		},

		remove: (state, action: PayloadAction<{ clanId: string; userId: string }>) => {
			const { clanId, userId } = action.payload;
			if (state.byClans[clanId]) {
				UsersClanAdapter.removeOne(state.byClans[clanId].entities, userId);
			}
		},
		updateUserClan: (state, action: PayloadAction<{ clanId: string; userId: string; clanNick: string; clanAvt: string }>) => {
			const { clanId, userId, clanNick, clanAvt } = action.payload;
			if (state.byClans[clanId]) {
				const dataCurrent = UsersClanAdapter.getSelectors().selectEntities(state.byClans[clanId].entities)[userId];
				UsersClanAdapter.updateOne(state.byClans[clanId].entities, {
					id: userId,
					changes: {
						clan_nick: clanNick || dataCurrent?.clan_nick,
						clan_avatar: clanAvt || dataCurrent?.clan_avatar
					}
				});
			}
		},
		updateManyRoleIds: (state, action: PayloadAction<{ clanId: string; updates: Array<{ userId: string; roleId: string }> }>) => {
			const { clanId, updates } = action.payload;
			if (state.byClans[clanId]) {
				const entityUpdates = updates.map(({ userId, roleId }) => ({
					id: userId,
					changes: {
						role_id: state.byClans[clanId].entities.entities[userId]?.role_id
							? [...new Set([...(state.byClans[clanId].entities.entities[userId].role_id || []), roleId])]
							: [roleId]
					}
				}));
				UsersClanAdapter.updateMany(state.byClans[clanId].entities, entityUpdates);
			}
		},
		removeManyRoleIds: (state, action: PayloadAction<{ clanId: string; updates: Array<{ userId: string; roleId: string }> }>) => {
			const { clanId, updates } = action.payload;
			if (state.byClans[clanId]) {
				const entityUpdates = updates
					.map(({ userId, roleId }) => {
						const existingMember = state.byClans[clanId].entities.entities[userId];
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
				UsersClanAdapter.updateMany(state.byClans[clanId].entities, entityUpdates);
			}
		},
		updateUserChannel: (state, action: PayloadAction<{ userId: string; clanId: string; clanNick: string; clanAvt: string }>) => {
			const { userId, clanId, clanNick, clanAvt } = action.payload;
			if (state.byClans[clanId]) {
				const entities = state.byClans[clanId].entities.entities;
				const userToUpdate = entities[userId];
				if (userToUpdate && userToUpdate.clan_id === clanId) {
					UsersClanAdapter.updateOne(state.byClans[clanId].entities, {
						id: userId,
						changes: {
							clan_nick: clanNick,
							clan_avatar: clanAvt
						}
					});
				}
			}
		},
		addRoleIdUser: (state, action: PayloadAction<{ clanId: string; userId: string; id: string }>) => {
			const { clanId, userId, id } = action.payload;
			if (state.byClans[clanId]) {
				const existingMember = state.byClans[clanId].entities.entities[userId];
				if (existingMember) {
					const roleIds = existingMember.role_id || [];
					const updatedRoleIds = [...roleIds, id];
					UsersClanAdapter.updateOne(state.byClans[clanId].entities, {
						id: userId,
						changes: { role_id: updatedRoleIds }
					});
				}
			}
		},
		removeRoleIdUser: (state, action: PayloadAction<{ clanId: string; userId: string; id: string }>) => {
			const { clanId, userId, id } = action.payload;
			if (state.byClans[clanId]) {
				const existingMember = state.byClans[clanId].entities.entities[userId];
				if (existingMember) {
					const roleIds = existingMember.role_id || [];
					const updatedRoleIds = roleIds.filter((roleId) => roleId !== id);
					UsersClanAdapter.updateOne(state.byClans[clanId].entities, {
						id: userId,
						changes: { role_id: updatedRoleIds }
					});
				}
			}
		},
		updateUserDisplayName: (state, action: PayloadAction<{ clanId: string; userId: string; displayName: string; avatarUrl: string }>) => {
			const { clanId, userId, displayName, avatarUrl } = action.payload;
			if (state.byClans[clanId]) {
				const existingMember = state.byClans[clanId].entities.entities[userId];
				if (existingMember) {
					UsersClanAdapter.updateOne(state.byClans[clanId].entities, {
						id: userId,
						changes: {
							user: {
								...existingMember.user,
								display_name: displayName,
								avatar_url: avatarUrl
							}
						}
					});
				}
			}
		},
		updateUserProfileAcrossClans: (state, action: PayloadAction<{ userId: string; avatar?: string; display_name?: string; about_me?: string }>) => {
			const { userId, avatar, display_name, about_me } = action.payload;
			Object.keys(state.byClans).forEach((clanId) => {
				const existingMember = state.byClans[clanId].entities.entities[userId];
				if (existingMember) {
					const updates: Partial<UsersClanEntity> = {
						user: {
							...existingMember.user
						}
					};

					if (avatar !== undefined) {
						updates.user!.avatar_url = avatar;
					}

					if (display_name !== undefined) {
						updates.user!.display_name = display_name;
					}

					if (about_me !== undefined) {
						updates.user!.about_me = about_me;
					}

					UsersClanAdapter.updateOne(state.byClans[clanId].entities, {
						id: userId,
						changes: updates
					});
				}
			});
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUsersClan.pending, (state: UsersClanState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchUsersClan.fulfilled,
				(state: UsersClanState, action: PayloadAction<{ users: UsersClanEntity[]; fromCache: boolean; clanId: string }>) => {
					const { users, fromCache, clanId } = action.payload;

					state.loadingStatus = 'loaded';

					if (!fromCache) {
						if (!state.byClans[clanId]) {
							state.byClans[clanId] = getInitialClanState();
						}
						const newEntities = users.reduce(
							(acc, category) => {
								acc[category.id] = category;
								return acc;
							},
							{} as Record<string, UsersClanEntity>
						);

						state.byClans[clanId].entities = {
							ids: users.map((c) => c.id),
							entities: newEntities
						};

						state.byClans[clanId].cache = createCacheMetadata();
					}
				}
			)
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

export const selectClanMembers = (clanId: string) =>
	createSelector(getUsersClanState, (state) => state.byClans[clanId]?.entities ?? UsersClanAdapter.getInitialState());

export const selectClanMemberByClanId = createSelector([getUsersClanState, (_, clanId: string) => clanId], (state, clanId) => state.byClans[clanId]);

export const selectAllUserClans = createSelector([getUsersClanState, (state: RootState) => state.clans.currentClanId as string], (state, clanId) => {
	const clanState = state.byClans[clanId]?.entities;
	return clanState ? selectAll(clanState) : [];
});

export const selectEntitesUserClans = createSelector(
	[getUsersClanState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		const clanState = state.byClans[clanId]?.entities;
		return clanState ? selectEntities(clanState) : {};
	}
);

export const selectMemberClanByUserId = createSelector(
	[selectEntitesUserClans, (state, userId: string) => userId],
	(entities, userId) => entities[userId]
);

export const selectMembersByUserIds = createSelector([selectEntitesUserClans, (_, userIds: string[]) => userIds], (entities, userIds) =>
	userIds.map((userId) => entities[userId] ?? null)
);

export const selectMemberClanByUserName = createSelector([selectAllUserClans, (_, username: string) => username], (members, username) => {
	return members.find((member) => member.user?.username === username);
});

export const selectMembersClanCount = createSelector(
	[getUsersClanState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		return state.byClans[clanId]?.entities.ids.length || 0;
	}
);

const getName = (user: UsersClanEntity) =>
	user.clan_nick?.toLowerCase() || user.user?.display_name?.toLowerCase() || user.user?.username?.toLowerCase() || '';

// CHECK
export const selectClanMemberWithStatusIds = createSelector(
	selectAllUserClans,
	selectClanMembersMetaEntities,
	selectAllAccount,
	(members, metas, userProfile) => {
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
				online: metas[item.id]?.status !== EUserStatus.INVISIBLE && !!metas[item.id]?.online,
				is_mobile: !!metas[item.id]?.isMobile
			}
		})) as UsersClanEntity[];

		const userProfileId = userProfile?.user?.id;
		if (userProfileId) {
			const metadata =
				typeof userProfile?.user?.metadata === 'string' ? safeJSONParse(userProfile?.user?.metadata) : userProfile?.user?.metadata;
			const userIndex = users.findIndex((user) => user.id === userProfileId);

			if (userIndex === -1 && metadata.user_status !== EUserStatus.INVISIBLE) {
				users.push({
					id: userProfileId,
					user: {
						...userProfile?.user,
						online: true
					}
				} as UsersClanEntity);
			} else if (metadata.user_status !== EUserStatus.INVISIBLE) {
				users[userIndex] = {
					...users[userIndex],
					user: {
						...users[userIndex]?.user,
						online: true
					}
				};
			} else {
				users[userIndex] = {
					...users[userIndex],
					user: {
						...users[userIndex]?.user,
						online: false
					}
				};
			}
		}

		users.sort((a, b) => {
			if (a?.user?.online === b?.user?.online) {
				return getName(a).localeCompare(getName(b));
			}
			return a?.user?.online ? -1 : 1;
		});
		const firstOfflineIndex = users.findIndex((user) => !user.user?.online);
		const onlineUsers = firstOfflineIndex === -1 ? users : users?.slice(0, firstOfflineIndex);
		const offlineUsers = firstOfflineIndex === -1 ? [] : users?.slice(firstOfflineIndex);

		return {
			online: onlineUsers?.map((item) => item?.id),
			offline: offlineUsers?.map((item) => item?.id)
		};
	}
);
