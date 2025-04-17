import { IDmCallInfo } from '@mezon/utils';
import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

export const AUDIO_CALL_FEATURE_KEY = 'audiocall';

export interface DmCallState {
	dmCallInfo: IDmCallInfo | null;
	isDialTone: boolean;
	isRingTone: boolean;
	isEndTone: boolean;
	isBusyTone: boolean;
	isRemoteAudio: boolean;
	isRemoteVideo: boolean;
	isJoinedCall: boolean;
	groupCallId: string;
	userCallId: string;
}

const initialState: DmCallState = {
	dmCallInfo: null,
	isDialTone: false,
	isRingTone: false,
	isEndTone: false,
	isBusyTone: false,
	isRemoteAudio: true,
	isRemoteVideo: false,
	isJoinedCall: false,
	groupCallId: '',
	userCallId: ''
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
		setIsBusyTone(state, action) {
			state.isBusyTone = action.payload;
		},
		setIsRemoteAudio(state, action) {
			state.isRemoteAudio = action.payload;
		},
		setIsRemoteVideo(state, action) {
			state.isRemoteVideo = action.payload;
		},
		setIsJoinedCall(state, action) {
			state.isJoinedCall = action.payload;
		},
		setGroupCallId(state, action) {
			state.groupCallId = action.payload;
		},
		setUserCallId(state, action) {
			state.userCallId = action.payload;
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

export const selectAudioBusyTone = createSelector(getAudioCallState, (state) => state.isBusyTone);

export const selectRemoteAudio = createSelector(getAudioCallState, (state) => state.isRemoteAudio);

export const selectRemoteVideo = createSelector(getAudioCallState, (state) => state.isRemoteVideo);

export const selectJoinedCall = createSelector(getAudioCallState, (state) => state.isJoinedCall);

export const selectGroupCallId = createSelector(getAudioCallState, (state) => state.groupCallId);

export const selectUserCallId = createSelector(getAudioCallState, (state) => state.userCallId);
