import { captureSentryError } from '@mezon/logger';
import type { IChannelMember, LoadingStatus, RemoveChannelUsers } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ChannelPresenceEvent, StatusPresenceEvent } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import type { ChannelUserListChannelUser } from 'mezon-js/dist/api.gen';
import { accountActions, selectAllAccount } from '../account/account.slice';
import type { CacheMetadata } from '../cache-metadata';
import { clearApiCallTracker, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { selectAllUserClans, selectEntitesUserClans, usersClanActions } from '../clanMembers/clan.members';
import { selectClanView } from '../clans/clans.slice';
import type { DirectEntity } from '../direct/direct.slice';
import { selectDirectMessageEntities } from '../direct/direct.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, ensureSocket, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import { notificationSettingActions } from '../notificationSetting/notificationSettingChannel.slice';
import type { RootState } from '../store';
import { selectMemberByGroupId } from './AllUsersChannelByAddChannel.slice';
export const CHANNEL_MEMBERS_FEATURE_KEY = 'channelMembers';

/*
 * Update these interfaces according to your requirements.
 */

type IMemberAddedByUserId = {
	id?: string;
	addedBy?: string;
};

export interface ChannelMembersEntity extends IChannelMember {
	id: string; // Primary ID
	name?: string;
	type?: number;
}

export interface ChannelMemberAvatar {
	avatar: string;
	name: string;
}

export interface ChannelMembersState extends EntityState<ChannelMembersEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentChannelId?: string | null;
	followingUserIds?: string[];
	onlineStatusUser: Record<string, boolean>;
	customStatusUser: Record<string, string>;
	toFollowUserIds: string[];
	memberChannels: Record<
		string,
		EntityState<ChannelMembersEntity, string> & {
			id: string;
			cache?: CacheMetadata;
			memberAddedByUserId?: IMemberAddedByUserId[];
		}
	>;
	dmGroupUsers?: ChannelUserListChannelUser[];
}

export const mapUserIdToEntity = (userId: string, username: string, online: boolean) => {
	return { username, id: userId, online };
};

export interface ChannelMemberRootState {
	[CHANNEL_MEMBERS_FEATURE_KEY]: ChannelMembersState;
}

export const channelMembersAdapter = createEntityAdapter<ChannelMembersEntity>();

export const fetchChannelMembersCached = async (
	getState: () => RootState,
	ensuredMezon: MezonValueContext,
	clanId: string,
	channelId: string,
	channelType: ChannelType,
	noCache = false
) => {
	const currentState = getState();
	const channelMembersState = currentState[CHANNEL_MEMBERS_FEATURE_KEY];

	const apiKey = createApiKey('fetchChannelMembers', clanId, channelId, channelType, ensuredMezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, channelMembersState?.memberChannels?.[channelId]?.cache, noCache);

	if (!shouldForceCall) {
		const cachedChannelData = channelMembersState.memberChannels[channelId];
		return {
			channel_users: cachedChannelData.ids?.map((item) => ({ user_id: item })) || [],
			time: Date.now(),
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListChannelUsers',
			list_channel_users_req: {
				channel_id: channelId,
				limit: 2000,
				clan_id: clanId,
				channel_type: channelType,
				state: 1
			}
		},
		() => ensuredMezon.client.listChannelUsers(ensuredMezon.session, clanId, channelId, channelType, 1, 2000, ''),
		'channel_user_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		time: Date.now(),
		fromCache: false
	};
};

type fetchChannelMembersPayload = {
	clanId: string;
	channelId: string;
	noCache?: boolean;
	channelType: ChannelType;
	repace?: boolean;
};

export const fetchChannelMembers = createAsyncThunk(
	'channelMembers/fetchChannelMembers',
	async ({ clanId, channelId, noCache, channelType, repace = false }: fetchChannelMembersPayload, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			if (noCache) {
				const apiKey = createApiKey('fetchChannelMembers', clanId, channelId, channelType, mezon.session.username || '');
				clearApiCallTracker(apiKey);
				thunkAPI.dispatch(channelMembersActions.invalidateChannelCache(channelId));
			}

			const state = thunkAPI.getState() as RootState;
			const currentChannel = state?.channels?.byClans?.[clanId as string]?.entities?.entities[channelId] || {};

			if (currentChannel?.parent_id && currentChannel.parent_id !== '0' && !state?.channelMembers?.entities?.[currentChannel.parent_id]) {
				const response = await fetchChannelMembersCached(
					thunkAPI.getState as () => RootState,
					mezon,
					clanId,
					currentChannel.parent_id,
					channelType
				);

				if (!response.fromCache && !response.fromCache) {
					thunkAPI.dispatch(
						channelMembersActions.setMemberChannels({ channelId: currentChannel.parent_id, members: response.channel_users ?? [] })
					);
				}
			}

			const response = await fetchChannelMembersCached(thunkAPI.getState as () => RootState, mezon, clanId, channelId, channelType, noCache);

			if (response.fromCache && response.channel_users) {
				return { channel_users: response.channel_users || [], fromCache: true, channelId };
			}

			if (!response.channel_users) {
				return { channel_users: [], fromCache: false, channelId };
			}

			if (repace) {
				thunkAPI.dispatch(channelMembersActions.removeUserByChannel(channelId));
			}

			thunkAPI.dispatch(channelMembersActions.setMemberChannels({ channelId, members: response.channel_users }));
			return { channel_users: response.channel_users, fromCache: false, channelId };
		} catch (error) {
			captureSentryError(error, 'channelMembers/fetchChannelMembers');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const fetchChannelMembersPresence = createAsyncThunk(
	'channelMembers/fetchChannelMembersPresence',
	async (channelPresence: ChannelPresenceEvent, thunkAPI) => {
		try {
			if (channelPresence.joins.length > 0) {
				const joinUser = channelPresence.joins[0];
				const userId = joinUser.user_id;
				const isMobile = joinUser.is_mobile;
				const channelId = channelPresence.channel_id;
				const state = thunkAPI.getState() as ChannelMemberRootState;
				const existingMember = state[CHANNEL_MEMBERS_FEATURE_KEY].memberChannels[channelId]?.ids?.findIndex((item) => item === userId);
				if (!existingMember) {
					thunkAPI.dispatch(channelMembersActions.addNewMember({ channel_id: channelPresence.channel_id, user_ids: [userId] }));
					thunkAPI.dispatch(channelMembersActions.setStatusUser({ userId, online: true, isMobile }));
				}
			}
		} catch (error) {
			captureSentryError(error, 'channelMembers/fetchChannelMembersPresence');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const updateStatusUser = createAsyncThunk('channelMembers/fetchUserStatus', async (statusPresence: StatusPresenceEvent, thunkAPI) => {
	if (statusPresence?.leaves?.length) {
		for (const leave of statusPresence.leaves) {
			const userId = leave.user_id;
			const isMobile = leave.is_mobile;
			thunkAPI.dispatch(channelMembersActions.setStatusUser({ userId, online: false, isMobile }));
		}
	}
	if (statusPresence?.joins?.length) {
		for (const join of statusPresence.joins) {
			const userId = join.user_id;
			const isMobile = join.is_mobile;
			thunkAPI.dispatch(channelMembersActions.setStatusUser({ userId, online: true, isMobile }));
		}
	}
});

export const removeMemberChannel = createAsyncThunk(
	'channelMembers/removeChannelUser',
	async ({ channelId, userIds, kickMember = true }: RemoveChannelUsers & { kickMember?: boolean }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const response = await mezon.client.removeChannelUsers(mezon.session, channelId, userIds);
			if (!response) {
				return;
			}
			if (kickMember) {
				await thunkAPI.dispatch(fetchChannelMembers({ clanId: '', channelId, noCache: true, channelType: ChannelType.CHANNEL_TYPE_CHANNEL }));
				return;
			} else {
				thunkAPI.dispatch(notificationSettingActions.removeNotiSetting(channelId));
			}

			return true;
		} catch (error) {
			captureSentryError(error, 'channelMembers/removeChannelUser');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type UpdateCustomStatus = {
	clanId: string;
	customStatus: string;
	minutes: number;
	noClear: boolean;
};

export const updateCustomStatus = createAsyncThunk(
	'channelMembers/updateCustomStatusUser',
	async ({ clanId, customStatus, minutes, noClear }: UpdateCustomStatus, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			if (minutes === 0) {
				const now = new Date();
				const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
				const timeDifference = endOfDay.getTime() - now.getTime();
				minutes = Math.floor(timeDifference / (1000 * 60));
			}
			const response = await mezon.socketRef.current?.writeCustomStatus(clanId, customStatus, minutes, noClear);

			const state = thunkAPI.getState() as RootState;
			const userId = state.account?.userProfile?.user?.id;

			thunkAPI.dispatch(accountActions.setCustomStatus(customStatus));
			thunkAPI.dispatch(accountActions.getUserProfile({ noCache: true }));

			if (userId) {
				thunkAPI.dispatch(
					usersClanActions.updateUserStatus({
						userId,
						user_status: customStatus
					})
				);
			}

			if (response) {
				return response;
			}
		} catch (error) {
			captureSentryError(error, 'channelMembers/updateCustomStatusUser');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialChannelMembersState: ChannelMembersState = channelMembersAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	onlineStatusUser: {},
	toFollowUserIds: [],
	customStatusUser: {},
	memberChannels: {},
	userRemoved: {},
	userRemovedClan: {}
});

export type StatusUserArgs = {
	userId: string;
	online: boolean;
	isMobile: boolean;
};

export type CustomStatusUserArgs = {
	userId: string;
	customStatus: string;
};

export const channelMembers = createSlice({
	name: CHANNEL_MEMBERS_FEATURE_KEY,
	initialState: initialChannelMembersState,
	reducers: {
		remove: (state, action: PayloadAction<{ channelId: string; userId: string }>) => {
			const { channelId, userId } = action.payload;
			const channelEntity = state.memberChannels[channelId];

			if (channelEntity) {
				const memberIds = (channelEntity.ids || []).filter((id) => id !== userId);
				state.memberChannels[channelId].ids = memberIds;
			}
		},
		removeUserByChannel: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			const channelEntity = state.memberChannels[channelId];
			channelEntity && (channelEntity.ids = []);
		},
		setFollowingUserIds: (state: ChannelMembersState, action: PayloadAction<string[]>) => {
			state.followingUserIds = action.payload;
		},
		setStatusUser: (state, action: PayloadAction<StatusUserArgs>) => {
			state.onlineStatusUser[action.payload.userId] = action.payload.online;
		},
		setMemberChannels: (state, action: PayloadAction<{ channelId: string; members: ChannelUserListChannelUser[] }>) => {
			const { channelId, members } = action.payload;
			if (!state.memberChannels[channelId]) {
				state.memberChannels[channelId] = {
					...channelMembersAdapter.getInitialState(),
					id: channelId
				};
			}
			const memberIds = members.map((member) => member.user_id as string);
			const memberAddedByUserId: IMemberAddedByUserId[] = members.map((member) => {
				return {
					id: member?.user_id as string,
					addedBy: member?.added_by as string
				} as IMemberAddedByUserId;
			});
			state.memberChannels[channelId] = {
				...state.memberChannels[channelId],
				ids: [...new Set(memberIds)],
				memberAddedByUserId
			};
		},
		addNewMember: (state, action: PayloadAction<{ channel_id: string; user_ids: string[]; addedByUserId?: string }>) => {
			const payload = action.payload;
			const userIds = payload.user_ids;
			const channelId = payload.channel_id;
			const addedByUserId = payload?.addedByUserId;

			if (!state?.memberChannels?.[channelId]) {
				state.memberChannels[channelId] = {
					...channelMembersAdapter.getInitialState(),
					id: channelId,
					memberAddedByUserId: state.memberChannels[channelId]?.memberAddedByUserId || []
				};
			}
			userIds.forEach((userId) => {
				if (!state.memberChannels[channelId]?.ids.includes(userId) && userId !== process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
					state.memberChannels[channelId].ids.push(userId);
					if (addedByUserId && state?.memberChannels?.[channelId]?.memberAddedByUserId) {
						const isExist = state.memberChannels[channelId].memberAddedByUserId?.some((i) => i.id === userId);
						if (!isExist) {
							state.memberChannels[channelId].memberAddedByUserId?.push({
								id: userId,
								addedBy: addedByUserId
							});
						}
					}
				}
			});
		},
		removeUserByUserIdAndClan: (state, action: PayloadAction<{ userId: string; channelIds: string[]; clanId: string }>) => {
			const { userId, channelIds } = action.payload;

			channelIds.forEach((channelId) => {
				const channelEntity = state.memberChannels[channelId];
				if (channelEntity) {
					state.memberChannels[channelId].ids = channelEntity.ids.filter((id) => id !== userId);
				}
			});
		},
		invalidateChannelCache: (state, action: PayloadAction<string>) => {
			const channelId = action.payload;
			if (state.memberChannels[channelId]?.cache) {
				delete state.memberChannels[channelId].cache;
			}
		},
		setCustomStatusUser: (state, action: PayloadAction<{ userId: string; status: string }>) => {
			const { userId, status } = action.payload;
			state.customStatusUser[userId] = status;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelMembers.pending, (state: ChannelMembersState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(
				fetchChannelMembers.fulfilled,
				(
					state: ChannelMembersState,
					action: PayloadAction<{ channel_users: ChannelUserListChannelUser[]; fromCache: boolean; channelId: string }>
				) => {
					const { channel_users, fromCache, channelId } = action.payload;

					if (channel_users !== null) {
						state.loadingStatus = 'loaded';

						if (!fromCache && state.memberChannels[channelId]) {
							state.memberChannels[channelId].cache = createCacheMetadata();
						}
					} else {
						state.loadingStatus = 'not loaded';
					}
				}
			)
			.addCase(fetchChannelMembers.rejected, (state: ChannelMembersState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(updateCustomStatus.fulfilled, (state: ChannelMembersState, action) => {
				if (action.payload) {
					state.customStatusUser[action.payload?.user_id] = action.payload.status;
				}
			});
	}
});

export const channelMembersReducer = channelMembers.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(channelMembersActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const channelMembersActions = {
	...channelMembers.actions,
	fetchChannelMembers,
	fetchChannelMembersPresence,
	updateStatusUser,
	removeMemberChannel,
	updateCustomStatus
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(fetchChannelMembers);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */

export const getChannelMembersState = (rootState: { [CHANNEL_MEMBERS_FEATURE_KEY]: ChannelMembersState }): ChannelMembersState => {
	return rootState[CHANNEL_MEMBERS_FEATURE_KEY];
};

export const selectMemberStatus = createSelector(getChannelMembersState, (state) => state.onlineStatusUser);
export const selectMemberCustomStatus = createSelector(getChannelMembersState, (state) => state.customStatusUser);

export const selectMemberIdsByChannelId = createSelector(
	[getChannelMembersState, (state, channelId: string) => channelId],
	(getChannelMembersState, channelId) => {
		return getChannelMembersState?.memberChannels?.[channelId]?.ids;
	}
);

export const selectMemberCustomStatusByUserId = createSelector(
	[
		selectEntitesUserClans,
		selectMemberCustomStatus,
		(state: RootState, userId: string) => {
			return userId;
		}
	],
	(usersClanEntities, usersStatus, userId) => {
		const userClan = usersClanEntities[userId];
		return usersStatus?.[userId] || userClan?.user?.user_status || '';
	}
);

export const selectGroupMembersEntities = createSelector([selectMemberByGroupId], (groupMembers): Record<string, ChannelMembersEntity> => {
	if (!groupMembers) return {};

	const groupMembersEntities = groupMembers.reduce<Record<string, ChannelMembersEntity>>((acc, member) => {
		acc[member.id as string] = member;
		return acc;
	}, {});
	return groupMembersEntities;
});

export const selectMemberGroupByUserId = createSelector(
	[(state: any, channelId: string) => selectMemberByGroupId(state, channelId), (_: any, __: string, userId: string) => userId],
	(users, userId): ChannelMembersEntity | undefined => {
		if (!users || !userId) return undefined;

		const index = users.findIndex((user) => user.id === userId);
		if (index === -1) return undefined;

		return users[index] as ChannelMembersEntity;
	}
);

export const selectMemberStatusById = createSelector(
	[
		selectEntitesUserClans,
		selectDirectMessageEntities,
		selectClanView,
		(state, userId: string) => {
			return `${userId},${state?.direct.currentDirectMessageId}`;
		}
	],
	(usersClanEntities, directs, isClanView, payload) => {
		const [userId, currentDirectMessageId] = payload.split(',');
		const userClan = usersClanEntities[userId];
		const userGroup = directs?.[currentDirectMessageId];
		if (userClan && isClanView) {
			return { status: userClan.user?.online, isMobile: userClan.user?.is_mobile };
		}
		const index = userGroup?.user_ids?.findIndex((item) => item === userId) ?? -1;
		if (index === -1) {
			return { status: false, isMobile: false };
		}
		return { status: userGroup?.onlines?.[index] || false, isMobile: false };
	}
);

export const selectAllChannelMembers = createSelector(
	[
		selectMemberIdsByChannelId,
		selectAllUserClans,
		selectEntitesUserClans,
		selectMemberByGroupId,
		(state: RootState, channelId: string) => {
			const currentClanId = state.clans?.currentClanId;
			const channel = state?.channels?.byClans?.[currentClanId as string]?.entities?.entities?.[channelId];
			const isPrivate = channel?.channel_private;
			const parentId = channel?.parent_id;
			const isDm = state.direct?.currentDirectMessageId === channelId || '';
			return `${channelId},${isPrivate},${isDm},${parentId}`;
		}
	],
	(channelMembers, allUserClans, usersClanEntities, directs, payload) => {
		const [channelId, isPrivate, isDm, parentId] = payload.split(',');

		const membersOfChannel: ChannelMembersEntity[] = [];
		if (isDm) return directs || [];

		if (!allUserClans?.length) return membersOfChannel;

		const ids = isPrivate === '1' || (parentId !== '0' && parentId !== '') ? channelMembers : allUserClans.map((u: any) => u.id);

		if (!ids?.length) return membersOfChannel;

		const result: ChannelMembersEntity[] = [];

		ids.map((id: string) => {
			if (usersClanEntities[id]) {
				result.push({
					...usersClanEntities[id],
					channelId,
					userChannelId: channelId
				});
			}
		});
		return result;
	}
);
export const selectAllChannelMembersClan = createSelector(
	[
		selectMemberIdsByChannelId,
		selectAllUserClans,
		selectEntitesUserClans,
		(state: RootState, channelId: string) => {
			const currentClanId = state.clans?.currentClanId;
			const channel = state?.channels?.byClans?.[currentClanId as string]?.entities?.entities?.[channelId];
			const isPrivate = channel?.channel_private;
			const parentId = channel?.parent_id;
			const creatorId = channel?.creator_id;
			return `${channelId},${isPrivate},${parentId},${creatorId || ''}`;
		}
	],
	(channelMembers, allUserClans, usersClanEntities, payload) => {
		const [channelId, isPrivate, parentId, creatorId] = payload.split(',');
		const membersOfChannel: ChannelMembersEntity[] = [];

		if (!allUserClans?.length) return membersOfChannel;

		const ids = isPrivate === '1' || (parentId !== '0' && parentId !== '') ? channelMembers : allUserClans.map((u: any) => u.id);

		if (!ids?.length) return membersOfChannel;

		return ids.map((id: string) => ({
			...usersClanEntities[id],
			channelId,
			userChannelId: channelId
		}));
	}
);

export const selectMemberByUsername = createSelector(
	[
		selectMemberIdsByChannelId,
		selectAllUserClans,
		selectEntitesUserClans,
		(state: RootState, channelId: string, username: string) => {
			const currentClanId = state.clans?.currentClanId;
			const channel = state.channels?.byClans[currentClanId as string]?.entities?.entities?.[channelId];
			const isPrivate = channel?.channel_private;
			const parentId = channel?.parent_id;
			return `${channelId},${isPrivate},${parentId},${username}`;
		}
	],
	(channelMembers, allUserClans, usersClanEntities, payload) => {
		const [channelId, isPrivate, parentId, username] = payload.split(',');
		if (!allUserClans?.length) return null;
		const ids = isPrivate === '1' || (parentId !== '0' && parentId !== '') ? channelMembers : allUserClans.map((u: any) => u.id);
		if (!ids?.length) return null;
		for (const id of ids) {
			const member = {
				...usersClanEntities[id],
				channelId,
				userChannelId: channelId
			};
			if (member.user?.username === username) {
				return member;
			}
		}

		return null;
	}
);

export const selectAllChannelMemberIds = createSelector(
	[
		getChannelMembersState,
		selectAllUserClans,
		selectMemberByGroupId,
		(state: RootState, channelId: string, isDm?: boolean) => {
			const currentClanId = state.clans?.currentClanId;
			const channel = state.channels?.byClans[currentClanId as string]?.entities?.entities?.[channelId];
			const isPrivate = channel?.channel_private;
			const parentId = channel?.parent_id;
			return `${channelId},${isPrivate},${isDm ? 1 : ''},${parentId}`;
		}
	],
	(channelMembersState, allUserClans, directs, payload) => {
		const [channelId, isPrivate, isDm, parentId] = payload.split(',');
		if (isDm) return directs;
		const memberIds =
			isPrivate === '1' || (parentId !== '0' && parentId !== '')
				? channelMembersState.memberChannels[channelId]?.ids || []
				: allUserClans.map((u: any) => u.id);
		return memberIds;
	}
);

export const selectChannelMemberByUserIds = createSelector(
	[
		selectEntitesUserClans,
		selectDirectMessageEntities,
		selectAllAccount,
		selectGroupMembersEntities,
		(state, channelId: string, userIds?: string, isDm?: string) => {
			return `${channelId},${userIds},${isDm}`;
		}
	],
	(usersClanEntities, directs, currentUser, dmMembers, payload) => {
		const [channelId, userIds, isDm] = payload.split(',');

		const users = isDm ? directs : usersClanEntities;
		if (!userIds.trim() || !users) return [];
		const members: ChannelMembersEntity[] = [];
		userIds.split('/')?.forEach((userId) => {
			const userInfo = users[isDm ? channelId : userId];
			if (!userInfo) return;
			if (isDm) {
				if (currentUser?.user?.id === userId) {
					members.push({
						...currentUser,
						channelId,
						userChannelId: channelId,
						id: currentUser?.user?.id as string
					} as ChannelMembersEntity);
					return;
				}
				const { channel_label, user_ids, onlines, usernames, display_names } = userInfo as DirectEntity;
				const currentUserIndex = Array.isArray(user_ids) ? user_ids.findIndex((id) => id === userId) : -1;
				if (currentUserIndex === -1) return;
				members.push({
					channelId,
					userChannelId: channelId,
					user: {
						online: onlines?.[currentUserIndex],
						...dmMembers?.[userId]?.user,
						display_name: display_names?.[currentUserIndex],
						username: usernames?.[currentUserIndex]
					},
					id: userId
				} as ChannelMembersEntity);
			} else {
				members.push({
					channelId,
					userChannelId: channelId,
					...userInfo,
					id: userInfo?.id
				} as ChannelMembersEntity);
			}
		});
		return members as ChannelMembersEntity[];
	}
);

export const selectAllMembersInClan = createSelector([selectAllUserClans], (allUserClans) => {
	return allUserClans;
});

export const selectUserAddedByUserId = createSelector(
	[getChannelMembersState, selectAllChannelMembers, (state: RootState, channelId: string, userId: string) => ({ channelId, userId })],
	(channelMembersState, channelMembers, { channelId, userId }) => {
		const memberChannelsData = channelMembersState.memberChannels[channelId];
		const addedByInfo = memberChannelsData?.memberAddedByUserId?.find((item) => item.id === userId);

		if (!addedByInfo?.addedBy) {
			return null;
		}

		const channelMembersMap = channelMembers.reduce(
			(acc, member) => {
				acc[member.id] = member;
				return acc;
			},
			{} as Record<string, (typeof channelMembers)[0]>
		);

		const addedByUser = channelMembersMap[addedByInfo.addedBy];

		if (!addedByUser) {
			return null;
		}

		return {
			id: addedByInfo.addedBy,
			username: addedByUser.user?.username,
			display_name: addedByUser.user?.display_name
		};
	}
);
