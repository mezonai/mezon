import { captureSentryError } from '@mezon/logger';
import { CDN_SIGNATURE_TTL_MS } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { CacheMetadata } from '../cache-metadata';
import { createCacheMetadata, isCacheValid } from '../cache-metadata';
import { ensureSession, getMezonCtx } from '../helpers';

export const CDN_SIGNATURE_FEATURE_KEY = 'cdnSignature';

const CDN_SIGNATURE_RETRY_MS = 30 * 1000;

export interface CdnSignatureEntry {
	signature: string;
	cache: CacheMetadata;
}

export interface CdnSignatureState {
	byChannelId: Record<string, CdnSignatureEntry>;
	requestIdByChannelId: Record<string, string>;
}

export const initialCdnSignatureState: CdnSignatureState = {
	byChannelId: {},
	requestIdByChannelId: {}
};

type CdnSignatureRootState = { [CDN_SIGNATURE_FEATURE_KEY]?: CdnSignatureState };

type FetchCdnSignaturePayload = {
	channelId: string;
	noCache?: boolean;
};

const isSignableChannelId = (channelId?: string): channelId is string => !!channelId && channelId !== '0';

export const getCdnSignatureState = (rootState: CdnSignatureRootState): CdnSignatureState =>
	rootState[CDN_SIGNATURE_FEATURE_KEY] ?? initialCdnSignatureState;

export const fetchCdnSignature = createAsyncThunk(
	'cdnSignature/fetchCdnSignature',
	async ({ channelId }: FetchCdnSignaturePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.generateCDNSignature(mezon.session, { channel_id: channelId });
			const signature = response?.signature;
			if (!signature) throw new Error('cannot generate cdn signature');
			return { channelId, signature };
		} catch (error) {
			captureSentryError(error, 'cdnSignature/fetchCdnSignature');
			return thunkAPI.rejectWithValue(error);
		}
	},
	{
		condition: ({ channelId, noCache }, { getState }) => {
			if (!isSignableChannelId(channelId)) return false;
			const state = getCdnSignatureState(getState() as CdnSignatureRootState);
			if (state.requestIdByChannelId[channelId]) return false;
			return noCache || !isCacheValid(state.byChannelId[channelId]?.cache);
		}
	}
);

export const cdnSignatureSlice = createSlice({
	name: CDN_SIGNATURE_FEATURE_KEY,
	initialState: initialCdnSignatureState,
	reducers: {
		removeByChannelId: (state, action: PayloadAction<string>) => {
			delete state.byChannelId[action.payload];
		},
		removeAll: () => initialCdnSignatureState
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCdnSignature.pending, (state, action) => {
				state.requestIdByChannelId[action.meta.arg.channelId] = action.meta.requestId;
			})
			.addCase(fetchCdnSignature.fulfilled, (state, action) => {
				const { channelId, signature } = action.payload;
				if (state.requestIdByChannelId[channelId] !== action.meta.requestId) return;
				delete state.requestIdByChannelId[channelId];
				state.byChannelId[channelId] = {
					signature,
					cache: createCacheMetadata(CDN_SIGNATURE_TTL_MS)
				};
			})
			.addCase(fetchCdnSignature.rejected, (state, action) => {
				const { channelId } = action.meta.arg;
				if (state.requestIdByChannelId[channelId] !== action.meta.requestId) return;
				delete state.requestIdByChannelId[channelId];
				state.byChannelId[channelId] = {
					signature: state.byChannelId[channelId]?.signature ?? '',
					cache: createCacheMetadata(CDN_SIGNATURE_RETRY_MS)
				};
			});
	}
});

export const cdnSignatureReducer = cdnSignatureSlice.reducer;

export const cdnSignatureActions = {
	...cdnSignatureSlice.actions,
	fetchCdnSignature
};

export const selectCdnSignatureByChannelId = (rootState: CdnSignatureRootState, channelId?: string): string | undefined =>
	channelId ? getCdnSignatureState(rootState).byChannelId[channelId]?.signature || undefined : undefined;

export const selectCdnSignatureExpiresAt = (rootState: CdnSignatureRootState, channelId?: string): number | undefined =>
	channelId ? getCdnSignatureState(rootState).byChannelId[channelId]?.cache.expiresAt : undefined;

export const selectIsCdnSignaturePending = (rootState: CdnSignatureRootState, channelId?: string): boolean => {
	const state = rootState[CDN_SIGNATURE_FEATURE_KEY];
	return !!state && isSignableChannelId(channelId) && !state.byChannelId[channelId];
};
