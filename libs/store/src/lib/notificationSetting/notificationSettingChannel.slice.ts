import { captureSentryError } from '@mezon/logger';
import { EMuteState, type INotificationUserChannel, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiNotificationUserChannel, ApiSetMuteRequest, ApiSetNotificationRequest } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelsActions } from '../channels/channels.slice';
import { directActions } from '../direct/direct.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const NOTIFICATION_SETTING_FEATURE_KEY = 'notificationsetting';

export interface NotificationSettingState extends EntityState<INotificationUserChannel, string> {
	byChannels: Record<
		string,
		{
			notificationSetting?: INotificationUserChannel | null;
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
}

const NotificationSettingsAdapter = createEntityAdapter({
	selectId: (notifi: INotificationUserChannel) => notifi.channel_id || ''
});

const getInitialChannelState = () => ({
	notificationSetting: null
});

export const initialNotificationSettingState: NotificationSettingState = NotificationSettingsAdapter.getInitialState({
	byChannels: {},
	loadingStatus: 'not loaded',
	error: null
});

type FetchNotificationSettingsArgs = {
	channelId: string;
	isCurrentChannel?: boolean;
	noCache?: boolean;
};

export const fetchNotificationSettingCached = async (getState: () => RootState, mezon: MezonValueContext, channelId: string, noCache = false) => {
	const currentState = getState();
	const notiSettingState = currentState[NOTIFICATION_SETTING_FEATURE_KEY];
	const channelData = notiSettingState.byChannels[channelId] || getInitialChannelState();

	const apiKey = createApiKey('fetchNotificationSetting', channelId, mezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, channelData.cache, noCache);

	if (!shouldForceCall) {
		return {
			...channelData.notificationSetting,
			fromCache: true,
			time: channelData.cache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		mezon,
		{
			api_name: 'GetNotificationChannel',
			notification_channel: {
				channel_id: channelId
			}
		},
		() => mezon.client.getNotificationChannel(mezon.session, channelId),
		'notificaion_user_channel'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const getNotificationSetting = createAsyncThunk(
	'notificationsetting/getNotificationSetting',
	async ({ channelId, isCurrentChannel: _isCurrentChannel = true, noCache }: FetchNotificationSettingsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchNotificationSettingCached(thunkAPI.getState as () => RootState, mezon, channelId, Boolean(noCache));

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid getNotificationSetting');
			}

			if (response.fromCache) {
				return {
					channelId,
					notifiSetting: {},
					fromCache: true
				};
			}

			return {
				channelId,
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
	mute_time?: number;
	clan_id: string;
	is_current_channel?: boolean;
	is_direct?: boolean;
	label?: string;
	title?: string;
};

export const setNotificationSetting = createAsyncThunk(
	'notificationsetting/setNotificationSetting',
	async (
		{ channel_id, notification_type, mute_time, clan_id, is_current_channel = true, is_direct = false, label, title }: SetNotificationPayload,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body: ApiSetNotificationRequest = {
				channel_category_id: channel_id,
				notification_type,
				clan_id
			};
			const response = await mezon.client.setNotificationChannel(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (mute_time) {
				if (is_direct) {
					thunkAPI.dispatch(directActions.update({ id: channel_id as string, changes: { is_mute: true } }));
				} else {
					thunkAPI.dispatch(channelsActions.update({ clanId: clan_id, update: { changes: { is_mute: true }, id: channel_id as string } }));
				}
			}

			return { ...body, clan_id, label, title };
		} catch (error) {
			captureSentryError(error, 'notificationsetting/setNotificationSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type MuteChannelPayload = {
	channel_id?: string;
	mute_time: number;
	active?: number;
	clan_id?: string;
};

export const setMuteChannel = createAsyncThunk(
	'notificationsetting/setMuteChannel',
	async ({ channel_id, mute_time, active, clan_id }: MuteChannelPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body: ApiSetMuteRequest = {
				id: channel_id,
				mute_time,
				active
			};
			const response = await mezon.client.setMuteChannel(mezon.session, body);

			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			return {
				channel_id,
				mute_time,
				active,
				clan_id
			};
		} catch (error) {
			captureSentryError(error, 'notificationsetting/setMuteChannel');
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
	async ({ channel_id, clan_id: _clan_id, is_current_channel: _is_current_channel = true }: DeleteNotiChannelSettingPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteNotificationChannel(mezon.session, channel_id || '');
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
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
			if (state?.byChannels?.[channel_id]) {
				state.byChannels[channel_id].notificationSetting = notificationEntity as INotificationUserChannel;
				state.byChannels[channel_id].cache = createCacheMetadata();
			} else {
				state.byChannels[channel_id] = getInitialChannelState();
			}
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
		},
		updateNotiState: (
			state,
			action: PayloadAction<{
				channelId: string;
				active: number;
			}>
		) => {
			const { channelId, active } = action.payload;

			if (!state?.byChannels?.[channelId]) {
				state.byChannels[channelId] = getInitialChannelState();
			}

			let notificationSetting = state?.byChannels?.[channelId]?.notificationSetting as INotificationUserChannel | undefined;
			if (!notificationSetting) {
				notificationSetting = {
					id: channelId,
					channel_id: channelId,
					active,
					notification_type: 0
				} as INotificationUserChannel;
				state.byChannels[channelId].notificationSetting = notificationSetting;
			}

			if (!notificationSetting.id || notificationSetting.id === '0') {
				notificationSetting.id = channelId;
				notificationSetting.channel_id = channelId;
			}

			if (notificationSetting.active !== active) {
				notificationSetting.active = active;
			}
			if (active === 0) {
				notificationSetting.time_mute = undefined;
			}
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
					const { channelId, fromCache, notifiSetting } = action.payload;

					if (!state.byChannels[channelId]) {
						state.byChannels[channelId] = getInitialChannelState();
					}

					if (!fromCache) {
						const notificationEntity = {
							id: channelId,
							...notifiSetting
						};
						NotificationSettingsAdapter.upsertOne(state, notificationEntity);

						state.byChannels[channelId].notificationSetting = notifiSetting as INotificationUserChannel;
						state.byChannels[channelId].cache = createCacheMetadata();
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(getNotificationSetting.rejected, (state: NotificationSettingState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(setMuteChannel.fulfilled, (state: NotificationSettingState, action: PayloadAction<MuteChannelPayload>) => {
				const { channel_id, mute_time, active } = action.payload;
				if (!channel_id) return;

				const channel = state.byChannels[channel_id];
				if (!channel?.notificationSetting) {
					return;
				}

				channel.notificationSetting.active = active ?? EMuteState.UN_MUTE;
				channel.notificationSetting.time_mute =
					active === EMuteState.MUTED && mute_time !== 0 ? new Date(Date.now() + (mute_time || 0) * 1000).toISOString() : undefined;
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
	setMuteChannel
};

export const getNotificationSettingState = (rootState: { [NOTIFICATION_SETTING_FEATURE_KEY]: NotificationSettingState }): NotificationSettingState =>
	rootState[NOTIFICATION_SETTING_FEATURE_KEY];

export const selectNotifiSettingsEntitiesById = createSelector(
	[getNotificationSettingState, (state: RootState, channelId: string) => channelId],
	(state, channelId) => state?.byChannels?.[channelId]?.notificationSetting
);
