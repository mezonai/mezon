import { captureSentryError } from '@mezon/logger';
import { IDefaultNotification, IDefaultNotificationClan, LoadingStatus } from '@mezon/utils';
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiNotificationSetting } from 'mezon-js/api.gen';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
export const DEFAULT_NOTIFICATION_CLAN_FEATURE_KEY = 'defaultnotificationclan';

export interface DefaultNotificationClanState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	defaultNotificationClan?: IDefaultNotificationClan | null;
}

export const initialDefaultNotificationClanState: DefaultNotificationClanState = {
	loadingStatus: 'not loaded',
	defaultNotificationClan: null
};

type fetchNotificationClanSettingsArgs = {
	clanId: string;
	noCache?: boolean;
};

export const fetchDefaultNotificationClanCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string) => {
		const response = await mezon.client.getNotificationClan(mezon.session, clanId);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: 1000 * 60 * 60,
		normalizer: (args) => {
			return args[1] + args[0]?.session?.username || '';
		}
	}
);

export const getDefaultNotificationClan = createAsyncThunk(
	'defaultnotificationclan/getDefaultNotificationClan',
	async ({ clanId, noCache }: fetchNotificationClanSettingsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			if (noCache) {
				fetchDefaultNotificationClanCached.delete(mezon, clanId);
			}
			const response = await fetchDefaultNotificationClanCached(mezon, clanId);
			if (!response) {
				return thunkAPI.rejectWithValue('Invalid getDefaultNotificationClan');
			}
			const clanNotificationConfig: ApiNotificationSetting = {
				id: response.id,
				notification_setting_type: response.notification_setting_type
			};

			return clanNotificationConfig;
		} catch (error) {
			captureSentryError(error, 'defaultnotificationclan/getDefaultNotificationClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type SetDefaultNotificationPayload = {
	clan_id?: string;
	notification_type?: number;
};

export const setDefaultNotificationClan = createAsyncThunk(
	'defaultnotificationclan/setDefaultNotificationClan',
	async ({ clan_id, notification_type }: SetDefaultNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				clan_id: clan_id,
				notification_type: notification_type
			};
			const response = await mezon.client.setNotificationClan(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(getDefaultNotificationClan({ clanId: clan_id || '', noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'defaultnotificationclan/setDefaultNotificationClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const defaultNotificationClanSlice = createSlice({
	name: DEFAULT_NOTIFICATION_CLAN_FEATURE_KEY,
	initialState: initialDefaultNotificationClanState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(getDefaultNotificationClan.pending, (state: DefaultNotificationClanState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getDefaultNotificationClan.fulfilled, (state: DefaultNotificationClanState, action: PayloadAction<ApiNotificationSetting>) => {
				state.defaultNotificationClan = action.payload;
				state.loadingStatus = 'loaded';
			})
			.addCase(getDefaultNotificationClan.rejected, (state: DefaultNotificationClanState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export interface DefaultNotificationListEntity extends IDefaultNotification {
	id: string; // Primary ID
}

export const defaultNotificationClanReducer = defaultNotificationClanSlice.reducer;

export const defaultNotificationActions = { ...defaultNotificationClanSlice.actions, getDefaultNotificationClan, setDefaultNotificationClan };

export const getDefaultNotificationClanState = (rootState: {
	[DEFAULT_NOTIFICATION_CLAN_FEATURE_KEY]: DefaultNotificationClanState;
}): DefaultNotificationClanState => rootState[DEFAULT_NOTIFICATION_CLAN_FEATURE_KEY];

export const selectDefaultNotificationClan = createSelector(
	getDefaultNotificationClanState,
	(state: DefaultNotificationClanState) => state.defaultNotificationClan
);
