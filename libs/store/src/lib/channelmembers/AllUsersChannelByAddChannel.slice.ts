import { captureSentryError } from '@mezon/logger';
import type { IUserChannel, LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiAllUsersAddChannelResponse } from 'mezon-js/types';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
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
	selectId: (userChannel: IUserChannel) => userChannel.channelId || ''
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
				channelId: channelId,
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
					userIds: response,
					fromCache: response.fromCache || true
				};
			}
			if (isGroup) {
				thunkAPI.dispatch(statusActions.updateBulkStatus(convertStatusGroup(response as ApiAllUsersAddChannelResponse)));
			}
			return {
				channelId,
				userIds: response,
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
				const updatedUserIds = Array.from(new Set([...(existingChannel?.userIds || []), ...userAdds]));

				UserChannelAdapter.updateOne(state, {
					id: channelId,
					changes: {
						userIds: updatedUserIds
					}
				});
			} else {
				UserChannelAdapter.addOne(state, {
					id: channelId,
					userIds: userAdds
				});
			}
		},
		removeUserChannel: (state, action: PayloadAction<{ channelId: string; userRemoves: Array<string> }>) => {
			const { channelId, userRemoves } = action.payload;

			if (userRemoves.length <= 0) return;
			const existingChannel = state.entities[channelId];

			if (existingChannel) {
				const userIds = existingChannel.userIds;
				const displayNames = existingChannel.displayNames;
				const usernames = existingChannel.usernames;
				const onlines = existingChannel.onlines;
				const avatars = existingChannel.avatars;
				userRemoves.forEach((user) => {
					const indexRemove = userIds?.indexOf(user);
					if (indexRemove !== -1 && indexRemove !== undefined) {
						userIds?.splice(indexRemove, 1);
						displayNames?.splice(indexRemove, 1);
						usernames?.splice(indexRemove, 1);
						onlines?.splice(indexRemove, 1);
						avatars?.splice(indexRemove, 1);
					}
				});

				UserChannelAdapter.updateOne(state, {
					id: channelId,
					changes: {
						userIds,
						displayNames,
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
					action: PayloadAction<{ channelId: string; userIds: ApiAllUsersAddChannelResponse; fromCache?: boolean }>
				) => {
					const { channelId, userIds, fromCache } = action.payload;
					state.loadingStatus = 'loaded';

					if (!fromCache && userIds) {
						const userIdsEntity = {
							id: channelId,
							...userIds
						};
						UserChannelAdapter.upsertOne(state, userIdsEntity);
						state.cacheByChannels[channelId] = createCacheMetadata();
					} else if (!userIds) {
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
export const selectUserChannelIds = createSelector(
	[getUserChannelsState, (state, channelId: string) => channelId],
	(state, channelId) => selectById(state, channelId)?.userIds || []
);

export const selectRawDataUserGroup = createSelector([getUserChannelsState, (state, channelId: string) => channelId], (state, channelId) =>
	selectById(state, channelId)
);
export const selectMemberByGroupId = createSelector([getUserChannelsState, (state, channelId: string) => channelId], (state, channelId) => {
	const entities = selectById(state, channelId);
	if (!entities) {
		return undefined;
	}
	const listMember: ChannelMembersEntity[] = [];
	entities?.userIds?.map((id, index) => {
		listMember.push({
			id,
			user: {
				id,
				username: entities.usernames?.[index] || '',
				displayName: entities.displayNames?.[index] || '',
				avatarUrl: entities.avatars?.[index] || '',
				online: entities.onlines?.[index]
			}
		});
	});
	return listMember;
});
