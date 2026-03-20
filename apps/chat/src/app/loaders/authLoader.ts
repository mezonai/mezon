import type { AppDispatch } from '@mezon/store';
import {
	accountActions,
	authActions,
	clansActions,
	directActions,
	emojiRecentActions,
	emojiSuggestionActions,
	fcmActions,
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
import { isOnline, waitForOnline } from '@mezon/transport';
import type { IWithError } from '@mezon/utils';
import { notificationService } from '@mezon/utils';
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

const connectNotification = async (dispatch: AppDispatch) => {
	try {
		const response = await dispatch(fcmActions.connectNotificationService());
		if (response.payload && typeof response.payload === 'object' && 'token' in response.payload) {
			const { token, userId } = response.payload as { token: string; userId: string };
			notificationService.connect(token, userId);
		}
	} catch (error) {
		console.error('Failed to connect notification service:', error);
	}
};

const handleLogoutWithRedirect = (dispatch: AppDispatch, initialPath: string): IAuthLoaderData => {
	const redirectTo = getRedirectTo(initialPath);
	dispatch(authActions.setLogout());
	dispatch(walletActions.setLogout());
	const redirect = redirectTo ? `/desktop/login?redirect=${redirectTo}` : '/desktop/login';
	return { isLogin: false, redirect } as IAuthLoaderData;
};

const isUnauthorizedError = (errorPayload: any): boolean => {
	if (errorPayload && typeof errorPayload === 'object' && 'status' in errorPayload && errorPayload.status === 401) {
		return true;
	}
	if (errorPayload instanceof Response && errorPayload.status === 401) {
		return true;
	}
	return false;
};

const refreshSession = async ({ dispatch, initialPath }: { dispatch: AppDispatch; initialPath: string }) => {
	const store = getStore();
	const sessionUser = selectSession(store?.getState());

	if (!sessionUser?.token) {
		return { isLogin: false } as IAuthLoaderData;
	}

	try {
		const response = await dispatch(authActions.refreshSession());

		if (response?.payload === 'Redirect Login') {
			return handleLogoutWithRedirect(dispatch, initialPath);
		}

		if ((response as unknown as IWithError).error) {
			const errorPayload = response.payload;
			if (isUnauthorizedError(errorPayload)) {
				console.error('Unauthorized (401), logging out immediately');
				return handleLogoutWithRedirect(dispatch, initialPath);
			}
			console.error('Session refresh failed:', errorPayload);
			return handleLogoutWithRedirect(dispatch, initialPath);
		}

		const profileResponse = await dispatch(accountActions.getUserProfile());
		if ((profileResponse as unknown as IWithError).error) {
			console.error('getUserProfile failed after refresh');
			return handleLogoutWithRedirect(dispatch, initialPath);
		}

		return { isLogin: true } as IAuthLoaderData;
	} catch (error) {
		console.error('refreshSession error:', error);
		return handleLogoutWithRedirect(dispatch, initialPath);
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
	dispatch(clansActions.fetchClans({}));
	dispatch(clansActions.listClanBadgeCount());
	dispatch(friendsActions.fetchListFriends({}));
	dispatch(directActions.fetchDirectMessage({}));
	dispatch(emojiRecentActions.fetchEmojiRecent({}));
	dispatch(emojiSuggestionActions.fetchEmoji({ clanId: '0' }));

	connectNotification(dispatch);

	if (!isOnline()) {
		const splashScreen = document.getElementById('splash-screen');
		const title = splashScreen?.querySelector('#splash-title') as HTMLSpanElement;
		title && (title.textContent = 'Connecting ...');
		await waitForOnline();
		await new Promise((resolve) => setTimeout(resolve, 3000));
		if (splashScreen) {
			splashScreen.style.display = 'none';
		}
	}

	return session;
};

export const shouldRevalidateAuth = () => {
	return false;
};
