import { IUserAccount, LoadingStatus } from '@mezon/utils';
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import { toast } from 'react-toastify';
import { authActions } from '../auth/auth.slice';
import { MezonValueContext, ensureSession, getMezonCtx } from '../helpers';
import { clearAllMemoizedFunctions, memoizeAndTrack } from '../memoize';

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
	logo?: string;
}

export const initialAccountState: AccountState = {
	loadingStatus: 'not loaded',
	account: null,
	userProfile: null,
	anonymousMode: false
};

const CHANNEL_PROFILE_CACHED_TIME = 1000 * 60 * 60;
const fetchUserProfileCached = memoizeAndTrack((mezon: MezonValueContext) => mezon.client.getAccount(mezon.session), {
	promise: true,
	maxAge: CHANNEL_PROFILE_CACHED_TIME,
	normalizer: (args) => {
		return args[0].session.username || '';
	}
});

export const getUserProfile = createAsyncThunk<IUserAccount, { noCache: boolean } | void>('account/user', async (arg, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const noCache = arg?.noCache ?? false;
	if (noCache) {
		fetchUserProfileCached.delete(mezon);
	}
	const response = await fetchUserProfileCached(mezon);
	if (!response) {
		return thunkAPI.rejectWithValue('Invalid getUserProfile');
	}
	return response;
});

export const deleteAccount = createAsyncThunk('account/deleteaccount', async (_, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await mezon.client.deleteAccount(mezon.session);
		thunkAPI.dispatch(authActions.setLogout());
		clearAllMemoizedFunctions();
		return response;
	} catch (error) {
		//Todo: check clan owner before deleting account
		toast.error('Error: You are the owner of the clan');
		// captureSentryError(error, 'account/deleteaccount');
		// return thunkAPI.rejectWithValue(error);
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
				const userMetadata = safeJSONParse(state.userProfile.user.metadata || '{}');
				const updatedUserMetadata = { ...userMetadata, status: action.payload };
				state.userProfile.user.metadata = JSON.stringify(updatedUserMetadata);
			}
		},
		setLogoCustom(state, action: PayloadAction<string | undefined>) {
			state.logo = action.payload;
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
			if (state.userProfile?.user?.metadata) {
				try {
					const metadataObj = JSON.parse(state.userProfile.user.metadata);
					if (metadataObj && typeof metadataObj === 'object') {
						metadataObj.user_status = action.payload;
						state.userProfile.user.metadata = JSON.stringify(metadataObj);
					}
				} catch (error) {
					console.error('Error updating user status in metadata:', error);
				}
			}
		},
		setUpdateAccount(state, action: PayloadAction<IUserAccount>) {
			state.userProfile = {
				...state.userProfile,
				user: { ...state.userProfile?.user, ...action.payload.user },
				encrypt_private_key: action.payload.encrypt_private_key
			};
			state.logo = action.payload.logo;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(getUserProfile.pending, (state: AccountState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(getUserProfile.fulfilled, (state: AccountState, action: PayloadAction<IUserAccount>) => {
				state.userProfile = action.payload;
				state.logo = action.payload.logo;
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

export const accountActions = { ...accountSlice.actions, getUserProfile, deleteAccount };

export const getAccountState = (rootState: { [ACCOUNT_FEATURE_KEY]: AccountState }): AccountState => rootState[ACCOUNT_FEATURE_KEY];

export const selectAllAccount = createSelector(getAccountState, (state: AccountState) => state.userProfile);

export const selectCurrentUserId = createSelector(getAccountState, (state: AccountState) => state?.userProfile?.user?.id || '');

export const selectAnonymousMode = createSelector(getAccountState, (state: AccountState) => state.anonymousMode);

export const selectAccountMetadata = createSelector(getAccountState, (state: AccountState) =>
	safeJSONParse(state.userProfile?.user?.metadata || '{}')
);

export const selectAccountCustomStatus = createSelector(selectAccountMetadata, (metadata) => metadata?.status || '');

export const selectLogoCustom = createSelector(getAccountState, (state) => state.logo);
