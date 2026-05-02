import type { AppDispatch } from '@mezon/store';
import {
	accountActions,
	clansActions,
	directActions,
	emojiRecentActions,
	emojiSuggestionActions,
	fcmActions,
	friendsActions,
	listChannelsByUserActions,
	listUsersByUserActions
} from '@mezon/store';
import { isOnline, waitForOnline } from '@mezon/transport';
import type { CustomLoaderFunction } from './appLoader';

export interface IAuthLoaderData {
	isLogin: boolean;
	redirect?: string;
}

const connectNotification = async (dispatch: AppDispatch) => {
	try {
		await dispatch(fcmActions.connectNotificationService());
	} catch (error) {
		console.error('Failed to connect notification service:', error);
	}
};

export const authLoader: CustomLoaderFunction = async ({ dispatch, initialPath }) => {
	await dispatch(accountActions.getUserProfile());
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

	return { isLogin: true };
};

export const shouldRevalidateAuth = () => {
	return false;
};
