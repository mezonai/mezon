import type { IDMCall, IMessageSendPayload, IOtherCall, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const DMCALL_FEATURE_KEY = 'dmcall';

/*
 * Update these interfaces according to your requirements.
 */
export interface DMCallEntity extends Omit<IDMCall, 'signalingData'> {
	id: string; // Primary ID
	signalingData: {
		receiver_id: string;
		data_type: number;
		json_data: string;
		channel_id: string;
		caller_id: string;
	};
}

export const mapDMCallToEntity = (dmCall: IDMCall, id?: string | bigint): DMCallEntity => {
	const entityId = id !== undefined ? String(id) : dmCall.callerId || dmCall.calleeId || '';
	return {
		...dmCall,
		id: entityId,
		signalingData: {
			receiver_id: dmCall.signalingData?.receiver_id !== undefined ? String(dmCall.signalingData.receiver_id) : '',
			data_type: dmCall.signalingData?.data_type || 0,
			json_data: dmCall.signalingData?.json_data || '',
			channel_id: dmCall.signalingData?.channel_id !== undefined ? String(dmCall.signalingData.channel_id) : '',
			caller_id: dmCall.signalingData?.caller_id !== undefined ? String(dmCall.signalingData.caller_id) : ''
		}
	};
};

export interface DMCallState extends EntityState<DMCallEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	signalingData: {
		receiver_id: string;
		data_type: number;
		json_data: string;
		channel_id: string;
		caller_id: string;
	};
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
				mezon.socketRef.current?.updateChatMessage(BigInt('0'), BigInt(channelId ?? ''), 4, false, BigInt(messageId), content, [], [], true);
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
		channel_id: '',
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

const DMCallSlice = createSlice({
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
					channel_id: action.payload.signalingData.channel_id
				} as IOtherCall;
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
const { selectEntities } = DMCallAdapter.getSelectors();

export const getDMCallState = (rootState: { [DMCALL_FEATURE_KEY]: DMCallState }): DMCallState => rootState[DMCALL_FEATURE_KEY];

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

export const selectIsShowMeetDM = createSelector(getDMCallState, (state: DMCallState) => state.isShowMeetDM);

export const selectIsInCall = createSelector(getDMCallState, (state) => state.isInCall);

export const selectOtherCall = createSelector(getDMCallState, (state) => state.otherCall);

export const selectCallMessageId = createSelector(getDMCallState, (state) => state.callMessageId);

export const selectIsForceQuitCallNative = createSelector(getDMCallState, (state) => state.isForceQuitCallNative);
