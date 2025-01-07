import { captureSentryError } from '@mezon/logger';
import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState } from '@reduxjs/toolkit';
import { ApiAllUsersAddChannelResponse } from 'mezon-js/api.gen';
import { USERS_CLANS_FEATURE_KEY, UsersClanState } from '../clanMembers/clan.members';
import { ensureSession, getMezonCtx, MezonValueContext } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { ChannelMembersEntity } from './channel.members';

export const ALL_USERS_BY_ADD_CHANNEL = 'allUsersByAddChannel';

const ADD_CHANNEL_USERS_CACHE_TIME = 1000 * 60 * 60;

export interface UsersByAddChannelState extends EntityState<string, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const UserChannelAdapter = createEntityAdapter({
	selectId: (userId: string) => userId || ''
});

export const initialUserChannelState: UsersByAddChannelState = UserChannelAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const fetchUserChannelsCached = memoizeAndTrack(
	async (mezon: MezonValueContext, channelId: string, limit: number, defaultResponse?: ApiAllUsersAddChannelResponse) => {
		if (defaultResponse) {
			return { ...defaultResponse, time: Date.now() };
		}
		const response = await mezon.client.listChannelUsersUC(mezon.session, channelId, limit);
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: ADD_CHANNEL_USERS_CACHE_TIME,
		normalizer: (args) => {
			return args[2] + args[1] + args[0]?.session?.username || '';
		}
	}
);

export const updateCacheUserChannels = async (mezon: MezonValueContext, channelId: string, userIdToLeave?: string, userIdsToAdd?: string[]) => {
	const response = await fetchUserChannelsCached(mezon, channelId, 500);
	if (response && response.user_ids) {
		let updateUserIds = response.user_ids;

		// remove user
		if (userIdToLeave) {
			updateUserIds = updateUserIds.filter((user_id: string) => user_id !== userIdToLeave);
		}

		// add users
		if (userIdsToAdd && userIdsToAdd.length > 0) {
			userIdsToAdd.forEach((userId: string) => {
				const isAlreadyExists = updateUserIds.some((user_id: string) => user_id === userId);
				if (!isAlreadyExists) {
					updateUserIds.push(userId);
				}
			});
		}

		// update cache
		fetchUserChannelsCached.delete(mezon, channelId, 500);
		fetchUserChannelsCached(mezon, channelId, 500, { user_ids: updateUserIds });
	}
};

export const fetchUserChannels = createAsyncThunk(
	'allUsersByAddChannel/fetchUserChannels',
	async ({ channelId, noCache }: { channelId: string; noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			if (noCache) {
				fetchUserChannelsCached.delete(mezon, channelId, 500);
			}

			const response = await fetchUserChannelsCached(mezon, channelId, 500);

			return response;
		} catch (error) {
			captureSentryError(error, 'allUsersByAddChannel/fetchUserChannels');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const userChannelsSlice = createSlice({
	name: ALL_USERS_BY_ADD_CHANNEL,
	initialState: initialUserChannelState,
	reducers: {
		add: UserChannelAdapter.addOne,
		upsertMany: UserChannelAdapter.upsertMany,
		remove: UserChannelAdapter.removeOne,
		update: UserChannelAdapter.updateOne,
		removeMany: UserChannelAdapter.removeMany
	},
	extraReducers(builder) {
		builder
			.addCase(fetchUserChannels.fulfilled, (state: UsersByAddChannelState, actions) => {
				state.loadingStatus = 'loaded';
				if (actions.payload?.user_ids) {
					UserChannelAdapter.setAll(state, actions.payload.user_ids);
				} else {
					state.error = 'No data received';
				}
			})
			.addCase(fetchUserChannels.pending, (state: UsersByAddChannelState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchUserChannels.rejected, (state: UsersByAddChannelState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const userChannelsActions = {
	...userChannelsSlice.actions,
	fetchUserChannels
};

export const userChannelsReducer = userChannelsSlice.reducer;

const getUsersClanState = (rootState: { [USERS_CLANS_FEATURE_KEY]: UsersClanState }): UsersClanState => rootState[USERS_CLANS_FEATURE_KEY];
export const getUserChannelsState = (rootState: { [ALL_USERS_BY_ADD_CHANNEL]: UsersByAddChannelState }): UsersByAddChannelState =>
	rootState[ALL_USERS_BY_ADD_CHANNEL];
const { selectAll } = UserChannelAdapter.getSelectors();
export const selectAllUserIdChannels = createSelector(getUserChannelsState, selectAll);

export const selectAllUserChannel = createSelector([selectAllUserIdChannels, getUsersClanState], (channelMembers, usersClanState) => {
	let membersOfChannel: ChannelMembersEntity[] = [];

	if (!usersClanState?.ids?.length) return membersOfChannel;

	const members = { ids: channelMembers };

	if (!members?.ids) return membersOfChannel;
	const ids = members.ids || [];
	membersOfChannel = ids.map((id) => ({
		...usersClanState.entities[id]
	}));

	return membersOfChannel;
});
