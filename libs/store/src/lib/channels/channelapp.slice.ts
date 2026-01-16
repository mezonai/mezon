import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import { DEFAULT_POSITION, INIT_SIZE } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { JoinChannelAppData } from 'mezon-js';
import { ensureSession, getMezonCtx } from '../helpers';

type CreateChannelAppMeetPayload = {
	channelId: bigint;
	roomName: string;
};

type GenerateAppUserHashPayload = {
	appId: bigint;
};

export const CHANNEL_APP = 'channelApp';

export interface ChannelAppEntity {
	id: string;
}

export interface ChannelAppState {
	loadingStatus: LoadingStatus;
	roomName: string | null;
	roomId: Record<string, string | null>;
	channelId: string | null;
	clanId: string | null;
	roomToken: string | undefined;
	enableMic: boolean;
	enableVideo: boolean;
	joinChannelAppData: JoinChannelAppData | undefined;
	enableCall: boolean;
	position: { x: number; y: number };
	size: { width: number; height: number };
}

export const initialChannelAppState: ChannelAppState = {
	loadingStatus: 'not loaded',
	roomName: null,
	joinChannelAppData: undefined,
	roomId: {},
	clanId: null,
	roomToken: undefined,
	enableMic: false,
	enableVideo: false,
	enableCall: false,
	channelId: null,
	position: DEFAULT_POSITION,
	size: INIT_SIZE
};
export const createChannelAppMeet = createAsyncThunk(
	`${CHANNEL_APP}/CreateMeetingRoom`,
	async ({ channelId, roomName }: CreateChannelAppMeetPayload, thunkAPI) => {
		if (!channelId || roomName.trim() === '') return thunkAPI.rejectWithValue('Invalid input');
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.createRoomChannelApps(mezon.session, {
				channel_id: channelId,
				room_name: roomName
			});

			if (!response) {
				return thunkAPI.rejectWithValue('Failed to create room');
			}
			return response;
		} catch (error) {
			captureSentryError(error, `${CHANNEL_APP}/CreateMeetingRoom`);
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const generateAppUserHash = createAsyncThunk(`${CHANNEL_APP}/generateAppUserHash`, async ({ appId }: GenerateAppUserHashPayload, thunkAPI) => {
	if (appId === BigInt(0)) return thunkAPI.rejectWithValue('Invalid input');
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.generateHashChannelApps(mezon.session, appId);

		if (!response) {
			return thunkAPI.rejectWithValue('Failed to create room');
		}
		return response;
	} catch (error) {
		captureSentryError(error, `${CHANNEL_APP}/generateAppUserHash`);
		return thunkAPI.rejectWithValue(error);
	}
});

export const channelAppSlice = createSlice({
	name: CHANNEL_APP,
	initialState: initialChannelAppState,
	reducers: {
		setRoomName: (state, action: PayloadAction<string>) => {
			state.roomName = action.payload;
		},
		setJoinChannelAppData: (state, action: PayloadAction<{ dataUpdate: JoinChannelAppData | undefined }>) => {
			state.joinChannelAppData = action.payload.dataUpdate;
		},
		setRoomId: (state, action: PayloadAction<{ channelId: string; roomId: string | null }>) => {
			state.roomId[action.payload.channelId] = action.payload.roomId;
		},
		setClanId: (state, action: PayloadAction<string | null>) => {
			state.clanId = action.payload;
		},
		setChannelId: (state, action: PayloadAction<string | null>) => {
			state.channelId = action.payload;
		},
		setRoomToken: (state, action: PayloadAction<string | undefined>) => {
			state.roomToken = action.payload;
		},
		setEnableVoice: (state, action: PayloadAction<boolean>) => {
			state.enableMic = action.payload;
		},
		setEnableVideo: (state, action: PayloadAction<boolean>) => {
			state.enableVideo = action.payload;
		},
		setEnableCall: (state, action: PayloadAction<boolean>) => {
			state.enableCall = action.payload;
		},
		setPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
			state.position = action.payload;
		},
		setSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
			state.size = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(createChannelAppMeet.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(createChannelAppMeet.fulfilled, (state, action) => {
				state.loadingStatus = 'loaded';
				state.roomName = action.payload?.room_name ?? '';
			})
			.addCase(createChannelAppMeet.rejected, (state) => {
				state.loadingStatus = 'error';
			});
	}
});

// Selectors
export const getChannelAppState = (rootState: { [CHANNEL_APP]: ChannelAppState }): ChannelAppState => rootState[CHANNEL_APP];

export const selectEnableVideo = createSelector(getChannelAppState, (state) => state.enableVideo);
export const selectGetRoomId = createSelector([getChannelAppState, (state, channelId) => channelId], (state, channelId) => state.roomId?.[channelId]);
export const selectEnableMic = createSelector(getChannelAppState, (state) => state.enableMic);
export const selectEnableCall = createSelector(getChannelAppState, (state) => state.enableCall);
export const selectLiveToken = createSelector(getChannelAppState, (state) => state.roomToken);
export const selectChannelAppChannelId = createSelector(getChannelAppState, (state) => state.channelId);
export const selectChannelAppClanId = createSelector(getChannelAppState, (state) => state.clanId);

export const channelAppReducer = channelAppSlice.reducer;

// Export actions & reducer
export const channelAppActions = {
	...channelAppSlice.actions,
	createChannelAppMeet,
	generateAppUserHash
};
