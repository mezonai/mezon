import type { IStreamInfo } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

export const VIDEO_STREAM_FEATURE_KEY = 'videostream';

export interface StreamState {
	streamInfo: IStreamInfo | null;
	isPlaying: boolean;
	isJoin: boolean;
	isRemoteVideoStream: boolean;
	isRemoteAudioStream: boolean;
}

const initialState: StreamState = {
	streamInfo: null,
	isPlaying: false,
	isJoin: false,
	isRemoteVideoStream: false,
	isRemoteAudioStream: false
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
			// state.currentStreamId = null;
		},
		setIsRemoteVideoStream(state, action) {
			state.isRemoteVideoStream = action.payload;
		},
		setIsRemoteAudioStream(state, action) {
			state.isRemoteAudioStream = action.payload;
		},
		setIsJoin(state, action) {
			state.isJoin = action.payload;
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

export const selectRemoteVideoStream = createSelector(getVideoStreamState, (state) => state.isRemoteVideoStream);

export const selectIsJoin = createSelector(getVideoStreamState, (state) => state.isJoin);
