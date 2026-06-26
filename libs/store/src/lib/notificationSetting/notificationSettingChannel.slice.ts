import { captureSentryError } from '@mezon/logger';
import { EMuteState, type INotificationUserChannel, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiNotificationUserChannel, ApiSetMuteRequest, ApiSetNotificationRequest } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { selectCategoryEntityStateByClanId } from '../categories/categories.slice';
import { channelsActions, selectChannelByIdAndClanId } from '../channels/channels.slice';
import { directActions } from '../direct/direct.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const NOTIFICATION_SETTING_FEATURE_KEY = 'notificationsetting';

const toStoredTimeMuteSeconds = (timeMuteSeconds?: number | null) => {
	if (timeMuteSeconds === undefined || timeMuteSeconds === null || timeMuteSeconds === EMuteState.UN_MUTE) {
		return timeMuteSeconds ?? undefined;
	}

	if (timeMuteSeconds === EMuteState.MUTED_INFINITY) {
		return EMuteState.MUTED_INFINITY;
	}

	return Date.now() + timeMuteSeconds * 1000;
};

export const getMuteActionFromMuteTime = (muteTime?: number | null): number => {
	if (muteTime === undefined || muteTime === null || muteTime === EMuteState.UN_MUTE) {
		return 1;
	}

	if (muteTime === EMuteState.MUTED_INFINITY) {
		return 0;
	}

	return muteTime > Date.now() ? 0 : 1;
};

export interface NotificationSettingState extends EntityState<INotificationUserChannel, string> {
	byChannels: Record<
		string,
		{
			notificationSetting?: INotificationUserChannel | null;
			cache?: CacheMetadata;
		}
	>;
	mutedChannels: Record<string, boolean>;
	mutedChannelsCache: Record<string, CacheMetadata>;
	loadingStatus: LoadingStatus;
	error?: string | null;
}

const NotificationSettingsAdapter = createEntityAdapter({
	selectId: (notifi: INotificationUserChannel) => notifi.channel_id || '0'
});

const getInitialChannelState = () => ({
	notificationSetting: null
});

export const initialNotificationSettingState: NotificationSettingState = NotificationSettingsAdapter.getInitialState({
	byChannels: {},
	mutedChannels: {},
	mutedChannelsCache: {},
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

	const apiKey = createApiKey('fetchNotificationSetting', channelId, mezon.session?.token || currentState.auth?.session?.token || '');

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
		(session) => mezon.client.getNotificationChannel(session, channelId),
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

type FetchMutedChannelsArgs = {
	clanId: string;
	noCache?: boolean;
};

export const fetchMutedChannelsCached = async (getState: () => RootState, mezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const notiSettingState = currentState[NOTIFICATION_SETTING_FEATURE_KEY];

	const apiKey = createApiKey('fetchMutedChannels', clanId, mezon.session?.token || currentState.auth?.session?.token || '');

	const shouldForceCall = shouldForceApiCall(apiKey, notiSettingState.mutedChannelsCache[clanId], noCache);

	if (!shouldForceCall) {
		return {
			mutedChannelIds: Object.keys(notiSettingState.mutedChannels).filter((channelId) => notiSettingState.mutedChannels[channelId]),
			fromCache: true
		};
	}

	const response = await mezon.client.listMutedChannel(mezon.session, clanId);

	markApiFirstCalled(apiKey);

	return {
		mutedChannelIds: (response.muted_list || []).map((id) => String(id)),
		fromCache: false
	};
};

export const fetchMutedChannels = createAsyncThunk(
	'notificationsetting/fetchMutedChannels',
	async ({ clanId, noCache }: FetchMutedChannelsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await fetchMutedChannelsCached(thunkAPI.getState as () => RootState, mezon, clanId, Boolean(noCache));

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid fetchMutedChannels');
			}

			return {
				clanId,
				mutedChannelIds: response.mutedChannelIds,
				fromCache: response.fromCache
			};
		} catch (error) {
			captureSentryError(error, 'notificationsetting/fetchMutedChannels');
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
		{
			channel_id,
			notification_type,
			mute_time,
			clan_id,
			is_current_channel: _is_current_channel = true,
			is_direct = false,
			label,
			title
		}: SetNotificationPayload,
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

			let resolvedLabel = label;
			let resolvedTitle = title;

			if (!resolvedLabel && channel_id) {
				const state = thunkAPI.getState() as RootState;
				const channel = selectChannelByIdAndClanId(state, clan_id, channel_id);
				if (channel?.channel_label) {
					resolvedLabel = channel.channel_label;
					resolvedTitle = resolvedTitle || 'channel';
				} else {
					const category = selectCategoryEntityStateByClanId(state, clan_id)?.entities[channel_id];
					if (category?.category_name) {
						resolvedLabel = category.category_name;
						resolvedTitle = resolvedTitle || 'category';
					}
				}
			}

			const rootState = thunkAPI.getState() as RootState;
			const channelNoti = channel_id ? rootState.notificationsetting.byChannels[channel_id]?.notificationSetting : undefined;
			const active = getMuteActionFromMuteTime(channelNoti?.time_mute_seconds);

			return { ...body, clan_id, label: resolvedLabel, title: resolvedTitle, active };
		} catch (error) {
			captureSentryError(error, 'notificationsetting/setNotificationSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type MuteChannelPayload = {
	channel_id?: string;
	mute_time: number;
	clan_id?: string;
};

export const setMuteChannel = createAsyncThunk(
	'notificationsetting/setMuteChannel',
	async ({ channel_id, mute_time, clan_id }: MuteChannelPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body: ApiSetMuteRequest = {
				id: channel_id,
				mute_time
			};
			const response = await mezon.client.setMuteChannel(mezon.session, body);

			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			return {
				channel_id,
				mute_time: mute_time === EMuteState.MUTED_INFINITY ? EMuteState.MUTED_INFINITY : mute_time && Date.now() + (mute_time || 0) * 1000,
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
	async ({ channel_id, clan_id, is_current_channel: _is_current_channel = true }: DeleteNotiChannelSettingPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			if (channel_id) {
				await mezon.client.setMuteChannel(mezon.session, { id: channel_id, mute_time: EMuteState.UN_MUTE });
			}

			const response = await mezon.client.deleteNotificationChannel(mezon.session, channel_id || '0');
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			if (channel_id && clan_id) {
				thunkAPI.dispatch(channelsActions.update({ clanId: clan_id, update: { id: channel_id, changes: { is_mute: false } } }));
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
			const { channel_id, active, time_mute_seconds } = action.payload;

			if (!channel_id) return;

			const existing = state.byChannels[channel_id]?.notificationSetting ?? state.entities[channel_id];
			const notificationEntity = {
				...(existing || {}),
				id: channel_id,
				channel_id,
				...(active !== undefined && { active }),
				...(time_mute_seconds !== undefined && { time_mute_seconds: toStoredTimeMuteSeconds(time_mute_seconds) })
			} as INotificationUserChannel;

			NotificationSettingsAdapter.upsertOne(state, notificationEntity);

			if (!state.byChannels[channel_id]) {
				state.byChannels[channel_id] = getInitialChannelState();
			}
			state.byChannels[channel_id].notificationSetting = notificationEntity;
			state.byChannels[channel_id].cache = createCacheMetadata();
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

			let notificationSetting = (state?.byChannels?.[channelId]?.notificationSetting ?? state.entities[channelId]) as
				| INotificationUserChannel
				| undefined;
			if (!notificationSetting) {
				notificationSetting = {
					id: channelId,
					channel_id: channelId,
					active
				} as INotificationUserChannel;
			}
			state.byChannels[channelId].notificationSetting = notificationSetting;

			if (!notificationSetting.id || notificationSetting.id === '0') {
				notificationSetting.id = channelId;
				notificationSetting.channel_id = channelId;
			}

			if (notificationSetting.active !== active) {
				notificationSetting.active = active;
			}
			if (active === 0) {
				notificationSetting.time_mute_seconds = EMuteState.UN_MUTE;
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
							...notifiSetting,
							time_mute_seconds: toStoredTimeMuteSeconds(notifiSetting.time_mute_seconds)
						} as INotificationUserChannel;

						NotificationSettingsAdapter.upsertOne(state, notificationEntity);
						state.byChannels[channelId].notificationSetting = notificationEntity;
						state.byChannels[channelId].cache = createCacheMetadata();
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(getNotificationSetting.rejected, (state: NotificationSettingState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(setMuteChannel.fulfilled, (state: NotificationSettingState, action) => {
				const { channel_id, mute_time, clan_id } = action.payload;
				if (!channel_id) return;

				if (!state.byChannels[channel_id]) {
					state.byChannels[channel_id] = getInitialChannelState();
				}

				const channel = state.byChannels[channel_id];
				const existing = channel.notificationSetting ?? state.entities[channel_id];
				const notificationSetting = {
					...(existing || {}),
					id: channel_id,
					channel_id,
					time_mute_seconds: mute_time
				} as INotificationUserChannel;

				channel.notificationSetting = notificationSetting;
				channel.cache = createCacheMetadata();
				NotificationSettingsAdapter.upsertOne(state, notificationSetting);

				if (getMuteActionFromMuteTime(mute_time) === 0) {
					state.mutedChannels = {
						...state.mutedChannels,
						[channel_id]: true
					};
				} else {
					const { [channel_id]: _removed, ...rest } = state.mutedChannels;
					state.mutedChannels = rest;
				}

				if (clan_id && state.mutedChannelsCache[clan_id]) {
					delete state.mutedChannelsCache[clan_id];
				}
			})
			.addCase(setNotificationSetting.fulfilled, (state: NotificationSettingState, action) => {
				const { channel_category_id, notification_type, active } = action.payload as {
					channel_category_id?: string;
					notification_type?: number;
					active?: number;
				};
				const channel_id = channel_category_id;
				if (!channel_id) {
					return;
				}

				if (!state.byChannels[channel_id]) {
					state.byChannels[channel_id] = getInitialChannelState();
				}

				const existing = state.byChannels[channel_id].notificationSetting;
				const notificationSetting = {
					...(existing || {}),
					id: channel_id,
					channel_id,
					notification_setting_type: notification_type,
					active: active ?? existing?.active ?? 1,
					time_mute_seconds: existing?.time_mute_seconds ?? EMuteState.UN_MUTE
				} as INotificationUserChannel;

				state.byChannels[channel_id].notificationSetting = notificationSetting;
				state.byChannels[channel_id].cache = createCacheMetadata();
				NotificationSettingsAdapter.upsertOne(state, notificationSetting);
			})
			.addCase(
				fetchMutedChannels.fulfilled,
				(state: NotificationSettingState, action: PayloadAction<{ clanId: string; mutedChannelIds: Array<string>; fromCache?: boolean }>) => {
					const { clanId, mutedChannelIds, fromCache } = action.payload;

					if (!fromCache) {
						const newMutedChannels: Record<string, boolean> = {};
						mutedChannelIds.forEach((channelId) => {
							newMutedChannels[channelId] = true;
						});
						state.mutedChannels = newMutedChannels;
						state.mutedChannelsCache[clanId] = createCacheMetadata();
					}
				}
			)
			.addCase(deleteNotiChannelSetting.fulfilled, (state: NotificationSettingState, action) => {
				const { channel_id, clan_id } = action.meta.arg;
				if (!channel_id) {
					return;
				}

				if (state.byChannels[channel_id]) {
					delete state.byChannels[channel_id];
				}

				if (state.mutedChannels[channel_id]) {
					const { [channel_id]: _removed, ...rest } = state.mutedChannels;
					state.mutedChannels = rest;
				}

				if (state.entities[channel_id]) {
					NotificationSettingsAdapter.removeOne(state, channel_id);
				}

				if (clan_id && state.mutedChannelsCache[clan_id]) {
					delete state.mutedChannelsCache[clan_id];
				}
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
	setMuteChannel,
	fetchMutedChannels
};

export const getNotificationSettingState = (rootState: { [NOTIFICATION_SETTING_FEATURE_KEY]: NotificationSettingState }): NotificationSettingState =>
	rootState[NOTIFICATION_SETTING_FEATURE_KEY];

export const selectNotifiSettingsEntitiesById = createSelector(
	[getNotificationSettingState, (state: RootState, channelId: string) => channelId],
	(state, channelId) => state?.byChannels?.[channelId]?.notificationSetting
);

export const selectIsChannelMuted = createSelector(
	[
		(state: RootState) => state[NOTIFICATION_SETTING_FEATURE_KEY].mutedChannels,
		(state: RootState, _clanId: string, channelId: string) => channelId
	],
	(mutedChannels, channelId) => {
		return Boolean(mutedChannels?.[channelId]);
	}
);
