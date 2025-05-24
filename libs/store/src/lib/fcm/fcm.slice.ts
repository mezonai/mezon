import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';

const REGIS_FCM_TOKEN_CACHED_TIME = 1000 * 60 * 60;

export const FCM_FEATURE_KEY = 'fcm';
export interface fcm {
	token: string | null;
}

const initialState: fcm = {
	token: null
};

type FcmDeviceTokenPayload = {
	tokenId: string;
	deviceId: string;
	platform?: string;
	voipToken?: string;
};

export const registFcmDeviceTokenCached = memoizeAndTrack(
	(mezon: MezonValueContext, tokenId: string, deviceId: string, platform: string, voipToken?: string) =>
		mezon.client.registFCMDeviceToken(mezon.session, tokenId, deviceId, platform || '', voipToken || ''),
	{
		promise: true,
		maxAge: REGIS_FCM_TOKEN_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[2] + args[3] + args[0].session.username;
		}
	}
);

export const registFcmDeviceToken = createAsyncThunk(
	'fcm/registFcmDeviceToken',
	async ({ tokenId, deviceId, platform, voipToken }: FcmDeviceTokenPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await registFcmDeviceTokenCached(mezon, tokenId, deviceId, platform || '', voipToken || '');
			if (!response) {
				return thunkAPI.rejectWithValue(null);
			}
			thunkAPI.dispatch(fcmActions.setGotifyToken(response?.token));
			return response;
		} catch {
			return null;
		}
	}
);

export const fcmSlice = createSlice({
	name: FCM_FEATURE_KEY,
	initialState: initialState,
	reducers: {
		setGotifyToken(state, action) {
			state.token = action.payload;
		}
		// ...
	}
});

export const fcmReducer = fcmSlice.reducer;

export const fcmActions = { ...fcmSlice.actions, registFcmDeviceToken };

export const getFcmState = (rootState: { [FCM_FEATURE_KEY]: fcm }): fcm => rootState[FCM_FEATURE_KEY];
