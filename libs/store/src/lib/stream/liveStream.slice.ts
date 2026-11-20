import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

export const LIVE_STREAM_FEATURE_KEY = 'livestream';

export type LivePhase = 'idle' | 'starting' | 'live' | 'reconnecting';

export type LiveFailure = 'busy' | 'forbidden' | 'serverBusy' | 'unsupported' | 'network' | 'replaced' | 'accessLost';

export type LiveSource = 'screen' | 'camera' | 'mic' | 'systemAudio';

export interface LiveStreamState {
	phase: LivePhase;
	clanId: string;
	channelId: string;
	channelLabel: string;
	clanName: string;
	parentId: string;
	attempt: number;
	screenOn: boolean;
	cameraOn: boolean;
	micOn: boolean;
	systemAudioOn: boolean;
	hasSystemAudio: boolean;
	stopRequest: LiveFailure | 'user' | null;
}

export interface LiveStartingPayload {
	clanId: string;
	channelId: string;
	channelLabel: string;
	clanName: string;
	parentId: string;
	screenOn: boolean;
	cameraOn: boolean;
	micOn: boolean;
	systemAudioOn: boolean;
	hasSystemAudio?: boolean;
}

export type LiveSourcesUpdate = Partial<{
	screenOn: boolean;
	cameraOn: boolean;
	micOn: boolean;
	systemAudioOn: boolean;
	hasSystemAudio: boolean;
}>;

const initialState: LiveStreamState = {
	phase: 'idle',
	clanId: '',
	channelId: '',
	channelLabel: '',
	clanName: '',
	parentId: '',
	attempt: 0,
	screenOn: false,
	cameraOn: false,
	micOn: false,
	systemAudioOn: false,
	hasSystemAudio: false,
	stopRequest: null
};

const liveStreamSlice = createSlice({
	name: LIVE_STREAM_FEATURE_KEY,
	initialState,
	reducers: {
		starting(state, action: PayloadAction<LiveStartingPayload>) {
			state.phase = 'starting';
			state.clanId = action.payload.clanId;
			state.channelId = action.payload.channelId;
			state.channelLabel = action.payload.channelLabel;
			state.clanName = action.payload.clanName;
			state.parentId = action.payload.parentId;
			state.attempt = 0;
			state.screenOn = action.payload.screenOn;
			state.cameraOn = action.payload.cameraOn;
			state.micOn = action.payload.micOn;
			state.systemAudioOn = action.payload.systemAudioOn;
			state.hasSystemAudio = action.payload.hasSystemAudio ?? false;
			state.stopRequest = null;
		},
		setPhase(state, action: PayloadAction<{ phase: LivePhase; attempt?: number }>) {
			state.phase = action.payload.phase;
			state.attempt = action.payload.attempt ?? (action.payload.phase === 'reconnecting' ? state.attempt : 0);
		},
		setSources(state, action: PayloadAction<LiveSourcesUpdate>) {
			if (action.payload.screenOn !== undefined) state.screenOn = action.payload.screenOn;
			if (action.payload.cameraOn !== undefined) state.cameraOn = action.payload.cameraOn;
			if (action.payload.micOn !== undefined) state.micOn = action.payload.micOn;
			if (action.payload.systemAudioOn !== undefined) state.systemAudioOn = action.payload.systemAudioOn;
			if (action.payload.hasSystemAudio !== undefined) state.hasSystemAudio = action.payload.hasSystemAudio;
		},
		requestStop(state, action: PayloadAction<LiveFailure | 'user'>) {
			if (state.phase !== 'idle') {
				state.stopRequest = action.payload;
			}
		},
		reset() {
			return initialState;
		}
	}
});

export const liveStreamReducer = liveStreamSlice.reducer;

export const liveStreamActions = {
	...liveStreamSlice.actions
};

export const getLiveStreamState = (rootState: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }): LiveStreamState => rootState[LIVE_STREAM_FEATURE_KEY];

export const selectLivePhase = createSelector(getLiveStreamState, (state) => state.phase);

export const selectLiveChannelId = createSelector(getLiveStreamState, (state) => (state.phase === 'idle' ? '' : state.channelId));

export const selectIsLiveActive = createSelector(getLiveStreamState, (state) => state.phase !== 'idle');

export const selectIsLiveInChannel = (rootState: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }, channelId: string): boolean => {
	const state = getLiveStreamState(rootState);
	return state.phase !== 'idle' && Boolean(channelId) && state.channelId === channelId;
};

export const selectLiveSources = createSelector(
	[
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).screenOn,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).cameraOn,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).micOn,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).systemAudioOn,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).hasSystemAudio
	],
	(screenOn, cameraOn, micOn, systemAudioOn, hasSystemAudio) => ({
		screenOn,
		cameraOn,
		micOn,
		systemAudioOn,
		hasSystemAudio
	})
);

export const selectLiveInfo = createSelector(
	[
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).clanId,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).clanName,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).channelId,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).channelLabel,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).parentId,
		(state: { [LIVE_STREAM_FEATURE_KEY]: LiveStreamState }) => getLiveStreamState(state).attempt
	],
	(clanId, clanName, channelId, channelLabel, parentId, attempt) => ({
		clanId,
		clanName,
		channelId,
		channelLabel,
		parentId,
		attempt
	})
);

export const selectLiveStopRequest = createSelector(getLiveStreamState, (state) => state.stopRequest);
