import { captureSentryError } from '@mezon/logger';
import type { IClanProfile, LoadingStatus } from '@mezon/utils';
import { TypeCheck } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiUpdateClanProfileRequest } from 'mezon-js';
import type { ApiClanProfile } from 'mezon-js/api.gen';
import { accountActions } from '../account/account.slice';
import { setUserClanAvatarOverride } from '../avatarOverride/avatarOverride';
import { ensureClient, ensureSession, ensureSocket, getMezonCtx, withRetry } from '../helpers';
import type { RootState } from '../store';
export const USER_CLAN_PROFILE_FEATURE_KEY = 'userClanProfile';

export interface UserClanProfileEntity extends IClanProfile {
	id: string; // Primary ID
}

export const mapUserClanProfileToEntity = (userClanProfileRes: ApiClanProfile): UserClanProfileEntity => {
	const { clan_id, user_id, ...rest } = userClanProfileRes;
	const id = `${clan_id}${user_id}`;
	return {
		...rest,
		id,
		clan_id: clan_id ? String(clan_id) : undefined,
		user_id: user_id ? String(user_id) : undefined
	};
};

export interface UserClanProfileState extends EntityState<UserClanProfileEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	currentUserClanProfileId?: string | null;
	showModalFooterProfile: boolean;
	showModalCustomStatus: boolean;
}

export const userClanProfileAdapter = createEntityAdapter<UserClanProfileEntity>();

type fetchUserClanProfilePayload = {
	clanId: string;
};

export const fetchUserClanProfile = createAsyncThunk('userclanProfile/userClanProfile', async ({ clanId }: fetchUserClanProfilePayload, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await withRetry(() => mezon.client.getUserProfileOnClan(mezon.session, BigInt(clanId)), {
		maxRetries: 3,
		initialDelay: 1000,
		scope: 'user-clan-profile'
	});
	if (!response) {
		return thunkAPI.rejectWithValue([]);
	}
	const userClanProfileEntity = mapUserClanProfileToEntity(response);
	return userClanProfileEntity;
});

export const checkDuplicateClanNickName = createAsyncThunk(
	'userClanProfile/duplicateClanNickName',
	async ({ clanNickName, clanId }: { clanNickName: string; clanId: string }, thunkAPI) => {
		try {
			const mezon = await ensureSocket(getMezonCtx(thunkAPI));
			const isDuplicateName = await mezon.socketRef.current?.checkDuplicateName(
				clanNickName,
				BigInt(clanId),
				TypeCheck.TYPENICKNAME,
				BigInt(clanId)
			);

			if (isDuplicateName?.type === TypeCheck.TYPENICKNAME) {
				return isDuplicateName.exist;
			}

			return false;
		} catch (error) {
			captureSentryError(error, 'userClanProfile/duplicateClanNickName');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

type updateLinkUserClanProfile = {
	username: string;
	avatarUrl: string;
	clanId: string;
};

export const updateUserClanProfile = createAsyncThunk(
	'userclanProfile/updateUserClanProfile',
	async ({ clanId, username, avatarUrl }: updateLinkUserClanProfile, thunkAPI) => {
		try {
			const state = thunkAPI.getState() as RootState;
			const currentUser = state.account?.userProfile;

			const currentUserClanProfile = state.userClanProfile.entities[`${clanId}${currentUser?.user?.id}`];
			const mezon = ensureClient(getMezonCtx(thunkAPI));
			const body: Partial<ApiUpdateClanProfileRequest> = {
				clan_id: BigInt(clanId),
				nick_name: username,
				avatar: avatarUrl
			};

			if (
				(username && username !== currentUserClanProfile?.nick_name) ||
				(avatarUrl && avatarUrl !== '' && avatarUrl !== currentUserClanProfile?.avatar)
			) {
				const response = await mezon.client.updateUserProfileByClan(mezon.session, BigInt(clanId), body as ApiUpdateClanProfileRequest);
				if (!response) {
					return thunkAPI.rejectWithValue([]);
				}

				thunkAPI.dispatch(
					userClanProfileSlice.actions.updateOne({
						id: `${clanId}${currentUser?.user?.id}`,
						changes: {
							nick_name: username,
							avatar: avatarUrl
						}
					})
				);

				if (avatarUrl && currentUser?.user?.id) {
					setUserClanAvatarOverride(String(currentUser.user.id), clanId, avatarUrl);
					thunkAPI.dispatch(accountActions.incrementAvatarVersion());
				}

				thunkAPI.dispatch(fetchUserClanProfile({ clanId }));
			}
			return true;
		} catch (error) {
			captureSentryError(error, 'userClanProfile/updateUserClanProfile');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialUserClanProfileState: UserClanProfileState = userClanProfileAdapter.getInitialState({
	loadingStatus: 'not loaded',
	error: null,
	showModalFooterProfile: false,
	showModalCustomStatus: false
});

export const userClanProfileSlice = createSlice({
	name: USER_CLAN_PROFILE_FEATURE_KEY,
	initialState: initialUserClanProfileState,
	reducers: {
		add: userClanProfileAdapter.addOne,
		remove: userClanProfileAdapter.removeOne,
		updateOne: userClanProfileAdapter.updateOne,
		changeUserClanProfile: (state, action: PayloadAction<string>) => {
			state.currentUserClanProfileId = action.payload;
		},
		setShowModalFooterProfile: (state, action: PayloadAction<boolean>) => {
			state.showModalFooterProfile = action.payload;
		},
		setShowModalCustomStatus: (state, action: PayloadAction<boolean>) => {
			state.showModalCustomStatus = action.payload;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUserClanProfile.pending, (state: UserClanProfileState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchUserClanProfile.fulfilled, (state: UserClanProfileState, action: PayloadAction<UserClanProfileEntity>) => {
				userClanProfileAdapter.setOne(state, action.payload);
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchUserClanProfile.rejected, (state: UserClanProfileState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const userClanProfileReducer = userClanProfileSlice.reducer;

export const userClanProfileActions = {
	...userClanProfileSlice.actions,
	fetchUserClanProfile,
	updateUserClanProfile
};

const { selectEntities } = userClanProfileAdapter.getSelectors();

export const getUserClanProfileState = (rootState: { [USER_CLAN_PROFILE_FEATURE_KEY]: UserClanProfileState }): UserClanProfileState =>
	rootState[USER_CLAN_PROFILE_FEATURE_KEY];

export const selectAllUserClanProfile = createSelector(getUserClanProfileState, selectEntities);

export const selectUserClanProfileByClanID = (clanId: string, userId: string) =>
	createSelector(selectAllUserClanProfile, (profiles) => profiles[`${clanId}${userId}`]);

export const selectShowModalFooterProfile = createSelector(getUserClanProfileState, (state) => state.showModalFooterProfile);

export const selectShowModalCustomStatus = createSelector(getUserClanProfileState, (state) => state.showModalCustomStatus);
