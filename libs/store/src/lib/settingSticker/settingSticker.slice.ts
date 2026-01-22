import type { LoadingStatus } from '@mezon/utils';
import type { EntityState } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

import { captureSentryError } from '@mezon/logger';
import type { ClanSticker } from 'mezon-js';
import type { ApiClanStickerAddRequest, MezonUpdateClanStickerByIdBody } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const SETTING_CLAN_STICKER = 'settingSticker';

export enum MediaType {
	STICKER = 0,
	AUDIO = 1
}

interface CustomRequest extends ApiClanStickerAddRequest {
	media_type?: MediaType;
}

interface SoundRequest extends ApiClanStickerAddRequest {
	media_type: MediaType;
}

interface CustomUpdateRequest extends MezonUpdateClanStickerByIdBody {
	media_type?: MediaType;
}

interface SoundUpdateRequest extends MezonUpdateClanStickerByIdBody {
	media_type: MediaType;
}

export interface SettingClanStickerState extends EntityState<ClanSticker, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	hasGrandchildModal: boolean;
	cache?: CacheMetadata;
}

export interface UpdateStickerArgs {
	request: CustomUpdateRequest;
	stickerId: string;
}

export interface UpdateSoundArgs {
	request: SoundUpdateRequest;
	soundId: string;
}

export const stickerAdapter = createEntityAdapter({
	selectId: (sticker: ClanSticker) => sticker.id || ''
});

export const initialSettingClanStickerState: SettingClanStickerState = stickerAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	hasGrandchildModal: false
});

const { selectAll } = stickerAdapter.getSelectors();

const selectCachedSticker = createSelector([(state: RootState) => state[SETTING_CLAN_STICKER]], (entitiesState) => {
	return entitiesState ? selectAll(entitiesState) : [];
});

export const fetchStickerByUserIdCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, noCache = false, clanId: string) => {
	const state = getState();
	const stickerData = state[SETTING_CLAN_STICKER];
	const apiKey = createApiKey(`fetchStickerByUserId_${clanId}`);
	const shouldForceCall = shouldForceApiCall(apiKey, stickerData?.cache, noCache);

	if (!shouldForceCall) {
		const sticker = selectCachedSticker(state);
		return {
			stickers: sticker,
			time: Date.now(),
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'GetListStickersByUserId'
		},
		(session) => ensuredMezon.client.getListStickersByUserId(session),
		'sticker_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

export const fetchStickerByUserId = createAsyncThunk(
	'settingClanSticker/fetchClanSticker',
	async ({ noCache = false, clanId }: { noCache?: boolean; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchStickerByUserIdCached(thunkAPI.getState as () => RootState, mezon, noCache, clanId);

			if (response) {
				const stickersWithMediaType = response.stickers || [];

				const processedStickers = stickersWithMediaType.map((sticker: ClanSticker & { media_type?: MediaType }) => {
					const isAudioFile =
						sticker.source && (sticker.source.endsWith('.mp3') || sticker.source.endsWith('.wav') || sticker.source.includes('/sounds/'));

					const mediaType = sticker.media_type !== undefined ? sticker.media_type : isAudioFile ? MediaType.AUDIO : MediaType.STICKER;

					return {
						...sticker,
						media_type: mediaType
					};
				});

				return {
					stickers: processedStickers || [],
					fromCache: !!response?.fromCache
				};
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
	async (form: { request: CustomRequest; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const requestWithMediaType = {
				...form.request,
				media_type: form.request.media_type !== undefined ? form.request.media_type : MediaType.STICKER
			};

			const res = await mezon.client.addClanSticker(mezon.session, requestWithMediaType);

			if (res) {
				thunkAPI.dispatch(fetchStickerByUserId({ noCache: true, clanId: form.clanId }));
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

		const requestWithMediaType = request;

		const res = await mezon.client.updateClanStickerById(mezon.session, stickerId, requestWithMediaType);
		if (res) {
			thunkAPI.dispatch(stickerSettingActions.update({ id: stickerId, changes: { ...requestWithMediaType } }));
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

export const createSound = createAsyncThunk('settingClanSticker/createSound', async (form: { request: SoundRequest; clanId: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const soundRequest = {
			...form.request,
			media_type: MediaType.AUDIO
		};

		const res = await mezon.client.addClanSticker(mezon.session, soundRequest);

		if (res) {
			thunkAPI.dispatch(fetchStickerByUserId({ noCache: true, clanId: form.clanId }));
		} else {
			return thunkAPI.rejectWithValue({});
		}
	} catch (error) {
		captureSentryError(error, 'settingClanSticker/createSound');
		return thunkAPI.rejectWithValue(error);
	}
});

export const updateSound = createAsyncThunk('settingClanSticker/updateSound', async ({ request, soundId }: UpdateSoundArgs, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const soundRequest = {
			...request,
			media_type: MediaType.AUDIO
		};

		const res = await mezon.client.updateClanStickerById(mezon.session, soundId, soundRequest);

		if (res) {
			thunkAPI.dispatch(stickerSettingActions.update({ id: soundId, changes: { ...soundRequest } }));
		}
	} catch (error) {
		captureSentryError(error, 'settingClanSticker/updateSound');
		return thunkAPI.rejectWithValue(error);
	}
});

export const deleteSound = createAsyncThunk(
	'settingClanSticker/deleteSound',
	async (data: { soundId: string; clan_id: string; soundLabel: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const res = await mezon.client.deleteClanStickerById(mezon.session, data.soundId, data.clan_id, data.soundLabel);

			if (res) {
				thunkAPI.dispatch(stickerSettingActions.remove(data.soundId));
			}
		} catch (error) {
			captureSentryError(error, 'settingClanSticker/deleteSound');
			return thunkAPI.rejectWithValue(error);
		}
	}
);
export const fetchSoundByUserId = createAsyncThunk(
	'settingClanSticker/fetchSound',
	async ({ noCache = false, clanId }: { noCache?: boolean; clanId: string }, thunkAPI) => {
		try {
			await thunkAPI.dispatch(fetchStickerByUserId({ noCache, clanId }));

			const state = thunkAPI.getState() as { settingSticker: SettingClanStickerState };

			const allStickers = selectAllStickerSuggestion(state);
			const sounds = allStickers.filter((sticker) => (sticker as any).media_type === MediaType.AUDIO);

			return sounds;
		} catch (error) {
			captureSentryError(error, 'settingClanSticker/fetchSound');
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
		},
		invalidateCache: (state) => {
			if (state.cache) {
				state.cache = undefined;
			}
		}
	},
	extraReducers(builder) {
		builder
			.addCase(fetchStickerByUserId.fulfilled, (state: SettingClanStickerState, actions: any) => {
				if (!actions?.payload?.fromCache) state.cache = createCacheMetadata();

				if (actions?.payload?.stickers) stickerAdapter.setAll(state, actions?.payload?.stickers);
				state.loadingStatus = 'loaded';
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

export const selectAllStickerSuggestion = createSelector(getStickerSettingState, selectAll);

export const hasGrandchildModal = createSelector(getStickerSettingState, (state) => state.hasGrandchildModal);

export const selectStickersByClanIdSelector = createSelector(
	[selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId],
	(stickers, clanId) =>
		stickers.filter(
			(sticker) =>
				sticker.clan_id === clanId && ((sticker as any).media_type === MediaType.STICKER || (sticker as any).media_type === undefined)
		)
);

export const selectStickersByClanId = (clanId: string) => (state: RootState) => selectStickersByClanIdSelector(state, clanId);

export const selectAudioByClanId = createSelector([selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId], (stickers, clanId) =>
	stickers.filter((sticker) => sticker.clan_id === clanId && (sticker as any).media_type === MediaType.AUDIO)
);

export const settingStickerReducer = settingClanStickerSlice.reducer;
export const settingClanStickerActions = { ...settingClanStickerSlice.actions, fetchStickerByUserId };

export const selectStickerOnSale = createSelector([selectAllStickerSuggestion], (stickers) =>
	stickers?.filter((sticker) => sticker?.is_for_sale === true)
);

export const soundEffectActions = {
	createSound,
	updateSound,
	deleteSound,
	fetchSoundByUserId,
	invalidateCache: settingClanStickerSlice.actions.invalidateCache
};
