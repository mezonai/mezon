import { notificationService } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Session } from 'mezon-js';
import { selectSession } from '../auth/auth.slice';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';
import type { RootState } from '../store';

const REGIS_FCM_TOKEN_CACHED_TIME = 1000 * 60 * 60;

export const FCM_FEATURE_KEY = 'fcm';
export interface fcm {
	token: string | null;
	deviceId?: string | null;
}

const initialState: fcm = {
	token: null,
	deviceId: null
};

type FcmDeviceTokenPayload = {
	session: Session;
	tokenId: string;
	deviceId: string;
	platform?: string;
	voipToken?: string;
};

export const registFcmDeviceToken = createAsyncThunk(
	'fcm/registFcmDeviceToken',
	async ({ session, tokenId, deviceId, platform, voipToken }: FcmDeviceTokenPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await withRetry(
				(latestSession) => mezon.client.registFCMDeviceToken(latestSession, tokenId, '', platform || '', voipToken || ''),
				{
					maxRetries: 3,
					initialDelay: 1000,
					scope: 'regist-fcm',
					mezon
				}
			);
			if (!response) {
				return thunkAPI.rejectWithValue(null);
			}
			return response;
		} catch (e) {
			console.error('Error', e);
			return null;
		}
	}
);

export const connectNotificationService = createAsyncThunk('fcm/connectNotificationService', async (_, thunkAPI) => {
	try {
		const state = thunkAPI.getState() as RootState;
		const sessionData = selectSession(state as Parameters<typeof selectSession>[0]);

		if (!sessionData?.token || !sessionData?.user_id) {
			return thunkAPI.rejectWithValue('No active session');
		}

		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await withRetry((session) => mezon.client.registFCMDeviceToken(session, state.fcm.deviceId || '', '', 'desktop', ''), {
			maxRetries: 3,
			initialDelay: 1000,
			scope: 'regist-fcm-connect',
			mezon
		});

		if (response.token) {
			notificationService.connect(response.token, sessionData.user_id);
		} else if (state.fcm.token) {
			notificationService.connect(state.fcm.token, sessionData.user_id);
		}

		return {
			token: response.token || '',
			userId: sessionData.user_id,
			deviceId: response.device_id
		};
	} catch (e) {
		console.error('connectNotificationService error:', e);
		return thunkAPI.rejectWithValue(e);
	}
});

export const fcmSlice = createSlice({
	name: FCM_FEATURE_KEY,
	initialState,
	reducers: {
		setGotifyToken(state, action) {
			state.token = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder.addCase(connectNotificationService.fulfilled, (state, action: PayloadAction<{ token: string; deviceId?: string }>) => {
			const { token, deviceId } = action.payload;
			if (!state.deviceId && deviceId) {
				state.deviceId = deviceId;
			}
			if (token) {
				state.token = token;
			}
		});
	}
});

export const fcmReducer = fcmSlice.reducer;

export const fcmActions = { ...fcmSlice.actions, registFcmDeviceToken, connectNotificationService };

export const getFcmState = (rootState: { [FCM_FEATURE_KEY]: fcm }): fcm => rootState[FCM_FEATURE_KEY];
