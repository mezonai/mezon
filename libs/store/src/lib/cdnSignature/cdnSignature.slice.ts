import { captureSentryError } from '@mezon/logger';
import { getCdnSignatureTtlMs } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { CacheMetadata } from '../cache-metadata';
import { createCacheMetadata, isCacheValid } from '../cache-metadata';
import { ensureSession, getMezonCtx } from '../helpers';

export const CDN_SIGNATURE_FEATURE_KEY = 'cdnSignature';

const CDN_SIGNATURE_RETRY_MS = 30 * 1000;
const CDN_SIGNATURE_TIMEOUT_MS = 5 * 1000;
const CDN_SIGNATURE_DENIED_CODES = new Set([7, 403]);

export interface CdnSignatureEntry {
	signature: string;
	cache: CacheMetadata;
	denied?: boolean;
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
	/** The signature of media the CDN refused: asks for a new one only while it is still the current one. */
	failedSignature?: string;
};

type FetchCdnSignatureResult = {
	channelId: string;
	signature: string;
	outcome: 'signed' | 'denied' | 'failed';
};

const isSignableChannelId = (channelId?: string): channelId is string => !!channelId && channelId !== '0';

const getServerErrorCode = (error: unknown): number | undefined => {
	const code = (error as { code?: unknown } | undefined)?.code;
	return !(error instanceof Error) && typeof code === 'number' ? code : undefined;
};

const TIMED_OUT = Symbol('timed out');

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
		timer = setTimeout(() => resolve(TIMED_OUT), ms);
	});
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export const getCdnSignatureState = (rootState: CdnSignatureRootState): CdnSignatureState =>
	rootState[CDN_SIGNATURE_FEATURE_KEY] ?? initialCdnSignatureState;

export const fetchCdnSignature = createAsyncThunk(
	'cdnSignature/fetchCdnSignature',
	async ({ channelId }: FetchCdnSignaturePayload, thunkAPI): Promise<FetchCdnSignatureResult> => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await withTimeout(mezon.client.generateCDNSignature(mezon.session, { channel_id: channelId }), CDN_SIGNATURE_TIMEOUT_MS);
			if (response === TIMED_OUT) return { channelId, signature: '', outcome: 'failed' };
			const signature = response?.signature;
			if (!signature) throw new Error('cannot generate cdn signature');
			return { channelId, signature, outcome: 'signed' };
		} catch (error) {
			const code = getServerErrorCode(error);
			if (code !== undefined && CDN_SIGNATURE_DENIED_CODES.has(code)) return { channelId, signature: '', outcome: 'denied' };
			if (error instanceof Error) captureSentryError(error, 'cdnSignature/fetchCdnSignature');
			return { channelId, signature: '', outcome: 'failed' };
		}
	},
	{
		condition: ({ channelId, noCache, failedSignature }, { getState }) => {
			if (!isSignableChannelId(channelId)) return false;
			const state = getCdnSignatureState(getState() as CdnSignatureRootState);
			if (state.requestIdByChannelId[channelId]) return false;
			const entry = state.byChannelId[channelId];
			if (failedSignature !== undefined) {
				// N refused images make one request: the first replaces the signature they share, and the rest no longer
				// match it. One younger than the retry interval is kept, its age cannot be why the media was refused.
				return entry?.signature === failedSignature && Date.now() - entry.cache.lastFetched >= CDN_SIGNATURE_RETRY_MS;
			}
			return noCache || !isCacheValid(entry?.cache);
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
				const { channelId, signature, outcome } = action.payload;
				if (state.requestIdByChannelId[channelId] !== action.meta.requestId) return;
				delete state.requestIdByChannelId[channelId];
				if (outcome === 'signed') {
					state.byChannelId[channelId] = { signature, cache: createCacheMetadata(getCdnSignatureTtlMs(signature)) };
					return;
				}
				state.byChannelId[channelId] = {
					signature: outcome === 'denied' ? '' : (state.byChannelId[channelId]?.signature ?? ''),
					denied: outcome === 'denied',
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

export const selectCdnSignatureEntry = (rootState: CdnSignatureRootState, channelId?: string): CdnSignatureEntry | undefined =>
	channelId ? getCdnSignatureState(rootState).byChannelId[channelId] : undefined;

export const selectCdnSignatureByChannelId = (rootState: CdnSignatureRootState, channelId?: string): string | undefined =>
	selectCdnSignatureEntry(rootState, channelId)?.signature || undefined;

export const selectCdnSignatureExpiresAt = (rootState: CdnSignatureRootState, channelId?: string): number | undefined =>
	channelId ? getCdnSignatureState(rootState).byChannelId[channelId]?.cache.expiresAt : undefined;

export const selectIsCdnSignaturePending = (rootState: CdnSignatureRootState, channelId?: string): boolean => {
	const state = rootState[CDN_SIGNATURE_FEATURE_KEY];
	return !!state && isSignableChannelId(channelId) && !state.byChannelId[channelId];
};
