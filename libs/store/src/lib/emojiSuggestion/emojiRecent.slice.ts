import { captureSentryError } from '@mezon/logger';
import type { IEmojiRecent } from '@mezon/utils';
import { RECENT_EMOJI_CATEGORY, WalletStorage } from '@mezon/utils';
import { ETransferType } from '@mezonai/mmn-client-js';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiClanEmoji } from 'mezon-js/dist/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { selectUserById } from '../channels/listUsers.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx, getMmnClient } from '../helpers';
import type { RootState } from '../store';
import { toastActions } from '../toasts';
import { selectAllEmojiSuggestion } from './emojiSuggestion.slice';

export const EMOJI_RECENT_FEATURE_KEY = 'emojiRecent';
const DEFAULT_EMOJI_PRICE = 500;

export interface EmojiRecentEntity extends IEmojiRecent {
	id: string;
}

export interface EmojiRecentState extends EntityState<EmojiRecentEntity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	lastEmojiRecent: { emoji_recents_id: string; emoji_id?: string };
	cache?: CacheMetadata;
	// Track emojis that are pending unlock (used to show loading overlays)
	pendingUnlockMap?: Record<string, boolean>;
}

export const emojiRecentAdapter = createEntityAdapter({
	selectId: (emo: EmojiRecentEntity) => emo.emoji_id || ''
});

const { selectAll: selectAllEmojiRecentEntities } = emojiRecentAdapter.getSelectors();

const selectCachedEmojiRecent = createSelector([(state: RootState) => state[EMOJI_RECENT_FEATURE_KEY]], (entitiesState) => {
	return entitiesState ? selectAllEmojiRecentEntities(entitiesState) : [];
});

export const fetchEmojiRecentCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, noCache = false) => {
	const state = getState();
	const emojiData = state[EMOJI_RECENT_FEATURE_KEY];
	const apiKey = createApiKey('fetchEmojiRecent');
	const shouldForceCall = shouldForceApiCall(apiKey, emojiData?.cache, noCache);

	if (!shouldForceCall) {
		const emojis = selectCachedEmojiRecent(state);
		return {
			emoji_recents: emojis,
			time: Date.now(),
			fromCache: true
		};
	}
	const response = await ensuredMezon.client.emojiRecentList(ensuredMezon.session);

	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

export const fetchEmojiRecent = createAsyncThunk('emoji/fetchEmojiRecent', async ({ noCache = false }: { noCache?: boolean }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await fetchEmojiRecentCached(thunkAPI.getState as () => RootState, mezon, noCache);

		if (!response?.emoji_recents) {
			thunkAPI.dispatch(emojiRecentActions.setLastEmojiRecent({ emoji_recents_id: '0', emoji_id: '' }));
			return {
				emojis: [],
				fromCache: response?.fromCache
			};
		}
		thunkAPI.dispatch(
			emojiRecentActions.setLastEmojiRecent({
				emoji_recents_id: response.emoji_recents[0]?.emoji_recents_id,
				emoji_id: response.emoji_recents[0]?.emoji_id
			})
		);
		return {
			emojis: response.emoji_recents,
			fromCache: response?.fromCache
		};
	} catch (error) {
		captureSentryError(error, 'emoji/fetchEmojiRecent');
		return thunkAPI.rejectWithValue(error);
	}
});

const buyItemForSale = createAsyncThunk(
	'emoji/buyItemForSale',
	async ({ id, type, creatorId, senderId }: { id?: string; type?: number; creatorId?: string; senderId?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const mmnClient = getMmnClient(thunkAPI);

			const encryptedWallet = await WalletStorage.getEncryptedWallet(senderId || '');
			if (!encryptedWallet) {
				thunkAPI.dispatch(
					toastActions.addToast({
						message: 'Wallet not available. Please enable wallet.',
						type: 'error'
					})
				);
				return thunkAPI.rejectWithValue('Wallet not available');
			}

			const senderWalletAccount = await mmnClient.getAccountByAddress(encryptedWallet.address);

			// Get creator wallet address from store using creator ID
			let creatorMmnAddress: string | null = null;
			if (creatorId) {
				const state = thunkAPI.getState() as RootState;
				const creator = selectUserById(state, creatorId);
				creatorMmnAddress = creator?.wallet_address || null;
			}

			if (!creatorMmnAddress) {
				thunkAPI.dispatch(
					toastActions.addToast({
						message: 'Creator address unavailable. Try again later.',
						type: 'error'
					})
				);
				return thunkAPI.rejectWithValue('Creator address unavailable');
			}
			const response = await mmnClient.sendTransaction({
				sender: encryptedWallet.address,
				recipient: creatorMmnAddress,
				amount: mmnClient.scaleAmountToDecimals(DEFAULT_EMOJI_PRICE, senderWalletAccount.decimals),
				nonce: senderWalletAccount.nonce + 1,
				textData: 'unlock item',
				privateKey: encryptedWallet.privateKey,
				extraInfo: {
					type: ETransferType.UnlockItem,
					UserReceiverId: creatorId || '',
					UserSenderId: `${mezon.session.user_id}` || '',
					UserSenderUsername: mezon.session.username || '',
					ItemType: type?.toString() ?? '',
					ItemId: id
				}
			});

			if (response.ok) {
				thunkAPI.dispatch(emojiRecentActions.addPendingUnlock({ emojiId: id ?? '' }));
			}
		} catch (error) {
			captureSentryError(error, 'emoji/fetchEmojiRecent');
			return thunkAPI.rejectWithValue(error);
		}
	}
);
export const initialEmojiRecentState: EmojiRecentState = emojiRecentAdapter.getInitialState({
	loadingStatus: 'not loaded',
	lastEmojiRecent: { emoji_recents_id: '0' },
	pendingUnlockMap: {}
});

export const emojiRecentSlice = createSlice({
	name: EMOJI_RECENT_FEATURE_KEY,
	initialState: initialEmojiRecentState,
	reducers: {
		setLastEmojiRecent: (state, action: PayloadAction<any>) => {
			state.lastEmojiRecent = action.payload;
		},
		addPendingUnlock: (state, action: PayloadAction<{ emojiId: string }>) => {
			if (!state.pendingUnlockMap) state.pendingUnlockMap = {};
			state.pendingUnlockMap[action.payload.emojiId] = true;
		},
		removePendingUnlock: (state, action: PayloadAction<{ emojiId: string }>) => {
			if (!state.pendingUnlockMap) return;
			delete state.pendingUnlockMap[action.payload.emojiId];
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
			.addCase(fetchEmojiRecent.fulfilled, (state, action: PayloadAction<any>) => {
				if (!action?.payload?.fromCache) state.cache = createCacheMetadata();
				if (action?.payload?.emojis) emojiRecentAdapter.setAll(state, action.payload.emojis);

				state.loadingStatus = 'loaded';
			})
			.addCase(fetchEmojiRecent.rejected, (state: EmojiRecentState, action) => {
				state.loadingStatus = 'error';
			})
			.addCase(buyItemForSale.pending, (state: EmojiRecentState) => {
				state.loadingStatus = 'loading';
			});
	}
});

export const emojiRecentReducer = emojiRecentSlice.reducer;

export const emojiRecentActions = {
	...emojiRecentSlice.actions,
	fetchEmojiRecent,
	buyItemForSale
};

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

export const selectPendingUnlockMap = createSelector(getEmojiRecentState, (state) => state.pendingUnlockMap || {});
