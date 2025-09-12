import { LoadingStatus } from '@mezon/utils';
import { IndexerClient, WalletDetail } from '@mezonai/mmn-client-js';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';

export const WALLET_FEATURE_KEY = 'wallet';

const client = new IndexerClient({
	endpoint: process.env.NX_CHAT_APP_INDEXER_API_URL || '',
	chainId: '1337',
	timeout: 10000 // optional, default 30s
});

export interface WalletState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	wallet?: WalletDetail;
}

export const fetchWalletDetail = createAsyncThunk('wallet/fetchWalletDetail', async ({ address }: { address: string }, thunkAPI) => {
	const response = await client.getWalletDetail(address);
	return {
		wallet: response
	};
});

export const initialWalletState: WalletState = {
	loadingStatus: 'not loaded',
	error: null,
	wallet: undefined
};

export const walletSlice = createSlice({
	name: WALLET_FEATURE_KEY,
	initialState: initialWalletState,
	reducers: {},
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
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const getWalletState = (rootState: { [WALLET_FEATURE_KEY]: WalletState }): WalletState => rootState[WALLET_FEATURE_KEY];
export const walletReducer = walletSlice.reducer;
export const walletActions = {
	...walletSlice.actions,
	fetchWalletDetail
};

export const selectWalletDetail = createSelector(getWalletState, (state) => state?.wallet);
