import { captureSentryError } from '@mezon/logger';
import type { IUserAccount, LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { t } from 'i18next';
import type { ApiLinkAccountConfirmRequest, ApiLinkAccountMezon, ApiUserStatusUpdate } from 'mezon-js/api.gen';
import { toast } from 'react-toastify';
import { authActions } from '../auth/auth.slice';
import type { CacheMetadata } from '../cache-metadata';
import { clearApiCallTracker, createApiKey, createCacheMetadata, markApiFirstCalled, shouldForceApiCall } from '../cache-metadata';
import type { MezonValueContext } from '../helpers';
import { ensureSession, getMezonCtx } from '../helpers';
import type { RootState } from '../store';
import { walletActions } from '../wallet/wallet.slice';
export const ACCOUNT_FEATURE_KEY = 'account';
export interface IAccount {
	email: string;
	password: string;
}
export interface AccountState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	account?: IAccount | null;
	userProfile?: IUserAccount | null;
	anonymousMode: boolean;
	cache?: CacheMetadata;
	avatarVersion: number;
}

export const initialAccountState: AccountState = {
	loadingStatus: 'not loaded',
	account: null,
	userProfile: null,
	anonymousMode: false,
	avatarVersion: 0
};

export const fetchUserProfileCached = async (getState: () => RootState, mezon: MezonValueContext, noCache = false) => {
	const currentState = getState();
	const accountData = currentState[ACCOUNT_FEATURE_KEY];
	const apiKey = createApiKey('fetchUserProfile', mezon.session.username || '');

	const shouldForceCall = shouldForceApiCall(apiKey, accountData?.cache, noCache);

	if (!shouldForceCall && accountData?.userProfile) {
		return {
			...accountData.userProfile,
			fromCache: true,
			time: accountData.cache?.lastFetched || Date.now()
		};
	}

	const response = await mezon.client.getAccount(mezon.session);

	markApiFirstCalled(apiKey);

	return {
		...response,
		fromCache: false,
		time: Date.now()
	};
};

export const getUserProfile = createAsyncThunk<IUserAccount & { fromCache?: boolean }, { noCache: boolean } | void>(
	'account/user',
	async (arg, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const noCache = arg?.noCache ?? false;

		const response = await fetchUserProfileCached(thunkAPI.getState as () => RootState, mezon, Boolean(noCache));

		if (!response) {
			return thunkAPI.rejectWithValue('Invalid getUserProfile');
		}

		if (response.fromCache) {
			return {
				fromCache: true
			} as IUserAccount & { fromCache: boolean };
		}

		const { fromCache, time, ...profileData } = response;
		return { ...profileData, fromCache: false };
	}
);

export const deleteAccount = createAsyncThunk('account/deleteaccount', async (_, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.deleteAccount(mezon.session);
		thunkAPI.dispatch(authActions.setLogout());
		thunkAPI.dispatch(walletActions.setLogout());
		clearApiCallTracker();
		return response;
	} catch (error) {
		//Todo: check clan owner before deleting account
		toast.error('Error: You are the owner of the clan');
		throw error;
		// captureSentryError(error, 'account/deleteaccount');
		// return thunkAPI.rejectWithValue(error);
	}
});

export const addPhoneNumber = createAsyncThunk('account/addPhoneNumber', async (data: ApiLinkAccountMezon, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.linkMezon(mezon.session, data);

		return response;
	} catch (error) {
		captureSentryError(error, 'account/addPhoneNumber');
		return thunkAPI.rejectWithValue(error);
	}
});

export const verifyPhone = createAsyncThunk('account/verifyPhone', async (data: ApiLinkAccountConfirmRequest, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.confirmLinkMezonOTP(mezon.session, data);

		return response;
	} catch (error) {
		captureSentryError(error, 'account/verifyPhone');
		toast.error(t('accountSetting:setPhoneModal.updatePhoneFail'));
	}
});

export const updateAccountStatus = createAsyncThunk('userstatusapi/updateUserStatus', async (request: ApiUserStatusUpdate, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.updateUserStatus(mezon.session, request);
		if (!response) {
			return '';
		}
		return request.status || '';
	} catch (error) {
		captureSentryError(error, 'userstatusapi/updateUserStatus');
		return thunkAPI.rejectWithValue(error);
	}
});

export const accountSlice = createSlice({
	name: ACCOUNT_FEATURE_KEY,
	initialState: initialAccountState,
	reducers: {
		setAccount(state, action) {
			state.account = action.payload;
		},
		setAnonymousMode(state) {
			state.anonymousMode = !state.anonymousMode;
		},
		setCustomStatus(state, action: PayloadAction<string>) {
			if (state?.userProfile?.user) {
				state.userProfile.user.user_status = action.payload;
			}
		},
		setWalletMetadata(state, action: PayloadAction<any>) {
			if (state?.userProfile?.user) {
				state.userProfile.user.user_status = action.payload;
			}
		},
		setLogoCustom(state, action: PayloadAction<string | undefined>) {
			if (state.userProfile) {
				state.userProfile.logo = action.payload;
			}
		},
		setWalletValue(state, action: PayloadAction<number>) {
			if (state.userProfile?.wallet) {
				try {
					state.userProfile.wallet = action.payload;
				} catch (error) {
					console.error('Error set wallet value:', error);
				}
			}
		},
		updateWalletByAction(state: AccountState, action: PayloadAction<(currentValue: number) => number>) {
			if (state.userProfile?.wallet) {
				try {
					state.userProfile.wallet = action.payload(state.userProfile?.wallet);
				} catch (error) {
					console.error('Error updating wallet by action:', error);
				}
			}
		},
		updateUserStatus(state: AccountState, action: PayloadAction<string>) {
			if (state.userProfile?.user?.status) {
				try {
					state.userProfile.user.status = action.payload;
				} catch (error) {
					console.error('Error updating user status in metadata:', error);
				}
			}
		},
		setUpdateAccount(state, action: PayloadAction<IUserAccount>) {
			state.userProfile = {
				...state.userProfile,
				...action.payload,
				user: { ...state.userProfile?.user, ...action.payload.user },
				encrypt_private_key: action.payload.encrypt_private_key
			};
		},
		incrementAvatarVersion(state) {
			state.avatarVersion = (state.avatarVersion || 0) + 1;
		},
		updatePhoneNumber(state, action: PayloadAction<string>) {
			if (state?.userProfile?.user) {
				state.userProfile.user.phone_number = action.payload;
			}
		},
		setPasswordSetted(state, action: PayloadAction<boolean>) {
			if (state?.userProfile) {
				state.userProfile.password_setted = action.payload;
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getUserProfile.pending, (state: AccountState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getUserProfile.fulfilled, (state: AccountState, action: PayloadAction<IUserAccount & { fromCache?: boolean }>) => {
				const { fromCache, ...profileData } = action.payload;
				if (!fromCache) {
					state.userProfile = profileData;
					state.cache = createCacheMetadata();
				}

				state.loadingStatus = 'loaded';
			})
			.addCase(getUserProfile.rejected, (state: AccountState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

/*
 * Export reducer for store configuration.
 */
export const accountReducer = accountSlice.reducer;

export const accountActions = { ...accountSlice.actions, getUserProfile, deleteAccount, addPhoneNumber, verifyPhone, updateAccountStatus };

export const getAccountState = (rootState: { [ACCOUNT_FEATURE_KEY]: AccountState }): AccountState => rootState[ACCOUNT_FEATURE_KEY];

export const selectAllAccount = createSelector(getAccountState, (state: AccountState) => state.userProfile);

export const selectCurrentUserId = createSelector(getAccountState, (state: AccountState) => state?.userProfile?.user?.id || '');

export const selectAnonymousMode = createSelector(getAccountState, (state: AccountState) => state.anonymousMode);

export const selectAccountCustomStatus = createSelector(getAccountState, (state: AccountState) => state.userProfile?.user?.user_status || '');

export const selectLogoCustom = createSelector(getAccountState, (state) => state?.userProfile?.logo);

export const selectAvatarVersion = createSelector(getAccountState, (state) => state.avatarVersion);
