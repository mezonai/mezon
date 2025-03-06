import { captureSentryError } from '@mezon/logger';
import { INotificationUserChannel, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiNotificationUserChannel } from 'mezon-js/api.gen';
import { channelsActions } from '../channels/channels.slice';
import { directActions } from '../direct/direct.slice';
import { directMetaActions } from '../direct/directmeta.slice';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { defaultNotificationCategoryActions } from './notificationSettingCategory.slice';
export const NOTIFICATION_SETTING_FEATURE_KEY = 'notificationsetting';

export interface NotificationSettingState extends EntityState<INotificationUserChannel, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
}

const NotificationSettingsAdapter = createEntityAdapter({
	selectId: (notifi: INotificationUserChannel) => notifi.channel_id || ''
});

export const initialNotificationSettingState: NotificationSettingState = NotificationSettingsAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

type FetchNotificationSettingsArgs = {
	channelId: string;
	isCurrentChannel?: boolean;
	noCache?: boolean;
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
			if (Date.now() - response.time > 1000) {
				return {
					channelId: channelId,
					notifiSetting: {},
					fromCache: true
				};
			}
			return {
				channelId: channelId,
				notifiSetting: response,
				fromCache: false
			};
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
				thunkAPI.dispatch(directMetaActions.updateMuteDM({ channelId: channel_id as string, isMute: active === 0 }));
			}
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
	reducers: {
		upsertNotiSetting: (state, action: PayloadAction<ApiNotificationUserChannel>) => {
			const notiSetting = action.payload;
			const { channel_id } = notiSetting;

			if (!channel_id) return;

			if (!state.entities[channel_id]) {
				state.entities[channel_id] = NotificationSettingsAdapter.getInitialState({
					id: channel_id
				});
			}
			const notificationEntity = {
				id: action.payload.channel_id || '',
				...action.payload
			};
			NotificationSettingsAdapter.upsertOne(state, notificationEntity);
		},
		removeNotiSetting: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			if (!state.entities[channelId]) return;
			NotificationSettingsAdapter.updateOne(state, {
				id: channelId,
				changes: {
					active: 1
				}
			});
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getNotificationSetting.pending, (state: NotificationSettingState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				getNotificationSetting.fulfilled,
				(
					state: NotificationSettingState,
					action: PayloadAction<{ channelId: string; notifiSetting: ApiNotificationUserChannel; fromCache?: boolean }>
				) => {
					if (action.payload.fromCache) return;
					const notificationEntity = {
						id: action.payload.channelId,
						...action.payload.notifiSetting
					};
					NotificationSettingsAdapter.upsertOne(state, notificationEntity);

					state.loadingStatus = 'loaded';
				}
			)
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

const { selectEntities } = NotificationSettingsAdapter.getSelectors();
export const getNotificationSettingState = (rootState: { [NOTIFICATION_SETTING_FEATURE_KEY]: NotificationSettingState }): NotificationSettingState =>
	rootState[NOTIFICATION_SETTING_FEATURE_KEY];

export const selectNotifiSettingEntities = createSelector(getNotificationSettingState, selectEntities);

export const selectNotifiSettingsEntitiesById = (id: string) =>
	createSelector(selectNotifiSettingEntities, (NotifiSettingsEntities) => NotifiSettingsEntities[id]);
