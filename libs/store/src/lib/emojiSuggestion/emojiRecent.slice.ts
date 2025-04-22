import { captureSentryError } from '@mezon/logger';
import { IEmojiRecent, RECENT_EMOJI_CATEGORY } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiClanEmoji } from 'mezon-js/dist/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { selectAllEmojiSuggestion } from './emojiSuggestion.slice';

export const EMOJI_RECENT_FEATURE_KEY = 'emojiRecent';

const EMOJI_RECENT_CACHE_TIME = 1000 * 60 * 60;

export interface EmojiRecentEntity extends IEmojiRecent {
	id: string;
}

export interface EmojiRecentState extends EntityState<EmojiRecentEntity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	lastEmojiRecent: { emoji_recents_id: string; emoji_id?: string };
}

export const emojiRecentAdapter = createEntityAdapter({
	selectId: (emo: EmojiRecentEntity) => emo.emoji_id || ''
});

export const fetchEmojiRecentCached = memoizeAndTrack(
	async (mezon: MezonValueContext) => {
		const response = await mezon.client.emojiRecentList(mezon.session);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: EMOJI_RECENT_CACHE_TIME,
		normalizer: (args) => {
			return args[0]?.session?.username || '';
		}
	}
);

export const fetchEmojiRecent = createAsyncThunk('emoji/fetchEmojiRecent', async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		if (noCache) {
			fetchEmojiRecentCached.clear(mezon);
		}
		const response = await fetchEmojiRecentCached(mezon);

		if (!response?.emoji_recents) {
			thunkAPI.dispatch(emojiRecentActions.setLastEmojiRecent({ emoji_recents_id: '0', emoji_id: '' }));
			return [];
		}
		thunkAPI.dispatch(
			emojiRecentActions.setLastEmojiRecent({
				emoji_recents_id: response.emoji_recents[0].emoji_recents_id,
				emoji_id: response.emoji_recents[0].emoji_id
			})
		);
		return response.emoji_recents;
	} catch (error) {
		captureSentryError(error, 'emoji/fetchEmojiRecent');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialEmojiRecentState: EmojiRecentState = emojiRecentAdapter.getInitialState({
	loadingStatus: 'not loaded',
	lastEmojiRecent: { emoji_recents_id: '0' }
});

export const emojiRecentSlice = createSlice({
	name: EMOJI_RECENT_FEATURE_KEY,
	initialState: initialEmojiRecentState,
	reducers: {
		setLastEmojiRecent: (state, action: PayloadAction<any>) => {
			state.lastEmojiRecent = action.payload;
		},
		addFirstEmojiRecent: (state, action: PayloadAction<any>) => {
			const emoji = action.payload;

			const existingIndex = state.ids.indexOf(emoji.emoji_id);
			if (existingIndex !== -1) {
				state.ids.splice(existingIndex, 1);
			}

			state.ids.unshift(emoji.emoji_id);
			state.entities[emoji.emoji_id] = emoji;

			if (state.ids.length > 20) {
				const removedId = state.ids.pop();
				delete state.entities[removedId!];
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchEmojiRecent.pending, (state: EmojiRecentState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchEmojiRecent.fulfilled, (state, action: PayloadAction<any[]>) => {
				emojiRecentAdapter.setAll(state, action.payload);

				state.loadingStatus = 'loaded';
			})
			.addCase(fetchEmojiRecent.rejected, (state: EmojiRecentState, action) => {
				state.loadingStatus = 'error';
			});
	}
});

export const emojiRecentReducer = emojiRecentSlice.reducer;

export const emojiRecentActions = {
	...emojiRecentSlice.actions,
	fetchEmojiRecent
};

const { selectAll, selectEntities } = emojiRecentAdapter.getSelectors();

export const getEmojiRecentState = (rootState: { [EMOJI_RECENT_FEATURE_KEY]: EmojiRecentState }): EmojiRecentState =>
	rootState[EMOJI_RECENT_FEATURE_KEY];

export const selectLastEmojiRecent = createSelector(getEmojiRecentState, (emojisState) => emojisState.lastEmojiRecent);

export const selectAllEmojiRecent = createSelector([selectAllEmojiSuggestion, getEmojiRecentState], (allEmojiSuggestion, allEmojiRecentId) => {
	if (allEmojiSuggestion?.length === 0 || allEmojiRecentId?.ids?.length === 0) return [];

	const emojiRecents = allEmojiRecentId?.ids
		?.map((id) => {
			const emoji = allEmojiSuggestion.find((emoji) => emoji.id === id);
			const recentEmoji = allEmojiRecentId.entities[id];

			if (!emoji || !recentEmoji) return null;

			return {
				id: emoji.id ?? '',
				shortname: emoji.shortname ?? '',
				src: emoji.src ?? '',
				category: RECENT_EMOJI_CATEGORY,
				emoji_recents_id: recentEmoji?.emoji_recents_id ?? ''
			} as ApiClanEmoji;
		})
		.filter((emoji): emoji is ApiClanEmoji => emoji !== null);

	return emojiRecents;
});
