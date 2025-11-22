import i18n from '@mezon/translations';
import { compareBigInt, type LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import type { ExtraInfo, IEphemeralKeyPair, IZkProof } from 'mmn-client-js';
import { ensureSession, getMezonCtx } from '../helpers';
import { EErrorType, toastActions } from '../toasts';

export const WALLET_FEATURE_KEY = 'wallet';

export interface WalletDetail {
	address: string;
	balance: string;
}

export interface WalletState {
	loadingStatus: LoadingStatus;
	error?: string | null;
	wallet?: WalletDetail;
	zkProofs?: IZkProof;
	ephemeralKeyPair?: IEphemeralKeyPair;
	address?: string | null;
	isEnabled?: boolean;
}

const fetchWalletDetail = createAsyncThunk('wallet/fetchWalletDetail', async ({ userId }: { userId: string }, thunkAPI) => {
	const mezon = await ensureSession(getMezonCtx(thunkAPI));
	if (!mezon.mmnClient) {
		return thunkAPI.rejectWithValue('MmnClient not initialized');
	}
	if (!mezon.indexerClient) {
		return thunkAPI.rejectWithValue('IndexerClient not initialized');
	}
	const response = await mezon.mmnClient.getAccountByUserId(userId);
	return {
		wallet: {
			address: response.address,
			balance: response.balance
		}
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

const fetchZkProofs = createAsyncThunk('wallet/fetchZkProofs', async (req: { userId: string; jwt: string }, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (!mezon.zkClient || !mezon.mmnClient) {
			return;
		}
		const ephemeralKeyPair = await mezon.mmnClient.generateEphemeralKeyPair();
		const address = await mezon.mmnClient.getAddressFromUserId(req.userId);
		const response = await mezon.zkClient.getZkProofs({
			userId: req.userId,
			jwt: req.jwt,
			address,
			ephemeralPublicKey: ephemeralKeyPair.publicKey
		});
		if (response) {
			await thunkAPI.dispatch(walletActions.fetchWalletDetail({ userId: req.userId }));
			thunkAPI.dispatch(walletActions.setIsEnabledWallet(true));
		}

		return response;
	} catch (error) {
		if (error instanceof Error) {
			thunkAPI.dispatch(
				toastActions.addToast({
					message: error.message,
					type: 'error'
				})
			);
		}
	}
});

const sendTransaction = createAsyncThunk(
	'wallet/sendTransaction',
	async (
		{
			sender,
			recipient,
			amount,
			textData,
			extraInfo,
			isSendByAddress
		}: {
			sender?: string;
			recipient?: string;
			amount?: number;
			textData?: string;
			extraInfo?: ExtraInfo;
			isSendByAddress?: boolean;
		},
		thunkAPI
	) => {
		const zkProofs = selectZkProofs(thunkAPI.getState() as any);
		const ephemeralKeyPair = selectEphemeralKeyPair(thunkAPI.getState() as any);
		const walletDetail = selectWalletDetail(thunkAPI.getState() as any);

		if (!sender || !zkProofs || !ephemeralKeyPair) {
			thunkAPI.dispatch(
				toastActions.addToast({
					message: i18n.t('message:wallet.notAvailable'),
					type: 'error'
				})
			);
			return thunkAPI.rejectWithValue({ message: i18n.t('message:wallet.notAvailable'), errType: EErrorType.WALLET });
		}

		if (!recipient) {
			thunkAPI.dispatch(toastActions.addToast({ message: i18n.t('token:toast.error.mustSelectUser'), type: 'error' }));
			return thunkAPI.rejectWithValue(i18n.t('token:toast.error.mustSelectUser'));
		}

		if (!amount || amount <= 0) {
			thunkAPI.dispatch(
				toastActions.addToast({
					message: i18n.t('token:toast.error.amountMustThanZero'),
					type: 'error'
				})
			);
			return thunkAPI.rejectWithValue(i18n.t('token:toast.error.amountMustThanZero'));
		}

		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (!mezon.mmnClient) {
			return thunkAPI.rejectWithValue('MmnClient not initialized');
		}

		if (compareBigInt(walletDetail?.balance || '', mezon.mmnClient.scaleAmountToDecimals(amount)) < 0) {
			thunkAPI.dispatch(
				toastActions.addToast({
					message: i18n.t('token:toast.error.exceedWallet'),
					type: 'error'
				})
			);
			return thunkAPI.rejectWithValue(i18n.t('token:toast.error.exceedWallet'));
		}

		const currentNonce = await mezon.mmnClient.getCurrentNonce(sender, 'pending');

		if (currentNonce?.error) {
			const errMsg = safeJSONParse(currentNonce.error)?.message || currentNonce.error;
			thunkAPI.dispatch(toastActions.addToast({ message: errMsg || i18n.t('token:toast.error.anErrorOccurred'), type: 'error' }));
			return thunkAPI.rejectWithValue(errMsg);
		}

		const response = isSendByAddress
			? await mezon.mmnClient.sendTransactionByAddress({
					sender,
					recipient,
					amount: mezon.mmnClient.scaleAmountToDecimals(amount),
					nonce: currentNonce.nonce + 1,
					textData,
					extraInfo,
					publicKey: ephemeralKeyPair.publicKey,
					privateKey: ephemeralKeyPair.privateKey,
					zkProof: zkProofs.proof,
					zkPub: zkProofs.public_input
				})
			: await mezon.mmnClient.sendTransaction({
					sender,
					recipient,
					amount: mezon.mmnClient.scaleAmountToDecimals(amount),
					nonce: currentNonce.nonce + 1,
					textData,
					extraInfo,
					publicKey: ephemeralKeyPair.publicKey,
					privateKey: ephemeralKeyPair.privateKey,
					zkProof: zkProofs.proof,
					zkPub: zkProofs.public_input
				});

		if (!response?.ok) {
			const errMsg = safeJSONParse(response.error)?.message || response.error;
			thunkAPI.dispatch(toastActions.addToast({ message: errMsg || i18n.t('token:toast.error.anErrorOccurred'), type: 'error' }));
			return thunkAPI.rejectWithValue(errMsg);
		}

		return response;
	}
);

export const initialWalletState: WalletState = {
	loadingStatus: 'not loaded',
	error: null,
	wallet: undefined,
	zkProofs: undefined,
	ephemeralKeyPair: undefined,
	isEnabled: false
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
		},
		setIsEnabledWallet(state: WalletState, action: PayloadAction<boolean>) {
			try {
				state.isEnabled = action.payload;
			} catch (error) {
				console.error('Error updating isEnabled wallet by action:', error);
			}
		},
		setLogout(state) {
			state.address = undefined;
			state.wallet = undefined;
			state.zkProofs = undefined;
			state.ephemeralKeyPair = undefined;
			state.loadingStatus = 'not loaded';
		},
		resetState(state) {
			state.isEnabled = false;
			state.wallet = undefined;
			state.error = null;
			state.zkProofs = undefined;
			state.ephemeralKeyPair = undefined;
			state.loadingStatus = 'not loaded';
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
	fetchZkProofs,
	sendTransaction
};

export const selectWalletDetail = createSelector(getWalletState, (state) => state?.wallet);

export const selectZkProofs = createSelector(getWalletState, (state) => state?.zkProofs);

export const selectEphemeralKeyPair = createSelector(getWalletState, (state) => state?.ephemeralKeyPair);

export const selectAddress = createSelector(getWalletState, (state) => state?.address);

export const selectIsEnabledWallet = createSelector(getWalletState, (state) => state?.isEnabled);

export const selectIsWalletAvailable = createSelector(
	getWalletState,
	(state) => !!state?.isEnabled && !!state?.zkProofs && !!state?.ephemeralKeyPair
);
