import type { AppDispatch } from '@mezon/store';
import {
	accountActions,
	authActions,
	clansActions,
	directActions,
	emojiRecentActions,
	emojiSuggestionActions,
	friendsActions,
	getStore,
	listChannelsByUserActions,
	listUsersByUserActions,
	selectCurrentClanId,
	selectSession,
	selectVoiceOpenPopOut,
	usersClanActions,
	walletActions
} from '@mezon/store';
import type { IWithError } from '@mezon/utils';
import type { CustomLoaderFunction } from './appLoader';
import { waitForSocketConnection } from './socketUtils';

export interface IAuthLoaderData {
	isLogin: boolean;
	redirect?: string;
}

function getRedirectTo(initialPath?: string): string {
	const searchParams = new URLSearchParams(window.location.search);
	const redirectParam = searchParams.get('redirect');

	if (redirectParam) {
		return redirectParam;
	}

	if (initialPath && !initialPath.startsWith('/desktop')) {
		return initialPath;
	}

	return '';
}

let connectionCheckPromise: Promise<void> | null = null;
let isCheckingConnection = false;

const waitForInternetConnection = async (delayMs: number): Promise<void> => {
	const hasConnection = await checkInternetConnection();

	if (!hasConnection) {
		if (isCheckingConnection && connectionCheckPromise) {
			await connectionCheckPromise;
		} else {
			isCheckingConnection = true;
			connectionCheckPromise = new Promise<void>((resolve) => {
				const intervalId = setInterval(async () => {
					const isConnected = await checkInternetConnection();
					if (isConnected) {
						clearInterval(intervalId);
						isCheckingConnection = false;
						connectionCheckPromise = null;
						resolve();
					}
				}, 2000);
			});
			await connectionCheckPromise;
		}
		return;
	}

	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, delayMs);
	});
};

const handleLogoutWithRedirect = (dispatch: AppDispatch, initialPath: string): IAuthLoaderData => {
	const redirectTo = getRedirectTo(initialPath);
	dispatch(authActions.setLogout());
	dispatch(walletActions.setLogout());
	const redirect = redirectTo ? `/desktop/login?redirect=${redirectTo}` : '/desktop/login';
	return { isLogin: false, redirect } as IAuthLoaderData;
};

async function checkInternetConnection() {
	try {
		const response = await fetch('https://mezon.ai/assets/favicon.ico', {
			method: 'HEAD',
			cache: 'no-cache'
		});
		return response.ok;
	} catch (error) {
		return false;
	}
}

const isServerError500 = (errorPayload: any): boolean => {
	if (errorPayload && typeof errorPayload === 'object' && 'status' in errorPayload && errorPayload.status === 500) {
		return true;
	}
	if (errorPayload instanceof Response && errorPayload.status === 500) {
		return true;
	}
	return false;
};

const refreshSession = async ({ dispatch, initialPath }: { dispatch: AppDispatch; initialPath: string }) => {
	let retries = 6;
	let attempt = 0;
	let isRedirectLogin = false;
	const store = getStore();
	const sessionUser = selectSession(store?.getState());

	if (!sessionUser?.token) {
		return { isLogin: !isRedirectLogin } as IAuthLoaderData;
	}

	while (retries > 0) {
		try {
			const response = await dispatch(authActions.refreshSession());

			if (response?.payload === 'Redirect Login') {
				isRedirectLogin = true;
			}

			if ((response as unknown as IWithError).error) {
				const errorPayload = response.payload;
				if (isServerError500(errorPayload)) {
					console.error('Server error (500), logging out immediately');
					return handleLogoutWithRedirect(dispatch, initialPath);
				}

				throw new Error('Session refresh failed');
			} else {
				const profileResponse = await dispatch(accountActions.getUserProfile());
				if (!(profileResponse as unknown as IWithError).error) {
					return { isLogin: true } as IAuthLoaderData;
				}
				throw new Error('Session expired');
			}
		} catch (error) {
			if ((await checkInternetConnection()) && error instanceof Error && !error.message.includes('Session expired')) {
				console.error('Non-retryable error, logging out:', error);
				return handleLogoutWithRedirect(dispatch, initialPath);
			}

			console.error(`Error in refreshSession, retrying... (${6 - retries + 1}/6)`, error);
		}

		retries -= 1;
		attempt += 1;

		if (retries > 0) {
			const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 16000);

			console.error(`Session expired, retrying in ${delayMs}ms... (${6 - retries + 1}/6)`);
			await waitForInternetConnection(delayMs);
		} else {
			console.error('Session expired after 6 retries');
			const redirectTo = getRedirectTo(initialPath);
			dispatch(authActions.setLogout());
			dispatch(walletActions.setLogout());
			const redirect = redirectTo ? `/desktop/login?redirect=${redirectTo}` : '/desktop/login';
			return { isLogin: !isRedirectLogin, redirect: isRedirectLogin ? redirect : '' } as IAuthLoaderData;
		}
	}
};

export const authLoader: CustomLoaderFunction = async ({ dispatch, initialPath }) => {
	const store = getStore();
	const isOpenVoicePopout = selectVoiceOpenPopOut(store.getState());

	if (isOpenVoicePopout) {
		const currentClanId = selectCurrentClanId(store.getState());
		dispatch(usersClanActions.fetchUsersClan({ clanId: currentClanId as string }));
	}
	const session = await refreshSession({ dispatch, initialPath: initialPath as string });
	await dispatch(waitForSocketConnection());

	dispatch(clansActions.joinClan({ clanId: '0' }));
	dispatch(listChannelsByUserActions.fetchListChannelsByUser({}));
	dispatch(listUsersByUserActions.fetchListUsersByUser({}));
	dispatch(friendsActions.fetchListFriends({}));
	dispatch(directActions.fetchDirectMessage({}));
	dispatch(emojiRecentActions.fetchEmojiRecent({}));
	dispatch(emojiSuggestionActions.fetchEmoji({ clanId: '0' }));
	// check network not connect
	if (!navigator.onLine) {
		const splashScreen = document.getElementById('splash-screen');
		const title = splashScreen?.querySelector('#splash-title') as HTMLSpanElement;
		title && (title.textContent = 'Connecting ...');
		await new Promise<void>((resolve) => {
			const handleOnline = () => {
				window.removeEventListener('online', handleOnline);
				setTimeout(() => {
					if (splashScreen) {
						splashScreen.style.display = 'none';
					}
					resolve();
				}, 3000);
			};
			window.addEventListener('online', handleOnline);
		});
	}

	return session;
};

export const shouldRevalidateAuth = () => {
	return false;
};
