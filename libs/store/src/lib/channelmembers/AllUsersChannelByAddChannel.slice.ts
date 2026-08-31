import { captureSentryError } from '@mezon/logger';
import { TypeSearch, type IUserChannel, type LoadingStatus, type SearchItemProps } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiAllUsersAddChannelResponse, ApiSearchCtrlKResponse } from 'mezon-js';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';
import type { ChannelMembersEntity } from './channel.members';

export const ALL_USERS_BY_ADD_CHANNEL = 'allUsersByAddChannel';

export interface UsersByAddChannelState extends EntityState<IUserChannel, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	cacheByChannels: Record<string, CacheMetadata>;
	userIdToChannelIds: Record<string, string[]>;
	listSearch: EntityState<SearchItemProps, string>;
}

export const UserChannelAdapter = createEntityAdapter({
	selectId: (userChannel: IUserChannel) => userChannel.channel_id || '0'
});

export const ItemSearchCtrlKAdapter = createEntityAdapter({
	selectId: (item: SearchItemProps) => item.id || '0'
});

export const initialUserChannelState: UsersByAddChannelState = UserChannelAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	cacheByChannels: {},
	userIdToChannelIds: {},
	listSearch: ItemSearchCtrlKAdapter.getInitialState({})
});

const cacheSearchKey = new Set<string>();

export const fetchUserChannelsCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	channelId: string,
	limit: number,
	noCache = false
) => {
	const currentState = getState();
	const userChannelsState = currentState[ALL_USERS_BY_ADD_CHANNEL];
	const apiKey = createApiKey('fetchUserChannels', channelId, limit, ensuredMezon.session?.token || '');
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
		(session) => ensuredMezon.client.listChannelUsersUC(session, channelId, limit),
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

export const fetchSearchCtrlK = createAsyncThunk(
	'allUsersByAddChannel/fetchSearchCtrlK',
	async ({ textSearch }: { textSearch: string }, thunkAPI) => {
		const typeSearch = textSearch.startsWith('@') ? 1 : textSearch.startsWith('#') ? 2 : 0;
		const textSearchValue = !typeSearch ? textSearch.trim() : textSearch.slice(1).trim();
		if (!textSearchValue.trim()) {
			return true;
		}
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (cacheSearchKey.has(textSearch)) {
				return true;
			}

			const response = await mezon.client.searchCtrlK(mezon.session, {
				text: textSearchValue,
				type: typeSearch
			});
			if (!typeSearch) {
				cacheSearchKey.add(`@${textSearch}`);
				cacheSearchKey.add(`#${textSearch}`);
			} else {
				cacheSearchKey.add(textSearch);
			}

			return response;
		} catch (error) {
			captureSentryError(error, 'allUsersByAddChannel/fetchSearchCtrlK');
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
		upsert: UserChannelAdapter.upsertOne,
		removeMany: UserChannelAdapter.removeMany,
		updateUserInfo: (state, action: PayloadAction<{ userId: string; displayName?: string; avatarUrl?: string }>) => {
			const { userId, displayName, avatarUrl } = action.payload;

			const channelIds = state.userIdToChannelIds[userId] || [];

			channelIds.forEach((channelId) => {
				const channel = state.entities[channelId];
				if (!channel?.user_ids) return;

				const userIndex = channel.user_ids.indexOf(userId);
				if (userIndex !== -1) {
					const changes: Partial<IUserChannel> = {};

					if (displayName !== undefined && channel.display_names) {
						const newDisplayNames = [...channel.display_names];
						newDisplayNames[userIndex] = displayName;
						changes.display_names = newDisplayNames;
					}
					if (avatarUrl !== undefined && channel.avatars) {
						const newAvatars = [...channel.avatars];
						newAvatars[userIndex] = avatarUrl;
						changes.avatars = newAvatars;
					}

					if (Object.keys(changes).length > 0) {
						UserChannelAdapter.updateOne(state, {
							id: channelId,
							changes
						});
					}
				}
			});
		},
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

			userAdds.forEach((userId) => {
				if (!state.userIdToChannelIds[userId]) {
					state.userIdToChannelIds[userId] = [];
				}
				if (!state.userIdToChannelIds[userId].includes(channelId)) {
					state.userIdToChannelIds[userId].push(channelId);
				}
			});
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

			userRemoves.forEach((userId) => {
				if (state.userIdToChannelIds[userId]) {
					state.userIdToChannelIds[userId] = state.userIdToChannelIds[userId].filter((id) => id !== channelId);
					if (state.userIdToChannelIds[userId].length === 0) {
						delete state.userIdToChannelIds[userId];
					}
				}
			});
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

						// Update reverse lookup map
						user_ids.user_ids?.forEach((userId) => {
							if (!state.userIdToChannelIds[userId]) {
								state.userIdToChannelIds[userId] = [];
							}
							if (!state.userIdToChannelIds[userId].includes(channelId)) {
								state.userIdToChannelIds[userId].push(channelId);
							}
						});
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
			})
			.addCase(fetchSearchCtrlK.fulfilled, (state: UsersByAddChannelState, action: PayloadAction<boolean | ApiSearchCtrlKResponse>) => {
				if (typeof action.payload === 'boolean') {
					return;
				}

				if (action.payload.channels && action.payload.channels?.length) {
					const channels: SearchItemProps[] = action.payload.channels.map((channel) => {
						return {
							count_messsage_unread: channel.count_mess_unread,
							channelId: channel.channel_id,
							id: channel.channel_id,
							channel_private: channel.channel_private || 0,
							name: channel?.channel_label ?? '',
							subText: channel.clan_name || '',
							icon: '#',
							clanId: channel?.clan_id ?? '',
							typeChat: TypeSearch.Channel_Type,
							prioritizeName: channel?.channel_label ?? '',
							age_restricted: channel.age_restricted,
							type: channel?.type,
							parent_id: channel?.parent_id
						};
					});
					state.listSearch = ItemSearchCtrlKAdapter.upsertMany(state.listSearch, channels);
				}

				if (action.payload.users && action.payload.users?.length) {
					const users: SearchItemProps[] = action.payload.users.map((users) => {
						return {
							channelId: users.id,
							idDM: users.id,
							id: users.id,
							name: users?.display_name || users?.username || '',
							subText: users?.username || '',
							icon: '@',
							typeChat: TypeSearch.Dm_Type,
							prioritizeName: users?.display_name || users?.username || '',
							searchName: `${users?.display_name}.${users?.username}`
						};
					});
					state.listSearch = ItemSearchCtrlKAdapter.upsertMany(state.listSearch, users);
				}
			});
	}
});

export const userChannelsActions = {
	...userChannelsSlice.actions,
	fetchUserChannels,
	fetchSearchCtrlK
};

export const userChannelsReducer = userChannelsSlice.reducer;

export const getUserChannelsState = (rootState: { [ALL_USERS_BY_ADD_CHANNEL]: UsersByAddChannelState }): UsersByAddChannelState =>
	rootState[ALL_USERS_BY_ADD_CHANNEL];
const { selectById } = UserChannelAdapter.getSelectors();

export const selectUserChannelIds = createSelector(
	[getUserChannelsState, (state, channelId: string) => channelId],
	(state, channelId) => selectById(state, channelId)?.user_ids || []
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
	entities?.user_ids?.forEach((id, index) => {
		listMember.push({
			id,
			user: {
				id,
				username: entities.usernames?.[index] || '',
				display_name: entities.display_names?.[index] || '',
				avatar_url: entities.avatars?.[index] || '',
				online: entities.onlines?.[index],
				create_time_seconds: entities?.create_time_seconds
			}
		});
	});
	return listMember;
});

const { selectEntities, selectAll } = ItemSearchCtrlKAdapter.getSelectors();
export const selectEntitiesCtrlK = createSelector(getUserChannelsState, (state) => selectEntities(state.listSearch));
export const selectAllCtrlK = createSelector(getUserChannelsState, (state) => selectAll(state.listSearch));
