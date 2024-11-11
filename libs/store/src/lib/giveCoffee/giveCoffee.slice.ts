import { LoadingStatus } from '@mezon/utils';
import { EntityState, PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { ApiGiveCoffeeEvent } from 'mezon-js/api.gen';
import { TokenSentEvent } from 'mezon-js/dist/socket';
import { ensureSession, ensureSocket, getMezonCtx } from '../helpers';
import { toastActions } from '../toasts/toasts.slice';

export const GIVE_COFEE = 'giveCoffee';

export interface GiveCoffeeEntity {
	id: string; // Primary ID
}

export interface GiveCoffeeState extends EntityState<GiveCoffeeEntity, string> {
	loadingStatus: LoadingStatus;
	error?: string | null;
	showModalSendToken: boolean;
	tokenSocket: Record<string, ApiGiveCoffeeEvent>;
	tokenUpdate: Record<string, number>;
}

export const giveCoffeeAdapter = createEntityAdapter<GiveCoffeeEntity>();

export const updateGiveCoffee = createAsyncThunk(
	'giveCoffee/updateGiveCoffee',
	async ({ channel_id, clan_id, message_ref_id, receiver_id, sender_id, token_count }: ApiGiveCoffeeEvent, thunkAPI) => {
		try {
			const mezon = await ensureSession(getMezonCtx(thunkAPI));

			const response = await mezon.client.givecoffee(mezon.session, {
				channel_id,
				clan_id,
				message_ref_id,
				receiver_id,
				sender_id,
				token_count
			});
			if (!response) {
				return thunkAPI.rejectWithValue([]);
			}
			return response;
		} catch (error: any) {
			const errmsg = await error.json();
			return thunkAPI.rejectWithValue(errmsg.message);
		}
	}
);

export const initialGiveCoffeeState: GiveCoffeeState = giveCoffeeAdapter.getInitialState({
	loadingStatus: 'not loaded',
	clans: [],
	error: null,
	showModalSendToken: false,
	tokenSocket: {},
	tokenUpdate: {}
});

export const sendToken = createAsyncThunk('token/sendToken', async (tokenEvent: TokenSentEvent, thunkAPI) => {
	try {
		const mezon = await ensureSocket(getMezonCtx(thunkAPI));
		const response = await mezon.socketRef.current?.sendToken(tokenEvent.receiver_id, tokenEvent.amount);

		if (response) {
			thunkAPI.dispatch(toastActions.addToast({ message: 'Token sent successfully', type: 'success', id: 'ACTION_SEND_TOKEN_SUCCESS' }));
			thunkAPI.dispatch(giveCoffeeActions.updateTokenUser({ tokenEvent }));
			return response;
		} else {
			thunkAPI.dispatch(toastActions.addToast({ message: 'An error occurred, please try again', type: 'error', id: 'ACTION_SEND_TOKEN_FAILD' }));
		}
	} catch (error: any) {
		const errmsg = await error.json();
		return thunkAPI.rejectWithValue(errmsg.message);
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
		updateTokenUser: (state, action: PayloadAction<{ tokenEvent: TokenSentEvent }>) => {
			const { tokenEvent } = action.payload;
			const userId = tokenEvent.sender_id;
			if (!userId) return;
			state.tokenUpdate[userId] = state.tokenUpdate[userId] ?? 0;
			state.tokenSocket[userId] = tokenEvent ?? {};

			if (userId === tokenEvent.sender_id) {
				state.tokenUpdate[userId] -= tokenEvent.amount;
			}
		},
		handleSocketToken: (state, action: PayloadAction<{ currentUserId: string; tokenEvent: TokenSentEvent }>) => {
			const { currentUserId, tokenEvent } = action.payload;
			if (!currentUserId) return;
			if (currentUserId !== tokenEvent.receiver_id) return;

			state.tokenUpdate[currentUserId] = state.tokenUpdate[currentUserId] ?? 0;
			state.tokenSocket[currentUserId] = tokenEvent ?? {};

			if (currentUserId === tokenEvent.receiver_id) {
				state.tokenUpdate[currentUserId] += tokenEvent.amount;
			}
		},
		setTokenFromSocket: (state, action: PayloadAction<{ userId: string | undefined; coffeeEvent: ApiGiveCoffeeEvent }>) => {
			const { userId, coffeeEvent } = action.payload;

			if (!userId) return;

			state.tokenUpdate[userId] = state.tokenUpdate[userId] ?? 0;
			state.tokenSocket[userId] = coffeeEvent ?? {};

			if (userId === coffeeEvent.receiver_id) {
				state.tokenUpdate[userId] += 1;
			} else if (userId === coffeeEvent.sender_id) {
				state.tokenUpdate[userId] -= 1;
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
