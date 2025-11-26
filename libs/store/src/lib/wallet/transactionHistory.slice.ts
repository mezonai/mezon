import type { LoadingStatus } from '@mezon/utils';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { Transaction } from 'mmn-client-js';
import { ensureSession, getMezonCtx } from '../helpers';

export const TRANSACTION_HISTORY_FEATURE_KEY = 'transactionHistory';
export interface TransactionHistoryState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	transactionHistory?: Transaction[] | null;
	count?: number;
	detailTransaction?: Transaction | null;
}

export const fetchListTransactionHistory = createAsyncThunk(
	'transactionHistory/fetchList',
	async ({ address, page, filter = 0 }: { address: string; page?: number; filter?: number }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (!mezon.indexerClient) {
				return thunkAPI.rejectWithValue('IndexerClient not initialized');
			}
			const response = await mezon.indexerClient.getTransactionByWallet(address, page, undefined, filter);
			return {
				ledgers: response.data || [],
				count: response.meta.total_items || 0,
				page: page || 1
			};
		} catch (error) {
			return thunkAPI.rejectWithValue({ error });
		}
	}
);

export const fetchTransactionDetail = createAsyncThunk(
	'transactionHistory/fetchTransactionDetail',
	async ({ txHash }: { txHash: string }, thunkAPI) => {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (!mezon.indexerClient) {
			return thunkAPI.rejectWithValue('IndexerClient not initialized');
		}
		const response = await mezon.indexerClient.getTransactionByHash(txHash);
		return {
			detailTransaction: response
		};
	}
);

export const initialTransactionHistoryState: TransactionHistoryState = {
	loadingStatus: 'not loaded',
	error: null,
	transactionHistory: null,
	detailTransaction: null,
	count: 0
};

export const transactionHistorySlice = createSlice({
	name: TRANSACTION_HISTORY_FEATURE_KEY,
	initialState: initialTransactionHistoryState,
	reducers: {
		resetTransactionHistory: (state) => {
			state.transactionHistory = null;
			state.count = 0;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListTransactionHistory.pending, (state: TransactionHistoryState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListTransactionHistory.fulfilled, (state: TransactionHistoryState, action) => {
				const { ledgers, count, page } = action.payload;
				state.transactionHistory = state.transactionHistory && page !== 1 ? [...state.transactionHistory, ...ledgers] : ledgers;
				state.count = count;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchListTransactionHistory.rejected, (state: TransactionHistoryState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchTransactionDetail.pending, (state: TransactionHistoryState) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchTransactionDetail.fulfilled, (state: TransactionHistoryState, action) => {
				state.detailTransaction = action.payload.detailTransaction;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchTransactionDetail.rejected, (state: TransactionHistoryState, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			});
	}
});

export const getTransactionHistoryState = (rootState: { [TRANSACTION_HISTORY_FEATURE_KEY]: TransactionHistoryState }): TransactionHistoryState =>
	rootState[TRANSACTION_HISTORY_FEATURE_KEY];
export const transactionHistoryReducer = transactionHistorySlice.reducer;
export const transactionHistoryActions = {
	...transactionHistorySlice.actions,
	fetchListTransactionHistory,
	fetchTransactionDetail
};
export const selectTransactionHistory = createSelector(getTransactionHistoryState, (state) => state.transactionHistory);
export const selectCountTransactionHistory = createSelector(getTransactionHistoryState, (state) => state.count);
export const selectDetailTransaction = createSelector(getTransactionHistoryState, (state) => state.detailTransaction);
