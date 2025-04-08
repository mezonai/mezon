import {
	accountActions,
	AppDispatch,
	authActions,
	clansActions,
	directActions,
	emojiRecentActions,
	friendsActions,
	getStore,
	listChannelsByUserActions,
	listUsersByUserActions,
	selectVoiceOpenPopOut
} from '@mezon/store';
import { IWithError, sleep } from '@mezon/utils';
import { CustomLoaderFunction } from './appLoader';

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

const refreshSession = async ({ dispatch, initialPath }: { dispatch: AppDispatch; initialPath: string }) => {
	let retries = 3;
	let isRedirectLogin = false;
	while (retries > 0) {
		try {
			const response = await dispatch(authActions.refreshSession());
			if (response?.payload === 'Redirect Login') {
				isRedirectLogin = true;
			}
			if (!(response as unknown as IWithError).error) {
				const profileResponse = await dispatch(accountActions.getUserProfile());
				if (!(profileResponse as unknown as IWithError).error) {
					return { isLogin: true } as IAuthLoaderData;
				}
				throw new Error('Session expired');
			}
		} catch (error) {
			console.error(`Error in refreshSession, retrying... (${3 - retries}/3)`, error);
		}
		retries -= 1;
		if (retries > 0) {
			console.error(`Session expired, retrying... (${3 - retries}/3)`);
			await sleep(1000);
		} else {
			console.error('Session expired after 3 retries');
			const redirectTo = getRedirectTo(initialPath);
			const redirect = redirectTo ? `/desktop/login?redirect=${redirectTo}` : '/desktop/login';
			return { isLogin: !isRedirectLogin, redirect: isRedirectLogin ? redirect : '' } as IAuthLoaderData;
		}
	}
};

export const authLoader: CustomLoaderFunction = async ({ dispatch, initialPath }) => {
	const store = getStore();
	const isOpenVoicePopout = selectVoiceOpenPopOut(store.getState());
	dispatch(clansActions.joinClan({ clanId: '0' }));
	dispatch(listChannelsByUserActions.fetchListChannelsByUser({}));
	dispatch(listUsersByUserActions.fetchListUsersByUser({}));
	dispatch(friendsActions.fetchListFriends({}));
	dispatch(directActions.fetchDirectMessage({}));
	dispatch(emojiRecentActions.fetchEmojiRecent({}));
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
	return await refreshSession({ dispatch, initialPath: initialPath as string });
};

export const shouldRevalidateAuth = () => {
	return false;
};
