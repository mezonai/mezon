import { captureSentryError } from '@mezon/logger';
import { EMuteState, type IChannelCategorySetting, type IDefaultNotificationCategory, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiNotificationChannelCategorySetting } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx, timestampToString } from '../helpers';
import type { RootState } from '../store';
import { deleteNotiChannelSetting, setMuteChannel, setNotificationSetting } from './notificationSettingChannel.slice';

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
				categoryId
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
				notificationSettingType: response.notificationSettingType,
				active: response.active,
				timeMute:
					response.timeMute && typeof response.timeMute === 'object' && 'seconds' in response.timeMute
						? new Date((response.timeMute as any).seconds * 1000).toISOString()
						: (response.timeMute as string | null | undefined)
			};

			return { ...apiNotificationSetting, categoryId, clanId };
		} catch (error) {
			captureSentryError(error, 'defaultnotificationcategory/getDefaultNotificationCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type SetDefaultNotificationPayload = {
	categoryId?: string;
	notificationType?: number;
	clanId?: string;
	label?: string;
	title?: string;
};

export const setDefaultNotificationCategory = createAsyncThunk(
	'defaultnotificationcategory/setDefaultNotificationCategory',
	async ({ categoryId, notificationType, clanId, label, title }: SetDefaultNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				$typeName: 'mezon.api.SetNotificationRequest' as const,
				channelCategoryId: categoryId || '',
				notificationType: notificationType || 0,
				clanId: clanId || ''
			};
			const response = await mezon.client.setNotificationCategory(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return { ...body, clanId, label, title };
		} catch (error) {
			captureSentryError(error, 'defaultnotificationcategory/setDefaultNotificationCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type DeleteDefaultNotificationPayload = {
	categoryId?: string;
	clanId?: string;
};

export const deleteDefaultNotificationCategory = createAsyncThunk(
	'defaultnotificationcategory/deleteDefaultNotificationCategory',
	async ({ categoryId, clanId: _clan_id }: DeleteDefaultNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.deleteNotificationCategory(mezon.session, categoryId || '');
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return response;
		} catch (error) {
			captureSentryError(error, 'defaultnotificationcategory/deleteDefaultNotificationCategory');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export type MuteCatePayload = {
	active?: number;
	id?: string;
	muteTime?: number;
	clanId: string;
};
export const setMuteCategory = createAsyncThunk(
	'defaultnotificationcategory/setMuteCategory',
	async ({ id, active, muteTime, clanId }: MuteCatePayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.setMuteCategory(mezon.session, {
				$typeName: 'mezon.api.SetMuteRequest' as const,
				active: active ?? 0,
				id: id || '',
				muteTime: muteTime ?? 0,
				clanId: clanId || ''
			});
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}

			return {
				active,
				id,
				muteTime,
				clanId
			};
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
		},
		unmuteCate: (state, action: PayloadAction<{ categoryId: string; clanId: string }>) => {
			const { categoryId, clanId } = action.payload;
			if (state.byClans[clanId]?.categoriesSettings[categoryId]) {
				state.byClans[clanId].categoriesSettings[categoryId].active = EMuteState.UN_MUTE;
				state.byClans[clanId].categoriesSettings[categoryId].timeMute = null;
			}
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
			})
			.addCase(setDefaultNotificationCategory.fulfilled, (state, action) => {
				const { channelCategoryId, notificationType, clanId } = action.payload;
				if (!clanId || !channelCategoryId) {
					return;
				}
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}
				if (state.byClans[clanId]?.categoriesSettings[channelCategoryId]) {
					state.byClans[clanId].categoriesSettings[channelCategoryId].notificationSettingType = notificationType;
				}
			})
			.addCase(setMuteCategory.fulfilled, (state, action) => {
				const { id, active, muteTime, clanId } = action.payload;
				if (!id) {
					return;
				}
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}
				if (state.byClans[clanId]?.categoriesSettings[id]) {
					state.byClans[clanId].categoriesSettings[id].active = active ? EMuteState.UN_MUTE : EMuteState.MUTED;
					state.byClans[clanId].categoriesSettings[id].timeMute =
						muteTime === 0 && active === EMuteState.MUTED ? null : new Date(Date.now() + (muteTime || 0) * 1000).toISOString();
				}
			});
	}
});

//

export interface NotiChannelCategorySettingEntity extends IChannelCategorySetting {
	id: string; // Primary ID
}

export const mapChannelCategorySettingToEntity = (ChannelCategorySettingRes: ApiNotificationChannelCategorySetting) => {
	const id = (ChannelCategorySettingRes as unknown as { id: string }).id;
	const res = ChannelCategorySettingRes as any;
	return {
		...ChannelCategorySettingRes,
		id,
		timeMute: timestampToString(res.timeMute)
	};
};

export interface ChannelCategorySettingState {
	byClans: Record<
		string,
		{
			loadingStatus: LoadingStatus;
			cache?: CacheMetadata;
			list: EntityState<NotiChannelCategorySettingEntity, string>;
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
				clanId
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
					notificationChannelCategorySettingsList: []
				};
			}

			const res = response as any;
			if (!res?.notificationChannelCategorySettingsList) {
				return {
					fromCache: response.fromCache,
					clanId,
					notificationChannelCategorySettingsList: []
				};
			}

			return {
				fromCache: response.fromCache,
				clanId,
				notificationChannelCategorySettingsList: res.notificationChannelCategorySettingsList.map(mapChannelCategorySettingToEntity)
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
			.addCase(fetchChannelCategorySetting.pending, (state: ChannelCategorySettingState, _action) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchChannelCategorySetting.fulfilled,
				(
					state: ChannelCategorySettingState,
					action: PayloadAction<{
						clanId: string;
						fromCache?: boolean;
						notificationChannelCategorySettingsList: IChannelCategorySetting[];
					}>
				) => {
					const { clanId, fromCache, notificationChannelCategorySettingsList } = action.payload;

					if (!state.byClans[clanId]) {
						state.byClans[clanId] = {
							loadingStatus: 'not loaded',
							list: channelCategorySettingAdapter.getInitialState()
						};
					}

					if (!fromCache) {
						channelCategorySettingAdapter.setAll(state.byClans[clanId].list, notificationChannelCategorySettingsList);
						state.byClans[clanId].cache = createCacheMetadata(CHANNEL_CATEGORY_SETTING_CACHE_TIME);
					}

					state.loadingStatus = 'loaded';
				}
			)

			.addCase(setDefaultNotificationCategory.fulfilled, (state: ChannelCategorySettingState, action) => {
				const { channelCategoryId, notificationType, clanId, label, title } = action.payload;

				if (!clanId || !channelCategoryId) {
					return;
				}

				const existingEntity = state.byClans[clanId]?.list.entities[channelCategoryId];
				if (existingEntity) {
					channelCategorySettingAdapter.updateOne(state.byClans[clanId].list, {
						id: channelCategoryId,
						changes: {
							notificationSettingType: notificationType
						}
					});
				} else {
					channelCategorySettingAdapter.addOne(state.byClans[clanId].list, {
						id: channelCategoryId,
						notificationSettingType: notificationType,
						channelCategoryLabel: label,
						channelCategoryTitle: title
					});
				}
			})
			.addCase(setNotificationSetting.fulfilled, (state: ChannelCategorySettingState, action) => {
				const payload = action.payload as unknown as {
					channelCategoryId?: string;
					notificationType?: number;
					clanId?: string;
					label?: string;
					title?: string;
				};
				const { channelCategoryId, notificationType, clanId, label, title } = payload;
				if (!clanId || !channelCategoryId || !notificationType) {
					return;
				}

				if (!state?.byClans?.[clanId]) {
					state.byClans[clanId] = {
						loadingStatus: 'not loaded',
						list: channelCategorySettingAdapter.getInitialState()
					};
				}

				const existingEntity = state.byClans[clanId]?.list.entities[channelCategoryId];
				if (existingEntity) {
					channelCategorySettingAdapter.updateOne(state.byClans[clanId].list, {
						id: channelCategoryId,
						changes: {
							notificationSettingType: notificationType
						}
					});
				} else {
					channelCategorySettingAdapter.addOne(state.byClans[clanId].list, {
						id: channelCategoryId,
						notificationSettingType: notificationType,
						channelCategoryLabel: label,
						channelCategoryTitle: title
					});
				}
			})
			.addCase(setMuteChannel.fulfilled, (state: ChannelCategorySettingState, action) => {
				const payload = action.payload as unknown as { channelId?: string; active?: number; clanId?: string };
				const { channelId, active, clanId } = payload;
				if (!clanId || !channelId) {
					return;
				}

				const existingEntity = state.byClans[clanId].list.entities[channelId];
				if (existingEntity) {
					channelCategorySettingAdapter.updateOne(state.byClans[clanId].list, {
						id: channelId,
						changes: {
							action: active
						}
					});
				}
			})
			.addCase(setMuteCategory.fulfilled, (state: ChannelCategorySettingState, action) => {
				const payload = action.payload as unknown as { id?: string; active?: number; clanId?: string };
				const { id, active, clanId } = payload;
				if (!clanId || !id) {
					return;
				}

				const existingEntity = state.byClans[clanId]?.list?.entities[id];
				if (existingEntity) {
					channelCategorySettingAdapter.updateOne(state.byClans[clanId].list, {
						id,
						changes: {
							action: active
						}
					});
				}
			})
			.addCase(deleteDefaultNotificationCategory.fulfilled, (state: ChannelCategorySettingState, action) => {
				const { categoryId, clanId } = action.meta.arg;
				if (!clanId || !categoryId) {
					return;
				}

				if (state.byClans[clanId]) {
					channelCategorySettingAdapter.removeOne(state.byClans[clanId].list, categoryId);
				}
			})
			.addCase(deleteNotiChannelSetting.fulfilled, (state: ChannelCategorySettingState, action) => {
				const { channelId, clanId } = action.meta.arg;
				if (!clanId || !channelId) {
					return;
				}
				if (state.byClans[clanId]) {
					channelCategorySettingAdapter.removeOne(state.byClans[clanId].list, channelId);
				}
			})

			.addCase(fetchChannelCategorySetting.rejected, (state: ChannelCategorySettingState, action) => {
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

export const selectEntiteschannelCategorySetting = createSelector(
	[getchannelCategorySettingListState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		return selectEntities(state.byClans[clanId]?.list);
	}
);

export const selectAllchannelCategorySetting = createSelector(
	[getchannelCategorySettingListState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => {
		if (!state.byClans[clanId]) {
			return [];
		}
		return selectAll(state.byClans[clanId]?.list);
	}
);
