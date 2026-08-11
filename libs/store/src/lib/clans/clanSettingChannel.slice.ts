import type { LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

import { captureSentryError } from '@mezon/logger';
import type { ApiChannelDescription, ApiChannelSettingItem } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { archiveChannel } from '../channels/channels.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';

export const SETTING_CLAN_CHANNEL = 'settingClanChannel';

interface CachedChannelSettingData {
	channel_setting_list: ApiChannelSettingItem[];
	channel_count: number;
	thread_count: number;
}

export interface SettingClanChannelState extends EntityState<ApiChannelSettingItem, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	channelCount: number;
	threadCount: number;
	threadsByChannel: Record<string, ApiChannelSettingItem[]>;
	listSearchChannel: ApiChannelSettingItem[];
	listArchivedChannel: ApiChannelDescription[];
	cacheByKey: Record<string, CacheMetadata>;
	dataByKey: Record<string, CachedChannelSettingData>;
}

export const channelSettingAdapter = createEntityAdapter({
	selectId: (channel: ApiChannelSettingItem) => channel.id || ''
});
const cleanUndefinedFields = (item: ApiChannelSettingItem): ApiChannelSettingItem => {
	return Object.fromEntries(Object.entries(item).filter(([_, value]) => value !== undefined)) as ApiChannelSettingItem;
};

export const initialSettingClanChannelState: SettingClanChannelState = channelSettingAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	channelCount: 0,
	threadCount: 0,
	threadsByChannel: {},
	listSearchChannel: [],
	listArchivedChannel: [],
	cacheByKey: {},
	dataByKey: {}
});

const resetSettingClanChannelState = (state: SettingClanChannelState) => {
	channelSettingAdapter.removeAll(state);
	state.loadingStatus = 'not loaded';
	state.error = null;
	state.channelCount = 0;
	state.threadCount = 0;
	state.threadsByChannel = {};
	state.listSearchChannel = [];
	state.listArchivedChannel = [];
	state.cacheByKey = {};
	state.dataByKey = {};
};

export enum ETypeFetchChannelSetting {
	FETCH_CHANNEL = 'FETCH_CHANNEL',
	MORE_CHANNEL = 'MORE_CHANNEL',
	FETCH_THREAD = 'FETCH_THREAD',
	SEARCH_CHANNEL = 'SEARCH_CHANNEL'
}

export const fetchChannelSettingInClanCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	clanId: string,
	parentId: string,
	page: number,
	limit: number,
	channel_label: string,
	noCache = false
) => {
	const currentState = getState();
	const channelSettingState = currentState[SETTING_CLAN_CHANNEL];
	const apiKey = createApiKey('fetchChannelSettingInClan', clanId, parentId, page, limit, channel_label);

	const cacheForKey = channelSettingState.cacheByKey?.[apiKey];
	const shouldForceCall = shouldForceApiCall(apiKey, cacheForKey, noCache);

	if (!shouldForceCall) {
		const cachedData = channelSettingState.dataByKey?.[apiKey];

		if (cachedData) {
			return {
				...cachedData,
				fromCache: true,
				apiKey,
				time: cacheForKey?.lastFetched || Date.now()
			};
		}
	}
	const response = await mezon.client.getChannelSettingInClan(
		mezon.session,
		clanId,
		parentId, // parent_id
		undefined, // category_id
		undefined, // private_channel
		undefined, // active
		undefined, // status
		undefined, // type
		limit, // limit
		page,
		channel_label // keyword search
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		apiKey,
		time: Date.now()
	};
};

interface IFetchChannelSetting {
	noCache?: boolean;
	clanId: string;
	parentId: string;
	page?: number;
	limit?: number;
	typeFetch: ETypeFetchChannelSetting;
	keyword?: string;
}

export const fetchActiveChannelSettingInClanCached = async (
	getState: () => RootState,
	mezon: MezonValueContext,
	clanId: string,
	parentId: string,
	page: number,
	limit: number,
	channel_label: string,
	noCache = false
) => {
	const currentState = getState();
	const channelSettingState = currentState[SETTING_CLAN_CHANNEL];
	const apiKey = createApiKey('fetchActiveChannelSettingInClan', clanId, parentId, page, limit, channel_label);

	const cacheForKey = channelSettingState.cacheByKey?.[apiKey];
	const shouldForceCall = shouldForceApiCall(apiKey, cacheForKey, noCache);

	if (!shouldForceCall) {
		const cachedData = channelSettingState.dataByKey?.[apiKey];

		if (cachedData) {
			return {
				...cachedData,
				fromCache: true,
				apiKey,
				time: cacheForKey?.lastFetched || Date.now()
			};
		}
	}
	const response = await mezon.client.getChannelSettingInClan(
		mezon.session,
		clanId,
		parentId, // parent_id
		undefined, // category_id
		undefined, // private_channel
		1, // active — only active (non-archived) channels
		undefined, // status
		undefined, // type
		limit, // limit
		page,
		channel_label // keyword search
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		apiKey,
		time: Date.now()
	};
};

export const fetchActiveChannelSettingInClan = createAsyncThunk(
	'channelSetting/fetchActiveChannelSettingInClan',
	async ({ noCache = false, clanId, parentId, page = 1, limit = 10, typeFetch, keyword }: IFetchChannelSetting, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchActiveChannelSettingInClanCached(
				thunkAPI.getState as () => RootState,
				mezon,
				clanId,
				parentId,
				page,
				limit,
				keyword || '',
				Boolean(noCache)
			);

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid fetchActiveChannelSettingInClan');
			}

			return {
				parentId,
				response,
				typeFetch,
				apiKey: response.apiKey,
				fromCache: Boolean(response.fromCache)
			};
		} catch (error) {
			captureSentryError(error, 'channelSetting/fetchActiveChannelSettingInClan');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchChannelSettingInClan = createAsyncThunk(
	'channelSetting/fetchClanChannelSetting',
	async ({ noCache = false, clanId, parentId, page = 1, limit = 10, typeFetch, keyword }: IFetchChannelSetting, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchChannelSettingInClanCached(
				thunkAPI.getState as () => RootState,
				mezon,
				clanId,
				parentId,
				page,
				limit,
				keyword || '',
				Boolean(noCache)
			);

			if (!response) {
				return thunkAPI.rejectWithValue('Invalid fetchChannelSettingInClan');
			}

			return {
				parentId,
				response,
				typeFetch,
				apiKey: response.apiKey,
				fromCache: Boolean(response.fromCache)
			};
		} catch (error) {
			captureSentryError(error, 'channelSetting/fetchClanChannelSetting');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchArchivedChannelsInClan = createAsyncThunk('channelSetting/fetchArchivedChannelsInClan', async (clanId: string, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listArchivedChannelDescs(mezon.session, clanId);

		if (!response) {
			return thunkAPI.rejectWithValue('Invalid fetchArchivedChannelsInClan');
		}

		return { channeldesc: response.channeldesc || [] };
	} catch (error) {
		captureSentryError(error, 'channelSetting/fetchArchivedChannelsInClan');
		return thunkAPI.rejectWithValue(error);
	}
});

const applyChannelSettingFulfilled = (
	state: SettingClanChannelState,
	payload: {
		response?: {
			fromCache: boolean;
			apiKey: string;
			time: number;
			channel_count?: number;
			channel_setting_list?: Array<ApiChannelSettingItem>;
			clan_id?: string;
			thread_count?: number;
		};
		typeFetch: ETypeFetchChannelSetting;
		parentId: string;
		apiKey?: string;
		fromCache?: boolean;
	}
) => {
	const { response, typeFetch, parentId, apiKey, fromCache } = payload;
	if (!response) return;

	state.loadingStatus = 'loaded';
	const cleanedList = (response.channel_setting_list || []).map(cleanUndefinedFields);

	switch (typeFetch) {
		case ETypeFetchChannelSetting.FETCH_CHANNEL:
			channelSettingAdapter.setAll(state, cleanedList);
			break;
		case ETypeFetchChannelSetting.MORE_CHANNEL:
			channelSettingAdapter.upsertMany(state, cleanedList);
			break;
		case ETypeFetchChannelSetting.FETCH_THREAD:
			state.threadsByChannel[parentId] = response.channel_setting_list || [];
			break;
		case ETypeFetchChannelSetting.SEARCH_CHANNEL:
			state.listSearchChannel = response.channel_setting_list || [];
			break;
		default:
			channelSettingAdapter.setAll(state, response.channel_setting_list || []);
	}
	state.channelCount = response.channel_count || 0;
	state.threadCount = response.thread_count || 0;

	if (!fromCache && apiKey) {
		state.cacheByKey[apiKey] = createCacheMetadata();
		state.dataByKey[apiKey] = {
			channel_setting_list: cleanedList,
			channel_count: response.channel_count || 0,
			thread_count: response.thread_count || 0
		};
	}
};

export const settingClanChannelSlice = createSlice({
	name: SETTING_CLAN_CHANNEL,
	initialState: initialSettingClanChannelState,
	reducers: {
		resetChannelSettingState: (state) => {
			resetSettingClanChannelState(state);
		},

		addChannelFromSocket: (state, action) => {
			const channel = action.payload;
			if (!channel?.id) return;
			if (channel.parent_id && channel.parent_id !== '0') {
				if (!state.threadsByChannel[channel.parent_id]) {
					state.threadsByChannel[channel.parent_id] = [];
				}
				const existingThread = state.threadsByChannel[channel.parent_id].find((t) => t.id === channel.id);
				if (!existingThread) {
					state.threadsByChannel[channel.parent_id].push(channel);
					state.threadCount += 1;
				}
				return;
			}
			channelSettingAdapter.addOne(state, channel);
			state.channelCount += 1;
		},
		removeChannelFromSocket: (state, action) => {
			const channelId = action.payload;
			if (state.listSearchChannel?.length > 0) {
				state.listSearchChannel = state.listSearchChannel.filter((c) => c.id !== channelId);
			}
			if (state.entities[channelId]) {
				channelSettingAdapter.removeOne(state, channelId);
				state.channelCount = Math.max(0, state.channelCount - 1);
				return;
			}
			Object.keys(state.threadsByChannel).some((parentId) => {
				const threads = state.threadsByChannel[parentId];
				const threadExists = threads.some((t) => t.id === channelId);
				if (threadExists) {
					state.threadsByChannel[parentId] = threads.filter((t) => t.id !== channelId);
					state.threadCount = Math.max(0, state.threadCount - 1);
					return true;
				}
				return false;
			});
		},
		removeArchivedChannel: (state, action: PayloadAction<string>) => {
			state.listArchivedChannel = state.listArchivedChannel.filter((ch) => ch.channel_id !== action.payload);
		},
		updateChannelFromSocket: (state, action) => {
			const channel = action.payload;
			if (!channel?.id) return;

			const safeChannel = { ...channel };
			if (safeChannel.channel_type === 0 || safeChannel.channel_type === undefined) {
				delete safeChannel.channel_type;
			}

			if (state.entities[channel.id]) {
				channelSettingAdapter.updateOne(state, {
					id: channel.id,
					changes: safeChannel
				});
				return;
			}

			for (const pid in state.threadsByChannel) {
				const threads = state.threadsByChannel[pid];
				const index = threads.findIndex((t) => t.id === channel.id);
				if (index !== -1) {
					threads[index] = { ...threads[index], ...safeChannel };
					return;
				}
			}

			if (channel.parent_id && channel.parent_id !== '0') {
				state.threadsByChannel[channel.parent_id] ??= [];
				state.threadsByChannel[channel.parent_id].push(channel);
			} else {
				channelSettingAdapter.addOne(state, channel);
			}
		}
	},
	extraReducers(builder) {
		builder
			.addCase(fetchChannelSettingInClan.fulfilled, (state: SettingClanChannelState, actions) => {
				applyChannelSettingFulfilled(state, actions.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchChannelSettingInClan.pending, (state: SettingClanChannelState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchChannelSettingInClan.rejected, (state: SettingClanChannelState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(archiveChannel.fulfilled, (state: SettingClanChannelState, action) => {
				const channelId = action.meta.arg.channelId;
				settingClanChannelSlice.caseReducers.removeChannelFromSocket(state, { payload: channelId, type: '' });
			})
			.addCase(fetchArchivedChannelsInClan.fulfilled, (state: SettingClanChannelState, action) => {
				state.listArchivedChannel = action.payload.channeldesc || [];
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchArchivedChannelsInClan.pending, (state: SettingClanChannelState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchArchivedChannelsInClan.rejected, (state: SettingClanChannelState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchActiveChannelSettingInClan.fulfilled, (state: SettingClanChannelState, actions) => {
				applyChannelSettingFulfilled(state, actions.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchActiveChannelSettingInClan.pending, (state: SettingClanChannelState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchActiveChannelSettingInClan.rejected, (state: SettingClanChannelState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const channelSettingActions = {
	...settingClanChannelSlice.actions,
	fetchChannelSettingInClan,
	fetchActiveChannelSettingInClan,
	fetchArchivedChannelsInClan
};

export const getChannelSettingState = (rootState: { [SETTING_CLAN_CHANNEL]: SettingClanChannelState }): SettingClanChannelState =>
	rootState[SETTING_CLAN_CHANNEL];
const { selectAll, selectById } = channelSettingAdapter.getSelectors();
export const selectAllChannelSuggestion = createSelector(getChannelSettingState, selectAll);
export const selectOneChannelInfor = (channelId: string) => createSelector(getChannelSettingState, (state) => selectById(state, channelId));
export const selectThreadsListByParentId = (parentId: string) =>
	createSelector(getChannelSettingState, (state) => {
		return state.threadsByChannel[parentId];
	});
export const settingChannelReducer = settingClanChannelSlice.reducer;
export const selectNumberChannelCount = createSelector(getChannelSettingState, (state) => state.channelCount);

export const selectListChannelBySearch = createSelector(getChannelSettingState, (state) => state.listSearchChannel);

export const selectArchivedChannels = createSelector(getChannelSettingState, (state) => state.listArchivedChannel);
export const selectArchivedChannelsLoadingStatus = createSelector(getChannelSettingState, (state) => state.loadingStatus);
