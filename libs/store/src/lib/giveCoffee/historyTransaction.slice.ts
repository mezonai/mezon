import { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiTransactionDetail, ApiWalletLedger } from 'mezon-js/api.gen';
import { ensureSession, getMezonCtx } from '../helpers';

export const WALLET_LEDGER_FEATURE_KEY = 'walletLedger';

export interface WalletLedgerState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	walletLedger?: ApiWalletLedger[] | null;
	count?: number;
	detailLedger?: ApiTransactionDetail | null;
}

export const fetchListWalletLedger = createAsyncThunk(
	'walletLedger/fetchList',
	async ({ page, filter }: { page?: number; filter?: number }, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const response = await mezon.client.listWalletLedger(mezon.session, 8, filter, '', page);
		return {
			ledgers: response.wallet_ledger || [],
			count: response.count || 0,
			page: page || 1
		};
	}
);

export const fetchDetailTransaction = createAsyncThunk('walletLedger/fetchDetailTransaction', async ({ transId }: { transId: string }, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	const response = await mezon.client.listTransactionDetail(mezon.session, transId);
	return {
		detailLedger: response
	};
});

export const initialWalletLedgerState: WalletLedgerState = {
	loadingStatus: 'not loaded',
	error: null,
	walletLedger: null,
	detailLedger: null,
	count: 0
};

export const walletLedgerSlice = createSlice({
	name: WALLET_LEDGER_FEATURE_KEY,
	initialState: initialWalletLedgerState,
	reducers: {
		resetWalletLedger: (state) => {
			state.walletLedger = null;
			state.count = 0;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListWalletLedger.pending, (state: WalletLedgerState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListWalletLedger.fulfilled, (state: WalletLedgerState, action) => {
				const { ledgers, count, page } = action.payload;
				state.walletLedger = state.walletLedger && page !== 1 ? [...state.walletLedger, ...ledgers] : ledgers;
				state.count = count;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchListWalletLedger.rejected, (state: WalletLedgerState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchDetailTransaction.pending, (state: WalletLedgerState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchDetailTransaction.fulfilled, (state: WalletLedgerState, action) => {
				state.detailLedger = action.payload.detailLedger;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchDetailTransaction.rejected, (state: WalletLedgerState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const getWalletLedgerState = (rootState: { [WALLET_LEDGER_FEATURE_KEY]: WalletLedgerState }): WalletLedgerState =>
	rootState[WALLET_LEDGER_FEATURE_KEY];
export const walletLedgerReducer = walletLedgerSlice.reducer;
export const walletLedgerActions = {
	...walletLedgerSlice.actions,
	fetchListWalletLedger,
	fetchDetailTransaction
};
export const selectWalletLedger = createSelector(getWalletLedgerState, (state) => state.walletLedger);
export const selectCountWalletLedger = createSelector(getWalletLedgerState, (state) => state.count);
export const selectDetailedger = createSelector(getWalletLedgerState, (state) => state.detailLedger);
