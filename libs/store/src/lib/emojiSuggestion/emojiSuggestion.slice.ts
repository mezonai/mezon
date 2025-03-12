import { captureSentryError } from '@mezon/logger';
import { IEmoji } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ClanEmoji } from 'mezon-js';
import { ApiClanEmojiCreateRequest, MezonUpdateClanEmojiByIdBody } from 'mezon-js/api.gen';
import { ApiClanEmoji } from 'mezon-js/dist/api.gen';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';

export const EMOJI_SUGGESTION_FEATURE_KEY = 'suggestionEmoji';

const EMOJI_SUGGESTION_CACHE_TIME = 1000 * 60 * 60;

export interface EmojiSuggestionEntity extends IEmoji {
	id: string;
}

export interface EmojiSuggestionState extends EntityState<EmojiSuggestionEntity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
	emojiPicked: string;
	emojiObjPicked?: Record<string, string>;
	emojiSuggestionListStatus: boolean;
	keyCodeFromKeyBoardState: number;
	textToSearchEmojiSuggestion: string;
	addEmojiAction: boolean;
	shiftPressed: boolean;
}

type UpdateEmojiRequest = {
	request: MezonUpdateClanEmojiByIdBody;
	emojiId: string;
};

export const emojiSuggestionAdapter = createEntityAdapter({
	selectId: (emo: EmojiSuggestionEntity) => emo.id || ''
});

type EmojiObjPickedArgs = {
	shortName: string;
	id: string;
	isReset?: boolean;
};

export const fetchEmojiCached = memoizeAndTrack(
	async (mezon: MezonValueContext, defaultResponse?: Array<ApiClanEmoji>) => {
		if (defaultResponse) {
			return {
				emoji_list: defaultResponse,
				time: Date.now()
			};
		}

		const response = await mezon.client.getListEmojisByUserId(mezon.session);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: EMOJI_SUGGESTION_CACHE_TIME,
		normalizer: (args) => {
			return args[0]?.session?.username || '';
		}
	}
);

export const updateEmojiCache = createAsyncThunk('emoji/updateCache', async (emojiList: Array<ApiClanEmoji>, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	fetchEmojiCached.clear();

	await fetchEmojiCached(mezon, emojiList);
});

export const fetchEmoji = createAsyncThunk('emoji/fetchEmoji', async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		if (noCache) {
			fetchEmojiCached.clear(mezon);
		}
		const response = await fetchEmojiCached(mezon);

		if (!response?.emoji_list) {
			throw new Error('Emoji list is undefined or null');
		}
		return response.emoji_list;
	} catch (error) {
		captureSentryError(error, 'emoji/fetchEmoji');
		return thunkAPI.rejectWithValue(error);
	}
});

export const createEmojiSetting = createAsyncThunk(
	'settingClanEmoji/createEmoji',
	async (form: { request: ApiClanEmojiCreateRequest; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const res = await mezon.client.createClanEmoji(mezon.session, form.request);
			if (!res) {
				return thunkAPI.rejectWithValue({});
			}
			thunkAPI.dispatch(fetchEmoji({ noCache: true }));
		} catch (error) {
			captureSentryError(error, 'emoji/createEmoji');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateEmojiSetting = createAsyncThunk('settingClanEmoji/updateEmoji', async ({ request, emojiId }: UpdateEmojiRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const res = await mezon.client.updateClanEmojiById(mezon.session, emojiId, request);
		if (res) {
			return { request, emojiId };
		}
	} catch (error) {
		captureSentryError(error, 'settingClanEmoji/updateEmoji');
		return thunkAPI.rejectWithValue(error);
	}
});

export const deleteEmojiSetting = createAsyncThunk(
	'settingClanEmoji/deleteEmoji',
	async (data: { emoji: ClanEmoji; clan_id: string; label: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const res = await mezon.client.deleteByIdClanEmoji(mezon.session, data.emoji.id || '', data.clan_id, data.label);
			if (res) {
				return data.emoji;
			}
		} catch (error) {
			captureSentryError(error, 'settingClanEmoji/deleteEmoji');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialEmojiSuggestionState: EmojiSuggestionState = emojiSuggestionAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	emojiPicked: '',
	emojiObjPicked: {},
	emojiSuggestionListStatus: false,
	keyCodeFromKeyBoardState: 1000,
	textToSearchEmojiSuggestion: '',
	addEmojiAction: false,
	shiftPressed: false
});

export const emojiSuggestionSlice = createSlice({
	name: EMOJI_SUGGESTION_FEATURE_KEY,
	initialState: initialEmojiSuggestionState,
	reducers: {
		add: (state, action: PayloadAction<any>) => {
			state.ids.unshift(action.payload.id);
			state.entities[action.payload.id] = action.payload;
		},
		remove: emojiSuggestionAdapter.removeOne,
		update: emojiSuggestionAdapter.updateOne,
		setSuggestionEmojiPicked: (state, action: PayloadAction<string>) => {
			state.emojiPicked = action.payload;
		},

		setStatusSuggestionEmojiList: (state, action: PayloadAction<boolean>) => {
			state.emojiSuggestionListStatus = action.payload;
		},
		setTextToSearchEmojiSuggestion: (state, action: PayloadAction<string>) => {
			state.textToSearchEmojiSuggestion = action.payload;
		},
		setAddEmojiActionChatbox: (state, action: PayloadAction<boolean>) => {
			state.addEmojiAction = action.payload;
		},
		setShiftPressed: (state, action: PayloadAction<boolean>) => {
			state.shiftPressed = action.payload;
		},

		setSuggestionEmojiObjPicked: (state, action: PayloadAction<EmojiObjPickedArgs>) => {
			const { shortName, id, isReset } = action.payload;

			if (isReset || !state.emojiObjPicked) {
				state.emojiObjPicked = {};
			} else if (shortName !== '' && id !== '') {
				state.emojiObjPicked[shortName] = id;
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchEmoji.pending, (state: EmojiSuggestionState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchEmoji.fulfilled, (state, action: PayloadAction<any[]>) => {
				emojiSuggestionAdapter.setAll(state, action.payload);

				state.loadingStatus = 'loaded';
			})
			.addCase(fetchEmoji.rejected, (state: EmojiSuggestionState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder.addCase(updateEmojiSetting.fulfilled, (state, action) => {
			const dataChange = action.payload?.request;
			emojiSuggestionAdapter.updateOne(state, {
				id: action.payload?.emojiId ?? '',
				changes: {
					shortname: dataChange?.shortname
				}
			});
		});
		builder.addCase(deleteEmojiSetting.fulfilled, (state, action) => {
			emojiSuggestionAdapter.removeOne(state, action.payload?.id ?? '');
		});
	}
});

export const emojiSuggestionReducer = emojiSuggestionSlice.reducer;

export const emojiSuggestionActions = {
	...emojiSuggestionSlice.actions,
	fetchEmoji,
	updateEmojiSetting,
	deleteEmojiSetting,
	createEmojiSetting,
	updateEmojiCache
};

const { selectAll, selectEntities } = emojiSuggestionAdapter.getSelectors();

export const getEmojiSuggestionState = (rootState: { [EMOJI_SUGGESTION_FEATURE_KEY]: EmojiSuggestionState }): EmojiSuggestionState =>
	rootState[EMOJI_SUGGESTION_FEATURE_KEY];

export const selectAllEmojiSuggestion = createSelector(getEmojiSuggestionState, selectAll);

export const selectEmojiSuggestion = createSelector(getEmojiSuggestionState, (emojisState) => emojisState.emojiPicked);

export const selectEmojiSuggestionEntities = createSelector(getEmojiSuggestionState, selectEntities);

export const selectEmojiListStatus = createSelector(getEmojiSuggestionState, (emojisState) => emojisState.emojiSuggestionListStatus);

export const selectTextToSearchEmojiSuggestion = createSelector(getEmojiSuggestionState, (emojisState) => emojisState.textToSearchEmojiSuggestion);

export const selectAddEmojiState = createSelector(getEmojiSuggestionState, (emojisState) => emojisState.addEmojiAction);

export const selectShiftPressedStatus = createSelector(getEmojiSuggestionState, (emojisState) => emojisState.shiftPressed);

export const selectEmojiObjSuggestion = createSelector(getEmojiSuggestionState, (emojisState) => emojisState.emojiObjPicked);

export const selectEmojiByClanId = (clanId: string) =>
	createSelector(selectAllEmojiSuggestion, (emojis) => {
		return emojis.filter((emoji) => emoji.clan_id === clanId);
	});
