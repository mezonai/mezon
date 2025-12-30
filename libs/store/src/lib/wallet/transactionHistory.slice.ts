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
	hasMore?: boolean;
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

export const fetchLoadMoreTransaction = createAsyncThunk(
	'transactionHistory/fetchLoadMore',
	async ({ address, filter = 0, timeStamp, lastHash }: { address: string; filter?: number; timeStamp?: string; lastHash?: string }, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			if (!mezon.indexerClient) {
				return thunkAPI.rejectWithValue('IndexerClient not initialized');
			}
			const response = await mezon.indexerClient.getTransactionsByWalletBeforeTimestamp(address, filter, undefined, timeStamp, lastHash);
			return {
				ledgers: response?.data || [],
				count: response?.meta?.total_items || 0,
				hasMore: response?.meta?.has_more ?? false
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
	count: 0,
	hasMore: false
};

export const transactionHistorySlice = createSlice({
	name: TRANSACTION_HISTORY_FEATURE_KEY,
	initialState: initialTransactionHistoryState,
	reducers: {
		resetTransactionHistory: (state) => {
			state.transactionHistory = null;
			state.count = 0;
			state.hasMore = false;
			state.loadingStatus = 'not loaded';
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchListTransactionHistory.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchListTransactionHistory.fulfilled, (state, action) => {
				const { ledgers, count, page } = action.payload;
				state.transactionHistory = state.transactionHistory && page !== 1 ? [...state.transactionHistory, ...ledgers] : ledgers;
				state.count = count;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchListTransactionHistory.rejected, (state, action) => {
				state.loadingStatus = 'error';
				state.error = action.error.message;
			})
			.addCase(fetchTransactionDetail.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchTransactionDetail.fulfilled, (state, action) => {
				state.detailTransaction = action.payload.detailTransaction;
			})
			.addCase(fetchTransactionDetail.rejected, (state, action) => {
				state.error = action.error.message;
			})

			.addCase(fetchLoadMoreTransaction.pending, (state) => {
				state.loadingStatus = 'loading';
			})
			.addCase(fetchLoadMoreTransaction.fulfilled, (state, action) => {
				const { ledgers, count, hasMore } = action.payload;
				const { timeStamp, lastHash } = action.meta.arg;
				const isFirstPage = !timeStamp && !lastHash;

				if (isFirstPage) {
					state.transactionHistory = ledgers;
				} else {
					state.transactionHistory = [...(state.transactionHistory || []), ...ledgers];
				}

				state.count = count;
				state.hasMore = hasMore;
				state.loadingStatus = 'loaded';
			})
			.addCase(fetchLoadMoreTransaction.rejected, (state, action) => {
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
	fetchTransactionDetail,
	fetchLoadMoreTransaction
};
export const selectTransactionHistory = createSelector(getTransactionHistoryState, (state) => state.transactionHistory);
export const selectDetailTransaction = createSelector(getTransactionHistoryState, (state) => state.detailTransaction);
export const selectHasMore = createSelector(getTransactionHistoryState, (state) => state.hasMore);
