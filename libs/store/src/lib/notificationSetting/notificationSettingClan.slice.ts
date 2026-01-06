import { captureSentryError } from '@mezon/logger';
import type { IDefaultNotification, IDefaultNotificationClan, LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiNotificationSetting } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const DEFAULT_NOTIFICATION_CLAN_FEATURE_KEY = 'defaultnotificationclan';

const DEFAULT_NOTIFICATION_CLAN_CACHE_TIME = 1000 * 60 * 60;

export interface DefaultNotificationClanState {
	byClans: Record<
		string,
		{
			defaultNotificationClan?: IDefaultNotificationClan | null;
			cache?: CacheMetadata;
		}
	>;
	loadingStatus: LoadingStatus;
	error?: string | null;
}

const getInitialClanState = () => ({
	defaultNotificationClan: null
});

export const initialDefaultNotificationClanState: DefaultNotificationClanState = {
	byClans: {},
	loadingStatus: 'not loaded'
};

type fetchNotificationClanSettingsArgs = {
	clanId: string;
	noCache?: boolean;
};

export const fetchDefaultNotificationClanCached = async (getState: () => RootState, mezon: MezonValueContext, clanId: string, noCache = false) => {
	const currentState = getState();
	const clanData = currentState[DEFAULT_NOTIFICATION_CLAN_FEATURE_KEY].byClans[clanId];
	const apiKey = createApiKey('fetchDefaultNotificationClan', clanId);

	const shouldForceCall = shouldForceApiCall(apiKey, clanData?.cache, noCache);

	if (!shouldForceCall) {
		return {
			...clanData.defaultNotificationClan,
			fromCache: true,
			time: clanData.cache?.lastFetched || Date.now()
		};
	}

	const response = await fetchDataWithSocketFallback(
		mezon,
		{
			api_name: 'GetNotificationClancase',
			notification_clan: {
				clanId: clanId
			}
		},
		() => mezon.client.getNotificationClan(mezon.session, clanId),
		'notification_setting'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const getDefaultNotificationClan = createAsyncThunk(
	'defaultnotificationclan/getDefaultNotificationClan',
	async ({ clanId, noCache }: fetchNotificationClanSettingsArgs, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchDefaultNotificationClanCached(thunkAPI.getState as () => RootState, mezon, clanId, Boolean(noCache));

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid getDefaultNotificationClan');
			}

			if (response.fromCache) {
				return {
					fromCache: true,
					clanId
				};
			}

			const clanNotificationConfig: ApiNotificationSetting = {
				id: response.id,
				notificationSettingType: response.notificationSettingType
			};

			return { ...clanNotificationConfig, clanId };
		} catch (error) {
			captureSentryError(error, 'defaultnotificationclan/getDefaultNotificationClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type SetDefaultNotificationPayload = {
	clanId?: string;
	notificationType?: number;
};

export const setDefaultNotificationClan = createAsyncThunk(
	'defaultnotificationclan/setDefaultNotificationClan',
	async ({ clanId, notificationType }: SetDefaultNotificationPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const body = {
				clanId,
				notificationType
			};
			const response = await mezon.client.setNotificationClan(mezon.session, body);
			if (!response) {
				return null;
			}
			return body;
		} catch (error) {
			captureSentryError(error, 'defaultnotificationclan/setDefaultNotificationClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const defaultNotificationClanSlice = createSlice({
	name: DEFAULT_NOTIFICATION_CLAN_FEATURE_KEY,
	initialState: initialDefaultNotificationClanState,
	reducers: {
		updateCache: (state, action: PayloadAction<{ clanId: string }>) => {
			const { clanId } = action.payload;
			if (!state.byClans[clanId]) {
				state.byClans[clanId] = getInitialClanState();
			}
			state.byClans[clanId].cache = createCacheMetadata(DEFAULT_NOTIFICATION_CLAN_CACHE_TIME);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getDefaultNotificationClan.pending, (state: DefaultNotificationClanState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				getDefaultNotificationClan.fulfilled,
				(state: DefaultNotificationClanState, action: PayloadAction<ApiNotificationSetting & { clanId: string; fromCache?: boolean }>) => {
					const { clanId, fromCache, ...notificationData } = action.payload;

					if (!state.byClans[clanId]) {
						state.byClans[clanId] = getInitialClanState();
					}

					if (!fromCache) {
						state.byClans[clanId].defaultNotificationClan = notificationData;
						state.byClans[clanId].cache = createCacheMetadata(DEFAULT_NOTIFICATION_CLAN_CACHE_TIME);
					}

					state.loadingStatus = 'loaded';
				}
			)
			.addCase(getDefaultNotificationClan.rejected, (state: DefaultNotificationClanState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(setDefaultNotificationClan.fulfilled, (state: DefaultNotificationClanState, action) => {
				if (!action.payload) {
					return;
				}
				const { clanId, notificationType } = action.payload;
				if (!clanId) return;
				if (!state.byClans[clanId]) {
					state.byClans[clanId] = getInitialClanState();
				}
				if (state.byClans[clanId].defaultNotificationClan) {
					state.byClans[clanId].defaultNotificationClan = {
						...state.byClans[clanId].defaultNotificationClan,
						notificationSettingType: notificationType
					};
				}
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
	[getDefaultNotificationClanState, (state: RootState) => state.clans.currentClanId as string],
	(state, clanId) => state.byClans[clanId]?.defaultNotificationClan
);

export const selectDefaultNotificationClanByClanId = createSelector(
	[getDefaultNotificationClanState, (state: RootState, clanId: string) => clanId],
	(state, clanId) => state.byClans[clanId]?.defaultNotificationClan
);
