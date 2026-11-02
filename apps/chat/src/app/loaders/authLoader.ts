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
	stickerSettingActions
} from '@mezon/store';
import { isOnline, socketState, waitForOnline } from '@mezon/transport';
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

let stopReloadOnConnect: (() => void) | null = null;

const loadSignedInData = async (dispatch: AppDispatch) => {
	await dispatch(accountActions.getUserProfile());
	dispatch(stickerSettingActions.fetchStickerByUserId({ clanId: '' }));
	dispatch(listChannelsByUserActions.fetchListChannelsByUser({}));
	dispatch(clansActions.fetchClans({}));
	dispatch(clansActions.listClanBadgeCount());
	dispatch(friendsActions.fetchListFriends({}));
	dispatch(directActions.joinDirectMessageSpace({ restart: true }));
	dispatch(emojiRecentActions.fetchEmojiRecent({}));
	dispatch(emojiSuggestionActions.fetchEmoji({ clanId: '0' }));

	connectNotification(dispatch);
};

export const authLoader: CustomLoaderFunction = async ({ dispatch, initialPath }) => {
	if (!socketState.isConnected && !stopReloadOnConnect) {
		stopReloadOnConnect = socketState.subscribe((status) => {
			if (status !== 'connected') return;
			stopReloadOnConnect?.();
			stopReloadOnConnect = null;
			loadSignedInData(dispatch);
		});
	}

	await loadSignedInData(dispatch);

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
