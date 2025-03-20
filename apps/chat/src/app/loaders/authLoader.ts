import {
	accountActions,
	authActions,
	clansActions,
	directActions,
	friendsActions,
	listChannelsByUserActions,
	listUsersByUserActions
} from '@mezon/store';
import { IWithError } from '@mezon/utils';
import { emojiRecentActions } from 'libs/store/src/lib/emojiSuggestion/emojiRecent.slice';
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

export const authLoader: CustomLoaderFunction = async ({ dispatch, initialPath }) => {
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

	try {
		const response = await dispatch(authActions.refreshSession());
		if ((response as unknown as IWithError).error) {
			throw new Error('Session expired');
		}

		const profileResponse = await dispatch(accountActions.getUserProfile());

		if ((profileResponse as unknown as IWithError).error) {
			throw new Error('Session expired');
		}
		return {
			isLogin: true
		} as IAuthLoaderData;
	} catch (error) {
		const redirectTo = getRedirectTo(initialPath);
		const redirect = redirectTo ? `/desktop/login?redirect=${redirectTo}` : '/desktop/login';
		return {
			isLogin: false,
			redirect: redirect
		} as IAuthLoaderData;
	}
};

export const shouldRevalidateAuth = () => {
	return false;
};
