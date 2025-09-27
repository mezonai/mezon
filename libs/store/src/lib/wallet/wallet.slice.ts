import { LoadingStatus } from '@mezon/utils';
import { IEphemeralKeyPair, IZkProof, WalletDetail } from 'mmn-client-js';
import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ensureSession, getMezonCtx } from '../helpers';

export const WALLET_FEATURE_KEY = 'wallet';

export interface WalletState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	wallet?: WalletDetail;
	zkProofs?: IZkProof;
	ephemeralKeyPair?: IEphemeralKeyPair;
	address?: string | null;
}

const fetchWalletDetail = createAsyncThunk('wallet/fetchWalletDetail', async ({ userId }: { userId: string }, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	if (!mezon.mmnClient) {
		return thunkAPI.rejectWithValue('MmnClient not initialized');
	}
	if (!mezon.indexerClient) {
		return thunkAPI.rejectWithValue('IndexerClient not initialized');
	}
	const address = await mezon.mmnClient.getAddressFromUserId(userId);
	const response = await mezon.indexerClient.getWalletDetail(address);
	return {
		wallet: response
	};
});

const fetchAddress = createAsyncThunk('wallet/fetchAddress', async ({ userId }: { userId: string }, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	if (!mezon.mmnClient) {
		return thunkAPI.rejectWithValue('MmnClient not initialized');
	}
	const address = await mezon.mmnClient.getAddressFromUserId(userId);
	return {
		address
	};
});

const fetchEphemeralKeyPair = createAsyncThunk('wallet/fetchEphemeralKeyPair', async (_, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	if (!mezon.mmnClient) {
		return thunkAPI.rejectWithValue('MmnClient not initialized');
	}
	const response = await mezon.mmnClient.generateEphemeralKeyPair();
	return {
		ephemeralKeyPair: response
	};
});

const fetchZkProofs = createAsyncThunk(
	'wallet/fetchZkProofs',
	async (req: { userId: string; ephemeralPrivateKey?: string; jwt: string }, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const ephemeralKeyPair = selectEphemeralKeyPair(thunkAPI.getState() as any);
		const address = selectAddress(thunkAPI.getState() as any);
		if (!ephemeralKeyPair || !address) {
			return thunkAPI.rejectWithValue('Invalid ephemeral key pair or address');
		}
		if (!mezon.zkClient) {
			return thunkAPI.rejectWithValue('ZkClient not initialized');
		}
		const response = await mezon.zkClient.getZkProofs({ ...req, address, ephemeralPublicKey: ephemeralKeyPair?.publicKey });
		return response;
	}
);

export const initialWalletState: WalletState = {
	loadingStatus: 'not loaded',
	error: null,
	wallet: undefined,
	zkProofs: undefined,
	ephemeralKeyPair: undefined
};

export const walletSlice = createSlice({
	name: WALLET_FEATURE_KEY,
	initialState: initialWalletState,
	reducers: {
		updateWalletByAction(state: WalletState, action: PayloadAction<(currentValue: string) => string>) {
			if (state.wallet?.balance) {
				try {
					state.wallet.balance = action.payload(state.wallet.balance);
				} catch (error) {
					console.error('Error updating wallet by action:', error);
				}
			}
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchWalletDetail.pending, (state: WalletState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchWalletDetail.fulfilled, (state: WalletState, action) => {
				state.wallet = action.payload.wallet;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchWalletDetail.rejected, (state: WalletState, action) => {
				state.wallet = undefined;
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchAddress.pending, (state: WalletState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchAddress.fulfilled, (state: WalletState, action) => {
				state.address = action.payload.address;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchAddress.rejected, (state: WalletState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchEphemeralKeyPair.pending, (state: WalletState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchEphemeralKeyPair.fulfilled, (state: WalletState, action) => {
				state.ephemeralKeyPair = action.payload.ephemeralKeyPair;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchEphemeralKeyPair.rejected, (state: WalletState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchZkProofs.pending, (state: WalletState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchZkProofs.fulfilled, (state: WalletState, action) => {
				state.zkProofs = action.payload;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchZkProofs.rejected, (state: WalletState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const getWalletState = (rootState: { [WALLET_FEATURE_KEY]: WalletState }): WalletState => rootState[WALLET_FEATURE_KEY];
export const walletReducer = walletSlice.reducer;
export const walletActions = {
	...walletSlice.actions,
	fetchWalletDetail,
	fetchAddress,
	fetchEphemeralKeyPair,
	fetchZkProofs
};

export const selectWalletDetail = createSelector(getWalletState, (state) => state?.wallet);

export const selectZkProofs = createSelector(getWalletState, (state) => state?.zkProofs);

export const selectEphemeralKeyPair = createSelector(getWalletState, (state) => state?.ephemeralKeyPair);

export const selectAddress = createSelector(getWalletState, (state) => state?.address);
