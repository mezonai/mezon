import { captureSentryError } from '@mezon/logger';
import type { IStreamInfo } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiGetStreamPlaybackResponse } from 'mezon-js';
import { ensureClient, ensureSocket, getMezonCtx } from '../helpers';

export const VIDEO_STREAM_FEATURE_KEY = 'videostream';

export type StreamQuality = 'auto' | 'high' | 'mid' | 'low';

export const STREAM_QUALITIES: StreamQuality[] = ['auto', 'high', 'mid', 'low'];

const DEFAULT_QUALITY_STORAGE_KEY = 'mezon.stream.defaultQuality';

export const loadDefaultStreamQuality = (): StreamQuality => {
	try {
		const stored = localStorage.getItem(DEFAULT_QUALITY_STORAGE_KEY) as StreamQuality | null;
		return stored && STREAM_QUALITIES.includes(stored) ? stored : 'auto';
	} catch {
		return 'auto';
	}
};

export const saveDefaultStreamQuality = (quality: StreamQuality) => {
	try {
		localStorage.setItem(DEFAULT_QUALITY_STORAGE_KEY, quality);
	} catch {
		return;
	}
};

export interface StreamState {
	streamInfo: IStreamInfo | null;
	isPlaying: boolean;
	isJoin: boolean;
	playback: ApiGetStreamPlaybackResponse | null;
	quality: StreamQuality;
	defaultQuality: StreamQuality;
	volume: number;
	muted: boolean;
}

const defaultQuality = loadDefaultStreamQuality();

const initialState: StreamState = {
	streamInfo: null,
	isPlaying: false,
	isJoin: false,
	playback: null,
	quality: defaultQuality,
	defaultQuality,
	volume: 1,
	muted: false
};

export const fetchStreamPlayback = createAsyncThunk(
	'videostream/fetchStreamPlayback',
	async ({ channelId, publish = false }: { channelId: string; publish?: boolean }, thunkAPI): Promise<ApiGetStreamPlaybackResponse | null> => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const playback = await mezon.client.getStreamPlayback(mezon.session, { channel_id: channelId, publish });
			const usable = publish ? Boolean(playback?.whip_url) : Boolean(playback?.whep_url || playback?.hls_url);
			if (!playback?.token || !usable) throw new Error('stream playback is empty');
			return playback;
		} catch (error) {
			captureSentryError(error, 'videostream/fetchStreamPlayback');
			return null;
		}
	}
);

export const watchStream = createAsyncThunk(
	'videostream/watchStream',
	async ({ channelId, watching }: { channelId: string; watching: boolean }, thunkAPI) => {
		try {
			const mezon = ensureClient(getMezonCtx(thunkAPI));
			await mezon.client.writeStreamingWatch(mezon.session, channelId, watching);
		} catch {
			return;
		}
	}
);

const videoStreamSlice = createSlice({
	name: 'stream',
	initialState,
	reducers: {
		startStream(state, action: PayloadAction<IStreamInfo>) {
			state.streamInfo = action.payload;
			state.isPlaying = true;
			state.quality = state.defaultQuality;
		},
		stopStream(state) {
			state.isPlaying = false;
		},
		setIsJoin(state, action: PayloadAction<boolean>) {
			state.isJoin = action.payload;
		},
		setPlayback(state, action: PayloadAction<ApiGetStreamPlaybackResponse>) {
			state.playback = action.payload;
		},
		setQuality(state, action: PayloadAction<StreamQuality>) {
			state.quality = action.payload;
		},
		setDefaultQuality(state, action: PayloadAction<StreamQuality>) {
			state.defaultQuality = action.payload;
		},
		setVolume(state, action: PayloadAction<number>) {
			state.volume = Math.min(1, Math.max(0, action.payload));
			if (state.volume > 0) state.muted = false;
		},
		setMuted(state, action: PayloadAction<boolean>) {
			state.muted = action.payload;
		},
		resetPlayback(state) {
			state.isPlaying = false;
			state.isJoin = false;
			state.playback = null;
		}
	}
});

export const videoStreamReducer = videoStreamSlice.reducer;

export const videoStreamActions = {
	...videoStreamSlice.actions
};

export const getVideoStreamState = (rootState: { [VIDEO_STREAM_FEATURE_KEY]: StreamState }): StreamState => rootState[VIDEO_STREAM_FEATURE_KEY];

export const selectCurrentStreamInfo = createSelector(getVideoStreamState, (state) => state.streamInfo);

export const selectStatusStream = createSelector(getVideoStreamState, (state) => state.isPlaying);

export const selectIsJoin = createSelector(getVideoStreamState, (state) => state.isJoin);

export const selectStreamPlayback = createSelector(getVideoStreamState, (state) => state.playback);

export const selectStreamQuality = createSelector(getVideoStreamState, (state) => state.quality);

export const selectStreamDefaultQuality = createSelector(getVideoStreamState, (state) => state.defaultQuality);

export const selectStreamVolume = createSelector(getVideoStreamState, (state) => state.volume);

export const selectStreamMuted = createSelector(getVideoStreamState, (state) => state.muted);
