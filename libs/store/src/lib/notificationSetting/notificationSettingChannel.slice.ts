import { captureSentryError } from '@mezon/logger';
import { INotificationSetting, LoadingStatus } from '@mezon/utils';
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiNotificationUserChannel } from 'mezon-js/api.gen';
import { channelsActions } from '../channels/channels.slice';
import { directActions } from '../direct/direct.slice';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { defaultNotificationCategoryActions } from './notificationSettingCategory.slice';
export const NOTIFICATION_SETTING_FEATURE_KEY = 'notificationsetting';

export interface NotificationSettingState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentChannelNotificationSetting?: INotificationSetting | null;
	selectedChannelNotificationSetting?: INotificationSetting | null;
}

export const initialNotificationSettingState: NotificationSettingState = {
	loadingStatus: 'not loaded',
	currentChannelNotificationSetting: null
};

type FetchNotificationSettingsArgs = {
	channelId: string;
	isCurrentChannel?: boolean;
	noCache?: boolean;
};

type GetNotificationSettingResponse = {
	notificationSetting: ApiNotificationUserChannel;
	isCurrentChannel: boolean | undefined;
};

export const fetchNotificationSettingCached = memoizeAndTrack(
	async (mezon: MezonValueContext, channelId: string) => {
		const response = await mezon.client.getNotificationChannel(mezon.session, channelId);
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

export const getNotificationSetting = createAsyncThunk(
	'notificationsetting/getNotificationSetting',
	async ({ channelId, isCurrentChannel = true, noCache }: FetchNotificationSettingsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchNotificationSettingCached.clear(mezon, channelId);
			}
			const response = await fetchNotificationSettingCached(mezon, channelId);
			if (!response) {
				return thunkAPI.rejectWithValue('Invalid session');
			}
			const apiNotificationUserChannel: ApiNotificationUserChannel = {
				active: response.active,
				id: response.id,
				notification_setting_type: response.notification_setting_type,
				time_mute: response.time_mute
			};
			const payload: GetNotificationSettingResponse = {
				notificationSetting: apiNotificationUserChannel,
				isCurrentChannel: isCurrentChannel
			};
			return payload;
		} catch (error) {
			captureSentryError(error, 'notificationsetting/getNotificationSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type SetNotificationPayload = {
	channel_id?: string;
	notification_type?: number;
	time_mute?: string;
	clan_id: string;
	is_current_channel?: boolean;
	is_direct?: boolean;
};

export const setNotificationSetting = createAsyncThunk(
	'notificationsetting/setNotificationSetting',
	async ({ channel_id, notification_type, time_mute, clan_id, is_current_channel = true, is_direct = false }: SetNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				channel_category_id: channel_id,
				notification_type: notification_type,
				time_mute: time_mute,
				clan_id: clan_id
			};
			const response = await mezon.client.setNotificationChannel(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (time_mute) {
				if (is_direct) {
					thunkAPI.dispatch(directActions.update({ id: channel_id as string, changes: { is_mute: true } }));
				} else {
					thunkAPI.dispatch(channelsActions.update({ clanId: clan_id, update: { changes: { is_mute: true }, id: channel_id as string } }));
				}
			}
			if (!is_direct) {
				thunkAPI.dispatch(defaultNotificationCategoryActions.fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			}
			thunkAPI.dispatch(getNotificationSetting({ channelId: channel_id || '', isCurrentChannel: is_current_channel, noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'notificationsetting/setNotificationSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type SetMuteNotificationPayload = {
	channel_id?: string;
	notification_type?: number;
	active: number;
	clan_id: string;
	is_current_channel?: boolean;
};

export const setMuteNotificationSetting = createAsyncThunk(
	'notificationsetting/setMuteNotificationSetting',
	async ({ channel_id, notification_type, active, clan_id, is_current_channel = true }: SetMuteNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				id: channel_id,
				notification_type: notification_type,
				active: active
			};
			const response = await mezon.client.setMuteNotificationChannel(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (clan_id !== '0' && clan_id !== '') {
				thunkAPI.dispatch(
					channelsActions.update({ clanId: clan_id, update: { changes: { is_mute: active === 0 }, id: channel_id as string } })
				);
				thunkAPI.dispatch(defaultNotificationCategoryActions.fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			} else {
				thunkAPI.dispatch(directActions.update({ id: channel_id as string, changes: { is_mute: active === 0 } }));
			}
			thunkAPI.dispatch(getNotificationSetting({ channelId: channel_id || '', isCurrentChannel: is_current_channel, noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'notificationsetting/setMuteNotificationSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type DeleteNotiChannelSettingPayload = {
	channel_id?: string;
	clan_id?: string;
	is_current_channel?: boolean;
};

export const deleteNotiChannelSetting = createAsyncThunk(
	'notificationsetting/deleteNotiChannelSetting',
	async ({ channel_id, clan_id, is_current_channel = true }: DeleteNotiChannelSettingPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteNotificationChannel(mezon.session, channel_id || '');
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(defaultNotificationCategoryActions.fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(getNotificationSetting({ channelId: channel_id || '', isCurrentChannel: is_current_channel, noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'notificationsetting/deleteNotiChannelSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const notificationSettingSlice = createSlice({
	name: NOTIFICATION_SETTING_FEATURE_KEY,
	initialState: initialNotificationSettingState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(getNotificationSetting.pending, (state: NotificationSettingState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getNotificationSetting.fulfilled, (state: NotificationSettingState, action: PayloadAction<GetNotificationSettingResponse>) => {
				const isCurrentChannel = action.payload.isCurrentChannel;
				if (isCurrentChannel) {
					state.currentChannelNotificationSetting = action.payload.notificationSetting;
				}
				state.selectedChannelNotificationSetting = action.payload.notificationSetting;
				state.loadingStatus = 'loaded';
			})
			.addCase(getNotificationSetting.rejected, (state: NotificationSettingState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const notificationSettingReducer = notificationSettingSlice.reducer;

export const notificationSettingActions = {
	...notificationSettingSlice.actions,
	getNotificationSetting,
	setNotificationSetting,
	deleteNotiChannelSetting,
	setMuteNotificationSetting
};

export const getNotificationSettingState = (rootState: { [NOTIFICATION_SETTING_FEATURE_KEY]: NotificationSettingState }): NotificationSettingState =>
	rootState[NOTIFICATION_SETTING_FEATURE_KEY];

export const selectCurrentChannelNotificatonSelected = createSelector(
	getNotificationSettingState,
	(state: NotificationSettingState) => state.currentChannelNotificationSetting
);

export const selectSelectedChannelNotificationSetting = createSelector(
	getNotificationSettingState,
	(state: NotificationSettingState) => state.selectedChannelNotificationSetting
);
