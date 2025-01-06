import { captureSentryError } from '@mezon/logger';
import { IClan, LIMIT_CLAN_ITEM, LoadingStatus, TypeCheck } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiUpdateClanDescRequest, ChannelType } from 'mezon-js';
import { ApiClanDesc, ApiUpdateAccountRequest } from 'mezon-js/api.gen';
import { accountActions } from '../account/account.slice';
import { categoriesActions } from '../categories/categories.slice';
import { channelsActions } from '../channels/channels.slice';
import { usersClanActions } from '../clanMembers/clan.members';
import { eventManagementActions } from '../eventManagement/eventManagement.slice';
import { ensureClient, ensureSession, ensureSocket, getMezonCtx } from '../helpers';
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

const clanMetaAdapter = createEntityAdapter<ClanMeta>();

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
			thunkAPI.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId: '' }));
			thunkAPI.dispatch(clansActions.setCurrentClanId(clanId));
			thunkAPI.dispatch(categoriesActions.fetchCategories({ clanId }));
			thunkAPI.dispatch(usersClanActions.fetchUsersClan({ clanId }));
			thunkAPI.dispatch(rolesClanActions.fetchRolesClan({ clanId }));
			thunkAPI.dispatch(eventManagementActions.fetchEventManagement({ clanId }));
			thunkAPI.dispatch(policiesActions.fetchPermissionsUser({ clanId }));
			thunkAPI.dispatch(policiesActions.fetchPermission());
			thunkAPI.dispatch(defaultNotificationCategoryActions.fetchChannelCategorySetting({ clanId }));
			thunkAPI.dispatch(defaultNotificationActions.getDefaultNotificationClan({ clanId: clanId }));
			thunkAPI.dispatch(channelsActions.fetchChannels({ clanId }));
			thunkAPI.dispatch(channelsActions.setStatusChannelFetch(clanId));
			thunkAPI.dispatch(
				voiceActions.fetchVoiceChannelMembers({
					clanId: clanId ?? '',
					channelId: '',
					channelType: ChannelType.CHANNEL_TYPE_VOICE
				})
			);
			thunkAPI.dispatch(
				usersStreamActions.fetchStreamChannelMembers({
					clanId: clanId ?? '',
					channelId: '',
					channelType: ChannelType.CHANNEL_TYPE_STREAMING
				})
			);
		} catch (error) {
			captureSentryError(error, 'clans/changeCurrentClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchClans = createAsyncThunk<ClansEntity[]>('clans/fetchClans', async (_, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listClanDescs(mezon.session, LIMIT_CLAN_ITEM, 1, '');
		if (!response.clandesc) {
			return [];
		}
		const clans = response.clandesc.map(mapClanToEntity);
		const meta = clans.map((clan) => extractClanMeta(clan));
		thunkAPI.dispatch(clansActions.updateBulkClanMetadata(meta));
		return clans;
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
			thunkAPI.dispatch(fetchClans());
		}
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
		thunkAPI.dispatch(fetchClans());
		return response;
	} catch (error) {
		captureSentryError(error, 'clans/removeClanUsers');
		return thunkAPI.rejectWithValue(error);
	}
});

export const updateClan = createAsyncThunk(
	'clans/updateClans',
	async ({ clan_id, banner, clan_name, creator_id, logo }: ApiUpdateClanDescRequest, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const request: ApiUpdateClanDescRequest = {
				clan_id,
				creator_id,
				clan_name,
				logo,
				banner
			};

			const response = await mezon.client.updateClanDesc(mezon.session, clan_id, request);

			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			thunkAPI.dispatch(fetchClans());
			return response;
		} catch (error) {
			captureSentryError(error, 'clans/updateClans');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateBageClanWS = createAsyncThunk('clans/updateBageClanWS', async ({ channel_id }: { channel_id: string }, thunkAPI) => {
	const state = thunkAPI.getState() as RootState;

	if (!state) {
		throw Error('refresh app error: state does not init');
	}

	const channel = state.channels?.byClans[state.clans?.currentClanId as string]?.entities?.entities?.[channel_id];

	try {
		const numberNotification = channel?.count_mess_unread ? channel?.count_mess_unread : 0;
		if (numberNotification && numberNotification > 0) {
			await thunkAPI.dispatch(clansActions.updateClanBadgeCount({ clanId: channel?.clan_id ?? '', count: numberNotification * -1 }));
		}
	} catch (error) {
		captureSentryError(error, 'clans/updateBageClanWS');
		return thunkAPI.rejectWithValue(error);
	}
});

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
			const mezon = ensureClient(getMezonCtx(thunkAPI));
			const body: ApiUpdateAccountRequest = {
				avatar_url: avatar_url || '',
				display_name: display_name || '',
				lang_tag: 'en',
				location: '',
				timezone: '',
				username: user_name,
				about_me: about_me,
				dob: dob,
				logo: logo,
				encrypt_private_key
			};
			const response = await mezon.client.updateAccount(mezon.session, body);
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
	inviteChannelId: undefined
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
		toggleInvitePeople: (state, action: PayloadAction<{ status: boolean; channelId?: string }>) => {
			state.invitePeople = action.payload.status;
			if (action.payload.status) {
				state.inviteChannelId = action.payload.channelId;
			} else {
				state.inviteChannelId = undefined;
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
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchClans.pending, (state: ClansState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchClans.fulfilled, (state: ClansState, action: PayloadAction<IClan[]>) => {
				clansAdapter.setAll(state, action.payload);
				state.loadingStatus = 'loaded';
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
	updateBageClanWS
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
const { selectAll, selectEntities } = clansAdapter.getSelectors();

export const getClansState = (rootState: { [CLANS_FEATURE_KEY]: ClansState }): ClansState => rootState[CLANS_FEATURE_KEY];
export const selectAllClans = createSelector(getClansState, selectAll);
export const selectCurrentClanId = createSelector(getClansState, (state) => state.currentClanId);

export const selectClanView = createSelector(selectCurrentClanId, (currentClanId) => !!(currentClanId && currentClanId !== '0'));

export const selectClansEntities = createSelector(getClansState, selectEntities);

export const selectClanById = (id: string) => createSelector(selectClansEntities, (clansEntities) => clansEntities[id]);

export const selectCurrentClan = createSelector(selectClansEntities, selectCurrentClanId, (clansEntities, clanId) =>
	clanId ? clansEntities[clanId] : null
);

export const selectDefaultClanId = createSelector(selectAllClans, (clans) => (clans.length > 0 ? clans[0].id : null));

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
		return clan?.badge_count;
	});

export const selectInvitePeopleStatus = createSelector(getClansState, (state) => state.invitePeople);
export const selectInviteChannelId = createSelector(getClansState, (state) => state.inviteChannelId);
