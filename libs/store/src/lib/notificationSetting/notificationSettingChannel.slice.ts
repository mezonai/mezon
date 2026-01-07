import { captureSentryError } from '@mezon/logger';
import { EMuteState, type INotificationUserChannel, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiNotificationUserChannel } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelsActions } from '../channels/channels.slice';
import { directActions } from '../direct/direct.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx, timestampToString } from '../helpers';
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
	selectId: (notifi: INotificationUserChannel) => notifi.channelId || ''
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
				channelId
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

			const notifiSetting = {
				...response,
				timeMute: timestampToString((response as any).timeMute)
			};

			return {
				channelId,
				notifiSetting: notifiSetting as ApiNotificationUserChannel,
				fromCache: false
			};
		} catch (error) {
			captureSentryError(error, 'notificationsetting/getNotificationSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type SetNotificationPayload = {
	channelId?: string;
	notificationType?: number;
	muteTime?: number;
	clanId: string;
	is_current_channel?: boolean;
	is_direct?: boolean;
	label?: string;
	title?: string;
};

export const setNotificationSetting = createAsyncThunk(
	'notificationsetting/setNotificationSetting',
	async (
		{ channelId, notificationType, muteTime, clanId, is_current_channel = true, is_direct = false, label, title }: SetNotificationPayload,
		thunkAPI
	) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				$typeName: 'mezon.api.SetNotificationRequest' as const,
				channelCategoryId: channelId || '',
				notificationType: notificationType || 0,
				clanId: clanId || ''
			};
			const response = await mezon.client.setNotificationChannel(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (muteTime) {
				if (is_direct) {
					thunkAPI.dispatch(directActions.update({ id: channelId as string, changes: { isMute: true } }));
				} else {
					thunkAPI.dispatch(channelsActions.update({ clanId, update: { changes: { isMute: true }, id: channelId as string } }));
				}
			}

			return { ...body, clanId, label, title };
		} catch (error) {
			captureSentryError(error, 'notificationsetting/setNotificationSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type MuteChannelPayload = {
	channelId?: string;
	muteTime: number;
	active?: number;
	clanId?: string;
};

export const setMuteChannel = createAsyncThunk(
	'notificationsetting/setMuteChannel',
	async ({ channelId, muteTime, active, clanId }: MuteChannelPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				$typeName: 'mezon.api.SetMuteRequest' as const,
				id: channelId || '',
				muteTime: muteTime ?? 0,
				active: active ?? 0,
				clanId: clanId || ''
			};
			const response = await mezon.client.setMuteChannel(mezon.session, body);

			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			return {
				channelId,
				muteTime,
				active,
				clanId
			};
		} catch (error) {
			captureSentryError(error, 'notificationsetting/setMuteChannel');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type DeleteNotiChannelSettingPayload = {
	channelId?: string;
	clanId?: string;
	is_current_channel?: boolean;
};

export const deleteNotiChannelSetting = createAsyncThunk(
	'notificationsetting/deleteNotiChannelSetting',
	async ({ channelId, clanId: _clan_id, is_current_channel: _is_current_channel = true }: DeleteNotiChannelSettingPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteNotificationChannel(mezon.session, channelId || '');
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
			const { channelId } = notiSetting;

			if (!channelId) return;

			if (!state.entities[channelId]) {
				state.entities[channelId] = NotificationSettingsAdapter.getInitialState({
					id: channelId
				});
			}
			const notificationEntity = {
				id: action.payload.channelId || '',
				...action.payload
			};
			NotificationSettingsAdapter.upsertOne(state, notificationEntity);
			if (state?.byChannels?.[channelId]) {
				state.byChannels[channelId].notificationSetting = notificationEntity as INotificationUserChannel;
				state.byChannels[channelId].cache = createCacheMetadata();
			} else {
				state.byChannels[channelId] = getInitialChannelState();
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
					channelId,
					active,
					notificationType: 0
				} as INotificationUserChannel;
				state.byChannels[channelId].notificationSetting = notificationSetting;
			}

			if (!notificationSetting.id || notificationSetting.id === '0') {
				notificationSetting.id = channelId;
				notificationSetting.channelId = channelId;
			}

			if (notificationSetting.active !== active) {
				notificationSetting.active = active;
			}
			if (active === 0) {
				notificationSetting.timeMute = undefined;
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
				const { channelId, muteTime, active } = action.payload;
				if (!channelId) return;

				const channel = state.byChannels[channelId];
				if (!channel?.notificationSetting) {
					return;
				}

				channel.notificationSetting.active = active ?? EMuteState.UN_MUTE;
				channel.notificationSetting.timeMute =
					active === EMuteState.MUTED && muteTime !== 0 ? new Date(Date.now() + (muteTime || 0) * 1000).toISOString() : undefined;
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
