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
	} else if (typeof action.payload === 'object' && action.payload != null && action.payload.message) {
		message = action.payload.message;
	} else if (typeof action.payload === 'object' && action.payload != null && action.payload.error) {
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

		if (!error) {
			return;
		}

		trackError(error);

		const toast = createErrorToast(error);

		if (action.payload) {
			const key = Object.keys(action.payload);

			const getMessageFromPayload = async (payload: any) => {
				if (key.length === 0) {
					if (typeof payload.json === 'function') {
						const data = await payload.json();
						return data.message;
					}
				} else {
					if (typeof payload[key[0]].json === 'function') {
						const data = await payload[key[0]].json();
						return data.message;
					}
				}
				return null;
			};

			const messageFromServer = await getMessageFromPayload(action.payload);
			if (messageFromServer) {
				if (toast) {
					toast.message = messageFromServer;
				}
				Sentry.captureException(messageFromServer);
			} else {
				Sentry.captureException(action.payload);
			}
		}

		if (!toast) {
			return;
		}
		if (toast.type === 'error') {
			listenerApi.dispatch(toastActions.setErrorToastStatus(true));
		}
	}
});
