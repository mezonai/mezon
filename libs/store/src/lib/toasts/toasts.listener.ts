import type { Action } from '@reduxjs/toolkit';
import { createListenerMiddleware } from '@reduxjs/toolkit';
import { toastActions } from './toasts.slice';

// Define the type for actions that include a toast in their meta
interface ToastMeta {
	toast: {
		id: string;
		message: string;
		type: 'success' | 'error' | 'info';
	};
}

interface ToastAction extends Action {
	meta: ToastMeta;
}

type MaybeToastAction = ToastAction | Action;

// Create the middleware instance and methods
export const toastListenerMiddleware = createListenerMiddleware();

function isToastAction(action: Action): action is ToastAction {
	return (action as ToastAction).meta?.toast !== undefined;
}

// Type guard to check if an action has a toast in its meta
function isToastPredicate(action: MaybeToastAction): action is ToastAction {
	return isToastAction(action);
}

// Extract the toast object from an action
function getToastFromAction(action: ToastAction) {
	return action.meta.toast;
}

// Add one or more listener entries that look for specific actions.
// They may contain any sync or async logic, similar to thunks.
toastListenerMiddleware.startListening({
	predicate: isToastPredicate,
	effect: async (action, listenerApi) => {
		if (!isToastAction(action)) {
			return;
		}

		const toast = getToastFromAction(action);

		if (!toast) {
			return;
		}

		listenerApi.dispatch(toastActions.addToast(toast));
	}
});
