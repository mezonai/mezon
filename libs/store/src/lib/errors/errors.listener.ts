import { LIMIT_CLAN_ITEM, trackError } from '@mezon/utils';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/browser';
import { authActions } from '../auth/auth.slice';
import type { Toast, ToastPayload } from '../toasts';
import { toastActions } from '../toasts';
import { triggerClanLimitModal } from './errors.slice';

export const errorListenerMiddleware = createListenerMiddleware({
	onError: (error, _listenerApi) => {
		console.error('errorListenerMiddleware', error);
	}
});

let hasDispatchedRefreshOnce = false;
let isRefreshing = false;

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
		action,
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

errorListenerMiddleware.startListening({
	predicate: isErrorPredicate,
	effect: async (action: any, listenerApi) => {
		try {
			const isRefreshAction = typeof action.type === 'string' && action.type.startsWith('auth/refreshSession');

			if (!isRefreshAction && !hasDispatchedRefreshOnce && !isRefreshing) {
				let status: number | undefined = action?.payload?.status ?? action?.payload?.error?.status;
				if (status == null && action?.payload && typeof action.payload === 'object') {
					status = action?.payload?.status;
				}

				if (status === 401) {
					isRefreshing = true;
					hasDispatchedRefreshOnce = true;
					try {
						await listenerApi.dispatch(authActions.refreshSession());
					} finally {
						isRefreshing = false;
					}
				}
			}
		} catch (e) {
			console.error(e);
		}

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

			listenerApi.dispatch(
				toastActions.addToastError({
					message: toast.message as string,
					errType: action.payload?.errType
				})
			);
		}
	}
});
