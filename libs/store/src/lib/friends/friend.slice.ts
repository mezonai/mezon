import i18n from '@mezon/translations';
import { EUserStatus, type IUserProfileActivity, type LoadingStatus } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { AddFriend } from 'mezon-js';
import type { ApiFriend } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { selectAllAccount, selectCurrentUserId } from '../account/account.slice';
import type { CacheMetadata } from '../cache-metadata';
import { createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { StatusUserArgs } from '../channelmembers/channel.members';
import { statusActions } from '../direct/status.slice';
import type { MezonValueContext } from '../helpers';
import { ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
import type { RootState } from '../store';
export const FRIEND_FEATURE_KEY = 'friends';
const LIMIT_FRIEND = 1000;

interface FriendState {
	[FRIEND_FEATURE_KEY]: FriendsState;
}

export interface FriendsEntity extends ApiFriend {
	id: string;
}

interface IStatusSentMobile {
	isSuccess: boolean;
}

export enum EStateFriend {
	FRIEND = 0,
	OTHER_PENDING = 1,
	MY_PENDING = 2,
	BLOCK = 3
}

export const mapFriendToEntity = (FriendRes: ApiFriend, myId: string) => {
	return {
		...FriendRes,
		id: myId === FriendRes.source_id ? FriendRes?.user?.id || '' : FriendRes?.source_id || '',
		source_id: FriendRes?.source_id || ''
	};
};

const mapFriendToStatus = (friends: ApiFriend[]): IUserProfileActivity[] => {
	const listFriend: IUserProfileActivity[] = [];
	friends.map((friend) => {
		listFriend.push({
			id: friend.user?.id || '',
			avatar_url: friend.user?.avatar_url || '',
			display_name: friend.user?.display_name,
			online: friend.user?.online,
			is_mobile: friend.user?.is_mobile,
			status: friend.user?.online ? friend.user?.status || EUserStatus.ONLINE : EUserStatus.INVISIBLE,
			user_status: friend.user?.user_status,
			username: friend.user?.username
		});
	});
	return listFriend;
};
export interface FriendsState extends EntityState<FriendsEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentTabStatus: string;
	statusSentMobile: IStatusSentMobile | null;
	cache?: CacheMetadata;
}

export const friendsAdapter = createEntityAdapter({
	selectId: (friend: FriendsEntity) => friend.id || ''
});

const selectAllFriendsEntities = friendsAdapter.getSelectors().selectAll;

const selectCachedFriends = createSelector([(state: FriendState) => state[FRIEND_FEATURE_KEY]], (friendsState) => {
	return selectAllFriendsEntities(friendsState);
});

export const fetchListFriendsCached = async (
	getState: () => FriendState,
	ensuredMezon: MezonValueContext,
	state: number,
	limit: number,
	cursor: string,
	noCache = false
) => {
	const currentState = getState();
	const friendsState = currentState[FRIEND_FEATURE_KEY];

	const apiKey = createApiKey('fetchFriends', state, limit, cursor, ensuredMezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, friendsState?.cache, noCache);

	if (!shouldForceCall) {
		const friends = selectCachedFriends(currentState);
		return {
			friends,
			fromCache: true
		};
	}

	const response = await fetchDataWithSocketFallback(
		ensuredMezon,
		{
			api_name: 'ListFriends',
			list_friend_req: {}
		},
		() => ensuredMezon.client.listFriends(ensuredMezon.session),
		'friend_list'
	);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false
	};
};

type fetchListFriendsArgs = {
	noCache?: boolean;
};

export const fetchListFriends = createAsyncThunk('friends/fetchListFriends', async ({ noCache }: fetchListFriendsArgs, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await fetchListFriendsCached(thunkAPI.getState as () => FriendState, mezon, -1, LIMIT_FRIEND, '', noCache);
	if (!response.friends) {
		return { friends: [], fromCache: response.fromCache };
	}

	const state = thunkAPI.getState() as RootState;
	const currentUserId = selectAllAccount(state)?.user?.id || '';
	const listFriends = response.friends.map((friend) => mapFriendToEntity(friend, currentUserId));
	thunkAPI.dispatch(statusActions.updateBulkStatus(mapFriendToStatus(response.friends)));
	return { friends: listFriends, fromCache: response.fromCache };
});

export type requestAddFriendParam = {
	ids?: string[];
	usernames?: string[];
	isAcceptingRequest?: boolean;
};

export const sendRequestAddFriend = createAsyncThunk(
	'friends/requestFriends',
	async ({ ids, usernames, isAcceptingRequest }: requestAddFriendParam, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const state = thunkAPI.getState() as RootState;
		const currentUserId = state.account?.userProfile?.user?.id;
		await mezon.client
			.addFriends(mezon.session, ids, usernames)

			.catch(function (err) {
				err.json().then((data: any) => {
					thunkAPI.dispatch(
						friendsActions.setSentStatusMobile({
							isSuccess: false
						})
					);
					toast.error(i18n.t('friends:toast.sendAddFriendFail'));
				});
			})
			.then((data) => {
				if (data) {
					if (!isAcceptingRequest && data?.ids) {
						thunkAPI.dispatch(
							friendsActions.upsertFriend({
								id: data?.ids?.[0] || '',
								source_id: currentUserId,
								state: EStateFriend.OTHER_PENDING,
								user: {
									username: usernames?.[0],
									id: data?.ids?.[0]
								}
							})
						);
						toast.success(i18n.t('friends:toast.sendAddFriendSuccess'));
					} else {
						thunkAPI.dispatch(friendsActions.acceptFriend(`${ids?.[0]}`));
						toast.success(i18n.t('friends:toast.acceptAddFriendSuccess'));
					}
				}
			});
	}
);

export const sendRequestDeleteFriend = createAsyncThunk(
	'friends/requestDeleteFriends',
	async ({ ids, usernames }: requestAddFriendParam, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.deleteFriends(mezon.session, ids, usernames);
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}
		thunkAPI.dispatch(friendsActions.remove(ids?.[0] || ''));
		return response;
	}
);

export const sendRequestBlockFriend = createAsyncThunk('friends/requestBlockFriends', async ({ ids }: requestAddFriendParam, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));

	const response = await mezon.client.blockFriends(mezon.session, ids);
	if (!response) {
		return thunkAPI.rejectWithValue([]);
	}
	return response;
});

export const sendRequestUnblockFriend = createAsyncThunk('friends/requestUnblockFriends', async ({ ids }: requestAddFriendParam, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await mezon.client.unblockFriends(mezon.session, ids);
	if (!response) {
		return thunkAPI.rejectWithValue([]);
	}
	return response;
});

export const upsertFriendRequest = createAsyncThunk(
	'friends/upsertFriendRequest',
	async ({ user, myId }: { user: AddFriend; myId: string }, thunkAPI) => {
		const state = thunkAPI.getState() as RootState;
		const currentFriendApi = friendsAdapter.getSelectors().selectById(state.friends, `${user.user_id}`);

		const friend: FriendsEntity = {
			state: currentFriendApi ? EStateFriend.FRIEND : EStateFriend.MY_PENDING,
			id: user.user_id,
			source_id: myId,
			user: {
				id: user.user_id,
				username: user.username,
				avatar_url: user.avatar,
				display_name: user.display_name
			}
		};
		thunkAPI.dispatch(friendsActions.upsertFriend(friend));
	}
);

export const initialFriendsState: FriendsState = friendsAdapter.getInitialState({
	loadingStatus: 'not loaded',
	friends: [],
	error: null,
	currentTabStatus: 'all',
	statusSentMobile: null,
	cache: undefined
});

export const friendsSlice = createSlice({
	name: FRIEND_FEATURE_KEY,
	initialState: initialFriendsState,
	reducers: {
		remove: (state, action: PayloadAction<string>) => {
			const keyToRemove = state?.ids?.find((key) => state?.entities?.[key]?.user?.id === action.payload);
			keyToRemove && friendsAdapter.removeOne(state, keyToRemove);
		},
		changeCurrentStatusTab: (state, action: PayloadAction<string>) => {
			state.currentTabStatus = action.payload;
		},
		setSentStatusMobile: (state, action: PayloadAction<IStatusSentMobile | null>) => {
			state.statusSentMobile = action.payload;
		},
		setManyStatusUser: (state, action: PayloadAction<StatusUserArgs[]>) => {
			action.payload.forEach((statusUser) => {
				const key = state?.ids?.find((key) => state?.entities?.[key]?.user?.id === statusUser.userId);
				const friend = key ? state?.entities?.[key] : null;
				if (friend?.user && statusUser) {
					friend.user.online = statusUser.online;
					friend.user.is_mobile = statusUser.isMobile;
				}
			});
		},
		updateUserStatus: (state, action: PayloadAction<{ userId: string; user_status: any }>) => {
			const { userId, user_status } = action.payload;
			const key = state?.ids?.find((key) => state?.entities?.[key]?.user?.id === userId);
			const friendMeta = key ? state?.entities?.[key] : null;
			if (friendMeta) {
				friendMeta.user = friendMeta.user || {};
				//TODO: thai fix later
			}
		},
		updateFriendState: (
			state,
			action: PayloadAction<{
				userId: string;
				sourceId?: string;
			}>
		) => {
			const { userId, sourceId } = action.payload;

			const friend = state?.entities?.[userId];

			if (friend) {
				friend.state = friend.state === EStateFriend.BLOCK ? EStateFriend.FRIEND : EStateFriend.BLOCK;
				if (sourceId) {
					friend.source_id = sourceId;
				}
			}
		},
		upsertFriend: (state, action: PayloadAction<FriendsEntity>) => {
			const friendEntity = mapFriendToEntity(action.payload, action.payload.source_id || '');
			friendsAdapter.upsertOne(state, friendEntity);
		},
		acceptFriend: (state, action: PayloadAction<string>) => {
			friendsAdapter.updateOne(state, {
				id: action.payload,
				changes: { state: EStateFriend.FRIEND }
			});
		},
		removeOne: (state, action: PayloadAction<string>) => {
			friendsAdapter.removeOne(state, action.payload);
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListFriends.pending, (state: FriendsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListFriends.fulfilled, (state: FriendsState, action: PayloadAction<{ friends: FriendsEntity[]; fromCache: boolean }>) => {
				const { friends, fromCache } = action.payload;
				if (!fromCache) {
					friendsAdapter.setAll(state, friends);
					state.cache = createCacheMetadata();
				}

				state.loadingStatus = 'loaded';
			})
			.addCase(fetchListFriends.rejected, (state: FriendsState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
		builder.addCase(sendRequestAddFriend.rejected, (state: FriendsState, action) => {
			state.loadingStatus = 'error';
			state.error = action.error.message ?? 'No valid ID or username was provided.';
		});
	}
});

export const friendsReducer = friendsSlice.reducer;

export const friendsActions = {
	...friendsSlice.actions,
	fetchListFriends,
	sendRequestAddFriend,
	sendRequestDeleteFriend,
	sendRequestBlockFriend,
	sendRequestUnblockFriend,
	upsertFriendRequest
};

const { selectAll, selectById, selectEntities } = friendsAdapter.getSelectors();

export const getFriendsState = (FriendState: { [FRIEND_FEATURE_KEY]: FriendsState }): FriendsState => FriendState[FRIEND_FEATURE_KEY];
export const selectAllFriends = createSelector(getFriendsState, selectAll);
export const selectFriendsEntities = createSelector(getFriendsState, selectEntities);
export const selectStatusSentMobile = createSelector(getFriendsState, (state) => state.statusSentMobile);
export const selectFriendStatus = (userId: string) =>
	createSelector(getFriendsState, (state) => {
		const friends = selectAll(state);
		const friend = friends?.find((friend) => friend?.user?.id === userId);
		return friend?.state;
	});
export const selectBlockedUsers = createSelector([selectAllFriends, selectCurrentUserId], (friends, currentUserId) =>
	friends.filter((friend) => friend?.state === EStateFriend.BLOCK && friend?.user?.id !== currentUserId && friend?.source_id === currentUserId)
);
export const selectBlockedUsersForMessage = createSelector([selectAllFriends], (friends) =>
	friends.filter((friend) => friend?.state === EStateFriend.BLOCK)
);
export const selectFriendById = createSelector([getFriendsState, (state, userId: string) => userId], (state, userId) => selectById(state, userId));
export const selectCurrentTabStatus = createSelector(getFriendsState, (state) => state.currentTabStatus);
