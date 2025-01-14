import { captureSentryError } from '@mezon/logger';
import { IChannelMember, LoadingStatus, RemoveChannelUsers } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ChannelPresenceEvent, ChannelType, StatusPresenceEvent, safeJSONParse } from 'mezon-js';
import { ChannelUserListChannelUser } from 'mezon-js/dist/api.gen';
import { accountActions, selectAllAccount } from '../account/account.slice';
import { ChannelsEntity } from '../channels/channels.slice';
import { USERS_CLANS_FEATURE_KEY, UsersClanState, selectEntitesUserClans } from '../clanMembers/clan.members';
import { DirectEntity, selectDirectById, selectDirectMessageEntities } from '../direct/direct.slice';
import { MezonValueContext, ensureSession, ensureSocket, getMezonCtx } from '../helpers';
import { memoizeAndTrack } from '../memoize';
import { RootState } from '../store';

const CHANNEL_MEMBERS_CACHED_TIME = 1000 * 60 * 60;
export const CHANNEL_MEMBERS_FEATURE_KEY = 'channelMembers';

/*
 * Update these interfaces according to your requirements.
 */
export interface ChannelMembersEntity extends IChannelMember {
	id: string; // Primary ID
	name?: string;
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
		}
	>;
	dmGroupUsers?: ChannelUserListChannelUser[];
}

export const mapUserIdToEntity = (userId: string, username: string, online: boolean) => {
	return { username: username, id: userId, online };
};

export interface ChannelMemberRootState {
	[CHANNEL_MEMBERS_FEATURE_KEY]: ChannelMembersState;
}

export const channelMembersAdapter = createEntityAdapter<ChannelMembersEntity>();

const fetchChannelMembersCached = memoizeAndTrack(
	async (mezon: MezonValueContext, clanId: string, channelId: string, channelType: ChannelType) => {
		const response = await mezon.client.listChannelUsers(mezon.session, clanId, channelId, channelType, 1, 2000, '');
		return { ...response, time: Date.now() };
	},
	{
		promise: true,
		maxAge: CHANNEL_MEMBERS_CACHED_TIME,
		normalizer: (args) => {
			return args[1] + args[2] + args[3] + args[0].session.username;
		}
	}
);

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
				fetchChannelMembersCached.delete(mezon, clanId, channelId, channelType);
			}

			const state = thunkAPI.getState() as RootState;
			const currentChannel = state?.channels?.byClans?.[clanId as string]?.entities?.entities[channelId] || {};
			const parentChannel = state?.channels?.byClans?.[clanId as string]?.entities?.entities[currentChannel.parrent_id || ''] as ChannelsEntity;

			if (parentChannel?.channel_private && !state?.channelMembers?.entities?.[parentChannel.id]) {
				const response = await fetchChannelMembersCached(mezon, clanId, parentChannel.id, channelType);

				if (!(Date.now() - response.time > 100)) {
					thunkAPI.dispatch(
						channelMembersActions.setMemberChannels({ channelId: parentChannel.id, members: response.channel_users ?? [] })
					);
				}
			}

			const response = await fetchChannelMembersCached(mezon, clanId, channelId, channelType);

			if (Date.now() - response.time > 100) {
				return [];
			}

			if (!response.channel_users) {
				return [];
			}
			if (repace) {
				thunkAPI.dispatch(channelMembersActions.removeUserByChannel(channelId));
			}

			thunkAPI.dispatch(channelMembersActions.setMemberChannels({ channelId: channelId, members: response.channel_users }));
			return response.channel_users;
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
					thunkAPI.dispatch(channelMembersActions.setStatusUser({ userId, online: true, isMobile: isMobile }));
					thunkAPI.dispatch(channelMembersActions.setCustomStatusUser({ userId, customStatus: joinUser.status ?? '' }));
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
			thunkAPI.dispatch(channelMembersActions.setStatusUser({ userId, online: false, isMobile: isMobile }));
			thunkAPI.dispatch(channelMembersActions.setCustomStatusUser({ userId, customStatus: leave.status }));
		}
	}
	if (statusPresence?.joins?.length) {
		for (const join of statusPresence.joins) {
			const userId = join.user_id;
			const isMobile = join.is_mobile;
			thunkAPI.dispatch(channelMembersActions.setStatusUser({ userId, online: true, isMobile: isMobile }));
			thunkAPI.dispatch(channelMembersActions.setCustomStatusUser({ userId, customStatus: join.status }));
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
				await thunkAPI.dispatch(
					fetchChannelMembers({ clanId: '', channelId: channelId, noCache: true, channelType: ChannelType.CHANNEL_TYPE_TEXT })
				);
				return;
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
};

export const updateCustomStatus = createAsyncThunk(
	'channelMembers/updateCustomStatusUser',
	async ({ clanId, customStatus }: UpdateCustomStatus, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const response = await mezon.socketRef.current?.writeCustomStatus(clanId, customStatus);
			thunkAPI.dispatch(accountActions.setCustomStatus(customStatus));
			thunkAPI.dispatch(accountActions.getUserProfile({ noCache: true }));
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
		setManyCustomStatusUser: (state, action: PayloadAction<CustomStatusUserArgs[]>) => {
			for (const i of action.payload) {
				state.customStatusUser[i.userId] = i.customStatus;
			}
		},
		setFollowingUserIds: (state: ChannelMembersState, action: PayloadAction<string[]>) => {
			state.followingUserIds = action.payload;
		},
		setStatusUser: (state, action: PayloadAction<StatusUserArgs>) => {
			state.onlineStatusUser[action.payload.userId] = action.payload.online;
		},

		setCustomStatusUser: (state, action: PayloadAction<CustomStatusUserArgs>) => {
			state.customStatusUser[action.payload.userId] = action.payload.customStatus;
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
			state.memberChannels[channelId] = {
				...state.memberChannels[channelId],
				ids: [...new Set(memberIds)]
			};
		},
		addNewMember: (state, action: PayloadAction<{ channel_id: string; user_ids: string[] }>) => {
			const payload = action.payload;
			const userIds = payload.user_ids;
			const channelId = payload.channel_id;

			if (!state.memberChannels[channelId]) {
				state.memberChannels[channelId] = {
					...channelMembersAdapter.getInitialState(),
					id: channelId
				};
			}
			userIds.forEach((userId) => {
				if (!state.memberChannels[channelId]?.ids.includes(userId)) {
					state.memberChannels[channelId].ids.push(userId);
				}
			});
		},
		removeUserByUserIdAndClan: (state, action: PayloadAction<{ userId: string; channelIds: string[]; clanId: string }>) => {
			const { userId, channelIds } = action.payload;

			channelIds.forEach((channelId) => {
				const channelEntity = state.memberChannels[channelId];
				if (channelEntity) {
					channelEntity.ids = channelEntity.ids.filter((id) => id !== userId);
				}
			});
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchChannelMembers.pending, (state: ChannelMembersState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchChannelMembers.fulfilled, (state: ChannelMembersState, action: PayloadAction<ChannelUserListChannelUser[] | null>) => {
				if (action.payload !== null) {
					state.loadingStatus = 'loaded';
				} else {
					state.loadingStatus = 'not loaded';
				}
			})
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

const getUsersClanState = (rootState: { [USERS_CLANS_FEATURE_KEY]: UsersClanState }): UsersClanState => rootState[USERS_CLANS_FEATURE_KEY];

export const selectMemberStatus = createSelector(getChannelMembersState, (state) => state.onlineStatusUser);

export const selectCustomUserStatus = createSelector(getChannelMembersState, (state) => state.customStatusUser);

export const selectMemberIdsByChannelId = createSelector(
	[getChannelMembersState, (state, channelId: string) => channelId],
	(getChannelMembersState, channelId) => {
		return getChannelMembersState?.memberChannels?.[channelId]?.ids;
	}
);

export const selectMemberCustomStatusById = createSelector(
	[
		getUsersClanState,
		selectDirectMessageEntities,
		selectAllAccount,
		selectCustomUserStatus,
		(state: RootState, userId: string, isDM?: boolean) => {
			//DO NOT EDIT UNLESS YOU KNOW WHAT ARE YOU DOING: thanh.levan
			return `${userId},${state?.direct.currentDirectMessageId},${isDM}`;
		}
	],
	(usersClanState, directs, currentUserProfile, statusList, payload) => {
		const [userId, currentDirectMessageId, isDM] = payload.split(',');
		const myId = currentUserProfile?.user?.id;
		const userClan = usersClanState.entities[userId];
		const userGroup = directs?.[currentDirectMessageId];

		if (userId === myId) {
			return statusList?.[userId] || false;
		}
		if (userClan && (isDM === 'false' || 'undefined')) {
			return (userClan?.user?.metadata as any)?.status || '';
		}
		const index = userGroup?.user_id?.findIndex((item) => item === userId) ?? -1;
		if (index === -1) {
			return false;
		}
		try {
			return JSON.parse(userGroup?.metadata?.[index] || '{}')?.status || '';
		} catch (e) {
			const unescapedJSON = userGroup?.metadata?.[index].replace(/\\./g, (match) => {
				switch (match) {
					case '\\"':
						return '"';
					// Add more escape sequences as needed
					default:
						return match[1]; // Remove the backslash
				}
			});
			return safeJSONParse(unescapedJSON || '{}')?.status;
		}
	}
);

export const selectGrouplMembers = createSelector(
	[selectDirectById, selectAllAccount, (state, groupId: string) => groupId],
	(group, currentUser, groupId) => {
		if (!group?.user_id) {
			return [];
		}
		const groupDisplayNames = group.usernames?.split(',');
		const users = group?.user_id?.map((userId, index) => {
			return {
				channelId: groupId,
				userChannelId: groupId,
				user: {
					...group,
					id: userId,
					user_id: [userId],
					avatar_url: group.channel_avatar?.[index],
					username: groupDisplayNames?.[index],
					display_name: groupDisplayNames?.[index],
					online: group.is_online?.[index]
				},
				id: userId
			};
		}) as ChannelMembersEntity[];

		// push current user login to list users
		currentUser?.user &&
			users.push({
				...currentUser,
				channelId: groupId,
				userChannelId: groupId,
				id: currentUser?.user?.id as string
			} as ChannelMembersEntity);
		return users;
	}
);

export const selectGroupMembersEntities = createSelector([selectGrouplMembers], (groupMembers): Record<string, ChannelMembersEntity> => {
	const groupMembersEntities = groupMembers.reduce<Record<string, ChannelMembersEntity>>((acc, member) => {
		acc[member.id as string] = member;
		return acc;
	}, {});
	return groupMembersEntities;
});

export const selectMembeGroupByUserId = createSelector([selectGrouplMembers, (state, groupId: string, userId: string) => userId], (users, userId) => {
	return users?.find((item) => item.id === userId);
});

export const selectMemberStatusById = createSelector(
	[
		getUsersClanState,
		selectDirectMessageEntities,
		(state, userId: string) => {
			return `${userId},${state?.direct.currentDirectMessageId}`;
		}
	],
	(usersClanState, directs, payload) => {
		const [userId, currentDirectMessageId] = payload.split(',');
		const userClan = usersClanState.entities[userId];
		const userGroup = directs?.[currentDirectMessageId];
		if (userClan) {
			return { status: userClan.user?.online, isMobile: userClan.user?.is_mobile };
		}
		const index = userGroup?.user_id?.findIndex((item) => item === userId) ?? -1;
		if (index === -1) {
			return { status: false, isMobile: false };
		}
		return { status: userGroup?.is_online?.[index] || false, isMobile: false };
	}
);

export const selectAllChannelMembers = createSelector(
	[
		selectMemberIdsByChannelId,
		getUsersClanState,
		selectGrouplMembers,
		(state: RootState, channelId: string) => {
			const currentClanId = state.clans?.currentClanId;
			const channel = state.channels?.byClans[currentClanId as string]?.entities?.entities?.[channelId];
			const isPrivate = channel?.channel_private;
			const parentId = channel?.parrent_id;
			const isDm = state.direct?.currentDirectMessageId === channelId || '';
			return `${channelId},${isPrivate},${isDm},${parentId}`;
		}
	],
	(channelMembers, usersClanState, directs, payload) => {
		const [channelId, isPrivate, isDm, parentId] = payload.split(',');

		let membersOfChannel: ChannelMembersEntity[] = [];
		if (isDm) return directs || [];

		if (!usersClanState?.ids?.length) return membersOfChannel;

		const members = isPrivate === '1' || (parentId !== '0' && parentId !== '') ? { ids: channelMembers } : usersClanState;

		if (!members?.ids) return membersOfChannel;
		const ids = members.ids || [];

		membersOfChannel = ids.map((id) => ({
			...usersClanState.entities[id],
			channelId,
			userChannelId: channelId
		}));

		return membersOfChannel;
	}
);

export const selectAllChannelMemberIds = createSelector(
	[
		getChannelMembersState,
		getUsersClanState,
		selectGrouplMembers,
		(state: RootState, channelId: string, isDm?: boolean) => {
			const currentClanId = state.clans?.currentClanId;
			const channel = state.channels?.byClans[currentClanId as string]?.entities?.entities?.[channelId];
			const isPrivate = channel?.channel_private;
			const parentId = channel?.parrent_id;
			return `${channelId},${isPrivate},${isDm ? 1 : ''},${parentId}`;
		}
	],
	(channelMembersState, usersClanState, directs, payload) => {
		const [channelId, isPrivate, isDm, parentId] = payload.split(',');
		if (isDm) return directs;
		const memberIds =
			isPrivate === '1' || (parentId !== '0' && parentId !== '')
				? channelMembersState.memberChannels[channelId]?.ids || []
				: usersClanState.ids;
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
	(usersClanState, directs, currentUser, dmMembers, payload) => {
		const [channelId, userIds, isDm] = payload.split(',');

		const users = isDm ? directs : usersClanState;
		if (!userIds.trim() || !users) return [];
		const members: ChannelMembersEntity[] = [];
		userIds.split('/')?.forEach((userId) => {
			const userInfo = users[isDm ? channelId : userId];
			if (!userInfo) return;
			if (isDm) {
				if (currentUser?.user?.id === userId) {
					members.push({
						...currentUser,
						channelId: channelId,
						userChannelId: channelId,
						id: currentUser?.user?.id as string
					} as ChannelMembersEntity);
					return;
				}
				const { usernames, channel_label, user_id, is_online, channel_avatar } = userInfo as DirectEntity;
				const currentUserIndex = Array.isArray(user_id) ? user_id.findIndex((id) => id === userId) : -1;
				if (currentUserIndex === -1) return;
				members.push({
					channelId,
					userChannelId: channelId,
					user: {
						online: is_online?.[currentUserIndex],
						...dmMembers?.[userId]?.user
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
