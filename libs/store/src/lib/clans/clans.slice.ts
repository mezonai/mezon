import { captureSentryError } from '@mezon/logger';
import { IClan, LIMIT_CLAN_ITEM, LoadingStatus, TypeCheck } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelType, ClanUpdatedEvent } from 'mezon-js';
import { ApiClanDesc, ApiUpdateAccountRequest, MezonUpdateClanDescBody } from 'mezon-js/api.gen';
import { batch } from 'react-redux';
import { accountActions } from '../account/account.slice';
import { CacheMetadata, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelsActions } from '../channels/channels.slice';
import { usersClanActions } from '../clanMembers/clan.members';
import { eventManagementActions } from '../eventManagement/eventManagement.slice';
import { MezonValueContext, ensureClient, ensureSession, ensureSocket, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import { defaultNotificationCategoryActions } from '../notificationSetting/notificationSettingCategory.slice';
import { defaultNotificationActions } from '../notificationSetting/notificationSettingClan.slice';
import { policiesActions } from '../policies/policies.slice';
import { rolesClanActions } from '../roleclan/roleclan.slice';
import { RootState } from '../store';
import { usersStreamActions } from '../stream/usersStream.slice';
import { voiceActions } from '../voice/voice.slice';

export const CLANS_FEATURE_KEY = 'clans';

/*
 * Update these interfaces according to your requirements.
 */

export interface ClansEntity extends IClan {
	id: string; // Primary ID
}

export const mapClanToEntity = (clanRes: ApiClanDesc) => {
	return { ...clanRes, id: clanRes.clan_id || '' };
};

interface ClanMeta {
	id: string;
	showNumEvent: boolean;
}

export interface ClanGroup {
	id: string;
	name?: string;
	clanIds: string[];
	isExpanded: boolean;
	createdAt: number;
}

export interface ClanGroupItem {
	type: 'clan' | 'group';
	id: string;
	clanId?: string;
	groupId?: string;
}

const clanMetaAdapter = createEntityAdapter<ClanMeta>();
const clanGroupAdapter = createEntityAdapter<ClanGroup>();

function extractClanMeta(clan: ClansEntity): ClanMeta {
	return {
		id: clan.id,
		showNumEvent: true
	};
}

export interface ClansState extends EntityState<ClansEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentClanId?: string | null;
	clanMetadata: EntityState<ClanMeta, string>;
	invitePeople: boolean;
	inviteChannelId?: string;
	inviteClanId?: string;
	clansOrder?: string[];
	// Add clan groups state
	clanGroups: EntityState<ClanGroup, string>;
	clanGroupOrder: ClanGroupItem[];
	cache?: CacheMetadata;
}

export const clansAdapter = createEntityAdapter<ClansEntity>();

export type ChangeCurrentClanArgs = {
	clanId: string;
	noCache?: boolean;
};

export const changeCurrentClan = createAsyncThunk<void, ChangeCurrentClanArgs>(
	'clans/changeCurrentClan',
	async ({ clanId, noCache = false }: ChangeCurrentClanArgs, thunkAPI) => {
		try {
			batch(() => {
				thunkAPI.dispatch(clansActions.setCurrentClanId(clanId as string));
				thunkAPI.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId: '' }));
				thunkAPI.dispatch(channelsActions.fetchChannels({ clanId }));

				thunkAPI.dispatch(usersClanActions.fetchUsersClan({ clanId }));
				thunkAPI.dispatch(rolesClanActions.fetchRolesClan({ clanId }));
				thunkAPI.dispatch(eventManagementActions.fetchEventManagement({ clanId }));
				thunkAPI.dispatch(policiesActions.fetchPermissionsUser({ clanId }));
				thunkAPI.dispatch(policiesActions.fetchPermission({}));
				thunkAPI.dispatch(defaultNotificationCategoryActions.fetchChannelCategorySetting({ clanId }));
				thunkAPI.dispatch(defaultNotificationActions.getDefaultNotificationClan({ clanId: clanId }));
				thunkAPI.dispatch(channelsActions.setStatusChannelFetch(clanId));
				thunkAPI.dispatch(
					voiceActions.fetchVoiceChannelMembers({
						clanId: clanId ?? '',
						channelId: '',
						channelType: ChannelType.CHANNEL_TYPE_GMEET_VOICE
					})
				);
				thunkAPI.dispatch(
					usersStreamActions.fetchStreamChannelMembers({
						clanId: clanId ?? '',
						channelId: '',
						channelType: ChannelType.CHANNEL_TYPE_STREAMING
					})
				);
			});
		} catch (error) {
			captureSentryError(error, 'clans/changeCurrentClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

const selectCachedClans = createSelector([(state: RootState) => state[CLANS_FEATURE_KEY]], (clansState) => {
	return clansAdapter.getSelectors().selectAll(clansState);
});

export const fetchClansCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	limit?: number,
	state?: number,
	cursor?: string,
	noCache = false
) => {
	const rootState = getState();
	const clansState = rootState[CLANS_FEATURE_KEY];
	const apiKey = createApiKey('fetchClans', limit?.toString() || '', state?.toString() || '', cursor || '');

	const shouldForceCall = shouldForceApiCall(apiKey, clansState.cache, noCache);

	if (!shouldForceCall) {
		const clans = selectCachedClans(rootState);
		return {
			clandesc: clans,
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListClanDescs',
			list_clan_req: {
				limit: limit,
				state: 1
			}
		},
		() => ensuredMezon.client.listClanDescs(ensuredMezon.session, limit, state, cursor || ''),
		'clan_desc_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

export type FetchClansPayload = {
	clans: IClan[];
	fromCache?: boolean;
};

export const fetchClans = createAsyncThunk('clans/fetchClans', async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchClansCached(thunkAPI.getState as () => RootState, mezon, LIMIT_CLAN_ITEM, 1, '', noCache);
		if (!response.clandesc) {
			return { clans: [], fromCache: response.fromCache };
		}
		const clans = response.clandesc.map(mapClanToEntity);
		const meta = clans.map((clan: ClansEntity) => extractClanMeta(clan));
		thunkAPI.dispatch(clansActions.updateBulkClanMetadata(meta));
		const payload: FetchClansPayload = {
			clans,
			fromCache: response.fromCache
		};
		return payload;
	} catch (error) {
		captureSentryError(error, 'clans/fetchClans');
		return thunkAPI.rejectWithValue(error);
	}
});

type CreatePayload = {
	clan_name: string;
	logo?: string;
};

export const createClan = createAsyncThunk('clans/createClans', async ({ clan_name, logo }: CreatePayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const body = {
			banner: '',
			clan_name: clan_name,
			creator_id: '',
			logo: logo ?? ''
		};
		const response = await mezon.client.createClanDesc(mezon.session, body);
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}
		return mapClanToEntity(response);
	} catch (error) {
		captureSentryError(error, 'clans/createClans');
		return thunkAPI.rejectWithValue(error);
	}
});

export const checkDuplicateNameClan = createAsyncThunk('clans/duplicateNameClan', async (clan_name: string, thunkAPI) => {
	try {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		const isDuplicateName = await mezon.socketRef.current?.checkDuplicateName(clan_name, '', TypeCheck.TYPECLAN);

		if (isDuplicateName?.type === TypeCheck.TYPECLAN) {
			return isDuplicateName.exist;
		}
		return;
	} catch (error) {
		captureSentryError(error, 'clans/duplicateNameClan');
		return thunkAPI.rejectWithValue(error);
	}
});

export const deleteClan = createAsyncThunk('clans/deleteClans', async (body: ChangeCurrentClanArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.deleteClanDesc(mezon.session, body.clanId);
		if (response) {
			thunkAPI.dispatch(fetchClans({ noCache: true }));
		}
	} catch (error) {
		captureSentryError(error, 'clans/deleteClans');
		return thunkAPI.rejectWithValue(error);
	}
});

export const transferClan = createAsyncThunk('clans/transferClan', async (body: { clanId: string; new_clan_owner: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.transferOwnership(mezon.session, {
			clan_id: body.clanId,
			new_owner_id: body.new_clan_owner
		});
		if (response) {
			return {
				clanId: body.clanId,
				new_clan_owner: body.new_clan_owner
			};
		}
		return null;
	} catch (error) {
		captureSentryError(error, 'clans/deleteClans');
		return thunkAPI.rejectWithValue(error);
	}
});

type removeClanUsersPayload = {
	clanId: string;
	userIds: string[];
};

export const removeClanUsers = createAsyncThunk('clans/removeClanUsers', async ({ clanId, userIds }: removeClanUsersPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.removeClanUsers(mezon.session, clanId, userIds);
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}
		thunkAPI.dispatch(fetchClans({ noCache: true }));
		return response;
	} catch (error) {
		captureSentryError(error, 'clans/removeClanUsers');
		return thunkAPI.rejectWithValue(error);
	}
});

export const updateClan = createAsyncThunk(
	'clans/updateClans',
	async ({ clan_id, request }: { clan_id: string; request: MezonUpdateClanDescBody }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await mezon.client.updateClanDesc(mezon.session, clan_id, request);

			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			thunkAPI.dispatch(fetchClans({ noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'clans/updateClans');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type UpdateLinkUser = {
	user_name: string;
	avatar_url: string;
	display_name: string;
	about_me: string;
	dob: string;
	noCache?: boolean;
	logo?: string;
	encrypt_private_key?: string;
};

export const updateUser = createAsyncThunk(
	'clans/updateUser',
	async ({ user_name, avatar_url, display_name, about_me, logo, noCache = false, dob, encrypt_private_key }: UpdateLinkUser, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const currentUser = state.account?.userProfile;

			const mezon = ensureClient(getMezonCtx(thunkAPI));

			const body: Partial<ApiUpdateAccountRequest> = {};

			if (user_name && user_name !== currentUser?.user?.username) {
				body.username = user_name;
			}

			if (avatar_url && avatar_url !== currentUser?.user?.avatar_url) {
				body.avatar_url = avatar_url || '';
			}

			if (display_name && display_name !== currentUser?.user?.display_name) {
				body.display_name = display_name || '';
			}

			if (about_me && about_me !== currentUser?.user?.about_me) {
				body.about_me = about_me;
			}

			if (dob && dob !== currentUser?.user?.dob) {
				body.dob = dob;
			}

			if (logo !== currentUser?.logo) {
				body.logo = logo;
			}

			if (encrypt_private_key && encrypt_private_key !== currentUser?.encrypt_private_key) {
				body.encrypt_private_key = encrypt_private_key;
			}

			if (Object.keys(body).length === 0) {
				return true;
			}

			const response = await mezon.client.updateAccount(mezon.session, body as ApiUpdateAccountRequest);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (response) {
				// thunkAPI.dispatch(accountActions.getUserProfile({ noCache: true }));
				thunkAPI.dispatch(
					accountActions.setUpdateAccount({
						logo,
						encrypt_private_key,
						user: {
							avatar_url: avatar_url || '',
							display_name: display_name || '',
							lang_tag: 'en',
							location: '',
							timezone: '',
							username: user_name,
							about_me: about_me,
							dob: dob
						}
					})
				);
			}
			return response as true;
		} catch (error) {
			captureSentryError(error, 'clans/updateUser');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

interface JoinClanPayload {
	clanId: string;
}

export const joinClan = createAsyncThunk<void, JoinClanPayload>('direct/joinClan', async ({ clanId }, thunkAPI) => {
	try {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		await mezon.socketRef.current?.joinClanChat(clanId);
	} catch (error) {
		captureSentryError(error, 'clans/joinClan');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialClansState: ClansState = clansAdapter.getInitialState({
	loadingStatus: 'not loaded',
	clans: [],
	error: null,
	clanMetadata: clanMetaAdapter.getInitialState(),
	invitePeople: false,
	inviteChannelId: undefined,
	inviteClanId: undefined,
	clansOrder: [],
	clanGroups: clanGroupAdapter.getInitialState(),
	clanGroupOrder: []
});

type UpdateClanBadgeCountPayload = {
	clanId: string;
	channels: {
		channelId: string;
		count: number;
	}[];
};

export const clansSlice = createSlice({
	name: CLANS_FEATURE_KEY,
	initialState: initialClansState,
	reducers: {
		add: clansAdapter.addOne,
		remove: clansAdapter.removeOne,
		removeAll: clansAdapter.removeAll,
		setCurrentClanId: (state, action: PayloadAction<string>) => {
			state.currentClanId = action.payload;
		},
		updateClansOrder: (state, action: PayloadAction<string[]>) => {
			state.clansOrder = action.payload;
		},
		updateClanOwner: (state, action: PayloadAction<{ clanId: string; newOwnerId: string }>) => {
			clansAdapter.updateOne(state, {
				id: action.payload.clanId,
				changes: { creator_id: action.payload.newOwnerId }
			});
		},

		createClanGroup: (state, action: PayloadAction<{ clanIds: string[]; name?: string }>) => {
			const { clanIds, name } = action.payload;
			const groupId = `group_${Date.now()}`;

			const newGroup: ClanGroup = {
				id: groupId,
				name,
				clanIds,
				isExpanded: false,
				createdAt: Date.now()
			};

			clanGroupAdapter.addOne(state.clanGroups, newGroup);

			const newOrder: ClanGroupItem[] = [];
			const processedClanIds = new Set<string>();

			newOrder.push({
				type: 'group',
				id: groupId,
				groupId
			});

			clanIds.forEach((id) => processedClanIds.add(id));

			state.clanGroupOrder.forEach((item) => {
				if (item.type === 'clan' && item.clanId && !processedClanIds.has(item.clanId)) {
					newOrder.push(item);
				} else if (item.type === 'group') {
					newOrder.push(item);
				}
			});

			state.clanGroupOrder = newOrder;
		},

		addClanToGroup: (state, action: PayloadAction<{ groupId: string; clanId: string }>) => {
			const { groupId, clanId } = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group && !group.clanIds.includes(clanId)) {
				group.clanIds.push(clanId);

				state.clanGroupOrder = state.clanGroupOrder.filter((item) => !(item.type === 'clan' && item.clanId === clanId));
			}
		},

		removeClanFromGroup: (state, action: PayloadAction<{ groupId: string; clanId: string }>) => {
			const { groupId, clanId } = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group) {
				group.clanIds = group.clanIds.filter((id) => id !== clanId);

				if (group.clanIds.length === 0) {
					clanGroupAdapter.removeOne(state.clanGroups, groupId);
					state.clanGroupOrder = state.clanGroupOrder.filter((item) => !(item.type === 'group' && item.groupId === groupId));
				} else {
					const groupIndex = state.clanGroupOrder.findIndex((item) => item.type === 'group' && item.groupId === groupId);

					if (groupIndex !== -1) {
						state.clanGroupOrder.splice(groupIndex + 1, 0, {
							type: 'clan',
							id: clanId,
							clanId
						});
					}
				}
			}
		},

		reorderClansInGroup: (state, action: PayloadAction<{ groupId: string; clanIds: string[] }>) => {
			const { groupId, clanIds } = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group) {
				group.clanIds = clanIds;
			}
		},

		toggleGroupExpanded: (state, action: PayloadAction<string>) => {
			const groupId = action.payload;
			const group = state.clanGroups.entities[groupId];

			if (group) {
				group.isExpanded = !group.isExpanded;
			}
		},

		collapseAllGroups: (state) => {
			Object.values(state.clanGroups.entities).forEach((group) => {
				if (group && group.isExpanded) {
					group.isExpanded = false;
				}
			});
		},

		updateClanGroupOrder: (state, action: PayloadAction<ClanGroupItem[]>) => {
			state.clanGroupOrder = action.payload;
		},

		initializeClanGroupOrder: (state) => {
			if (state.clanGroupOrder.length === 0) {
				const order = state.clansOrder || state.ids;
				state.clanGroupOrder = order.map((clanId) => ({
					type: 'clan' as const,
					id: clanId,
					clanId
				}));
			}
		},

		toggleInvitePeople: (state, action: PayloadAction<{ status: boolean; clanId?: string; channelId?: string }>) => {
			state.invitePeople = action.payload.status;
			if (action.payload.status) {
				state.inviteChannelId = action.payload.channelId;
				state.inviteClanId = action.payload.clanId;
			} else {
				state.inviteChannelId = undefined;
				state.inviteClanId = undefined;
			}
		},
		updateBulkClanMetadata: (state, action: PayloadAction<ClanMeta[]>) => {
			state.clanMetadata = clanMetaAdapter.upsertMany(state.clanMetadata, action.payload);
		},
		setClanShowNumEvent: (state, action: PayloadAction<{ clanId: string; status: boolean }>) => {
			const clan = state.clanMetadata.entities[action.payload.clanId];
			if (clan) {
				clan.showNumEvent = action.payload.status;
			}
		},
		removeByClanID: (state, action: PayloadAction<string>) => {
			clansAdapter.removeOne(state, action.payload);
		},
		updateClanBadgeCount: (state: ClansState, action: PayloadAction<{ clanId: string; count: number; isReset?: boolean }>) => {
			const { clanId, count, isReset } = action.payload;
			const entity = state.entities[clanId];
			if (entity) {
				const newBadgeCount = !isReset ? (entity.badge_count ?? 0) + count : 0;
				if (!entity.badge_count && newBadgeCount === 0) return;
				if (entity.badge_count !== newBadgeCount) {
					clansAdapter.updateOne(state, {
						id: clanId,
						changes: {
							badge_count: newBadgeCount
						}
					});
				}
			}
		},
		updateClanBadgeCount2: (state, action: PayloadAction<UpdateClanBadgeCountPayload>) => {
			const { clanId, channels } = action.payload;
			const clan = state.entities[clanId];

			if (clan) {
				const totalCount = channels.reduce((sum, { count }) => sum + count, 0);
				clan.badge_count = Math.max(0, (clan.badge_count ?? 0) + totalCount);
			}
		},
		refreshStatus(state) {
			state.loadingStatus = 'not loaded';
		},
		updateOnboardingMode: (state, action: PayloadAction<{ clanId: string; onboarding: boolean }>) => {
			const { clanId, onboarding } = action.payload;
			clansAdapter.updateOne(state, {
				id: clanId,
				changes: {
					is_onboarding: onboarding
				}
			});
		},
		update: (state, action: PayloadAction<{ dataUpdate: ClanUpdatedEvent }>) => {
			const { dataUpdate } = action.payload;

			const currentClanData = clansAdapter.getSelectors().selectById(state, dataUpdate.clan_id);
			clansAdapter.updateOne(state, {
				id: dataUpdate.clan_id as string,
				changes: {
					clan_id: dataUpdate.clan_id,
					clan_name: dataUpdate.clan_name,
					logo: dataUpdate.logo,
					banner: dataUpdate.banner,
					is_onboarding: dataUpdate.is_onboarding,
					welcome_channel_id: dataUpdate.welcome_channel_id !== '-1' ? dataUpdate.welcome_channel_id : currentClanData.welcome_channel_id
				}
			});
		},
		invalidateCache: (state) => {
			if (state.cache) {
				state.cache = undefined;
			}
		},
		clearClanGroups: (state) => {
			state.clanGroups = clanGroupAdapter.getInitialState();
			state.clanGroupOrder = [];
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchClans.pending, (state: ClansState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchClans.fulfilled, (state: ClansState, action: PayloadAction<FetchClansPayload>) => {
				const { clans, fromCache } = action.payload;
				state.loadingStatus = 'loaded';

				if (fromCache) return;

				clansAdapter.setAll(state, clans);
				state.cache = createCacheMetadata();
			})
			.addCase(fetchClans.rejected, (state: ClansState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});

		builder
			.addCase(createClan.pending, (state: ClansState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(createClan.fulfilled, (state: ClansState, action: PayloadAction<IClan>) => {
				clansAdapter.addOne(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(createClan.rejected, (state: ClansState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder.addCase(deleteClan.pending, (state: ClansState) => {
			state.loadingStatus = 'loading';
		});
		builder.addCase(deleteClan.fulfilled, (state: ClansState) => {
			state.loadingStatus = 'loaded';
		});
		builder.addCase(deleteClan.rejected, (state: ClansState, action) => {
			state.loadingStatus = 'error';
			state.error = action.error.message;
		});
		builder.addCase(transferClan.fulfilled, (state: ClansState, action) => {
			if (!action.payload) return;
			const { clanId, new_clan_owner } = action.payload;
			clansAdapter.updateOne(state, {
				id: clanId,
				changes: { creator_id: new_clan_owner }
			});
		});
	}
});

/*
 * Export reducer for store configuration.
 */
export const clansReducer = clansSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(clansActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const clansActions = {
	...clansSlice.actions,
	fetchClans,
	createClan,
	updateClan,
	removeClanUsers,
	changeCurrentClan,
	updateUser,
	deleteClan,
	joinClan,
	transferClan
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllClans);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities, selectById } = clansAdapter.getSelectors();

export const getClansState = (rootState: { [CLANS_FEATURE_KEY]: ClansState }): ClansState => rootState[CLANS_FEATURE_KEY];
export const selectAllClans = createSelector(getClansState, selectAll);
export const selectClanNumber = createSelector(getClansState, (state) => state?.ids?.length || 0);
export const selectCurrentClanId = createSelector(getClansState, (state) => state.currentClanId);
export const selectClansLoadingStatus = createSelector(getClansState, (state) => state.loadingStatus);

export const selectClanView = createSelector(selectCurrentClanId, (currentClanId) => !!(currentClanId && currentClanId !== '0'));

export const selectClansEntities = createSelector(getClansState, selectEntities);

export const selectClanById = (id: string) => createSelector(selectClansEntities, (clansEntities) => clansEntities[id]);

export const selectCurrentClan = createSelector(selectClansEntities, selectCurrentClanId, (clansEntities, clanId) =>
	clanId ? clansEntities[clanId] : null
);

export const selectDefaultClanId = createSelector(selectAllClans, (clans) => (clans.length > 0 ? clans[0].id : null));
export const selectOrderedClans = createSelector([selectAllClans, (state: RootState) => state.clans.clansOrder], (clans, order) => {
	if (!order || order.length === 0) return clans;

	const clanMap = Object.fromEntries(clans.map((clan) => [clan.id, clan]));

	const orderedClans = order.map((id) => clanMap[id]).filter(Boolean);

	const remainingClans = clans.filter((clan) => !order.includes(clan.id));

	return [...orderedClans, ...remainingClans];
});

export const selectShowNumEvent = (clanId: string) =>
	createSelector(getClansState, (state) => {
		const clan = state.clanMetadata.entities[clanId];
		return clan?.showNumEvent || false;
	});

export const selectBadgeCountAllClan = createSelector(selectAllClans, (clan) => {
	return clan.reduce((total, count) => total + (count.badge_count ?? 0), 0);
});

export const selectBadgeCountByClanId = (clanId: string) =>
	createSelector(getClansState, (state) => {
		const clan = state.entities[clanId];
		return clan?.badge_count || 0;
	});

export const selectInvitePeopleStatus = createSelector(getClansState, (state) => state.invitePeople);
export const selectInviteChannelId = createSelector(getClansState, (state) => state.inviteChannelId);
export const selectInviteClanId = createSelector(getClansState, (state) => state.inviteClanId);
export const selectWelcomeChannelByClanId = createSelector([getClansState, (state, clanId: string) => clanId], (state, clanId) => {
	return selectById(state, clanId)?.welcome_channel_id || null;
});

export const selectClanGroups = createSelector(getClansState, (state) => clanGroupAdapter.getSelectors().selectAll(state.clanGroups));

export const selectClanGroupEntities = createSelector(getClansState, (state) => clanGroupAdapter.getSelectors().selectEntities(state.clanGroups));

export const selectClanGroupById = (groupId: string) => createSelector(selectClanGroupEntities, (entities) => entities[groupId]);

export const selectClanGroupOrder = createSelector(getClansState, (state) => state?.clanGroupOrder || []);

export const selectOrderedClansWithGroups = createSelector([selectAllClans, selectClanGroups, selectClanGroupOrder], (clans, groups, order) => {
	if (!order || order.length === 0) {
		return clans.map((clan) => ({
			type: 'clan' as const,
			id: clan.id,
			clan
		}));
	}

	const clanMap = Object.fromEntries(clans.map((clan) => [clan.id, clan]));
	const groupMap = Object.fromEntries(groups.map((group) => [group.id, group]));

	const clansInGroups = new Set<string>();
	groups.forEach((group) => {
		group.clanIds.forEach((clanId) => clansInGroups.add(clanId));
	});

	const orderedItems = order
		.map((item) => {
			if (item.type === 'clan' && item.clanId) {
				const clan = clanMap[item.clanId];
				return clan ? { type: 'clan' as const, id: item.id, clan } : null;
			} else if (item.type === 'group' && item.groupId) {
				const group = groupMap[item.groupId];
				return group ? { type: 'group' as const, id: item.id, group } : null;
			}
			return null;
		})
		.filter(Boolean);

	const orderedClanIds = new Set(
		order
			.filter((item) => item.type === 'clan')
			.map((item) => item.clanId)
			.filter(Boolean)
	);

	const remainingClans = clans
		.filter((clan) => !clansInGroups.has(clan.id) && !orderedClanIds.has(clan.id))
		.map((clan) => ({
			type: 'clan' as const,
			id: clan.id,
			clan
		}));

	return [...orderedItems, ...remainingClans];
});
