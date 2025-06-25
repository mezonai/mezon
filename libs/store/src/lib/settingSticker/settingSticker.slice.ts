import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState } from '@reduxjs/toolkit';

import { captureSentryError } from '@mezon/logger';
import { ClanSticker } from 'mezon-js';
import { ApiClanStickerAddRequest, MezonUpdateClanStickerByIdBody } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { RootState } from '../store';

export const SETTING_CLAN_STICKER = 'settingSticker';

const STICKER_CLAN_CACHE_TIME = 1000 * 60 * 60;

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

				return processedStickers;
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
			thunkAPI.dispatch(fetchStickerByUserId({ noCache: true }));
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

export const fetchSoundByUserId = createAsyncThunk('settingClanSticker/fetchSound', async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
	try {
		await thunkAPI.dispatch(fetchStickerByUserId({ noCache }));

		const state = thunkAPI.getState() as { settingSticker: SettingClanStickerState };

		const allStickers = selectAllStickerSuggestion(state);
		const sounds = allStickers.filter((sticker) => (sticker as any).media_type === MediaType.AUDIO);

		return sounds;
	} catch (error) {
		captureSentryError(error, 'settingClanSticker/fetchSound');
		return thunkAPI.rejectWithValue(error);
	}
});

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

export const selectStickerByClanIdAndMediaType = (clanId: string, mediaType: MediaType) =>
	createSelector(selectAllStickerSuggestion, (stickers) => {
		return stickers.filter((sticker) => sticker.clan_id === clanId && (sticker as any).media_type === mediaType);
	});

export const selectStickerByClanIdSelector = createSelector(
	[selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId],
	(stickers, clanId) => stickers.filter((sticker) => sticker.clan_id === clanId)
);

export const selectStickerByClanId = (clanId: string) => (state: RootState) =>
	selectStickerByClanIdSelector(state, clanId);

export const selectStickersByClanIdSelector = createSelector(
	[selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId],
	(stickers, clanId) =>
		stickers.filter((sticker) =>
			sticker.clan_id === clanId &&
			((sticker as any).media_type === MediaType.STICKER || (sticker as any).media_type === undefined)
		)
);

export const selectStickersByClanId = (clanId: string) => (state: RootState) =>
	selectStickersByClanIdSelector(state, clanId);

export const selectAudioByClanIdSelector = createSelector(
	[selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId],
	(stickers, clanId) =>
		stickers.filter((sticker) => sticker.clan_id === clanId && (sticker as any).media_type === MediaType.AUDIO)
);

export const selectAudioByClanId = (clanId: string) => (state: RootState) =>
	selectAudioByClanIdSelector(state, clanId);

export const selectStickersByCurrentUserSelector = createSelector(
	[selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId, (_state: RootState, _clanId: string, userId: string) => userId],
	(stickers, clanId, userId) =>
		stickers.filter(
			(sticker) =>
				sticker.clan_id === clanId &&
				sticker.creator_id === userId &&
				((sticker as any).media_type === MediaType.STICKER || (sticker as any).media_type === undefined)
		)
);

export const selectStickersByCurrentUser = (clanId: string, userId: string) => (state: RootState) =>
	selectStickersByCurrentUserSelector(state, clanId, userId);

export const selectAudioByCurrentUserSelector = createSelector(
	[selectAllStickerSuggestion, (_state: RootState, clanId: string) => clanId, (_state: RootState, _clanId: string, userId: string) => userId],
	(stickers, clanId, userId) =>
		stickers.filter((sticker) => sticker.clan_id === clanId && sticker.creator_id === userId && (sticker as any).media_type === MediaType.AUDIO)
);

export const selectAudioByCurrentUser = (clanId: string, userId: string) => (state: RootState) =>
	selectAudioByCurrentUserSelector(state, clanId, userId);

export const settingStickerReducer = settingClanStickerSlice.reducer;
export const settingClanStickerActions = { ...settingClanStickerSlice.actions, fetchStickerByUserId };

export const selectStickerOnSale = createSelector([selectAllStickerSuggestion], (stickers) =>
	stickers?.filter((sticker) => sticker?.is_for_sale === true)
);

export const soundEffectActions = {
	createSound,
	updateSound,
	deleteSound,
	fetchSoundByUserId
};
