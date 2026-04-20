import { captureSentryError } from '@mezon/logger';
import type { IUserProfileActivity, LoadingStatus, UsersClanEntity } from '@mezon/utils';
import { EUserStatus } from '@mezon/utils';
import type { EntityState, PayloadAction, Update } from '@reduxjs/toolkit';
import { createAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelUserListChannelUser, ClanUserListClanUser } from 'mezon-js';
import { batch } from 'react-redux';
import { selectAllAccount, selectCurrentUserId } from '../account/account.slice';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { convertStatusClan, selectStatusEntities, statusActions } from '../direct/status.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, ensureSocket, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';
export const USERS_CLANS_FEATURE_KEY = 'usersClan';

export const initClanMembersAction = createAction<{ users: UsersClanEntity[]; clanId: string }>('UsersClan/initClanMembers');

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
		(session) => ensuredMezon.client.listClanUsers(session, clanId),
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
		return { users: response?.users, fromCache: response.fromCache, clanId };
	} catch (error) {
		captureSentryError(error, 'UsersClan/fetchUsersClan');
		return thunkAPI.rejectWithValue(error);
	}
});

export const listOnlineUserClan = createAsyncThunk('UsersClan/listOnlineUserClan', async ({ clanId }: { clanId?: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.listUserOnline(mezon.session, clanId || '');

		const result: IUserProfileActivity[] = [];
		const state = thunkAPI.getState() as RootState;

		if (response?.users) {
			const list_users = response?.users;
			for (const user of list_users) {
				if (user?.id) {
					result.push(convertStatusClan({ ...user, id: user.id }, state));
				}
			}
			thunkAPI.dispatch(statusActions.updateBulkStatus(result));
		}

		return clanId;
	} catch (error) {
		captureSentryError(error, 'UsersClan/listOnlineUserClan');
		return thunkAPI.rejectWithValue(error);
	}
});

export const fetchClanMembersWithStatus = createAsyncThunk(
	'UsersClan/fetchClanMembersWithStatus',
	async ({ clanId }: { clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));

			const [membersResponse, onlineResponse, statusResponse] = await Promise.all([
				fetchUsersClanCached(thunkAPI.getState as () => RootState, mezon, clanId),
				mezon.client.listUserOnline(mezon.session, clanId),
				mezon.client.listClanUsersStatus(mezon.session, clanId)
			]);

			const userStatusMap = new Map<string, string>();
			if (statusResponse?.clan_user_statuses) {
				for (const s of statusResponse.clan_user_statuses) {
					if (s.user_id) userStatusMap.set(s.user_id, s.user_status || '');
				}
			}

			const state = thunkAPI.getState() as RootState;
			const statusData: IUserProfileActivity[] = [];
			if (onlineResponse?.users) {
				for (const user of onlineResponse.users) {
					if (user?.id) {
						const entry = convertStatusClan({ ...user, id: user.id }, state);
						entry.user_status = userStatusMap.get(user.id) ?? entry.user_status;
						statusData.push(entry);
					}
				}
			}

			batch(() => {
				if (!membersResponse.fromCache && membersResponse.users?.length) {
					thunkAPI.dispatch(initClanMembersAction({ users: membersResponse.users, clanId }));
				}
				if (statusData.length) {
					thunkAPI.dispatch(statusActions.updateBulkStatus(statusData));
				}
			});
		} catch (error) {
			captureSentryError(error, 'UsersClan/fetchClanMembersWithStatus');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchListBanMembersCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	clanId: string,
	channelId: string,
	noCache = false
) => {
	const currentState = getState();
	const clanData = currentState[USERS_CLANS_FEATURE_KEY].byClans[clanId];

	const apiKey = createApiKey('listBannedUsers', clanId, ensuredMezon.session.username || '');
	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			ban_list: [],
			fromCache: true
		};
	}

	const response = await ensuredMezon.client.listBannedUsers(ensuredMezon.session, clanId, channelId);

	markApiFirstCalled(apiKey);

	return {
		ban_list: response.banned_users,
		fromCache: false
	};
};

export const fetchListBanUser = createAsyncThunk(
	'channelMembers/fetchListBanUser',
	async ({ clanId, channelId = '0' }: { clanId: string; channelId?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchListBanMembersCached(thunkAPI.getState as () => RootState, mezon, clanId, channelId);
			if (!response || !response.ban_list) {
				return {
					ban_list: [],
					fromCache: false,
					clanId
				};
			}
			return {
				ban_list: response.ban_list,
				clanId,
				fromCache: response.fromCache
			};
		} catch (error) {
			captureSentryError(error, 'channelMembers/banUserChannel');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

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
		removeUsersAndClearCache: (state, action: PayloadAction<{ clanId: string; userIds: string[] }>) => {
			const { clanId, userIds } = action.payload;
			if (state.byClans[clanId]) {
				UsersClanAdapter.removeMany(state.byClans[clanId].entities, userIds);
				delete state.byClans[clanId].cache;
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
		updateUserStatus: (state, action: PayloadAction<{ userId: string; user_status: string }>) => {
			const { userId, user_status } = action.payload;
			Object.keys(state.byClans).forEach((clanId) => {
				const existingMember = state.byClans[clanId].entities.entities[userId];
				if (existingMember) {
					UsersClanAdapter.updateOne(state.byClans[clanId].entities, {
						id: userId,
						changes: {
							user: {
								...existingMember.user,
								user_status
							}
						}
					});
				}
			});
		},
		updateUserProfileAcrossClans: (
			state,
			action: PayloadAction<{ userId: string; avatar?: string; display_name?: string; about_me?: string }>
		) => {
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
		},
		addBannedUser: (
			state,
			action: PayloadAction<{ clanId: string; channelId: string; userIds: string[]; banner_id?: string; ban_time?: number }>
		) => {
			const { clanId, channelId, userIds, banner_id, ban_time } = action.payload;
			const banList: Update<UsersClanEntity, string>[] = userIds.map((id) => {
				const oldBanList = state.byClans?.[clanId]?.entities?.entities[id]?.ban_list || {};
				return {
					id,
					changes: {
						ban_list: {
							...oldBanList,
							[channelId]: {
								banner_id,
								ban_time: ban_time ? Date.now() + (ban_time || 0) : ban_time
							}
						}
					}
				};
			});
			if (state.byClans[clanId]?.entities) {
				UsersClanAdapter.updateMany(state.byClans[clanId]?.entities, banList);
			}
		},
		removeBannedUser: (state, action: PayloadAction<{ clanId: string; channelId: string; userIds: string[] }>) => {
			const { clanId, channelId, userIds } = action.payload;
			const banList: Update<UsersClanEntity, string>[] = userIds.map((id) => {
				const oldBanList = state.byClans?.[clanId]?.entities?.entities[id].ban_list || {};
				const newBanList = { ...oldBanList };
				delete newBanList[channelId];
				return {
					id,
					changes: {
						ban_list: newBanList
					}
				};
			});
			if (state.byClans[clanId]?.entities) {
				UsersClanAdapter.updateMany(state.byClans[clanId]?.entities, banList);
			}
		},
		upsertBanFromChannel: (state, action: PayloadAction<{ clanId: string; channelId: string; users: ChannelUserListChannelUser[] }>) => {
			const { clanId, channelId, users } = action.payload;
			const clanEntities = state.byClans?.[clanId]?.entities?.entities;
			if (!clanEntities) return;
			const updates: Update<UsersClanEntity, string>[] = [];
			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				if (!user?.is_banned) continue;

				if (!user?.user_id) return;
				const userEntity = clanEntities[user.user_id];
				if (!userEntity) continue;

				const oldBanList = userEntity.ban_list || {};
				const newBanList = {
					...oldBanList,
					[channelId]: {
						ban_time: user?.expired_ban_time ? Date.now() + (user?.expired_ban_time || 0) : undefined,
						banner_id: ''
					}
				};
				updates.push({
					id: user.user_id,
					changes: { ban_list: newBanList }
				});
			}
			UsersClanAdapter.updateMany(state.byClans[clanId].entities, updates);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(initClanMembersAction, (state, action) => {
				const { users, clanId } = action.payload;
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}
				const newEntities = users.reduce(
					(acc, user) => {
						acc[user.id] = user;
						return acc;
					},
					{} as Record<string, UsersClanEntity>
				);
				state.byClans[clanId].entities = {
					ids: users.map((u) => u.id),
					entities: newEntities
				};
				state.byClans[clanId].cache = createCacheMetadata();
			})
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
			})
			.addCase(fetchListBanUser.fulfilled, (state, action) => {
				const { ban_list, fromCache, clanId } = action.payload;
				state.loadingStatus = 'loaded';

				if (!fromCache) {
					if (!state.byClans[clanId]) {
						state.byClans[clanId] = getInitialClanState();
					}
					const grouped: Record<string, Record<string, { banner_id?: string; ban_time?: number }>> = {};

					for (const user of ban_list) {
						if (!user.banned_id || !user.channel_id) continue;
						if (grouped[user.banned_id]) {
							grouped[user.banned_id][user.channel_id] = {
								banner_id: user.banner_id || '',
								ban_time: user?.ban_time ? Date.now() + (user?.ban_time || 0) : user?.ban_time
							};
						} else {
							grouped[user.banned_id] = {
								[user.channel_id]: {
									banner_id: user.banner_id || '',
									ban_time: user?.ban_time ? Date.now() + (user?.ban_time || 0) : user?.ban_time
								}
							};
						}
					}
					if (state.byClans[clanId]?.entities) {
						const banList: Update<UsersClanEntity, string>[] = Object.entries(grouped).map(([banned_id, channelSet]) => ({
							id: banned_id,
							changes: {
								ban_list: channelSet
							}
						}));

						UsersClanAdapter.updateMany(state.byClans[clanId]?.entities, banList);
						state.byClans[clanId].cache = createCacheMetadata();
					}
				}
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const usersClanReducer = UsersClanSlice.reducer;
export const usersClanActions = { ...UsersClanSlice.actions, fetchUsersClan, fetchListBanUser };

const { selectAll, selectById, selectEntities } = UsersClanAdapter.getSelectors();

export const getUsersClanState = (rootState: { [USERS_CLANS_FEATURE_KEY]: UsersClanState }): UsersClanState => rootState[USERS_CLANS_FEATURE_KEY];

export const selectClanMemberByClanId = createSelector([getUsersClanState, (_, clanId: string) => clanId], (state, clanId) => state.byClans[clanId]);

export const selectMemberByIdAndClanId = createSelector(
	[getUsersClanState, (_, clanId: string) => clanId, (_, __, userId: string) => userId],
	(state, clanId, userId) => {
		const clanState = state.byClans[clanId]?.entities;
		return clanState ? selectById(clanState, userId) : null;
	}
);

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

export const selectMembersClanCount = createSelector(
	[getUsersClanState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		return state.byClans[clanId]?.entities.ids.length || 0;
	}
);

const getName = (user: UsersClanEntity) =>
	user.clan_nick?.toLowerCase() || user.user?.display_name?.toLowerCase() || user.user?.username?.toLowerCase() || '';

export const selectOnlineUserIdsSet = createSelector(
	selectStatusEntities,
	selectAllAccount,
	(metas, userProfile) => {
		const onlineIds = new Set<string>();
		for (const id in metas) {
			const meta = metas[id];
			if (meta && meta.status !== EUserStatus.INVISIBLE && meta.online) {
				onlineIds.add(id);
			}
		}
		const myId = userProfile?.user?.id;
		if (myId && userProfile?.user?.status !== EUserStatus.INVISIBLE) {
			onlineIds.add(myId);
		}
		return onlineIds;
	},
	{
		memoizeOptions: {
			resultEqualityCheck: (a: Set<string>, b: Set<string>) => {
				if (a.size !== b.size) return false;
				for (const id of a) {
					if (!b.has(id)) return false;
				}
				return true;
			}
		}
	}
);

export const selectClanMemberWithStatusIds = createSelector(
	selectAllUserClans,
	selectOnlineUserIdsSet,
	(members, onlineIds) => {
		const online: string[] = [];
		const offline: string[] = [];

		const sorted = [...members].sort((a, b) => {
			const aOnline = onlineIds.has(a.id);
			const bOnline = onlineIds.has(b.id);
			if (aOnline !== bOnline) return aOnline ? -1 : 1;
			return getName(a).localeCompare(getName(b));
		});

		for (const member of sorted) {
			if (onlineIds.has(member.id)) {
				online.push(member.id);
			} else {
				offline.push(member.id);
			}
		}

		return { online, offline };
	},
	{
		memoizeOptions: {
			resultEqualityCheck: (a: { online: string[]; offline: string[] }, b: { online: string[]; offline: string[] }) =>
				a.online.length === b.online.length &&
				a.offline.length === b.offline.length &&
				a.online.every((id, i) => id === b.online[i]) &&
				a.offline.every((id, i) => id === b.offline[i])
		}
	}
);

export const selectBanMemberCurrentClanById = createSelector(
	[
		getUsersClanState,
		(state: RootState) => state.clans.currentClanId as string,
		(_: RootState, channelId: string) => channelId,
		(_: RootState, __: string, userId: string) => userId
	],
	(state, clanId, channelId, userId) => {
		const clanState = state.byClans?.[clanId]?.entities;
		if (!clanState) return false;
		return selectById(state.byClans?.[clanId]?.entities, userId)?.ban_list?.[channelId];
	}
);

export const selectBanMeInChannel = createSelector(
	[
		getUsersClanState,
		selectCurrentUserId,
		(state: RootState) => state.clans.currentClanId as string,
		(_: RootState, channelId?: string | null) => channelId
	],
	(state, userId, clanId, channelId) => {
		if (!channelId) return false;
		const clanState = state.byClans?.[clanId]?.entities;
		if (!clanState) return false;
		return selectById(state.byClans?.[clanId]?.entities, userId)?.ban_list?.[channelId];
	}
);

export const selectBanMemberByChannelId = createSelector(
	[getUsersClanState, (state: RootState) => state.clans.currentClanId as string, (_: RootState, channelId: string) => channelId],
	(state, clanId, channelId) => {
		const clanState = state.byClans?.[clanId]?.entities;
		if (!clanState) return [];
		return selectAll(state.byClans?.[clanId]?.entities).filter((user) => user.ban_list?.[channelId]);
	}
);
