import { captureSentryError } from '@mezon/logger';
import { IChannelCategorySetting, IDefaultNotificationCategory, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiNotificationSetting } from 'mezon-js/api.gen';
import { ApiNotificationChannelCategorySetting } from 'mezon-js/dist/api.gen';
import { channelsActions } from '../channels/channels.slice';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
export const DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY = 'defaultnotificationcategory';

export interface DefaultNotificationCategoryState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	defaultNotificationCategory?: IDefaultNotificationCategory | null;
}

export const initialDefaultNotificationCategoryState: DefaultNotificationCategoryState = {
	loadingStatus: 'not loaded',
	defaultNotificationCategory: null
};

type fetchNotificationCategorySettingsArgs = {
	categoryId: string;
	noCache?: boolean;
};

export const fetchDefaultNotificationCategoryCached = memoizeAndTrack(
	async (mezon: MezonValueContext, categoryId: string) => {
		const response = await mezon.client.getNotificationCategory(mezon.session, categoryId);
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

export const getDefaultNotificationCategory = createAsyncThunk(
	'defaultnotificationcategory/getDefaultNotificationCategory',
	async ({ categoryId, noCache }: fetchNotificationCategorySettingsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchDefaultNotificationCategoryCached.delete(mezon, categoryId);
			}
			const response = await fetchDefaultNotificationCategoryCached(mezon, categoryId);

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid getDefaultNotificationCategory');
			}

			const apiNotificationSetting = response
				? {
						id: response.id,
						notification_setting_type: response.notification_setting_type,
						active: response.active,
						time_mute: response.time_mute
					}
				: {};

			return apiNotificationSetting;
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
				notification_type: notification_type,
				time_mute: time_mute,
				clan_id: clan_id
			};
			const response = await mezon.client.setNotificationCategory(mezon.session, body);
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			if (time_mute) {
				thunkAPI.dispatch(channelsActions.fetchChannels({ clanId: clan_id || '', noCache: true }));
			}
			thunkAPI.dispatch(fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(getDefaultNotificationCategory({ categoryId: category_id || '', noCache: true }));
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
			thunkAPI.dispatch(getDefaultNotificationCategory({ categoryId: category_id || '', noCache: true }));
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
				active: active,
				notification_type: notification_type,
				id: category_id
			});
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			thunkAPI.dispatch(channelsActions.fetchChannels({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(fetchChannelCategorySetting({ clanId: clan_id || '', noCache: true }));
			thunkAPI.dispatch(getDefaultNotificationCategory({ categoryId: category_id || '', noCache: true }));
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
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(getDefaultNotificationCategory.pending, (state: DefaultNotificationCategoryState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				getDefaultNotificationCategory.fulfilled,
				(state: DefaultNotificationCategoryState, action: PayloadAction<ApiNotificationSetting>) => {
					state.defaultNotificationCategory = action.payload;
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
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const channelCategorySettingAdapter = createEntityAdapter<NotiChannelCategorySettingEntity>();

type fetchChannelCategorySettingPayload = {
	clanId: string;
	noCache?: boolean;
};

export const fetchChannelCategorySettingCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string) => {
		const response = await mezon.client.getChannelCategoryNotiSettingsList(mezon.session, clanId);
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

export const fetchChannelCategorySetting = createAsyncThunk(
	'channelCategorySetting/fetchChannelCategorySetting',
	async ({ clanId, noCache }: fetchChannelCategorySettingPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchChannelCategorySettingCached.delete(mezon, clanId);
			}
			const response = await fetchChannelCategorySettingCached(mezon, clanId);

			if (!response?.notification_channel_category_settings_list) {
				return [];
			}
			return response.notification_channel_category_settings_list.map(mapChannelCategorySettingToEntity);
		} catch (error) {
			captureSentryError(error, 'channelCategorySetting/fetchChannelCategorySetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialChannelCategorySettingState: ChannelCategorySettingState = channelCategorySettingAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const channelCategorySettingSlice = createSlice({
	name: 'notichannelcategorysetting',
	initialState: initialChannelCategorySettingState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelCategorySetting.pending, (state: ChannelCategorySettingState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchChannelCategorySetting.fulfilled,
				(state: ChannelCategorySettingState, action: PayloadAction<IChannelCategorySetting[]>) => {
					channelCategorySettingAdapter.setAll(state, action.payload);
					state.loadingStatus = 'loaded';
				}
			)
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
	fetchChannelCategorySetting,
	setMuteCategory
};

export const getDefaultNotificationCategoryState = (rootState: {
	[DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY]: DefaultNotificationCategoryState;
}): DefaultNotificationCategoryState => rootState[DEFAULT_NOTIFICATION_CATEGORY_FEATURE_KEY];

export const selectDefaultNotificationCategory = createSelector(
	getDefaultNotificationCategoryState,
	(state: DefaultNotificationCategoryState) => state.defaultNotificationCategory
);

const { selectAll, selectEntities } = channelCategorySettingAdapter.getSelectors();

export const getchannelCategorySettingListState = (rootState: {
	['notichannelcategorysetting']: ChannelCategorySettingState;
}): ChannelCategorySettingState => rootState['notichannelcategorysetting'];

export const selectAllchannelCategorySetting = createSelector(getchannelCategorySettingListState, selectAll);

export const selectEntiteschannelCategorySetting = createSelector(getchannelCategorySettingListState, selectEntities);
