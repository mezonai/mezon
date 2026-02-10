import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiChannelEvent, ApiListChannelEventsRequest } from 'mezon-js/dist/api';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { ensureSession, getMezonCtx, type MezonValueContext } from '../helpers';

export const CHANNEL_MEDIA_FEATURE_KEY = 'channelMedia';

const CHANNEL_MEDIA_CACHED_TIME = 1000 * 60 * 20;

export interface ChannelMediaChannelState {
	events: ApiChannelEvent[];
	cache?: CacheMetadata;
}

export interface ChannelMediaState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	eventsByChannel: Record<string, ChannelMediaChannelState>;
}

type FetchChannelMediaPayload = ApiListChannelEventsRequest & { noCache?: boolean };

type RootState = { [CHANNEL_MEDIA_FEATURE_KEY]: ChannelMediaState };

const fetchChannelMediaCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, payload: FetchChannelMediaPayload) => {
	const { noCache, ...requestPayload } = payload;
	const currentState = getState();
	const channelData = currentState[CHANNEL_MEDIA_FEATURE_KEY].eventsByChannel[payload.channel_id];
	const apiKey = createApiKey('fetchChannelMedia', payload.channel_id, payload.year);

	const shouldForceCall = shouldForceApiCall(apiKey, channelData?.cache, noCache);

	if (!shouldForceCall && channelData?.events?.length > 0) {
		return {
			channelId: payload.channel_id,
			events: channelData.events,
			fromCache: true,
			time: channelData.cache?.lastFetched || Date.now()
		};
	}

	const response = await ensuredMezon.client.listChannelEvents(ensuredMezon.session, requestPayload);

	markApiFirstCalled(apiKey);

	return {
		channelId: payload.channel_id,
		events: response.events || [],
		fromCache: false,
		time: Date.now()
	};
};

export const fetchChannelMedia = createAsyncThunk('channelMedia/fetchChannelMedia', async (payload: FetchChannelMediaPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		return await fetchChannelMediaCached(thunkAPI.getState as () => RootState, mezon, payload);
	} catch (error) {
		captureSentryError(error, 'channelMedia/fetchChannelMedia');
		return thunkAPI.rejectWithValue(error);
	}
});

export const initialChannelMediaState: ChannelMediaState = {
	loadingStatus: 'not loaded',
	error: null,
	eventsByChannel: {} as Record<string, ChannelMediaChannelState>
};

export const channelMediaSlice = createSlice({
	name: CHANNEL_MEDIA_FEATURE_KEY,
	initialState: initialChannelMediaState,
	reducers: {
		clearChannelMedia: (state, action: PayloadAction<{ channelId: string }>) => {
			delete state.eventsByChannel[action.payload.channelId];
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelMedia.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchChannelMedia.fulfilled,
				(state, action: PayloadAction<{ channelId: string; events: ApiChannelEvent[]; fromCache: boolean; time: number }>) => {
					const { channelId, events, fromCache } = action.payload;

					if (!state.eventsByChannel[channelId]) {
						state.eventsByChannel[channelId] = { events: [] };
					}

					if (!fromCache) {
						state.eventsByChannel[channelId].events = events;
						state.eventsByChannel[channelId].cache = createCacheMetadata(CHANNEL_MEDIA_CACHED_TIME);
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchChannelMedia.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const channelMediaReducer = channelMediaSlice.reducer;

export const channelMediaActions = {
	...channelMediaSlice.actions,
	fetchChannelMedia
};

export const getChannelMediaState = (rootState: any): ChannelMediaState => rootState[CHANNEL_MEDIA_FEATURE_KEY];

export const selectChannelMediaByChannelId = createSelector(
	[getChannelMediaState, (_state: unknown, channelId: string) => channelId],
	(state, channelId) => state.eventsByChannel[channelId]?.events || []
);

export const selectChannelMediaLoadingStatus = createSelector([getChannelMediaState], (state) => state.loadingStatus);
