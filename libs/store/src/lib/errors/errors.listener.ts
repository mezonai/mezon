import { LIMIT_CLAN_ITEM, trackError } from '@mezon/utils';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/browser';
import type { EErrorType, Toast, ToastPayload } from '../toasts';
import { toastActions } from '../toasts';
import { triggerClanLimitModal } from './errors.slice';

interface ErrorAction {
	type: string;
	payload?: {
		status?: number;
		error?: { status?: number };
		errType?: EErrorType;
		json?: () => Promise<{ message: string }>;
		[key: string]: unknown;
	};
	error?: { message?: string };
	meta?: { error?: { toast?: boolean | string | object } };
	message?: string;
	config?: { toast?: boolean | string | object };
	action?: ErrorAction;
}

export const errorListenerMiddleware = createListenerMiddleware({
	onError: (error, _listenerApi) => {
		console.error('errorListenerMiddleware', error);
	}
});

let hasDispatchedRefreshOnce = false;
let isRefreshing = false;

export function resetRefreshState() {
	hasDispatchedRefreshOnce = false;
	isRefreshing = false;
}

function isErrorPredicate(action: ErrorAction) {
	return !!action.error;
}

function isRejectedWithValue(action: ErrorAction) {
	return action.type.endsWith('rejected') && action.payload !== undefined && action.error && action.error.message === 'Rejected';
}

function getErrorFromRejectedWithValue(action: ErrorAction): ErrorAction {
	let message = action.error?.message;

	if (typeof action.payload === 'string') {
		message = action.payload;
	} else if (typeof action.payload === 'object' && action.payload != null && 'message' in action.payload) {
		message = action.payload.message as string;
	} else if (typeof action.payload === 'object' && action.payload != null && action.payload.error) {
		if (typeof action.payload.error === 'string') {
			message = action.payload.error;
		} else if (typeof action.payload.error === 'object' && 'message' in action.payload.error) {
			message = (action.payload.error as { message?: string }).message;
		}
	}

	return {
		message,
		error: action.error,
		action,
		config: action.meta?.error || {
			toast: true
		},
		type: action.type
	};
}

function normalizeError(error: ErrorAction) {
	if (isRejectedWithValue(error)) {
		return getErrorFromRejectedWithValue(error);
	}

	return error;
}

function createErrorToast(error: ErrorAction): ToastPayload {
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

errorListenerMiddleware.startListening({
	predicate: isErrorPredicate,
	effect: async (action: ErrorAction, listenerApi) => {
		const error = normalizeError(action);

		if (!error) {
			return;
		}

		const errorMessage = error?.message || action?.error?.message || '';
		if (typeof errorMessage === 'string' && errorMessage.includes('Request cancelled')) {
			return;
		}

		trackError(error);

		const toast = createErrorToast(error);

		if (action.payload) {
			const key = Object.keys(action.payload);

			const getMessageFromPayload = async (payload: ErrorAction['payload']) => {
				if (key.length === 0) {
					if (payload && typeof payload.json === 'function') {
						const data = await payload.json();
						return data.message;
					}
				} else {
					const payloadItem = payload?.[key[0]];
					if (payloadItem && typeof payloadItem === 'object' && 'json' in payloadItem && typeof payloadItem.json === 'function') {
						const data = await (payloadItem as { json: () => Promise<{ message: string }> }).json();
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
			if (toast.message === 'Redirect Login') {
				return;
			}

			const isMaxClanLimitError = toast.message && typeof toast.message === 'string' && toast.message.includes('clan limit exceeded');

			if (isMaxClanLimitError) {
				listenerApi.dispatch(
					triggerClanLimitModal({
						type: 'join',
						clanCount: LIMIT_CLAN_ITEM
					})
				);
				return;
			}

			const isAuthTokenError =
				toast.message &&
				typeof toast.message === 'string' &&
				(toast.message.toLowerCase().includes('auth token') ||
					toast.message.toLowerCase().includes('malformed') ||
					toast.message.toLowerCase().includes('token expired'));

			if (isAuthTokenError) {
				return;
			}

			listenerApi.dispatch(
				toastActions.addToastError({
					message: toast.message as string,
					errType: action.payload?.errType
				})
			);
		}
	}
});
