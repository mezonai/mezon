import { captureSentryError } from '@mezon/logger';
import i18n from '@mezon/translations';
import { createClient } from '@mezon/transport';
import type { IInvite, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiInviteUserRes, ApiLinkInviteUser } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';

export const INVITE_FEATURE_KEY = 'invite';

export interface InvitesEntity extends IInvite {
	id: string; // Primary ID
}

export const mapInviteToEntity = (inviteRes: ApiInviteUserRes, inviteId: string) => {
	return { ...inviteRes, id: inviteId || '' };
};

export interface InviteState extends EntityState<InvitesEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	isClickInvite: boolean;
	loadingById: Record<string, LoadingStatus>;
}

export const inviteAdapter = createEntityAdapter<InvitesEntity>();

export type CreateLinkInviteUser = {
	channel_id: string;
	clan_id: string;
	expiry_time: number;
};

export const createLinkInviteUser = createAsyncThunk(
	'invite/createLinkInviteUser',
	async ({ channel_id, clan_id, expiry_time }: CreateLinkInviteUser, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				channel_id,
				clan_id,
				expiry_time
			};
			const response = await mezon.client.createLinkInviteUser(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return response as ApiLinkInviteUser;
		} catch (error) {
			captureSentryError(error, 'invite/createLinkInviteUser');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type InviteUser = {
	inviteId: string;
};

export const inviteUser = createAsyncThunk('invite/inviteUser', async ({ inviteId }: InviteUser, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.inviteUser(mezon.session, inviteId);
		if (!response?.clan_id) {
			const cannotJoinClanMessage = i18n.t('common:cannotJoinClan');
			captureSentryError(cannotJoinClanMessage, 'invite/inviteUser');
			return thunkAPI.rejectWithValue(cannotJoinClanMessage);
		}
		return response as ApiInviteUserRes;
	} catch (error) {
		captureSentryError(error, 'invite/inviteUser');
		return thunkAPI.rejectWithValue(error);
	}
});

export const getLinkInvite = createAsyncThunk('invite/getLinkInvite', async ({ inviteId }: InviteUser, thunkAPI) => {
	try {
		const gw_login = {
			host: process.env.NX_CHAT_APP_API_GW_HOST as string,
			port: process.env.NX_CHAT_APP_API_GW_PORT as string,
			key: process.env.NX_CHAT_APP_API_KEY as string,
			ssl: process.env.NX_CHAT_APP_API_SECURE === 'true'
		};
		const mezon = createClient(gw_login);
		const response = await mezon.getLinkInvite(inviteId);

		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}

		return mapInviteToEntity(response, inviteId);
	} catch (error) {
		captureSentryError(error, 'invite/getLinkInvite');
		return thunkAPI.rejectWithValue(error);
	}
});

export const checkMutableRelationship = createAsyncThunk('invite/getMutableRelation', async ({ userId }: { userId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.isFollower(mezon.session, {
			follow_id: userId
		});
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}

		return response;
	} catch (error) {
		captureSentryError(error, 'invite/getLinkInvite');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialInviteState: InviteState = inviteAdapter.getInitialState({
	loadingStatus: 'not loaded',
	clans: [],
	error: null,
	isClickInvite: false,
	loadingById: {}
});

export const inviteSlice = createSlice({
	name: INVITE_FEATURE_KEY,
	initialState: initialInviteState,
	reducers: {
		add: inviteAdapter.addOne,
		remove: inviteAdapter.removeOne,
		setIsClickInvite: (state, action) => {
			state.isClickInvite = action.payload;
		},
		removeByClanId: (state, action: PayloadAction<string>) => {
			for (const id of state.ids) {
				if (state.entities[id]?.clan_id === action.payload) {
					inviteAdapter.removeOne(state, id);
				}
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getLinkInvite.pending, (state: InviteState, action) => {
				state.loadingStatus = 'loading';
				state.loadingById[action.meta.arg.inviteId] = 'loading';
			})
			.addCase(getLinkInvite.fulfilled, (state: InviteState, action) => {
				inviteAdapter.upsertOne(state, action.payload);
				state.loadingStatus = 'loaded';
				state.loadingById[action.meta.arg.inviteId] = 'loaded';
			})
			.addCase(getLinkInvite.rejected, (state: InviteState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
				state.loadingById[action.meta.arg.inviteId] = 'error';
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const inviteReducer = inviteSlice.reducer;

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
export const inviteActions = {
	...inviteSlice.actions,
	createLinkInviteUser,
	inviteUser,
	getLinkInvite
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
const { selectEntities } = inviteAdapter.getSelectors();

export const getInviteState = (rootState: { [INVITE_FEATURE_KEY]: InviteState }): InviteState => rootState[INVITE_FEATURE_KEY];

export const selectInviteEntities = createSelector(getInviteState, selectEntities);

export const selectInviteById = (id: string) => createSelector(selectInviteEntities, (inviteEntities) => inviteEntities[id]);

export const selectInviteLoadingById = (inviteId: string) => createSelector(getInviteState, (state) => state.loadingById[inviteId]);
