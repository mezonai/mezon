import { trackError } from '@mezon/utils';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/browser';
import { Toast, ToastPayload, toastActions } from '../toasts';

// Create the middleware instance and methods
export const errorListenerMiddleware = createListenerMiddleware({
	onError: (error, listenerApi) => {
		console.error('errorListenerMiddleware', error);
	}
});

function isErrorPredicate(action: any) {
	return !!action.error;
}

function isRejectedWithValue(action: any) {
	return action.type.endsWith('rejected') && action.payload !== undefined && action.error && action.error.message === 'Rejected';
}

function getErrorFromRejectedWithValue(action: any) {
	let message = action.error.message;

	if (typeof action.payload === 'string') {
		message = action.payload;
	} else if (typeof action.payload === 'object' && action.payload.message) {
		message = action.payload.message;
	} else if (typeof action.payload === 'object' && action.payload.error) {
		if (typeof action.payload.error === 'string') {
			message = action.payload.error;
		} else if (typeof action.payload.error === 'object' && action.payload.error.message) {
			message = action.payload.error.message;
		}
	}

	return {
		message,
		error: action.error,
		action: action,
		config: action.meta.error || {
			toast: true
		}
	};
}

function normalizeError(error: any) {
	if (isRejectedWithValue(error)) {
		return getErrorFromRejectedWithValue(error);
	}

	return error;
}

function createErrorToast(error: any): ToastPayload {
	let toast: Toast = {
		message: error.message,
		type: 'error',
		id: Date.now().toString(),
		position: 'top-right'
	};

	if (typeof error.config === 'object' && error.config.toast) {
		if (typeof error.config.toast === 'string') {
			toast.message = error.config.toast;
		}

		if (typeof error.config.toast === 'object') {
			toast = {
				...toast,
				...error.config.toast
			};
		}
	}

	return toast;
}

// Add one or more listener entries that look for specific actions.
// They may contain any sync or async logic, similar to thunks.
errorListenerMiddleware.startListening({
	//   actionCreator: anyActionCreator,
	predicate: isErrorPredicate,
	effect: async (action: any, listenerApi) => {
		const error = normalizeError(action);

		trackError(error);

		if (action.payload) {
			const key = Object.keys(action.payload);
			if (key.length === 0) {
				if (typeof action.payload.json === 'function') {
					action.payload.json().then((data: any) => {
						Sentry.captureException(data.message);
					});
				}
			} else {
				if (typeof action.payload[key[0]].json === 'function') {
					action.payload[key[0]].json().then((data: any) => {
						Sentry.captureException(data.message);
					});
				} else {
					Sentry.captureException(action.payload);
				}
			}
		}

		if (!error) {
			return;
		}

		if (error && error.config && !error.config.toast) {
			return;
		}

		const toast = createErrorToast(error);

		if (!toast) {
			return;
		}

		listenerApi.dispatch(toastActions.addToast(toast));
	}
});
