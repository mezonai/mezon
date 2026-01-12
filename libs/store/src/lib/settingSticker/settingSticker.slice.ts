import type { LoadingStatus } from '@mezon/utils';
import type { EntityState } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

import { captureSentryError } from '@mezon/logger';
import type { ApiClanSticker, ApiClanStickerAddRequest, MezonUpdateClanStickerByIdBody } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, timestampToString, withRetry } from '../helpers';
import type { RootState } from '../store';

export const SETTING_CLAN_STICKER = 'settingSticker';

export enum MediaType {
	STICKER = 0,
	AUDIO = 1
}

interface CustomRequest extends ApiClanStickerAddRequest {
	mediaType?: MediaType;
}

interface SoundRequest extends ApiClanStickerAddRequest {
	mediaType: MediaType;
}

interface CustomUpdateRequest extends MezonUpdateClanStickerByIdBody {
	mediaType?: MediaType;
}

interface SoundUpdateRequest extends MezonUpdateClanStickerByIdBody {
	mediaType: MediaType;
}

export interface SettingClanStickerState extends EntityState<ApiClanSticker, string> {
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
	selectId: (sticker: ApiClanSticker) => sticker.id || ''
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

	const response = await withRetry(() => ensuredMezon.client.getListStickersByUserId(ensuredMezon.session), {
		scope: 'GetListStickersByUserId'
	});

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

				const processedStickers = stickersWithMediaType.map((sticker) => {
					const stickerTyped = sticker as ApiClanSticker & { mediaType?: MediaType };
					const isAudioFile =
						stickerTyped.source &&
						(stickerTyped.source.endsWith('.mp3') || stickerTyped.source.endsWith('.wav') || stickerTyped.source.includes('/sounds/'));

					const mediaType =
						stickerTyped.mediaType !== undefined ? stickerTyped.mediaType : isAudioFile ? MediaType.AUDIO : MediaType.STICKER;

					return {
						...stickerTyped,
						mediaType,
						createTime: timestampToString(stickerTyped.createTime)
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
				$typeName: 'mezon.api.ClanStickerAddRequest' as const,
				source: form.request.source || '',
				shortname: form.request.shortname || '',
				category: form.request.category || '',
				clanId: form.clanId,
				id: form.request.id || '',
				mediaType: (form.request.mediaType !== undefined ? form.request.mediaType : MediaType.STICKER) as number,
				isForSale: form.request.isForSale ?? false
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

		const requestWithMediaType = {
			$typeName: 'mezon.api.ClanStickerUpdateByIdRequest' as const,
			id: stickerId,
			source: request.source || '',
			shortname: request.shortname || '',
			category: request.category || '',
			clanId: request.clanId || ''
		};

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
		.filter((sticker) => sticker?.clanId === clanId)
		.map((sticker) => sticker?.id) as string[];
	thunkAPI.dispatch(stickerSettingActions.removeMany(stickerIdsToRemove));
});

export const deleteSticker = createAsyncThunk(
	'settingClanSticker/deleteSticker',
	async (data: { stickerId: string; clanId: string; stickerLabel: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const res = await mezon.client.deleteClanStickerById(mezon.session, data.stickerId, data.clanId, data.stickerLabel);
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
			$typeName: 'mezon.api.ClanStickerAddRequest' as const,
			source: form.request.source || '',
			shortname: form.request.shortname || '',
			category: form.request.category || '',
			clanId: form.clanId,
			id: form.request.id || '',
			mediaType: MediaType.AUDIO as number,
			isForSale: form.request.isForSale ?? false
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
			$typeName: 'mezon.api.ClanStickerUpdateByIdRequest' as const,
			id: soundId,
			source: request.source || '',
			shortname: request.shortname || '',
			category: request.category || '',
			clanId: request.clanId || ''
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
	async (data: { soundId: string; clanId: string; soundLabel: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const res = await mezon.client.deleteClanStickerById(mezon.session, data.soundId, data.clanId, data.soundLabel);

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
			const sounds = allStickers.filter((sticker) => (sticker as any).mediaType === MediaType.AUDIO);

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
			(sticker) => sticker.clanId === clanId && ((sticker as any).mediaType === MediaType.STICKER || (sticker as any).mediaType === undefined)
		)
);

export const selectStickersByClanId = (clanId: string) => (state: RootState) => selectStickersByClanIdSelector(state, clanId);

export const selectAudioByClanId = createSelector([selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId], (stickers, clanId) =>
	stickers.filter((sticker) => sticker.clanId === clanId && (sticker as any).mediaType === MediaType.AUDIO)
);

export const settingStickerReducer = settingClanStickerSlice.reducer;
export const settingClanStickerActions = { ...settingClanStickerSlice.actions, fetchStickerByUserId };

export const selectStickerOnSale = createSelector([selectAllStickerSuggestion], (stickers) =>
	stickers?.filter((sticker) => sticker?.isForSale === true)
);

export const soundEffectActions = {
	createSound,
	updateSound,
	deleteSound,
	fetchSoundByUserId,
	invalidateCache: settingClanStickerSlice.actions.invalidateCache
};
