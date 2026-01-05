import { EUserStatus, type IUserProfileActivity, type UsersClanEntity } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { UserStatusEvent } from 'mezon-js';
import type { ApiAllUsersAddChannelResponse } from 'mezon-js/api.gen';
import type { RootState } from '../store';

export const USER_STATUS_FEATURE_KEY = 'USER_STATUS_FEATURE_KEY';

export interface UserStatusState extends EntityState<IUserProfileActivity, string> {
	loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
	error?: string | null;
}

const statusAdapter = createEntityAdapter({
	selectId: (user: IUserProfileActivity) => user.id
});

export function convertStatusClan(user: UsersClanEntity, state: RootState): IUserProfileActivity {
	const isMe = state?.account?.userProfile?.user?.id === user?.user?.id;
	const isUserInvisible = user?.user?.userStatus === EUserStatus.INVISIBLE;
	return {
		id: user.id,
		online: (!isUserInvisible && !!user?.user?.online) || isMe,
		isMobile: !isUserInvisible && !!user?.user?.isMobile,
		status: user?.user?.online ? user?.user?.status : EUserStatus.INVISIBLE,
		userStatus: user?.user?.userStatus
	};
}

export function convertStatusGroup(users: ApiAllUsersAddChannelResponse): IUserProfileActivity[] {
	const listGroup: IUserProfileActivity[] = [];
	users.userIds?.map((id, index) => {
		if (id) {
			listGroup.push({
				id,
				avatarUrl: users.avatars?.[index] || '',
				displayName: users.display_names?.[index] || '',
				online: users.onlines?.[index],
				username: users.usernames?.[index] || ''
			});
		}
	});
	return listGroup;
}

export const initialUsetStatusState: UserStatusState = statusAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null
});

export const statusSlice = createSlice({
	name: USER_STATUS_FEATURE_KEY,
	initialState: initialUsetStatusState,
	reducers: {
		updateBulkStatus: (state, action: PayloadAction<IUserProfileActivity[]>) => {
			statusAdapter.upsertMany(state, action.payload);
		},
		updateStatus: (state, action: PayloadAction<UserStatusEvent>) => {
			const user = action.payload;

			statusAdapter.updateOne(state, {
				id: user.userId,
				changes: {
					status: user.custom_status
				}
			});
		},
		updateMany: statusAdapter.updateMany
	}
});

/*
 * Export reducer for store configuration.
 */
export const statusReducer = statusSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 */
export const statusActions = {
	...statusSlice.actions
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 */
const { selectAll, selectEntities, selectById } = statusAdapter.getSelectors();

export const getstatusState = (rootState: { [USER_STATUS_FEATURE_KEY]: UserStatusState }): UserStatusState => rootState[USER_STATUS_FEATURE_KEY];

export const selectAllstatus = createSelector(getstatusState, selectAll);

export const selectStatusEntities = createSelector(getstatusState, selectEntities);

export const selectUserStatusById = createSelector([getstatusState, (_, userId: string) => userId], (state, userId) => selectById(state, userId));
