import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface GroupCallData {
	groupId: string;
	groupName: string;
	groupAvatar?: string;
	meetingCode?: string;
	clanId?: string;
	participants: string[];
	callerInfo: {
		id: string;
		name: string;
		avatar?: string;
	};
}

interface GroupCallState {
	isGroupCallActive: boolean;
	isShowPreCallInterface: boolean;
	isShowIncomingGroupCall: boolean;
	currentGroupId: string | null;
	incomingCallData: any | null;
	storedCallData: GroupCallData | null;
	isVideoCall: boolean;
	isLoading: boolean;
	shouldAutoJoinRoom: boolean;
	isAnsweringCall: boolean;
	participants: string[];
	callStartTime: number | null;
}

const initialState: GroupCallState = {
	isGroupCallActive: false,
	isShowPreCallInterface: false,
	isShowIncomingGroupCall: false,
	currentGroupId: null,
	incomingCallData: null,
	storedCallData: null,
	isVideoCall: false,
	isLoading: false,
	shouldAutoJoinRoom: false,
	isAnsweringCall: false,
	participants: [],
	callStartTime: null
};

export const groupCallSlice = createSlice({
	name: 'groupCall',
	initialState,
	reducers: {
		showPreCallInterface: (state, action: PayloadAction<{ groupId: string; isVideo: boolean }>) => {
			state.isShowPreCallInterface = true;
			state.currentGroupId = action.payload.groupId;
			state.isVideoCall = action.payload.isVideo;
		},
		hidePreCallInterface: (state) => {
			state.isShowPreCallInterface = false;
		},
		showIncomingGroupCall: (state, action: PayloadAction<{ groupId: string; callData: any; isVideo: boolean }>) => {
			state.isShowIncomingGroupCall = true;
			state.currentGroupId = action.payload.groupId;
			state.incomingCallData = action.payload.callData;
			state.isVideoCall = action.payload.isVideo;
		},
		hideIncomingGroupCall: (state) => {
			state.isShowIncomingGroupCall = false;
		},
		setIncomingCallData: (state, action: PayloadAction<GroupCallData>) => {
			state.storedCallData = action.payload;
		},
		clearStoredCallData: (state) => {
			state.storedCallData = null;
		},
		autoJoinRoom: (state, action: PayloadAction<{ shouldJoin: boolean; isAnswering?: boolean }>) => {
			state.shouldAutoJoinRoom = action.payload.shouldJoin;
			if (action.payload.isAnswering !== undefined) {
				state.isAnsweringCall = action.payload.isAnswering;
			}
		},
		startGroupCall: (state) => {
			state.isGroupCallActive = true;
			state.isShowIncomingGroupCall = false;
			state.shouldAutoJoinRoom = false;
			state.callStartTime = Date.now();
		},
		hidePreCallInterfaceOnUserJoin: (state) => {
			state.isShowPreCallInterface = false;
		},
		endGroupCall: (state) => {
			state.isGroupCallActive = false;
			state.isShowPreCallInterface = false;
			state.isShowIncomingGroupCall = false;
			state.currentGroupId = null;
			state.incomingCallData = null;
			state.storedCallData = null;
			state.isVideoCall = false;
			state.shouldAutoJoinRoom = false;
			state.isAnsweringCall = false;
			state.participants = [];
			state.callStartTime = null;
		},
		addParticipant: (state, action: PayloadAction<string>) => {
			if (!state.participants.includes(action.payload)) {
				state.participants.push(action.payload);
				if (state.participants.length >= 1) {
					state.isShowPreCallInterface = false;
				}
			}
		},
		removeParticipant: (state, action: PayloadAction<string>) => {
			state.participants = state.participants.filter((id) => id !== action.payload);
		},
		setParticipants: (state, action: PayloadAction<string[]>) => {
			state.participants = action.payload;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		resetGroupCallState: () => initialState
	}
});

export const groupCallActions = groupCallSlice.actions;

export const selectIsGroupCallActive = (state: RootState) => state.groupCall.isGroupCallActive;
export const selectIsShowPreCallInterface = (state: RootState) => state.groupCall.isShowPreCallInterface;
export const selectIsShowIncomingGroupCall = (state: RootState) => state.groupCall.isShowIncomingGroupCall;
export const selectCurrentGroupId = (state: RootState) => state.groupCall.currentGroupId;
export const selectIncomingCallData = (state: RootState) => state.groupCall.incomingCallData;
export const selectIsVideoGroupCall = (state: RootState) => state.groupCall.isVideoCall;
export const selectIsGroupCallLoading = (state: RootState) => state.groupCall.isLoading;
export const selectShouldAutoJoinRoom = (state: RootState) => state.groupCall.shouldAutoJoinRoom;
export const selectIsAnsweringCall = (state: RootState) => state.groupCall.isAnsweringCall;
export const selectGroupCallStartTime = (state: RootState) => state.groupCall.callStartTime;
export const selectStoredCallData = (state: RootState) => state.groupCall.storedCallData;

export default groupCallSlice.reducer;
