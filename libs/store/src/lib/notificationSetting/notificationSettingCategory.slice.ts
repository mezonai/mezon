import { captureSentryError } from '@mezon/logger';
import type { IChannelCategorySetting, IDefaultNotificationCategory, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiNotificationChannelCategorySetting } from 'mezon-js/dist/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { channelsActions } from '../channels/channels.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY = 'defaultnotificationcategory';

const DEFAULT_NOTIFICATION_CATEGORY_CACHE_TIME = 1000 * 60 * 60;

export interface DefaultNotificationCategoryState {
	byClans: Record<
		string,
		{
			categoriesSettings: Record<string, IDefaultNotificationCategory>;
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
}

const getInitialClanState = () => ({
	categoriesSettings: {}
});

export const initialDefaultNotificationCategoryState: DefaultNotificationCategoryState = {
	byClans: {},
	loadingStatus: 'not loaded'
};

type fetchNotificationCategorySettingsArgs = {
	categoryId: string;
	clanId: string;
	noCache?: boolean;
};

export const fetchDefaultNotificationCategoryCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	categoryId: string,
	clanId: string,
	noCache = false
) => {
	const currentState = getState();
	const clanData = currentState[DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY].byClans[clanId];
	const apiKey = createApiKey('fetchDefaultNotificationCategory', categoryId, clanId);

	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			...clanData.categoriesSettings[categoryId],
			fromCache: true,
			time: clanData.cache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		mezon,
		{
			api_name: 'GetNotificationCategory',
			notification_category: {
				category_id: categoryId
			}
		},
		() => mezon.client.getNotificationCategory(mezon.session, categoryId),
		'notificaion_user_channel'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const getDefaultNotificationCategory = createAsyncThunk(
	'defaultnotificationcategory/getDefaultNotificationCategory',
	async ({ categoryId, clanId, noCache }: fetchNotificationCategorySettingsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchDefaultNotificationCategoryCached(
				thunkAPI.getState as () => RootState,
				mezon,
				categoryId,
				clanId,
				Boolean(noCache)
			);

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid getDefaultNotificationCategory');
			}

			if (response.fromCache) {
				return {
					fromCache: true,
					categoryId,
					clanId
				};
			}

			const apiNotificationSetting: IDefaultNotificationCategory = {
				id: response.id,
				notification_setting_type: response.notification_setting_type,
				active: response.active,
				time_mute: response.time_mute
			};

			return { ...apiNotificationSetting, categoryId, clanId };
		} catch (error) {
			captureSentryError(error, 'defaultnotificationcategory/getDefaultNotificationCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type SetDefaultNotificationPayload = {
	category_id?: string;
	notification_type?: number;
	time_mute?: string;
	clan_id: string;
	active?: number;
};

export const setDefaultNotificationCategory = createAsyncThunk(
	'defaultnotificationcategory/setDefaultNotificationCategory',
	async ({ category_id, notification_type, time_mute, clan_id }: SetDefaultNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				channel_category_id: category_id,
				notification_type,
				time_mute,
				clan_id
			};
			const response = await mezon.client.setNotificationCategory(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (time_mute) {
				thunkAPI.dispatch(channelsActions.fetchChannels({ clanId: clan_id || '', noCache: true }));
			}
			thunkAPI.dispatch(fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(getDefaultNotificationCategory({ categoryId: category_id || '', clanId: clan_id || '', noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'defaultnotificationcategory/setDefaultNotificationCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type DeleteDefaultNotificationPayload = {
	category_id?: string;
	clan_id?: string;
};

export const deleteDefaultNotificationCategory = createAsyncThunk(
	'defaultnotificationcategory/deleteDefaultNotificationCategory',
	async ({ category_id, clan_id }: DeleteDefaultNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteNotificationCategory(mezon.session, category_id || '');
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(getDefaultNotificationCategory({ categoryId: category_id || '', clanId: clan_id || '', noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'defaultnotificationcategory/deleteDefaultNotificationCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const setMuteCategory = createAsyncThunk(
	'defaultnotificationcategory/setMuteCategory',
	async ({ category_id, notification_type, active, clan_id }: SetDefaultNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.setMuteNotificationCategory(mezon.session, {
				active,
				notification_type,
				id: category_id
			});
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(channelsActions.fetchChannels({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(getDefaultNotificationCategory({ categoryId: category_id || '', clanId: clan_id || '', noCache: true }));
			return response;
		} catch (error) {
			captureSentryError(error, 'defaultnotificationcategory/setMuteCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const defaultNotificationCategorySlice = createSlice({
	name: DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY,
	initialState: initialDefaultNotificationCategoryState,
	reducers: {
		updateCache: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].cache = createCacheMetadata(DEFAULT_NOTIFICATION_CATEGORY_CACHE_TIME);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getDefaultNotificationCategory.pending, (state: DefaultNotificationCategoryState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				getDefaultNotificationCategory.fulfilled,
				(
					state: DefaultNotificationCategoryState,
					action: PayloadAction<IDefaultNotificationCategory & { categoryId: string; clanId: string; fromCache?: boolean }>
				) => {
					const { categoryId, clanId, fromCache, ...notificationData } = action.payload;

					if (!state.byClans[clanId]) {
						state.byClans[clanId] = getInitialClanState();
					}

					if (!fromCache) {
						state.byClans[clanId].categoriesSettings[categoryId] = notificationData;
						state.byClans[clanId].cache = createCacheMetadata(DEFAULT_NOTIFICATION_CATEGORY_CACHE_TIME);
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(getDefaultNotificationCategory.rejected, (state: DefaultNotificationCategoryState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

//

export interface NotiChannelCategorySettingEntity extends IChannelCategorySetting {
	id: string; // Primary ID
}

export const mapChannelCategorySettingToEntity = (ChannelCategorySettingRes: ApiNotificationChannelCategorySetting) => {
	const id = (ChannelCategorySettingRes as unknown as any).id;
	return { ...ChannelCategorySettingRes, id };
};

export interface ChannelCategorySettingState extends EntityState<NotiChannelCategorySettingEntity, string> {
	byClans: Record<
		string,
		{
			loadingStatus: LoadingStatus;
			cache?: CacheMetadata;
			list?: NotiChannelCategorySettingEntity[];
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const channelCategorySettingAdapter = createEntityAdapter<NotiChannelCategorySettingEntity>();

type fetchChannelCategorySettingPayload = {
	clanId: string;
	noCache?: boolean;
};

const CHANNEL_CATEGORY_SETTING_CACHE_TIME = 1000 * 60 * 60;

export const fetchChannelCategorySettingCached = async (getState: () => RootState, mezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const clanData = currentState['notichannelcategorysetting'].byClans[clanId];
	const apiKey = createApiKey('fetchChannelCategorySetting', clanId);

	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			fromCache: true,
			time: clanData.cache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		mezon,
		{
			api_name: 'GetChannelCategoryNotiSettingsList',
			notification_clan: {
				clan_id: clanId
			}
		},
		() => mezon.client.getChannelCategoryNotiSettingsList(mezon.session, clanId),
		'notification_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const fetchChannelCategorySetting = createAsyncThunk(
	'channelCategorySetting/fetchChannelCategorySetting',
	async ({ clanId, noCache }: fetchChannelCategorySettingPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchChannelCategorySettingCached(thunkAPI.getState as () => RootState, mezon, clanId, Boolean(noCache));

			if (response.fromCache) {
				return {
					fromCache: true,
					clanId,
					notification_channel_category_settings_list: []
				};
			}

			if (!response?.notification_channel_category_settings_list) {
				return {
					fromCache: response.fromCache,
					clanId,
					notification_channel_category_settings_list: []
				};
			}

			return {
				fromCache: response.fromCache,
				clanId,
				notification_channel_category_settings_list:
					response.notification_channel_category_settings_list.map(mapChannelCategorySettingToEntity)
			};
		} catch (error) {
			captureSentryError(error, 'channelCategorySetting/fetchChannelCategorySetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialChannelCategorySettingState: ChannelCategorySettingState = channelCategorySettingAdapter.getInitialState({
	byClans: {},
	loadingStatus: 'not loaded',
	error: null
});

export const channelCategorySettingSlice = createSlice({
	name: 'notichannelcategorysetting',
	initialState: initialChannelCategorySettingState,
	reducers: {
		updateChannelCategoryCache: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = { loadingStatus: 'not loaded' };
			}
			state.byClans[clanId].cache = createCacheMetadata(CHANNEL_CATEGORY_SETTING_CACHE_TIME);
		},

		invalidateCache: (state, action: PayloadAction<{ clanId: string; cache: CacheMetadata | null }>) => {
			const { clanId, cache } = action.payload;
			if (state.byClans[clanId]) {
				state.byClans[clanId].cache = cache || undefined;
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelCategorySetting.pending, (state: ChannelCategorySettingState, action) => {
				const clanId = action.meta.arg.clanId;
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = { loadingStatus: 'loading' };
				} else {
					state.byClans[clanId].loadingStatus = 'loading';
				}
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchChannelCategorySetting.fulfilled,
				(
					state: ChannelCategorySettingState,
					action: PayloadAction<{
						clanId: string;
						fromCache?: boolean;
						notification_channel_category_settings_list: IChannelCategorySetting[];
					}>
				) => {
					const { clanId, fromCache, notification_channel_category_settings_list } = action.payload;

					if (!state.byClans[clanId]) {
						state.byClans[clanId] = { loadingStatus: 'loaded' };
					} else {
						state.byClans[clanId].loadingStatus = 'loaded';
					}

					if (!fromCache) {
						channelCategorySettingAdapter.setAll(state, notification_channel_category_settings_list);
						state.byClans[clanId].list = notification_channel_category_settings_list as NotiChannelCategorySettingEntity[];
						state.byClans[clanId].cache = createCacheMetadata(CHANNEL_CATEGORY_SETTING_CACHE_TIME);
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(fetchChannelCategorySetting.rejected, (state: ChannelCategorySettingState, action) => {
				const clanId = action.meta.arg.clanId;
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = { loadingStatus: 'error' };
				} else {
					state.byClans[clanId].loadingStatus = 'error';
				}
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const channelCategorySettingReducer = channelCategorySettingSlice.reducer;
export const defaultNotificationCategoryReducer = defaultNotificationCategorySlice.reducer;

export const defaultNotificationCategoryActions = {
	...defaultNotificationCategorySlice.actions,
	getDefaultNotificationCategory,
	setDefaultNotificationCategory,
	deleteDefaultNotificationCategory,
	setMuteCategory,
	fetchChannelCategorySetting
};

export const channelCategorySettingActions = {
	...channelCategorySettingSlice.actions,
	fetchChannelCategorySetting
};

export const getDefaultNotificationCategoryState = (rootState: {
	[DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY]: DefaultNotificationCategoryState;
}): DefaultNotificationCategoryState => rootState[DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY];

export const selectDefaultNotificationCategory = createSelector(
	[
		getDefaultNotificationCategoryState,
		(state: RootState) => state.clans.currentClanId as string,
		(state: RootState, categoryId: string) => categoryId
	],
	(state, clanId, categoryId) => state.byClans[clanId]?.categoriesSettings[categoryId]
);

const { selectAll, selectEntities } = channelCategorySettingAdapter.getSelectors();

export const getchannelCategorySettingListState = (rootState: {
	['notichannelcategorysetting']: ChannelCategorySettingState;
}): ChannelCategorySettingState => rootState['notichannelcategorysetting'];

export const selectAllchannelCategorySetting = createSelector(getchannelCategorySettingListState, selectAll);

export const selectEntiteschannelCategorySetting = createSelector(getchannelCategorySettingListState, selectEntities);

export const selectChannelCategorySettingsByCurrentClan = createSelector(
	[getchannelCategorySettingListState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		const list = state.byClans[clanId]?.list;
		if (list && list.length > 0) return list;
		return selectAll(state);
	}
);
