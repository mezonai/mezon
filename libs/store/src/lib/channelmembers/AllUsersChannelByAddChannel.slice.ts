import { captureSentryError } from '@mezon/logger';
import { IUserChannel, LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiAllUsersAddChannelResponse } from 'mezon-js/api.gen';
import { USERS_CLANS_FEATURE_KEY, UsersClanState } from '../clanMembers/clan.members';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { ChannelMembersEntity } from './channel.members';

export const ALL_USERS_BY_ADD_CHANNEL = 'allUsersByAddChannel';

const ADD_CHANNEL_USERS_CACHE_TIME = 1000 * 60 * 60;

export interface UsersByAddChannelState extends EntityState<IUserChannel, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
}

export const UserChannelAdapter = createEntityAdapter({
	selectId: (userChannel: IUserChannel) => userChannel.channel_id || ''
});

export const initialUserChannelState: UsersByAddChannelState = UserChannelAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const fetchUserChannelsCached = memoizeAndTrack(
	async (mezon: MezonValueContext, channelId: string, limit: number, defaultResponse?: ApiAllUsersAddChannelResponse) => {
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

export const fetchUserChannels = createAsyncThunk(
	'allUsersByAddChannel/fetchUserChannels',
	async ({ channelId, noCache }: { channelId: string; noCache?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			if (noCache) {
				fetchUserChannelsCached.delete(mezon, channelId, 500);
			}

			const response = await fetchUserChannelsCached(mezon, channelId, 500);

			if (Date.now() - response.time > 1000) {
				return {
					channelId: channelId,
					user_ids: {},
					fromCache: true
				};
			}
			return {
				channelId: channelId,
				user_ids: response,
				fromCache: false
			};
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
		removeMany: UserChannelAdapter.removeMany,
		addUserChannel: (state, action: PayloadAction<{ channelId: string; userAdds: Array<string> }>) => {
			const { channelId, userAdds } = action.payload;

			if (userAdds.length <= 0) return;

			const existingChannel = state.entities[channelId];

			if (existingChannel) {
				const updatedUserIds = Array.from(new Set([...(existingChannel?.user_ids || []), ...userAdds]));

				UserChannelAdapter.updateOne(state, {
					id: channelId,
					changes: {
						user_ids: updatedUserIds
					}
				});
			} else {
				UserChannelAdapter.addOne(state, {
					id: channelId,
					user_ids: userAdds
				});
			}
		},
		removeUserChannel: (state, action: PayloadAction<{ channelId: string; userRemoves: Array<string> }>) => {
			const { channelId, userRemoves } = action.payload;

			if (userRemoves.length <= 0) return;
			const existingChannel = state.entities[channelId];

			if (existingChannel) {
				const updatedUserIds = (existingChannel?.user_ids || []).filter((userId) => !userRemoves.includes(userId));
				UserChannelAdapter.updateOne(state, {
					id: channelId,
					changes: {
						user_ids: updatedUserIds
					}
				});
			}
		}
	},
	extraReducers(builder) {
		builder
			.addCase(
				fetchUserChannels.fulfilled,
				(
					state: UsersByAddChannelState,
					action: PayloadAction<{ channelId: string; user_ids: ApiAllUsersAddChannelResponse; fromCache?: boolean }>
				) => {
					state.loadingStatus = 'loaded';
					if (action.payload.fromCache) return;
					if (action.payload?.user_ids) {
						const userIdsEntity = {
							id: action.payload.channelId,
							...action.payload?.user_ids
						};
						UserChannelAdapter.upsertOne(state, userIdsEntity);
					} else {
						state.error = 'No data received';
					}
				}
			)
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
const { selectAll, selectEntities } = UserChannelAdapter.getSelectors();

export const selectUserChannelUCEntities = createSelector(getUserChannelsState, selectEntities);
export const selectAllUserChannel = (channelId: string) =>
	createSelector([selectUserChannelUCEntities, getUsersClanState], (channelMembers, usersClanState) => {
		let membersOfChannel: ChannelMembersEntity[] = [];

		if (!usersClanState?.ids?.length) return membersOfChannel;

		const members = { ids: channelMembers?.[channelId]?.user_ids };

		if (!members?.ids) return membersOfChannel;
		const ids = members.ids || [];
		membersOfChannel = ids.map((id) => ({
			...usersClanState.entities[id]
		}));

		return membersOfChannel;
	});
