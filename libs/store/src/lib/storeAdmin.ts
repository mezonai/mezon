import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { ACCOUNT_FEATURE_KEY, accountReducer } from './account/account.slice';
import { appReducer } from './app/app.slice';
import { authReducer, setupSessionSyncListener } from './auth/auth.slice';

import type { MezonAdminContextValue } from '@mezon/transport';
import { publishSessionUpdate } from '@mezon/transport';
import { safeJSONParse } from 'mezon-js';
import { adminApplicationReducer } from './application/applications.slice';
import { categoriesReducer } from './categories/categories.slice';
import { channelsReducer } from './channels/channels.slice';
import { clansReducer } from './clans/clans.slice';
import { dashboardReducer } from './dashboard/dashboard.slice';
import { ERRORS_FEATURE_KEY, errorsReducer } from './errors';
import { errorListenerMiddleware } from './errors/errors.listener';
import { TOASTS_FEATURE_KEY, toastsReducer } from './toasts';
import { toastListenerMiddleware } from './toasts/toasts.listener';

const persistedReducer = persistReducer(
	{
		key: 'auth',
		storage
	},
	authReducer
);

const persistedAppReducer = persistReducer(
	{
		key: 'apps',
		storage,
		blacklist: [
			'loadingMainMobile',
			'isFromFcmMobile',
			'hasInternetMobile',
			'isShowChatStream',
			'chatStreamWidth',
			'isShowCanvas',
			'isShowSettingFooter',
			'isShowWelcomeMobile',
			'history'
		]
	},
	appReducer
);

const persistedAccountReducer = persistReducer(
	{
		key: ACCOUNT_FEATURE_KEY,
		storage
	},
	accountReducer
);

const persistedClansReducer = persistReducer(
	{
		key: 'clans',
		storage,
		blacklist: ['invitePeople', 'checkJoinList']
	},
	clansReducer
);

const persistedCatReducer = persistReducer(
	{
		key: 'categories',
		storage
	},
	categoriesReducer
);
const persistedChannelReducer = persistReducer(
	{
		key: 'channels',
		storage,
		blacklist: ['request', 'previousChannels', 'showScrollDownButton', 'scrollPosition']
	},
	channelsReducer
);
const reducer = {
	app: persistedAppReducer,
	dashboard: dashboardReducer,
	account: persistedAccountReducer,
	auth: persistedReducer,
	adminApplication: adminApplicationReducer,
	[ERRORS_FEATURE_KEY]: errorsReducer,
	[TOASTS_FEATURE_KEY]: toastsReducer,
	clans: persistedClansReducer,
	categories: persistedCatReducer,
	channels: persistedChannelReducer
};
let storeInstance = configureStore({
	reducer
});

export type StoreAdmin = typeof storeInstance;

let _resolveStoreReady: ((store: typeof storeInstance) => void) | null = null;
const _storeReadyPromise: Promise<typeof storeInstance> = new Promise((resolve) => {
	_resolveStoreReady = resolve;
});
let storeCreated = false;

let _storageListenerActive = false;

const isDev = process.env.NX_ENV === 'development';

const thunkNameLogger = () => (next: any) => (action: any) => {
	const isThunk = typeof action.type === 'string' && action.type.includes('/');
	if (isThunk) {
		const [slice, actionName, status] = action.type.split('/');
		if (status === 'pending') {
			console.warn(`🚀 : ${slice}/${actionName}`);
		}
	}

	return next(action);
};

export const initAdminStore = (mezon: MezonAdminContextValue) => {
	const store = configureStore({
		reducer,
		devTools: false,
		middleware: (getDefaultMiddleware) => {
			const base = getDefaultMiddleware({
				thunk: {
					extraArgument: { mezon }
				},
				immutableCheck: false,
				serializableCheck: false
			});

			const withListeners = base.prepend(errorListenerMiddleware.middleware, toastListenerMiddleware.middleware);

			if (isDev) {
				return withListeners.prepend(thunkNameLogger);
			}

			return withListeners;
		}
	});

	storeInstance = store;
	storeCreated = true;
	_resolveStoreReady?.(store);
	const persistor = persistStore(store);

	if (typeof window !== 'undefined') {
		let lastStorageValue: string | null = null;
		const handleStorageChange = async (e: StorageEvent) => {
			if (e.key !== 'persist:auth') return;
			if (e.newValue === lastStorageValue) return;
			lastStorageValue = e.newValue;

			try {
				const currentState = store.getState();
				const currentSession = currentState.auth?.session;

				if (!e.newValue) {
					if (currentSession) {
						publishSessionUpdate(null, 'cross-tab');
					}
					return;
				}

				const newAuthState = safeJSONParse(e.newValue);
				const sessionData = newAuthState?.session ? safeJSONParse(newAuthState.session) : null;
				const newSession = sessionData ?? null;

				const hasSessionChanged =
					newSession?.token !== currentSession?.token ||
					newSession?.refresh_token !== currentSession?.refresh_token ||
					newSession?.session_id !== currentSession?.session_id;

				if (!hasSessionChanged) return;

				publishSessionUpdate(newSession, 'cross-tab');
			} catch (err) {
				console.error('[Storage Sync] Failed to sync auth state:', err);
			}
		};

		if (!_storageListenerActive) {
			window.addEventListener('storage', handleStorageChange);
			_storageListenerActive = true;
		}
	}

	setupSessionSyncListener(store);
	return { store, persistor };
};

export const getStoreAdminAsync = async (timeoutMs = 5000): Promise<StoreAdmin> => {
	if (storeCreated) {
		return storeInstance;
	}
	return new Promise<StoreAdmin>((resolve, reject) => {
		const deadline = setTimeout(() => {
			reject(new Error('[getStoreAsync] Store initialization timed out'));
		}, timeoutMs);
		_storeReadyPromise.then((store) => {
			clearTimeout(deadline);
			resolve(store as StoreAdmin);
		});
	});
};
