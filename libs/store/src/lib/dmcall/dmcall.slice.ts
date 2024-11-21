import { IDMCall, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { WebrtcSignalingFwd } from 'mezon-js';

export const DMCALL_FEATURE_KEY = 'dmcall';

/*
 * Update these interfaces according to your requirements.
 */
export interface DMCallEntity extends IDMCall {
	id: string; // Primary ID
}

export interface DMCallState extends EntityState<DMCallEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	callerId: string;
	calleeId: string;
	signalingData: WebrtcSignalingFwd;
	listOfCalls: Record<string, string[]>;
	channelCallId: string;
	isMuteMicrophone: boolean;
	isShowShareScreen: boolean;
	isShowMeetDM: boolean;
	localStream: MediaStream | null;
	isInCall: boolean;
	peerConnection: RTCPeerConnection;
}

export const DMCallAdapter = createEntityAdapter<DMCallEntity>();

export const initialDMCallState: DMCallState = DMCallAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	callerId: '',
	calleeId: '',
	signalingData: {
		receiver_id: '',
		data_type: 0,
		json_data: '',
		channel_id: '',
		caller_id: ''
	},
	channelCallId: '',
	listOfCalls: {},
	isMuteMicrophone: false,
	isShowShareScreen: false,
	isShowMeetDM: false,
	localStream: null,
	isInCall: false,
	peerConnection: new RTCPeerConnection()
});

export const DMCallSlice = createSlice({
	name: DMCALL_FEATURE_KEY,
	initialState: initialDMCallState,
	reducers: {
		add: DMCallAdapter.addOne,
		addMany: DMCallAdapter.addMany,
		remove: DMCallAdapter.removeOne,
		setListOfCallsSocket: (state, action: PayloadAction<{ userId: string | undefined; event: WebrtcSignalingFwd }>) => {
			const { userId, event } = action.payload;
			if (!userId) return;

			if (userId === event.receiver_id && event.channel_id !== '') {
				if (event.data_type === 4 && event.json_data === '') {
					state.listOfCalls[userId] = state.listOfCalls[userId].filter((id) => id !== event.channel_id);
					return;
				}
				if (!state.listOfCalls[userId]) {
					state.listOfCalls[userId] = [];
				}
				if (!state.listOfCalls[userId].includes(event.channel_id)) {
					state.listOfCalls[userId].push(event.channel_id);
				}
			}
		},
		setListOfCalls: (state, action: PayloadAction<{ userId: string; event: Record<string, string[]> }>) => {
			const { userId, event } = action.payload;
			if (!userId) return;

			if (!state.listOfCalls[userId]) {
				state.listOfCalls[userId] = [];
			}

			if (event[userId]?.length === 0) {
				delete state.listOfCalls[userId];
			}

			event[userId].forEach((channelId) => {
				if (!state.listOfCalls[userId].includes(channelId)) {
					state.listOfCalls[userId].push(channelId);
				}
			});
		},
		setIsMuteMicrophone: (state, action) => {
			state.isMuteMicrophone = action.payload;
		},
		setIsShowShareScreen: (state, action) => {
			state.isShowShareScreen = action.payload;
		},
		setCallerId: (state, action) => {
			state.callerId = action.payload;
		},
		setCalleeId: (state, action) => {
			state.calleeId = action.payload;
		},
		setChannelCallId: (state, action) => {
			state.channelCallId = action.payload;
		},
		setIsShowMeetDM: (state, action) => {
			state.isShowMeetDM = action.payload;
		},
		setLocalStream: (state, action) => {
			state.localStream = action.payload;
		},
		removeAll: DMCallAdapter.removeAll,
		setIsInCall: (state, action) => {
			state.isInCall = action.payload;
		},
		setPeerConnection: (state, action) => {
			state.peerConnection = action.payload;
		}
		// ...
	}
});

/*
 * Export reducer for store configuration.
 */
export const DMCallReducer = DMCallSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(usersActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const DMCallActions = {
	...DMCallSlice.actions
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllUsers);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
const { selectAll, selectEntities } = DMCallAdapter.getSelectors();

export const getDMCallState = (rootState: { [DMCALL_FEATURE_KEY]: DMCallState }): DMCallState => rootState[DMCALL_FEATURE_KEY];

export const selectAllDMCallVoice = createSelector(getDMCallState, selectAll);

export const selectDMVoiceEntities = createSelector(getDMCallState, selectEntities);

export const selectSignalingDataByUserId = createSelector([selectDMVoiceEntities, (state, userId) => userId], (entities, userId) => {
	const dmcalls = Object.values(entities);
	return dmcalls.filter((dmcall) => dmcall && dmcall.signalingData?.receiver_id === userId);
});

export const selectListOfCalls = createSelector(getDMCallState, (state: DMCallState) => state.listOfCalls);

export const selectIsMuteMicrophone = createSelector(getDMCallState, (state: DMCallState) => state.isMuteMicrophone);

export const selectIsShowShareScreen = createSelector(getDMCallState, (state: DMCallState) => state.isShowShareScreen);

export const selectCallerId = createSelector(getDMCallState, (state: DMCallState) => state.callerId);

export const selectCalleeId = createSelector(getDMCallState, (state: DMCallState) => state.calleeId);

export const selectChannelCallId = createSelector(getDMCallState, (state: DMCallState) => state.channelCallId);

export const selectIsShowMeetDM = createSelector(getDMCallState, (state: DMCallState) => state.isShowMeetDM);

export const selectLocalStream = createSelector(getDMCallState, (state: DMCallState) => state.localStream);

export const selectIsInCall = createSelector(getDMCallState, (state) => state.isInCall);

export const selectPeerConnection = createSelector(getDMCallState, (state: DMCallState) => state.peerConnection);
