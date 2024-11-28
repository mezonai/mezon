import { IDmCallInfo } from '@mezon/utils';
import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

export const AUDIO_CALL_FEATURE_KEY = 'audiocall';

export interface DmCallState {
	dmCallInfo: IDmCallInfo | null;
	isDialTone: boolean;
	isRingTone: boolean;
	isEndTone: boolean;
	isRemoteAudio: boolean;
	isRemoteVideo: boolean;
	groupCallId: string;
}

const initialState: DmCallState = {
	dmCallInfo: null,
	isDialTone: false,
	isRingTone: false,
	isEndTone: false,
	isRemoteAudio: false,
	isRemoteVideo: false,
	groupCallId: ''
};

const audioCallSlice = createSlice({
	name: 'stream',
	initialState,
	reducers: {
		startDmCall(state, action: PayloadAction<IDmCallInfo>) {
			state.dmCallInfo = action.payload;
		},
		setIsDialTone(state, action) {
			state.isDialTone = action.payload;
		},
		setIsRingTone(state, action) {
			state.isRingTone = action.payload;
		},
		setIsEndTone(state, action) {
			state.isEndTone = action.payload;
		},
		setIsRemoteAudio(state, action) {
			state.isRemoteAudio = action.payload;
		},
		setIsRemoteVideo(state, action) {
			state.isRemoteVideo = action.payload;
		},
		setGroupCallId(state, action) {
			state.groupCallId = action.payload;
		}
	}
});

export const audioCallReducer = audioCallSlice.reducer;

export const audioCallActions = {
	...audioCallSlice.actions
};

export const getAudioCallState = (rootState: { [AUDIO_CALL_FEATURE_KEY]: DmCallState }): DmCallState => rootState[AUDIO_CALL_FEATURE_KEY];

export const selectCurrentStartDmCall = createSelector(getAudioCallState, (state) => state.dmCallInfo);

export const selectAudioDialTone = createSelector(getAudioCallState, (state) => state.isDialTone);

export const selectAudioRingTone = createSelector(getAudioCallState, (state) => state.isRingTone);

export const selectAudioEndTone = createSelector(getAudioCallState, (state) => state.isEndTone);

export const selectRemoteAudio = createSelector(getAudioCallState, (state) => state.isRemoteAudio);

export const selectRemoteVideo = createSelector(getAudioCallState, (state) => state.isRemoteVideo);

export const selectGroupCallId = createSelector(getAudioCallState, (state) => state.groupCallId);
