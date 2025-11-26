import { captureSentryError } from '@mezon/logger';
import type { IEmoji } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ClanEmoji } from 'mezon-js';
import type { ApiClanEmojiCreateRequest, MezonUpdateClanEmojiByIdBody } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { deleteClan } from '../clans/clans.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const EMOJI_SUGGESTION_FEATURE_KEY = 'suggestionEmoji';

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
	fromTopic?: boolean;
	cache?: CacheMetadata;
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
	fromTopic?: boolean;
};

const { selectAll, selectEntities } = emojiSuggestionAdapter.getSelectors();

const selectCachedEmoji = createSelector([(state: RootState) => state[EMOJI_SUGGESTION_FEATURE_KEY]], (entitiesState) => {
	return entitiesState ? selectAll(entitiesState) : [];
});

export const fetchEmojiCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, noCache = false, clanId: string) => {
	const state = getState();
	const emojiData = state[EMOJI_SUGGESTION_FEATURE_KEY];
	const apiKey = createApiKey(`fetchEmoji${clanId}`);
	const shouldForceCall = shouldForceApiCall(apiKey, emojiData?.cache, noCache);

	if (!shouldForceCall) {
		const emojis = selectCachedEmoji(state);
		return {
			emoji_list: emojis,
			time: Date.now(),
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'GetListEmojisByUserId'
		},
		() => ensuredMezon.client.getListEmojisByUserId(ensuredMezon.session),
		'emoji_list'
	);
	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

export const fetchEmoji = createAsyncThunk(
	'emoji/fetchEmoji',
	async ({ noCache = false, clanId }: { noCache?: boolean; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchEmojiCached(thunkAPI.getState as () => RootState, mezon, noCache, clanId);

			if (!response?.emoji_list) {
				throw new Error('Emoji list is undefined or null');
			}

			const state = thunkAPI.getState() as RootState;
			const userClans = state.clans?.entities || {};
			const userClanIds = new Set(
				Object.values(userClans)
					.filter((clan) => !!clan?.clan_id)
					.map((clan) => clan.clan_id)
			);

			const validEmojis = response.emoji_list.filter(
				(emoji: IEmoji) => !emoji.clan_id || emoji.clan_id === '0' || userClanIds.has(emoji.clan_id)
			);

			return {
				emojis: validEmojis,
				fromCache: response?.fromCache
			};
		} catch (error) {
			captureSentryError(error, 'emoji/fetchEmoji');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const createEmojiSetting = createAsyncThunk(
	'settingClanEmoji/createEmoji',
	async (form: { request: ApiClanEmojiCreateRequest; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const res = await mezon.client.createClanEmoji(mezon.session, form.request);
			if (!res) {
				return thunkAPI.rejectWithValue({});
			}
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
	shiftPressed: false,
	fromTopic: false
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
		removeEmojisByClanId: (state, action: PayloadAction<string>) => {
			const clanId = action.payload;
			const allEmojis = selectAll(state);
			const emojiIdsToRemove = allEmojis.filter((emoji) => emoji.clan_id === clanId).map((emoji) => emoji.id);

			emojiSuggestionAdapter.removeMany(state, emojiIdsToRemove);
		},
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
			const { shortName, id, isReset, fromTopic } = action.payload;

			if (isReset || !state.emojiObjPicked) {
				state.emojiObjPicked = {};
				state.fromTopic = false;
			} else if (shortName !== '' && id !== '') {
				state.emojiObjPicked[shortName] = id;
				state.fromTopic = fromTopic;
			}
		},
		invalidateCache: (state) => {
			if (state.cache) {
				state.cache = undefined;
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchEmoji.pending, (state: EmojiSuggestionState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchEmoji.fulfilled, (state, action: PayloadAction<any>) => {
				if (!action.payload?.fromCache) state.cache = createCacheMetadata();

				if (action.payload?.emojis) {
					emojiSuggestionAdapter.upsertMany(state, action.payload.emojis);
				}

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
		builder.addCase(deleteClan.fulfilled, (state, action) => {
			const clanId = action.meta.arg.clanId;
			const allEmojis = selectAll(state);
			const emojiIdsToRemove = allEmojis.filter((emoji) => emoji.clan_id === clanId).map((emoji) => emoji.id);
			emojiSuggestionAdapter.removeMany(state, emojiIdsToRemove);
		});
	}
});

export const emojiSuggestionReducer = emojiSuggestionSlice.reducer;

export const emojiSuggestionActions = {
	...emojiSuggestionSlice.actions,
	fetchEmoji,
	updateEmojiSetting,
	deleteEmojiSetting,
	createEmojiSetting
};

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

export const selectEmojiFromTopic = createSelector(getEmojiSuggestionState, (emojisState) => emojisState.fromTopic);

export const selectEmojiByClanId = createSelector(
	[(state: RootState) => state[EMOJI_SUGGESTION_FEATURE_KEY], (state: RootState, clanId: string) => clanId],
	(emojisState, clanId) => {
		const emojis = selectAll(emojisState);
		return emojis.filter((emoji) => emoji.clan_id === clanId);
	}
);

export const selectEmojiOnSale = createSelector([selectAllEmojiSuggestion], (emojis) => emojis?.filter((emoji) => emoji?.is_for_sale === true));
