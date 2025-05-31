import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState } from '@reduxjs/toolkit';

import { captureSentryError } from '@mezon/logger';
import { ClanSticker } from 'mezon-js';
import { ApiClanStickerAddRequest, MezonUpdateClanStickerByIdBody } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';

export const SETTING_CLAN_STICKER = 'settingSticker';

const STICKER_CLAN_CACHE_TIME = 1000 * 60 * 60;

export interface SettingClanStickerState extends EntityState<ClanSticker, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	hasGrandchildModal: boolean;
}

export interface UpdateStickerArgs {
	request: MezonUpdateClanStickerByIdBody;
	stickerId: string;
}
export const stickerAdapter = createEntityAdapter({
	selectId: (sticker: ClanSticker) => sticker.id || ''
});

export const initialSettingClanStickerState: SettingClanStickerState = stickerAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	hasGrandchildModal: false
});

export const fetchStickerByUserIdCached = memoizeAndTrack(
	async (mezon: MezonValueContext) => {
		const response = await mezon.client.getListStickersByUserId(mezon.session);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: STICKER_CLAN_CACHE_TIME,
		normalizer: (args) => {
			return args[0]?.session?.username || '';
		}
	}
);

export const fetchStickerByUserId = createAsyncThunk(
	'settingClanSticker/fetchClanSticker',
	async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchStickerByUserIdCached.delete(mezon);
			}

			const response = await fetchStickerByUserIdCached(mezon);

			if (response) {
				return response.stickers ?? [];
			}
			throw new Error('Emoji list is undefined or null');
		} catch (error) {
			captureSentryError(error, 'settingClanSticker/fetchClanSticker');
			return thunkAPI.rejectWithValue(error);
		}
	}
);
export const createSticker = createAsyncThunk(
	'settingClanSticker/createSticker',
	async (form: { request: ApiClanStickerAddRequest; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const res = await mezon.client.addClanSticker(mezon.session, form.request);
			if (res) {
				thunkAPI.dispatch(fetchStickerByUserId({ noCache: true }));
			} else {
				return thunkAPI.rejectWithValue({});
			}
		} catch (error) {
			captureSentryError(error, 'settingClanSticker/createSticker');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateSticker = createAsyncThunk('settingClanSticker/updateSticker', async ({ request, stickerId }: UpdateStickerArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const res = await mezon.client.updateClanStickerById(mezon.session, stickerId, request);
		if (res) {
			thunkAPI.dispatch(stickerSettingActions.update({ id: stickerId, changes: { ...request } }));
		}
	} catch (error) {
		captureSentryError(error, 'settingClanSticker/updateSticker');
		return thunkAPI.rejectWithValue(error);
	}
});

export const removeStickersByClanId = createAsyncThunk('settingClanSticker/removeStickersByClanId', async (clanId: string, thunkAPI) => {
	const state = thunkAPI.getState() as { settingSticker: SettingClanStickerState };
	const stickersToRemove = state.settingSticker.entities;
	const stickerIdsToRemove = Object.values(stickersToRemove)
		.filter((sticker) => sticker?.clan_id === clanId)
		.map((sticker) => sticker?.id) as string[];
	thunkAPI.dispatch(stickerSettingActions.removeMany(stickerIdsToRemove));
});

export const deleteSticker = createAsyncThunk(
	'settingClanSticker/deleteSticker',
	async (data: { stickerId: string; clan_id: string; stickerLabel: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const res = await mezon.client.deleteClanStickerById(mezon.session, data.stickerId, data.clan_id, data.stickerLabel);
			if (res) {
				thunkAPI.dispatch(stickerSettingActions.remove(data.stickerId));
			}
		} catch (error) {
			captureSentryError(error, 'settingClanSticker/deleteSticker');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const settingClanStickerSlice = createSlice({
	name: SETTING_CLAN_STICKER,
	initialState: initialSettingClanStickerState,
	reducers: {
		add: stickerAdapter.addOne,
		remove: stickerAdapter.removeOne,
		update: stickerAdapter.updateOne,
		removeMany: stickerAdapter.removeMany,
		openModalInChild: (state) => {
			state.hasGrandchildModal = true;
		},
		closeModalInChild: (state) => {
			state.hasGrandchildModal = false;
		}
	},
	extraReducers(builder) {
		builder
			.addCase(fetchStickerByUserId.fulfilled, (state: SettingClanStickerState, actions) => {
				state.loadingStatus = 'loaded';
				stickerAdapter.setAll(state, actions.payload);
			})
			.addCase(fetchStickerByUserId.pending, (state: SettingClanStickerState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchStickerByUserId.rejected, (state: SettingClanStickerState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const stickerSettingActions = {
	...settingClanStickerSlice.actions,
	fetchStickerByUserId,
	removeStickersByClanId
};

export const getStickerSettingState = (rootState: { [SETTING_CLAN_STICKER]: SettingClanStickerState }): SettingClanStickerState =>
	rootState[SETTING_CLAN_STICKER];
const { selectAll, selectEntities, selectById } = stickerAdapter.getSelectors();
export const selectAllStickerSuggestion = createSelector(getStickerSettingState, selectAll);
export const selectStickerSuggestionEntities = createSelector(getStickerSettingState, selectEntities);
export const selectOneStickerInfor = (stickerId: string) => createSelector(getStickerSettingState, (state) => selectById(state, stickerId));

export const hasGrandchildModal = createSelector(getStickerSettingState, (state) => state.hasGrandchildModal);
export const selectStickerByClanId = (clanId: string) =>
	createSelector(selectAllStickerSuggestion, (stickers) => {
		return stickers.filter((sticker) => sticker.clan_id === clanId);
	});
export const settingStickerReducer = settingClanStickerSlice.reducer;
export const settingClanStickerActions = { ...settingClanStickerSlice.actions, fetchStickerByUserId };
