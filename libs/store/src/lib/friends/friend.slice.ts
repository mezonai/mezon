import { LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { Friend } from 'mezon-js';
import { toast } from 'react-toastify';
import { selectCurrentUserId } from '../account/account.slice';
import { CacheMetadata, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import { StatusUserArgs } from '../channelmembers/channel.members';
import { MezonValueContext, ensureSession, fetchDataWithSocketFallback, getMezonCtx } from '../helpers';
export const FRIEND_FEATURE_KEY = 'friends';
const LIMIT_FRIEND = 1000;

interface RootState {
	[FRIEND_FEATURE_KEY]: FriendsState;
}

export interface FriendsEntity extends Friend {
	key: string;
	id: string;
}

export interface IFriend extends Friend {
	key: string;
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

export const mapFriendToEntity = (FriendRes: Friend) => {
	const uniqueId = `${FriendRes?.user?.id}_${FriendRes?.source_id}`;
	return {
		...FriendRes,
		key: uniqueId,
		id: FriendRes?.user?.id || '',
		source_id: FriendRes?.source_id || ''
	};
};
export interface FriendsState extends EntityState<FriendsEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentTabStatus: string;
	statusSentMobile: IStatusSentMobile | null;
	cache?: CacheMetadata;
}

export const friendsAdapter = createEntityAdapter({
	selectId: (friend: FriendsEntity) => friend.key || ''
});

const selectAllFriendsEntities = friendsAdapter.getSelectors().selectAll;

const selectCachedFriends = createSelector([(state: RootState) => state[FRIEND_FEATURE_KEY]], (friendsState) => {
	return selectAllFriendsEntities(friendsState);
});

export const fetchListFriendsCached = async (
	getState: () => RootState,
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
			friends: friends,
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
	const response = await fetchListFriendsCached(thunkAPI.getState as () => RootState, mezon, -1, LIMIT_FRIEND, '', noCache);
	if (!response.friends) {
		return { friends: [], fromCache: response.fromCache };
	}
	const listFriends = response.friends.map(mapFriendToEntity);
	return { friends: listFriends, fromCache: response.fromCache };
});

export type requestAddFriendParam = {
	ids?: string[];
	usernames?: string[];
	isAcceptingRequest?: boolean;
};

export const sendRequestAddFriend = createAsyncThunk('friends/requestFriends', async ({ ids, usernames, isAcceptingRequest }: requestAddFriendParam, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	await mezon.client
		.addFriends(mezon.session, ids, usernames)

		.catch(function (err) {
			err.json().then((data: any) => {
				thunkAPI.dispatch(
					friendsActions.setSentStatusMobile({
						isSuccess: false
					})
				);
				toast.error('Hm, that didn’t work. Double-check that the username is correct.');
			});
		})
		.then((data) => {
			if (data) {
				thunkAPI.dispatch(
					friendsActions.setSentStatusMobile({
						isSuccess: true
					})
				);
				if (!isAcceptingRequest) {
					toast.success('Friend request sent successfully!');
				} 
				thunkAPI.dispatch(friendsActions.fetchListFriends({ noCache: true }));
			}
		});
});

export const sendRequestDeleteFriend = createAsyncThunk(
	'friends/requestDeleteFriends',
	async ({ ids, usernames }: requestAddFriendParam, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.deleteFriends(mezon.session, ids, usernames);
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}
		thunkAPI.dispatch(friendsActions.fetchListFriends({ noCache: true }));
		return response;
	}
);

export const sendRequestBlockFriend = createAsyncThunk('friends/requestBlockFriends', async ({ ids, usernames }: requestAddFriendParam, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await mezon.client.blockFriends(mezon.session, ids, usernames);
	if (!response) {
		return thunkAPI.rejectWithValue([]);
	}
	return response;
});

export const sendRequestUnblockFriend = createAsyncThunk(
	'friends/requestUnblockFriends',
	async ({ ids, usernames }: requestAddFriendParam, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.unblockFriends(mezon.session, ids, usernames);
		if (!response) {
			return thunkAPI.rejectWithValue([]);
		}
		return response;
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
				friendMeta.user.metadata = friendMeta.user.metadata || {};
				//TODO: thai fix later
				(friendMeta.user.metadata as any).user_status = user_status;
			}
		},
		updateFriendState: (
			state,
			action: PayloadAction<{
				userId: string;
				friendState: EStateFriend;
				sourceId?: string;
			}>
		) => {
			const { userId, friendState, sourceId } = action.payload;
			const key = state?.ids?.find((key) => {
				return state?.entities?.[key]?.source_id === userId || state?.entities?.[key]?.user?.id === userId;
			});
			const friend = key ? state?.entities?.[key] : null;

			if (friend) {
				friend.state = friendState;
				if (sourceId) {
					friend.source_id = sourceId;
				}
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListFriends.pending, (state: FriendsState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListFriends.fulfilled, (state: FriendsState, action: PayloadAction<{ friends: IFriend[]; fromCache: boolean }>) => {
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
	sendRequestUnblockFriend
};

const { selectAll } = friendsAdapter.getSelectors();

export const getFriendsState = (rootState: { [FRIEND_FEATURE_KEY]: FriendsState }): FriendsState => rootState[FRIEND_FEATURE_KEY];
export const selectAllFriends = createSelector(getFriendsState, selectAll);
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
export const selectFriendById = createSelector([selectAllFriends, (state, userId: string) => userId], (friends, userId) =>
	friends.find((friend) => friend?.user?.id === userId || friend?.source_id === userId)
);
export const selectCurrentTabStatus = createSelector(getFriendsState, (state) => state.currentTabStatus);
