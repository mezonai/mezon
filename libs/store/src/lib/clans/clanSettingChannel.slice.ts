import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState } from '@reduxjs/toolkit';

import { ApiChannelSettingItem } from 'mezon-js/dist/api.gen';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';

export const SETTING_CLAN_CHANNEL = 'settingClanChannel';

const CHANNEL_SETTING_CLAN_CACHE_TIME = 1000 * 60 * 3;

export interface SettingClanChannelState extends EntityState<ApiChannelSettingItem, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	channelCount: number;
	threadCount: number;
	threadsByChannel: Record<string, ApiChannelSettingItem[]>;
	listSearchChannel: ApiChannelSettingItem[];
	isEnableOnBoarding: boolean;
}

export const channelSettingAdapter = createEntityAdapter({
	selectId: (channel: ApiChannelSettingItem) => channel.id || ''
});

export const initialSettingClanChannelState: SettingClanChannelState = channelSettingAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	channelCount: 0,
	threadCount: 0,
	threadsByChannel: {},
	listSearchChannel: [],
	isEnableOnBoarding: false
});

export enum ETypeFetchChannelSetting {
	FETCH_CHANNEL = 'FETCH_CHANNEL',
	MORE_CHANNEL = 'MORE_CHANNEL',
	FETCH_THREAD = 'FETCH_THREAD',
	SEARCH_CHANNEL = 'SEARCH_CHANNEL'
}

export const fetchChannelSettingInClanCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string, parentId: string, page: number, limit: number, channel_label: string) => {
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
		return response;
	},
	{
		promise: true,
		maxAge: CHANNEL_SETTING_CLAN_CACHE_TIME,
		normalizer: (args) => {
			return args[5] + args[4] + args[3] + args[1] + args[2] + args[0]?.session?.username || '';
		}
	}
);

interface IFetchChannelSetting {
	noCache?: boolean;
	clanId: string;
	parentId: string;
	page?: number;
	limit?: number;
	typeFetch: ETypeFetchChannelSetting;
	keyword?: string;
}

export const fetchChannelSettingInClan = createAsyncThunk(
	'channelSetting/fetchClanChannelSetting',
	async ({ noCache = false, clanId, parentId, page = 1, limit = 10, typeFetch, keyword }: IFetchChannelSetting, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (noCache) {
				fetchChannelSettingInClanCached.clear();
			}

			const response = await fetchChannelSettingInClanCached(mezon, clanId, parentId, page, limit, keyword || '');
			if (response) {
				return {
					parentId: parentId,
					response: response,
					typeFetch
				};
			}
			throw new Error('Emoji list is undefined or null');
		} catch (error) {
			return thunkAPI.rejectWithValue([]);
		}
	}
);

export const settingClanChannelSlice = createSlice({
	name: SETTING_CLAN_CHANNEL,
	initialState: initialSettingClanChannelState,
	reducers: {
		toggleOnBoarding: (state) => {
			state.isEnableOnBoarding = !state.isEnableOnBoarding;
		}
	},
	extraReducers(builder) {
		builder
			.addCase(fetchChannelSettingInClan.fulfilled, (state: SettingClanChannelState, actions) => {
				state.loadingStatus = 'loaded';
				switch (actions.payload.typeFetch) {
					case ETypeFetchChannelSetting.FETCH_CHANNEL:
						channelSettingAdapter.setAll(state, actions.payload.response.channel_setting_list || []);
						break;
					case ETypeFetchChannelSetting.MORE_CHANNEL:
						channelSettingAdapter.setMany(state, actions.payload.response.channel_setting_list || []);
						break;
					case ETypeFetchChannelSetting.FETCH_THREAD:
						state.threadsByChannel[actions.payload.parentId] = actions.payload.response.channel_setting_list || [];
						break;
					case ETypeFetchChannelSetting.SEARCH_CHANNEL:
						state.listSearchChannel = actions.payload.response.channel_setting_list || [];
						break;
					default:
						channelSettingAdapter.setAll(state, actions.payload.response.channel_setting_list || []);
				}
				state.channelCount = actions.payload.response.channel_count || 0;
				state.threadCount = actions.payload.response.thread_count || 0;
			})
			.addCase(fetchChannelSettingInClan.pending, (state: SettingClanChannelState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchChannelSettingInClan.rejected, (state: SettingClanChannelState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const channelSettingActions = {
	...settingClanChannelSlice.actions,
	fetchChannelSettingInClan
};

export const getChannelSettingState = (rootState: { [SETTING_CLAN_CHANNEL]: SettingClanChannelState }): SettingClanChannelState =>
	rootState[SETTING_CLAN_CHANNEL];
const { selectAll, selectEntities, selectById } = channelSettingAdapter.getSelectors();
export const selectAllChannelSuggestion = createSelector(getChannelSettingState, selectAll);
export const selectChannelSuggestionEntities = createSelector(getChannelSettingState, selectEntities);
export const selectOneChannelInfor = (channelId: string) => createSelector(getChannelSettingState, (state) => selectById(state, channelId));
export const selectThreadsListByParentId = (parentId: string) => createSelector(getChannelSettingState, (state) => state.threadsByChannel[parentId]);
export const settingChannelReducer = settingClanChannelSlice.reducer;
export const selectNumberChannelCount = createSelector(getChannelSettingState, (state) => state.channelCount);
export const selectNumberThreadCount = createSelector(getChannelSettingState, (state) => state.threadCount);

export const selectEnableStatusOfOnBoarding = createSelector(getChannelSettingState, (state) => state.isEnableOnBoarding);

export const selectListChannelBySearch = createSelector(getChannelSettingState, (state) => state.listSearchChannel);
