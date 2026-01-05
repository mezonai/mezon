import { IDMCall, IMessageSendPayload, IOtherCall, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { WebrtcSignalingFwd } from 'mezon-js';
import { ensureSession, getMezonCtx } from '../helpers';
import { RootState } from '../store';

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
	signalingData: WebrtcSignalingFwd;
	listOfCalls: Record<string, string[]>;
	isMuteMicrophone: boolean;
	isShowShareScreen: boolean;
	isShowMeetDM: boolean;
	localStream: MediaStream | null;
	isInCall: boolean;
	otherCall: IOtherCall | null;
	callMessageId: string;
	isForceQuitCallNative: boolean;
}

export const DMCallAdapter = createEntityAdapter<DMCallEntity>();

export const updateCallLog = createAsyncThunk(
	'update/callLog',
	async ({ channelId, content }: { channelId: string; content: IMessageSendPayload }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const state = thunkAPI.getState() as RootState;
			const messageId = selectCallMessageId(state);
			if (messageId) {
				mezon.socketRef.current?.updateChatMessage('0', channelId ?? '', 4, false, messageId, content, [], [], true);
			}
		} catch (error) {
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialDMCallState: DMCallState = DMCallAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	signalingData: {
		receiver_id: '',
		data_type: 0,
		json_data: '',
		channelId: '',
		caller_id: ''
	},
	listOfCalls: {},
	isMuteMicrophone: false,
	isShowShareScreen: false,
	isShowMeetDM: false,
	localStream: null,
	isInCall: false,
	otherCall: null,
	callMessageId: '',
	isForceQuitCallNative: false
});

export const DMCallSlice = createSlice({
	name: DMCALL_FEATURE_KEY,
	initialState: initialDMCallState,
	reducers: {
		add: DMCallAdapter.addOne,
		update: DMCallAdapter.updateOne,
		addMany: DMCallAdapter.addMany,
		remove: DMCallAdapter.removeOne,
		removeAll: DMCallAdapter.removeAll,

		addOrUpdate: (state, action: PayloadAction<DMCallEntity>) => {
			const existingEntity = state.entities[action.payload.id];
			if (existingEntity) {
				DMCallAdapter.updateOne(state, { id: action.payload.id, changes: action.payload });
			} else if (!existingEntity && Object.keys(state.entities).length === 0) {
				DMCallAdapter.addOne(state, action);
			} else {
				state.otherCall = {
					caller_id: action.payload.signalingData.caller_id,
					channelId: action.payload.signalingData.channelId
				};
			}
		},

		cancelCall: (state, action) => {
			const existingEntity = state.entities[action.payload.id];
			if (existingEntity) {
				DMCallActions.setIsInCall(false);
			}
			state.isInCall = false;
		},

		setIsMuteMicrophone: (state, action) => {
			state.isMuteMicrophone = action.payload;
		},
		setIsShowShareScreen: (state, action) => {
			state.isShowShareScreen = action.payload;
		},
		setIsShowMeetDM: (state, action) => {
			state.isShowMeetDM = action.payload;
		},
		setLocalStream: (state, action) => {
			state.localStream = action.payload;
		},
		setIsInCall: (state, action) => {
			state.isInCall = action.payload;
		},
		setOtherCall: (state, action: PayloadAction<IOtherCall>) => {
			state.otherCall = action.payload;
		},
		setCallMessageId: (state, action) => {
			state.callMessageId = action.payload;
		},
		setIsForceQuitCallNative(state, action) {
			state.isForceQuitCallNative = action.payload;
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
	...DMCallSlice.actions,
	updateCallLog
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
	return dmcalls.filter((dmcall) => {
		const isForUser = (dmcall && dmcall.signalingData?.receiver_id === userId) || dmcall.calleeId === userId;
		// Only include DM call events (data_type <= 8), exclude group call events (>= 9)
		const isDMCallEvent = dmcall?.signalingData?.data_type <= 8;
		return isForUser && isDMCallEvent;
	});
});

export const selectIsMuteMicrophone = createSelector(getDMCallState, (state: DMCallState) => state.isMuteMicrophone);

export const selectIsShowShareScreen = createSelector(getDMCallState, (state: DMCallState) => state.isShowShareScreen);

export const selectIsShowMeetDM = createSelector(getDMCallState, (state: DMCallState) => state.isShowMeetDM);

export const selectLocalStream = createSelector(getDMCallState, (state: DMCallState) => state.localStream);

export const selectIsInCall = createSelector(getDMCallState, (state) => state.isInCall);

export const selectOtherCall = createSelector(getDMCallState, (state) => state.otherCall);

export const selectCallMessageId = createSelector(getDMCallState, (state) => state.callMessageId);

export const selectIsForceQuitCallNative = createSelector(getDMCallState, (state) => state.isForceQuitCallNative);
