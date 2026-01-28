import i18n from '@mezon/translations';
import { compareBigInt, type LoadingStatus } from '@mezon/utils';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { safeJSONParse } from 'mezon-js';
import type { ClaimRedEnvelopeQRResponse, ExtraInfo, IEphemeralKeyPair, IZkProof } from 'mmn-client-js';
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

		return {
			response,
			ephemeralKeyPair
		};
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
			isSendByAddress,
			isMobile = false
		}: {
			sender?: string;
			recipient?: string;
			amount?: number;
			textData?: string;
			extraInfo?: ExtraInfo;
			isSendByAddress?: boolean;
			isMobile?: boolean;
		},
		thunkAPI
	) => {
		const notifyError = (message: string) => {
			if (!isMobile) {
				thunkAPI.dispatch(toastActions.addToast({ message, type: 'error' }));
			}
		};

		const zkProofs = selectZkProofs(thunkAPI.getState() as any);
		const ephemeralKeyPair = selectEphemeralKeyPair(thunkAPI.getState() as any);
		const walletDetail = selectWalletDetail(thunkAPI.getState() as any);

		if (!sender || !zkProofs || !ephemeralKeyPair) {
			const errMsg = i18n.t('message:wallet.notAvailable');
			notifyError(errMsg);
			return thunkAPI.rejectWithValue({ message: i18n.t('message:wallet.notAvailable'), errType: EErrorType.WALLET });
		}

		if (!recipient) {
			const errMsg = i18n.t('token:toast.error.mustSelectUser');
			notifyError(errMsg);
			return thunkAPI.rejectWithValue(errMsg);
		}

		if (!amount || amount <= 0) {
			const errMsg = i18n.t('token:toast.error.amountMustThanZero');
			notifyError(errMsg);
			return thunkAPI.rejectWithValue(errMsg);
		}

		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (!mezon.mmnClient) {
			return thunkAPI.rejectWithValue('MmnClient not initialized');
		}

		if (compareBigInt(walletDetail?.balance || '', mezon.mmnClient.scaleAmountToDecimals(amount)) < 0) {
			const errMsg = i18n.t('token:toast.error.exceedWallet');
			notifyError(errMsg);
			return thunkAPI.rejectWithValue(errMsg);
		}

		const currentNonce = await mezon.mmnClient.getCurrentNonce(sender, 'pending');

		if (currentNonce?.error) {
			const errMsg = safeJSONParse(currentNonce.error)?.message || currentNonce.error;
			notifyError(errMsg || i18n.t('token:toast.error.anErrorOccurred'));
			return thunkAPI.rejectWithValue(errMsg || i18n.t('token:toast.error.anErrorOccurred'));
		}

		try {
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
				notifyError(errMsg || i18n.t('token:toast.error.anErrorOccurred'));
				return thunkAPI.rejectWithValue(errMsg || i18n.t('token:toast.error.anErrorOccurred'));
			}

			return response;
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : i18n.t('token:toast.error.anErrorOccurred');
			notifyError(errMsg);
			return thunkAPI.rejectWithValue(errMsg);
		}
	}
);

const claimAmountRedEnvelopeQR = createAsyncThunk(
	'wallet/claimAmountRedEnvelopeQR',
	async (
		{
			id,
			userId
		}: {
			id: string;
			userId: string;
		},
		thunkAPI
	) => {
		const zkProofs = selectZkProofs(thunkAPI.getState() as any);
		const ephemeralKeyPair = selectEphemeralKeyPair(thunkAPI.getState() as any);
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (!mezon.dongClient) {
			return thunkAPI.rejectWithValue('DongClient not initialized');
		}

		const response = await mezon.dongClient.claimAmountRedEnvelopeQR({
			id,
			user_id: userId,
			proof_b64: zkProofs?.proof || '',
			public_b64: zkProofs?.public_input || '',
			publickey: ephemeralKeyPair?.publicKey || ''
		});

		return response as ClaimRedEnvelopeQRResponse;
	}
);

const claimRedEnvelopeQR = createAsyncThunk(
	'wallet/claimAmountRedEnvelopeQR',
	async (
		{
			id,
			splitMoneyId,
			userId
		}: {
			id: string;
			splitMoneyId: number;
			userId: string;
		},
		thunkAPI
	) => {
		const zkProofs = selectZkProofs(thunkAPI.getState() as any);
		const ephemeralKeyPair = selectEphemeralKeyPair(thunkAPI.getState() as any);
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		if (!mezon.dongClient) {
			return thunkAPI.rejectWithValue('DongClient not initialized');
		}

		const response = await mezon.dongClient.claimRedEnvelopeQR(id, {
			split_money_id: splitMoneyId,
			user_id: userId,
			proof_b64: zkProofs?.proof || '',
			public_b64: zkProofs?.public_input || '',
			publickey: ephemeralKeyPair?.publicKey || ''
		});

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
			state.wallet = undefined;
			state.zkProofs = undefined;
			state.ephemeralKeyPair = undefined;
			state.loadingStatus = 'not loaded';
			state.error = null;
			state.isEnabled = false;
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
				state.zkProofs = action.payload?.response;
				if (action?.payload?.ephemeralKeyPair) {
					state.ephemeralKeyPair = action.payload.ephemeralKeyPair;
				}
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
	fetchEphemeralKeyPair,
	fetchZkProofs,
	sendTransaction,
	claimAmountRedEnvelopeQR,
	claimRedEnvelopeQR
};

export const selectWalletDetail = createSelector(getWalletState, (state) => state?.wallet);

export const selectZkProofs = createSelector(getWalletState, (state) => state?.zkProofs);

export const selectEphemeralKeyPair = createSelector(getWalletState, (state) => state?.ephemeralKeyPair);

export const selectAddress = createSelector(getWalletState, (state) => state?.wallet?.address);

export const selectIsEnabledWallet = createSelector(getWalletState, (state) => state?.isEnabled);

export const selectIsWalletAvailable = createSelector(
	getWalletState,
	(state) => !!state?.isEnabled && !!state?.zkProofs && !!state?.ephemeralKeyPair
);
