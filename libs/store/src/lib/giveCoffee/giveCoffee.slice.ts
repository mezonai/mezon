import { captureSentryError } from '@mezon/logger';
import type { LoadingStatus } from '@mezon/utils';
import { AMOUNT_TOKEN } from '@mezon/utils';
import type { EntityState, PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiGiveCoffeeEvent } from 'mezon-js/api.gen';
import type { ApiTokenSentEvent } from 'mezon-js/dist/api.gen';
import type { AddTxResponse } from 'mmn-client-js';
import { ETransferType } from 'mmn-client-js';
import { ensureSession, getMezonCtx } from '../helpers';
import { toastActions } from '../toasts/toasts.slice';
import { walletActions } from '../wallet/wallet.slice';

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
	pendingGiveCoffee: boolean;
}

export const giveCoffeeAdapter = createEntityAdapter<GiveCoffeeEntity>();

export const updateGiveCoffee = createAsyncThunk(
	'giveCoffee/updateGiveCoffee',
	async ({ channel_id, clan_id, message_ref_id, receiver_id, sender_id }: ApiGiveCoffeeEvent, thunkAPI) => {
		const state = thunkAPI.getState() as any;
		if (!state.giveCoffee.pendingGiveCoffee) {
			try {
				thunkAPI.dispatch(giveCoffeeActions.setPendingGiveCoffee(true));

				const mezon = await ensureSession(getMezonCtx(thunkAPI));

				const response = await thunkAPI
					.dispatch(
						walletActions.sendTransaction({
							sender: sender_id,
							recipient: receiver_id,
							amount: AMOUNT_TOKEN.TEN_THOUSAND_TOKENS,
							textData: 'givecoffee',
							extraInfo: {
								type: ETransferType.GiveCoffee,
								ChannelId: channel_id || '',
								ClanId: clan_id || '',
								MessageRefId: message_ref_id || '',
								UserReceiverId: receiver_id || '',
								UserSenderId: sender_id || '',
								UserSenderUsername: mezon.session.username || ''
							}
						})
					)
					.then((action) => action?.payload as AddTxResponse);

				if (response?.ok) {
					thunkAPI.dispatch(toastActions.addToast({ message: 'Coffee sent', type: 'success' }));
					return response.ok;
				} else {
					return thunkAPI.rejectWithValue('');
				}
			} catch (error) {
				captureSentryError(error, 'giveCoffee/updateGiveCoffee');
				return thunkAPI.rejectWithValue(error);
			} finally {
				setTimeout(() => {
					thunkAPI.dispatch(giveCoffeeActions.setPendingGiveCoffee(false));
				}, 300);
			}
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
	sendTokenEvent: null,
	pendingGiveCoffee: false
});

export const sendToken = createAsyncThunk('token/sendToken', async (tokenEvent: ApiTokenSentEvent, thunkAPI) => {
	try {
		const mezon = await ensureSession(getMezonCtx(thunkAPI));

		const response = await thunkAPI
			.dispatch(
				walletActions.sendTransaction({
					sender: tokenEvent.sender_id,
					recipient: tokenEvent.receiver_id,
					amount: tokenEvent.amount,
					textData: tokenEvent.note,
					extraInfo: {
						type: ETransferType.TransferToken,
						UserReceiverId: tokenEvent.receiver_id || '',
						UserSenderId: tokenEvent.sender_id || '',
						UserSenderUsername: mezon.session.username || ''
					}
				})
			)
			.then((action) => action?.payload as AddTxResponse);

		if (response?.ok) {
			thunkAPI.dispatch(toastActions.addToast({ message: 'Funds Transferred', type: 'success' }));
			thunkAPI.dispatch(giveCoffeeActions.updateTokenUser({ tokenEvent }));
			return { ...response, tx_hash: response.tx_hash };
		} else {
			return thunkAPI.rejectWithValue('');
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
		},
		setPendingGiveCoffee: (state, action: PayloadAction<boolean>) => {
			state.pendingGiveCoffee = action.payload;
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
