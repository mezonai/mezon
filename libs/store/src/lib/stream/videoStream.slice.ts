import type { IStreamInfo } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

export const VIDEO_STREAM_FEATURE_KEY = 'videostream';

export interface StreamState {
	streamInfo: IStreamInfo | null;
	isPlaying: boolean;
	isJoin: boolean;
	token: string;
	volume: number;
	muted: boolean;
}

const initialState: StreamState = {
	streamInfo: null,
	isPlaying: false,
	isJoin: false,
	token: '',
	volume: 1,
	muted: false
};

const videoStreamSlice = createSlice({
	name: 'stream',
	initialState,
	reducers: {
		startStream(state, action: PayloadAction<IStreamInfo>) {
			state.streamInfo = action.payload;
			state.isPlaying = true;
		},
		stopStream(state) {
			state.isPlaying = false;
		},
		setIsJoin(state, action: PayloadAction<boolean>) {
			state.isJoin = action.payload;
		},
		setToken(state, action: PayloadAction<string>) {
			state.token = action.payload;
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
			state.token = '';
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

export const selectStreamAudioToken = createSelector(getVideoStreamState, (state) => state.token);

export const selectStreamVolume = createSelector(getVideoStreamState, (state) => state.volume);

export const selectStreamMuted = createSelector(getVideoStreamState, (state) => state.muted);
