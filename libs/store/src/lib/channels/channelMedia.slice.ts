import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { ensureSession, getMezonCtx, type MezonValueContext } from '../helpers';

export const CHANNEL_MEDIA_FEATURE_KEY = 'channelMedia';

const CHANNEL_MEDIA_CACHED_TIME = 1000 * 60 * 20;

export interface ChannelEventAttachment {
	id: string;
	file_name: string;
	file_url: string;
	file_type: string;
	file_size: string;
	width: number;
	height: number;
	thumbnail: string;
	duration: number;
	message_id: string;
}

export interface ChannelEvent {
	id: string;
	clan_id: string;
	channel_id: string;
	start_time_seconds: number;
	title: string;
	description: string;
	end_time_seconds: number;
	location: string;
	status: number;
	creator_id: string;
	create_time_seconds: number;
	update_time_seconds: number;
	attachments: Array<ChannelEventAttachment>;
}
export interface fetchChannelMediaPayload {
	clan_id: string;
	channel_id: string;
	year: number;
	start_time?: number;
	end_time?: number;
	limit?: number;
	noCache?: boolean;
}

export interface createChannelTimelinePayload {
	clan_id: string;
	channel_id: string;
	title: string;
	description?: string;
	start_time_seconds: number;
	end_time_seconds: number;
	location?: string;
	attachments?: Array<ChannelEventAttachment>;
}

export interface updateChannelTimelinePayload {
	id: string;
	clan_id: string;
	channel_id: string;
	title?: string;
	description?: string;
	start_time_seconds?: number;
	location?: string;
	attachments?: Array<ChannelEventAttachment>;
}

export interface ChannelMediaChannelState {
	events: ChannelEvent[];
	cache?: CacheMetadata;
}

export interface ChannelMediaState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	eventsByChannel: Record<string, ChannelMediaChannelState>;
}

type RootState = { [CHANNEL_MEDIA_FEATURE_KEY]: ChannelMediaState };

const fetchChannelMediaCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, payload: fetchChannelMediaPayload) => {
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

	const response = await ensuredMezon.client.listChannelTimeline(ensuredMezon.session, requestPayload);

	markApiFirstCalled(apiKey);

	return {
		channelId: payload.channel_id,
		events: response.events || [],
		fromCache: false,
		time: Date.now()
	};
};

export const fetchChannelMedia = createAsyncThunk('channelMedia/fetchChannelMedia', async (payload: fetchChannelMediaPayload, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		return await fetchChannelMediaCached(thunkAPI.getState as () => RootState, mezon, payload);
	} catch (error) {
		captureSentryError(error, 'channelMedia/fetchChannelMedia');
		return thunkAPI.rejectWithValue(error);
	}
});

export const createChannelTimeline = createAsyncThunk(
	'channelMedia/createChannelTimeline',
	async (payload: createChannelTimelinePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.createChannelTimeline(mezon.session, payload);
			return {
				channelId: payload.channel_id,
				event: response.event as ChannelEvent
			};
		} catch (error) {
			captureSentryError(error, 'channelMedia/createChannelTimeline');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateChannelTimeline = createAsyncThunk(
	'channelMedia/updateChannelTimeline',
	async (payload: updateChannelTimelinePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.updateChannelTimeline(mezon.session, {
				...payload,
				start_time_seconds: payload.start_time_seconds || 0
			});
			return {
				channelId: payload.channel_id,
				event: response.event as ChannelEvent
			};
		} catch (error) {
			captureSentryError(error, 'channelMedia/updateChannelTimeline');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

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
				(state, action: PayloadAction<{ channelId: string; events: ChannelEvent[]; fromCache: boolean; time: number }>) => {
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
			})
			.addCase(createChannelTimeline.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(createChannelTimeline.fulfilled, (state, action: PayloadAction<{ channelId: string; event: ChannelEvent }>) => {
				const { channelId, event } = action.payload;

				if (!state.eventsByChannel[channelId]) {
					state.eventsByChannel[channelId] = { events: [] };
				}

				state.eventsByChannel[channelId].events.push(event);
				state.loadingStatus = 'loaded';
			})
			.addCase(createChannelTimeline.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(updateChannelTimeline.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(updateChannelTimeline.fulfilled, (state, action: PayloadAction<{ channelId: string; event: ChannelEvent }>) => {
				const { channelId, event } = action.payload;

				if (state.eventsByChannel[channelId]) {
					const index = state.eventsByChannel[channelId].events.findIndex((e) => e.id === event.id);
					if (index !== -1) {
						state.eventsByChannel[channelId].events[index] = event;
					}
				}

				state.loadingStatus = 'loaded';
			})
			.addCase(updateChannelTimeline.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const channelMediaReducer = channelMediaSlice.reducer;

export const channelMediaActions = {
	...channelMediaSlice.actions,
	fetchChannelMedia,
	createChannelTimeline,
	updateChannelTimeline
};

export const getChannelMediaState = (rootState: any): ChannelMediaState => rootState[CHANNEL_MEDIA_FEATURE_KEY];

export const selectChannelMediaByChannelId = createSelector(
	[getChannelMediaState, (_state: unknown, channelId: string) => channelId],
	(state, channelId) => state.eventsByChannel[channelId]?.events || []
);

export const selectChannelMediaLoadingStatus = createSelector([getChannelMediaState], (state) => state.loadingStatus);
