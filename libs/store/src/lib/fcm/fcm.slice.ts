import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Session } from 'mezon-js';
import { selectSession } from '../auth/auth.slice';
import { ensureSession, getMezonCtx, withRetry } from '../helpers';

const REGIS_FCM_TOKEN_CACHED_TIME = 1000 * 60 * 60;

export const FCM_FEATURE_KEY = 'fcm';
export interface fcm {
	token: string | null;
}

const initialState: fcm = {
	token: null
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
			const response = await withRetry(() => mezon.client.registFCMDeviceToken(session, tokenId, deviceId, platform || '', voipToken || ''), {
				maxRetries: 3,
				initialDelay: 1000,
				scope: 'regist-fcm',
				mezon
			});
			if (!response) {
				return thunkAPI.rejectWithValue(null);
			}
			thunkAPI.dispatch(fcmActions.setGotifyToken(response?.token));
			return response;
		} catch (e) {
			console.error('Error', e);
			return null;
		}
	}
);

export const connectNotificationService = createAsyncThunk('fcm/connectNotificationService', async (_, thunkAPI) => {
	try {
		const state = thunkAPI.getState();
		const sessionData = selectSession(state as Parameters<typeof selectSession>[0]);

		if (!sessionData?.token || !sessionData?.user_id) {
			return thunkAPI.rejectWithValue('No active session');
		}

		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await withRetry(
			(session) =>
				mezon.client.registFCMDeviceToken(session, sessionData?.user_id?.toString() || '', sessionData.username || '', 'desktop', ''),
			{
				maxRetries: 3,
				initialDelay: 1000,
				scope: 'regist-fcm-connect',
				mezon
			}
		);

		if (!response?.token) {
			return thunkAPI.rejectWithValue('Failed to register FCM token');
		}

		thunkAPI.dispatch(fcmActions.setGotifyToken(response.token));

		return {
			token: response.token,
			userId: sessionData.user_id
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
	}
});

export const fcmReducer = fcmSlice.reducer;

export const fcmActions = { ...fcmSlice.actions, registFcmDeviceToken, connectNotificationService };

export const getFcmState = (rootState: { [FCM_FEATURE_KEY]: fcm }): fcm => rootState[FCM_FEATURE_KEY];
