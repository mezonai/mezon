import { captureSentryError } from '@mezon/logger';
import type { IUserChannel, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiAllUsersAddChannelResponse } from 'mezon-js/api.gen';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { selectAllUserClans, selectEntitesUserClans } from '../clanMembers/clan.members';
import { convertStatusGroup, statusActions } from '../direct/status.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';
import type { ChannelMembersEntity } from './channel.members';

export const ALL_USERS_BY_ADD_CHANNEL = 'allUsersByAddChannel';

export interface UsersByAddChannelState extends EntityState<IUserChannel, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	cacheByChannels: Record<string, CacheMetadata>;
}

export const UserChannelAdapter = createEntityAdapter({
	selectId: (userChannel: IUserChannel) => userChannel.channel_id || ''
});

export const initialUserChannelState: UsersByAddChannelState = UserChannelAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	cacheByChannels: {}
});

export const fetchUserChannelsCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	channelId: string,
	limit: number,
	noCache = false
) => {
	const currentState = getState();
	const userChannelsState = currentState[ALL_USERS_BY_ADD_CHANNEL];
	const apiKey = createApiKey('fetchUserChannels', channelId, limit, ensuredMezon.session.username || '');
	const shouldForceCall = shouldForceApiCall(apiKey, userChannelsState?.cacheByChannels?.[channelId], noCache);
	if (!shouldForceCall) {
		const cachedData = userChannelsState.entities[channelId];
		return {
			...cachedData,
			time: Date.now(),
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListChannelUsersUC',
			list_channel_users_uc_req: {
				channel_id: channelId,
				limit
			}
		},
		() => ensuredMezon.client.listChannelUsersUC(ensuredMezon.session, channelId, limit),
		'channel_users_uc_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

export const fetchUserChannels = createAsyncThunk(
	'allUsersByAddChannel/fetchUserChannels',
	async ({ channelId, noCache, isGroup = false }: { channelId: string; noCache?: boolean; isGroup?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await fetchUserChannelsCached(thunkAPI.getState as () => RootState, mezon, channelId, 500, noCache);

			if (response.fromCache || Date.now() - response.time > 1000) {
				return {
					channelId,
					user_ids: response,
					fromCache: response.fromCache || true
				};
			}
			if (isGroup) {
				thunkAPI.dispatch(statusActions.updateBulkStatus(convertStatusGroup(response as ApiAllUsersAddChannelResponse)));
			}
			return {
				channelId,
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
				const user_ids = existingChannel.user_ids;
				const display_names = existingChannel.display_names;
				const usernames = existingChannel.usernames;
				const onlines = existingChannel.onlines;
				const avatars = existingChannel.avatars;
				userRemoves.forEach((user) => {
					const indexRemove = user_ids?.indexOf(user);
					if (indexRemove !== -1 && indexRemove !== undefined) {
						user_ids?.splice(indexRemove, 1);
						display_names?.splice(indexRemove, 1);
						usernames?.splice(indexRemove, 1);
						onlines?.splice(indexRemove, 1);
						avatars?.splice(indexRemove, 1);
					}
				});

				UserChannelAdapter.updateOne(state, {
					id: channelId,
					changes: {
						user_ids,
						display_names,
						avatars,
						onlines,
						usernames
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
					const { channelId, user_ids, fromCache } = action.payload;
					state.loadingStatus = 'loaded';

					if (!fromCache && user_ids) {
						const userIdsEntity = {
							id: channelId,
							...user_ids
						};
						UserChannelAdapter.upsertOne(state, userIdsEntity);
						state.cacheByChannels[channelId] = createCacheMetadata();
					} else if (!user_ids) {
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

export const getUserChannelsState = (rootState: { [ALL_USERS_BY_ADD_CHANNEL]: UsersByAddChannelState }): UsersByAddChannelState =>
	rootState[ALL_USERS_BY_ADD_CHANNEL];
const { selectEntities, selectById } = UserChannelAdapter.getSelectors();

export const selectUserChannelUCEntities = createSelector(getUserChannelsState, selectEntities);
export const selectMemberByGroupId = createSelector([getUserChannelsState, (state, channelId: string) => channelId], (state, channelId) => {
	const entities = selectById(state, channelId);
	if (!entities) {
		return undefined;
	}
	const listMember: ChannelMembersEntity[] = [];
	entities?.user_ids?.map((id, index) => {
		listMember.push({
			id,
			user: {
				id,
				username: entities.usernames?.[index] || '',
				display_name: entities.display_names?.[index] || '',
				avatar_url: entities.avatars?.[index] || '',
				online: entities.onlines?.[index]
			}
		});
	});
	return listMember;
});

export const selectAllUserChannel = (channelId: string) =>
	createSelector([selectUserChannelUCEntities, selectAllUserClans, selectEntitesUserClans], (channelMembers, allUserClans, usersClanEntities) => {
		let membersOfChannel: ChannelMembersEntity[] = [];

		if (!allUserClans?.length) return membersOfChannel;

		const members = { ids: channelMembers?.[channelId]?.user_ids };

		if (!members?.ids) return membersOfChannel;
		const ids = members.ids || [];
		membersOfChannel = ids.map((id: string) => ({
			...usersClanEntities[id]
		}));

		return membersOfChannel;
	});
