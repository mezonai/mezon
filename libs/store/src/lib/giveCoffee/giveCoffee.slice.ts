import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import { WalletStorage } from '@mezon/utils';
import { ETransferType } from '@mezonai/mmn-client-js';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiGiveCoffeeEvent } from 'mezon-js/api.gen';
import type { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import { selectUserById } from '../channels/listUsers.slice';
import { ensureSession, getMezonCtx, getMmnClient } from '../helpers';
import type { RootState } from '../store';
import { toastActions } from '../toasts/toasts.slice';

export const GIVE_COFEE = 'giveCoffee';
export const TOKEN_SUCCESS_STATUS = 'SUCCESS';
export const TOKEN_FAILED_STATUS = 'FAILED';

export interface GiveCoffeeEntity {
	id: string; // Primary ID
}

export interface ISendTokenDetailType extends ApiTokenSentEvent {
	receiver_name?: string;
}
export interface GiveCoffeeState extends EntityState<GiveCoffeeEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	showModalSendToken: boolean;
	tokenSocket: Record<string, ApiGiveCoffeeEvent>;
	tokenUpdate: Record<string, number>;
	infoSendToken: ISendTokenDetailType | null;
	sendTokenEvent: {
		tokenEvent: ApiTokenSentEvent;
		status: string;
	} | null;
}

export const giveCoffeeAdapter = createEntityAdapter<GiveCoffeeEntity>();

export const updateGiveCoffee = createAsyncThunk(
	'giveCoffee/updateGiveCoffee',
	async ({ channel_id, clan_id, message_ref_id, receiver_id, sender_id, token_count }: ApiGiveCoffeeEvent, thunkAPI) => {
		try {
			const encryptedWallet = await WalletStorage.getEncryptedWallet(sender_id || '');
			if (!encryptedWallet) {
				thunkAPI.dispatch(
					toastActions.addToast({
						message: 'Wallet not available. Please enable wallet.',
						type: 'error'
					})
				);
				return thunkAPI.rejectWithValue('Wallet not available');
			}

			const mezon = await ensureSession(getMezonCtx(thunkAPI));
			const mmnClient = getMmnClient(thunkAPI);

			// Resolve recipient address from store
			let recipientAddress: string | null = null;
			if (receiver_id) {
				const state = thunkAPI.getState() as RootState;
				recipientAddress = selectUserById(state, receiver_id)?.wallet_address || null;
			}

			if (!recipientAddress) {
				thunkAPI.dispatch(toastActions.addToast({ message: 'Recipient wallet not found', type: 'error' }));
				return thunkAPI.rejectWithValue('Recipient wallet not found');
			}

			const senderWalletAccount = await mmnClient.getAccountByAddress(encryptedWallet.address);

			const response = await mmnClient.sendTransaction({
				sender: encryptedWallet.address,
				recipient: recipientAddress,
				amount: mmnClient.scaleAmountToDecimals(token_count ?? 0, senderWalletAccount.decimals),
				nonce: senderWalletAccount.nonce + 1,
				textData: 'givecoffee',
				extraInfo: {
					type: ETransferType.GiveCoffee,
					ChannelId: channel_id || '',
					ClanId: clan_id || '',
					MessageRefId: message_ref_id || '',
					UserReceiverId: receiver_id || '',
					UserSenderId: sender_id || '',
					UserSenderUsername: mezon.session.username || ''
				},
				privateKey: encryptedWallet.privateKey
			});

			if (response?.ok) {
				thunkAPI.dispatch(toastActions.addToast({ message: 'Coffee sent', type: 'success' }));
				return response?.ok;
			} else {
				const errorMessage = response?.error || 'An error occurred, please try again';
				thunkAPI.dispatch(toastActions.addToast({ message: errorMessage, type: 'error' }));
				return thunkAPI.rejectWithValue(errorMessage);
			}
		} catch (error) {
			captureSentryError(error, 'giveCoffee/updateGiveCoffee');
			return thunkAPI.rejectWithValue(error);
		}
	}
);

export const initialGiveCoffeeState: GiveCoffeeState = giveCoffeeAdapter.getInitialState({
	loadingStatus: 'not loaded',
	clans: [],
	error: null,
	showModalSendToken: false,
	tokenSocket: {},
	tokenUpdate: {},
	infoSendToken: null,
	sendTokenEvent: null
});

export const sendToken = createAsyncThunk('token/sendToken', async (tokenEvent: ApiTokenSentEvent, thunkAPI) => {
	try {
		const encryptedWallet = await WalletStorage.getEncryptedWallet(tokenEvent.sender_id || '');
		if (!encryptedWallet) {
			thunkAPI.dispatch(
				toastActions.addToast({
					message: 'Wallet not available. Please enable wallet.',
					type: 'error'
				})
			);
			return thunkAPI.rejectWithValue('Wallet not available');
		}
		const mezon = await ensureSession(getMezonCtx(thunkAPI));
		const mmnClient = getMmnClient(thunkAPI);

		let recipientAddress: string | null = null;
		if (tokenEvent.receiver_id) {
			const state = thunkAPI.getState() as RootState;
			recipientAddress = selectUserById(state, tokenEvent.receiver_id)?.wallet_address || null;
		}

		if (!recipientAddress) {
			thunkAPI.dispatch(toastActions.addToast({ message: 'Recipient wallet not found', type: 'error' }));
			return thunkAPI.rejectWithValue('Recipient wallet not found');
		}

		const senderWalletAccount = await mmnClient.getAccountByAddress(encryptedWallet.address);

		const response = await mmnClient.sendTransaction({
			sender: encryptedWallet.address,
			recipient: recipientAddress,
			amount: mmnClient.scaleAmountToDecimals(tokenEvent.amount ?? 0, senderWalletAccount.decimals),
			nonce: senderWalletAccount.nonce + 1,
			textData: tokenEvent.note,
			extraInfo: {
				type: ETransferType.TransferToken,
				UserReceiverId: tokenEvent.receiver_id || '',
				UserSenderId: tokenEvent.sender_id || '',
				UserSenderUsername: mezon.session.username || ''
			},
			privateKey: encryptedWallet.privateKey
		});

		if (response.ok) {
			thunkAPI.dispatch(toastActions.addToast({ message: 'Funds Transferred', type: 'success' }));
			thunkAPI.dispatch(giveCoffeeActions.updateTokenUser({ tokenEvent }));
			return { ...response, tx_hash: response.tx_hash };
		} else {
			thunkAPI.dispatch(toastActions.addToast({ message: response.error || 'An error occurred, please try again', type: 'error' }));
			return thunkAPI.rejectWithValue(response.error);
		}
	} catch (error) {
		captureSentryError(error, 'token/sendToken');
		thunkAPI.dispatch(
			toastActions.addToast({
				message: error instanceof Error ? error.message : 'Transaction failed',
				type: 'error'
			})
		);
		return thunkAPI.rejectWithValue(error);
	}
});

export const giveCoffeeSlice = createSlice({
	name: GIVE_COFEE,
	initialState: initialGiveCoffeeState,
	reducers: {
		add: giveCoffeeAdapter.addOne,
		remove: giveCoffeeAdapter.removeOne,
		setShowModalSendToken: (state, action: PayloadAction<boolean>) => {
			state.showModalSendToken = action.payload;
		},
		setInfoSendToken: (state, action: PayloadAction<ISendTokenDetailType | null>) => {
			state.infoSendToken = action.payload;
		},
		setSendTokenEvent: (state, action) => {
			state.sendTokenEvent = action.payload;
		},
		updateTokenUser: (state, action: PayloadAction<{ tokenEvent: ApiTokenSentEvent }>) => {
			const { tokenEvent } = action.payload;
			const userId = tokenEvent.sender_id;
			if (!userId) return;
			state.tokenUpdate[userId] = state.tokenUpdate[userId] ?? 0;
			state.tokenSocket[userId] = tokenEvent ?? {};

			if (userId === tokenEvent.sender_id) {
				state.tokenUpdate[userId] -= tokenEvent.amount || 0;
			}
		},
		handleSocketToken: (state, action: PayloadAction<{ currentUserId: string; tokenEvent: ApiTokenSentEvent }>) => {
			const { currentUserId, tokenEvent } = action.payload;
			if (!currentUserId) return;
			if (currentUserId !== tokenEvent.receiver_id) return;

			state.tokenUpdate[currentUserId] = state.tokenUpdate[currentUserId] ?? 0;
			state.tokenSocket[currentUserId] = tokenEvent ?? {};

			if (currentUserId === tokenEvent.receiver_id) {
				state.tokenUpdate[currentUserId] += tokenEvent.amount || 0;
			}
		}
	}
});

/*
 * Export reducer for store configuration.
 */
export const giveCoffeeReducer = giveCoffeeSlice.reducer;

/*
 * Export action creators to be dispatched. For use with the `useDispatch` hook.
 *
 * e.g.
 * ```
 * import React, { useEffect } from 'react';
 * import { useDispatch } from 'react-redux';
 *
 * // ...
 *
 * const dispatch = useDispatch();
 * useEffect(() => {
 *   dispatch(clansActions.add({ id: 1 }))
 * }, [dispatch]);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#usedispatch
 */
export const giveCoffeeActions = {
	...giveCoffeeSlice.actions,
	updateGiveCoffee,
	sendToken
};

/*
 * Export selectors to query state. For use with the `useSelector` hook.
 *
 * e.g.
 * ```
 * import { useSelector } from 'react-redux';
 *
 * // ...
 *
 * const entities = useSelector(selectAllClans);
 * ```
 *
 * See: https://react-redux.js.org/next/api/hooks#useselector
 */
export const getCoffeeState = (rootState: { [GIVE_COFEE]: GiveCoffeeState }): GiveCoffeeState => rootState[GIVE_COFEE];

export const selectShowModalSendToken = createSelector(getCoffeeState, (state) => state.showModalSendToken);

export const selectInfoSendToken = createSelector(getCoffeeState, (state) => state.infoSendToken);

export const selectSendTokenEvent = createSelector(getCoffeeState, (state) => state.sendTokenEvent);

export const selectUpdateToken = (userId: string) =>
	createSelector(getCoffeeState, (state) => {
		const tokenUpdate = state?.tokenUpdate || {};
		const tokenValue = tokenUpdate[userId];
		return typeof tokenValue === 'number' && !isNaN(tokenValue) ? tokenValue : 0;
	});
export const selectTokenSocket = (userId: string) =>
	createSelector(getCoffeeState, (state) => {
		const tokenSocket = state?.tokenSocket || {};
		return tokenSocket[userId];
	});
