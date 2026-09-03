import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { ensureSession, getMezonCtx, type MezonValueContext } from '../helpers';

export const CHANNEL_MEDIA_FEATURE_KEY = 'channelMedia';

const CHANNEL_MEDIA_CACHED_TIME = 1000 * 60 * 20;

export interface ChannelTimelineAttachment {
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

export interface ChannelTimeline {
	id: string;
	clan_id: string;
	channel_id: string;
	start_time_seconds: number;
	title: string;
	description: string;
	end_time_seconds: number;
	location: string;
	status: number;
	type?: number;
	creator_id: string;
	create_time_seconds: number;
	update_time_seconds: number;
	preview_imgs: Array<ChannelTimelineAttachment>;
	attachments: Array<ChannelTimelineAttachment>;
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
	attachments?: Array<ChannelTimelineAttachment>;
}

export interface updateChannelTimelinePayload {
	id: string;
	clan_id: string;
	channel_id: string;
	title?: string;
	description?: string;
	start_time_seconds: number;
	location?: string;
	attachments?: Array<ChannelTimelineAttachment>;
}

export interface detailChannelTimelinePayload {
	id: string;
	clan_id: string;
	channel_id: string;
	start_time_seconds: number;
	noCache?: boolean;
}

export interface ChannelMediaChannelState {
	eventsByYear: Record<number, ChannelTimeline[]>;
	cacheByYear: Record<number, CacheMetadata>;
}

export interface ChannelMediaState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	eventsByChannel: Record<string, ChannelMediaChannelState>;
	eventDetailCache: Record<string, { event: ChannelTimeline; cache: CacheMetadata }>;
}

type RootState = { [CHANNEL_MEDIA_FEATURE_KEY]: ChannelMediaState };

const fetchChannelMediaCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, payload: fetchChannelMediaPayload) => {
	const { noCache, ...requestPayload } = payload;
	const currentState = getState();
	const channelData = currentState[CHANNEL_MEDIA_FEATURE_KEY]?.eventsByChannel?.[payload.channel_id];
	const yearCache = channelData?.cacheByYear?.[payload.year];
	const apiKey = createApiKey('fetchChannelMedia', payload.channel_id, payload.year);

	const shouldForceCall = shouldForceApiCall(apiKey, yearCache, noCache);

	if (!shouldForceCall && channelData?.eventsByYear?.[payload.year]) {
		return {
			channelId: payload.channel_id,
			year: payload.year,
			events: channelData.eventsByYear[payload.year],
			fromCache: true,
			time: yearCache?.lastFetched || Date.now()
		};
	}

	const response = await ensuredMezon.client.listChannelTimeline(ensuredMezon.session, requestPayload);

	markApiFirstCalled(apiKey);

	return {
		channelId: payload.channel_id,
		year: payload.year,
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
			const event = {
				...payload,
				...(response?.event || {})
			} as ChannelTimeline;
			return {
				channelId: payload.channel_id,
				event
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
				event: response.event as ChannelTimeline
			};
		} catch (error) {
			captureSentryError(error, 'channelMedia/updateChannelTimeline');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

const selectCachedEventDetail = (state: RootState, eventId: string): ChannelTimeline | undefined =>
	state[CHANNEL_MEDIA_FEATURE_KEY].eventDetailCache[eventId]?.event;

const detailChannelTimelineCached = async (getState: () => RootState, ensuredMezon: MezonValueContext, payload: detailChannelTimelinePayload) => {
	const { noCache, ...requestPayload } = payload;
	const currentState = getState();
	const cachedEvent = selectCachedEventDetail(currentState, payload.id);
	const cached = currentState[CHANNEL_MEDIA_FEATURE_KEY].eventDetailCache[payload.id];
	const apiKey = createApiKey('detailChannelTimeline', payload.id);

	const shouldForceCall = shouldForceApiCall(apiKey, cached?.cache, noCache);

	if (!shouldForceCall && cachedEvent) {
		return {
			channelId: payload.channel_id,
			event: cachedEvent,
			fromCache: true
		};
	}

	const response = await ensuredMezon.client.detailChannelTimeline(ensuredMezon.session, requestPayload);
	markApiFirstCalled(apiKey);

	return {
		channelId: payload.channel_id,
		event: response.event as ChannelTimeline,
		fromCache: false
	};
};

export const detailChannelTimeline = createAsyncThunk(
	'channelMedia/detailChannelTimeline',
	async (payload: detailChannelTimelinePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			return await detailChannelTimelineCached(thunkAPI.getState as () => RootState, mezon, payload);
		} catch (error) {
			captureSentryError(error, 'channelMedia/detailChannelTimeline');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialChannelMediaState: ChannelMediaState = {
	loadingStatus: 'not loaded',
	error: null,
	eventsByChannel: {} as Record<string, ChannelMediaChannelState>,
	eventDetailCache: {}
};

function mergeChannelTimelineEvent(existing: ChannelTimeline | undefined, incoming: ChannelTimeline): ChannelTimeline {
	if (!existing) {
		return incoming;
	}
	return {
		...existing,
		...incoming,
		attachments: incoming.attachments ?? existing.attachments,
		preview_imgs: incoming.preview_imgs ?? existing.preview_imgs
	};
}

function syncEventDetailCache(state: ChannelMediaState, event: ChannelTimeline) {
	if (!event?.id) {
		return;
	}
	const merged = mergeChannelTimelineEvent(state.eventDetailCache[event.id]?.event, event);
	state.eventDetailCache[event.id] = {
		event: merged,
		cache: createCacheMetadata(CHANNEL_MEDIA_CACHED_TIME)
	};
}

export const channelMediaSlice = createSlice({
	name: CHANNEL_MEDIA_FEATURE_KEY,
	initialState: initialChannelMediaState,
	reducers: {
		clearChannelMedia: (state, action: PayloadAction<{ channelId: string }>) => {
			const channelId = action.payload.channelId;
			delete state.eventsByChannel[channelId];
			for (const id of Object.keys(state.eventDetailCache)) {
				if (state.eventDetailCache[id].event.channel_id === channelId) {
					delete state.eventDetailCache[id];
				}
			}
		},
		patchEventDetailCache: (state, action: PayloadAction<{ event: ChannelTimeline }>) => {
			syncEventDetailCache(state, action.payload.event);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelMedia.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchChannelMedia.fulfilled,
				(state, action: PayloadAction<{ channelId: string; year: number; events: ChannelTimeline[]; fromCache: boolean; time: number }>) => {
					const { channelId, year, events, fromCache } = action.payload;

					if (!state.eventsByChannel[channelId]) {
						state.eventsByChannel[channelId] = { eventsByYear: {}, cacheByYear: {} };
					}
					if (!state.eventsByChannel[channelId].eventsByYear) {
						state.eventsByChannel[channelId].eventsByYear = {};
					}
					if (!state.eventsByChannel[channelId].cacheByYear) {
						state.eventsByChannel[channelId].cacheByYear = {};
					}

					if (!fromCache) {
						state.eventsByChannel[channelId].eventsByYear[year] = events;
						state.eventsByChannel[channelId].cacheByYear[year] = createCacheMetadata(CHANNEL_MEDIA_CACHED_TIME);
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
			.addCase(createChannelTimeline.fulfilled, (state, action: PayloadAction<{ channelId: string; event: ChannelTimeline }>) => {
				const { channelId, event } = action.payload;

				if (!state.eventsByChannel[channelId]) {
					state.eventsByChannel[channelId] = { eventsByYear: {}, cacheByYear: {} };
				}
				if (!state.eventsByChannel[channelId].eventsByYear) {
					state.eventsByChannel[channelId].eventsByYear = {};
				}
				if (!state.eventsByChannel[channelId].cacheByYear) {
					state.eventsByChannel[channelId].cacheByYear = {};
				}

				const eventYear = event.start_time_seconds ? new Date(event.start_time_seconds * 1000).getFullYear() : new Date().getFullYear();

				if (!state.eventsByChannel[channelId].eventsByYear[eventYear]) {
					state.eventsByChannel[channelId].eventsByYear[eventYear] = [];
				}

				const events = state.eventsByChannel[channelId].eventsByYear[eventYear];
				const existingIndex = events.findIndex((e) => e.id === event.id);
				if (existingIndex !== -1) {
					events[existingIndex] = event;
				} else {
					const insertIndex = events.findIndex((e) => (e.start_time_seconds || 0) < (event.start_time_seconds || 0));
					if (insertIndex === -1) {
						events.push(event);
					} else {
						events.splice(insertIndex, 0, event);
					}
				}

				syncEventDetailCache(state, event);
				state.loadingStatus = 'loaded';
			})
			.addCase(createChannelTimeline.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(updateChannelTimeline.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(updateChannelTimeline.fulfilled, (state, action: PayloadAction<{ channelId: string; event: ChannelTimeline }>) => {
				const { channelId, event } = action.payload;

				if (state.eventsByChannel[channelId]?.eventsByYear) {
					const eventYear = event.start_time_seconds ? new Date(event.start_time_seconds * 1000).getFullYear() : new Date().getFullYear();

					let found = false;
					for (const yearKey of Object.keys(state.eventsByChannel[channelId].eventsByYear)) {
						const yearNum = Number(yearKey);
						const yearEvents = state.eventsByChannel[channelId].eventsByYear[yearNum];
						const index = yearEvents.findIndex((e) => e.id === event.id);
						if (index !== -1) {
							found = true;
							if (yearNum === eventYear) {
								yearEvents[index] = mergeChannelTimelineEvent(yearEvents[index], event);
							} else {
								yearEvents.splice(index, 1);
								if (!state.eventsByChannel[channelId].eventsByYear[eventYear]) {
									state.eventsByChannel[channelId].eventsByYear[eventYear] = [];
								}
								state.eventsByChannel[channelId].eventsByYear[eventYear].push(event);
							}
							break;
						}
					}

					if (!found && event.id) {
						if (!state.eventsByChannel[channelId].eventsByYear[eventYear]) {
							state.eventsByChannel[channelId].eventsByYear[eventYear] = [];
						}
						state.eventsByChannel[channelId].eventsByYear[eventYear].push(event);
					}
				}

				syncEventDetailCache(state, event);
				state.loadingStatus = 'loaded';
			})
			.addCase(updateChannelTimeline.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(
				detailChannelTimeline.fulfilled,
				(
					state,
					action: PayloadAction<{
						channelId: string;
						event: ChannelTimeline;
						fromCache?: boolean;
					}>
				) => {
					const { event, fromCache } = action.payload;
					if (!fromCache && event?.id) {
						syncEventDetailCache(state, event);
					}
					state.loadingStatus = 'loaded';
				}
			);
	}
});

export const channelMediaReducer = channelMediaSlice.reducer;

export const channelMediaActions = {
	...channelMediaSlice.actions,
	fetchChannelMedia,
	createChannelTimeline,
	updateChannelTimeline,
	detailChannelTimeline
};

export const getChannelMediaState = (rootState: any): ChannelMediaState => rootState[CHANNEL_MEDIA_FEATURE_KEY];

export const selectChannelMediaByChannelId = createSelector(
	[getChannelMediaState, (_state: unknown, channelId: string) => channelId],
	(state, channelId): ChannelTimeline[] => {
		const channelData = state.eventsByChannel[channelId];
		if (!channelData?.eventsByYear) return [];
		const allEvents = Object.values(channelData.eventsByYear).flat();
		const uniqueMap = new Map<string, ChannelTimeline>();
		for (const event of allEvents) {
			if (event?.id) {
				uniqueMap.set(event.id, event);
			}
		}
		return Array.from(uniqueMap.values()).sort((a, b) => (b.start_time_seconds || 0) - (a.start_time_seconds || 0));
	}
);

export const selectChannelMediaByChannelIdAndYear = createSelector(
	[getChannelMediaState, (_state: unknown, channelId: string) => channelId, (_state: unknown, _channelId: string, year: number) => year],
	(state, channelId, year): ChannelTimeline[] => {
		const channelData = state.eventsByChannel[channelId];
		const events = channelData?.eventsByYear?.[year] || [];
		return [...events].sort((a, b) => (b.start_time_seconds || 0) - (a.start_time_seconds || 0));
	}
);

export const selectChannelMediaLoadingStatus = createSelector([getChannelMediaState], (state) => state.loadingStatus);

export const selectChannelTimelineDetailById = createSelector(
	[getChannelMediaState, (_state: unknown, eventId: string) => eventId],
	(state, eventId) => state.eventDetailCache[eventId]?.event
);
