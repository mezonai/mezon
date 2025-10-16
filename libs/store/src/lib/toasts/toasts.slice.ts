import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Toast, ToastPayload } from './types';

export const TOASTS_FEATURE_KEY = 'toasts';

// Create an adapter for the toasts
const toastsAdapter = createEntityAdapter<Toast>();

const activeTimers = new Map<string, NodeJS.Timeout>();

export enum EErrorType {
	WALLET = 'wallet'
}

const initialState = {
	...toastsAdapter.getInitialState(),
	toastErrors: [] as { id: string; message: string; errType?: EErrorType }[]
};
const addToast = createAsyncThunk(
	'toasts/addToast',
	async (payload: ToastPayload, thunkAPI) => {
		const id = payload?.id || Date.now().toString();

		const newToast: Toast = {
			id,
			message: payload.message,
			position: payload.position || 'top-right',
			autoClose: payload.autoClose ?? 3000,
			hideProgressBar: payload.hideProgressBar || false,
			closeOnClick: payload.closeOnClick || true,
			pauseOnHover: payload.pauseOnHover || true,
			draggable: payload.draggable || true,
			theme: payload.theme || 'light',
			type: payload.type || 'info'
		};

		thunkAPI.dispatch(toastsSlice.actions.addOneToast(newToast));

		if (newToast.autoClose !== false && typeof newToast.autoClose === 'number' && newToast.autoClose > 0) {
			const existingTimer = activeTimers.get(id);
			if (existingTimer) {
				clearTimeout(existingTimer);
			}

			const timer = setTimeout(() => {
				const currentState = thunkAPI.getState() as { toasts: typeof initialState };
				const toastExists = selectToastById(currentState, id);

				if (toastExists) {
					thunkAPI.dispatch(toastsSlice.actions.removeToast(id));
				}

				activeTimers.delete(id);
			}, newToast.autoClose);

			activeTimers.set(id, timer);
		}

		return newToast;
	},
	{
		condition: (toast, { getState }) => {
			const toasts = selectToasts(getState() as { toasts: typeof initialState });
			if (toasts.length >= 5) {
				return false;
			}

			// If the toast is a duplicate, don't add it
			if (toasts.find((t) => t.message === toast.message)) {
				return false;
			}
		}
	}
);

// Create the slice
export const toastsSlice = createSlice({
	name: TOASTS_FEATURE_KEY,
	initialState,
	reducers: {
		addOneToast: toastsAdapter.addOne,
		removeToast: (state, action: PayloadAction<string>) => {
			const toastId = action.payload;
			const timer = activeTimers.get(toastId);
			if (timer) {
				clearTimeout(timer);
				activeTimers.delete(toastId);
			}

			toastsAdapter.removeOne(state, action.payload);
		},
		clearToasts: (state) => {
			activeTimers.forEach((timer) => clearTimeout(timer));
			activeTimers.clear();

			toastsAdapter.removeAll(state);
		},
		addToastError: (state, action: PayloadAction<{ message?: string; errType?: EErrorType }>) => {
			const message = action.payload.message;
			if (!message || state.toastErrors.find((error) => error.message === message)) {
				return;
			}
			const id = Date.now().toString();
			state.toastErrors.push({ id, message, errType: action.payload.errType });
		},
		removeToastError: (state, action: PayloadAction<string>) => {
			state.toastErrors = state.toastErrors.filter((error) => error.id !== action.payload);
		},
		clearAllToastErrors: (state) => {
			state.toastErrors = [];
		}
	}
});

export const { addOneToast, removeToast, clearToasts, addToastError, removeToastError, clearAllToastErrors } = toastsSlice.actions;

export const toastActions = {
	addToast,
	removeToast,
	clearToasts,
	addToastError,
	removeToastError,
	clearAllToastErrors
};

// Create selectors using the adapter's getSelectors method
export const { selectAll: selectToasts, selectById: selectToastById } = toastsAdapter.getSelectors(
	(state: { toasts: typeof initialState }) => state.toasts
);
export const selectToastErrors = createSelector([(state: { toasts: typeof initialState }) => state.toasts], (toastsState) => toastsState.toastErrors);

export const toastsReducer = toastsSlice.reducer;
