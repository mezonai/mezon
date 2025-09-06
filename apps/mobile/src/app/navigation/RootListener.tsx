/* eslint-disable no-console */
import {
	accountActions,
	appActions,
	authActions,
	channelsActions,
	clansActions,
	directActions,
	emojiSuggestionActions,
	fcmActions,
	friendsActions,
	getStore,
	gifsActions,
	listChannelsByUserActions,
	listUsersByUserActions,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDmGroupCurrentId,
	selectHasInternetMobile,
	selectIsFromFCMMobile,
	selectIsLogin,
	selectSession,
	settingClanStickerActions,
	topicsActions,
	useAppDispatch,
	userStatusActions,
	voiceActions
} from '@mezon/store-mobile';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ChatContext } from '@mezon/core';
import { IWithError, sleep } from '@mezon/utils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	ActionEmitEvent,
	STORAGE_CLAN_ID,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	STORAGE_MY_USER_ID,
	STORAGE_SESSION_KEY,
	load,
	save,
	setCurrentClanLoader
} from '@mezon/mobile-components';
import { useMezon } from '@mezon/transport';
import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';
import { ChannelType, Session } from 'mezon-js';
import { AppState, DeviceEventEmitter, Platform } from 'react-native';
import { getVoIPToken, handleFCMToken } from '../utils/pushNotificationHelpers';
const analytics = getAnalytics(getApp());
const MAX_RETRIES_SESSION = 5;
const RootListener = () => {
	const isLoggedIn = useSelector(selectIsLogin);
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();
	const hasInternet = useSelector(selectHasInternetMobile);
	const appStateRef = useRef(AppState.currentState);
	const { clientRef } = useMezon();

	useEffect(() => {
		if (isLoggedIn && hasInternet) {
			authLoader();
		}
	}, [isLoggedIn, hasInternet]);

	useEffect(() => {
		if (isLoggedIn) {
			requestIdleCallback(() => {
				dispatch(topicsActions.setCurrentTopicId(''));
				setTimeout(() => {
					initAppLoading();
					mainLoader();
				}, 2000);
			});
		}
	}, [isLoggedIn]);

	const initAppLoading = async () => {
		const isDisableLoad = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
		const isFromFCM = isDisableLoad?.toString() === 'true';
		await mainLoaderTimeout({ isFromFCM });
	};

	const activeAgainLoaderBackground = useCallback(async () => {
		try {
			const store = getStore();
			const currentClanId = selectCurrentClanId(store.getState() as any);
			dispatch(appActions.setLoadingMainMobile(false));
			if (currentClanId) {
				const promise = [
					dispatch(
						voiceActions.fetchVoiceChannelMembers({
							clanId: currentClanId ?? '',
							channelId: '',
							channelType: ChannelType.CHANNEL_TYPE_GMEET_VOICE || ChannelType.CHANNEL_TYPE_MEZON_VOICE
						})
					),
					dispatch(channelsActions.fetchChannels({ clanId: currentClanId, noCache: true, isMobile: true }))
				];
				await Promise.allSettled(promise);
			}
			dispatch(directActions.fetchDirectMessage({ noCache: true }));
			dispatch(clansActions.fetchClans({ noCache: true }));
			return null;
		} catch (error) {
			/* empty */
		}
	}, [dispatch]);

	const messageLoaderBackground = useCallback(async () => {
		try {
			const store = getStore();
			const currentChannelId = selectCurrentChannelId(store.getState() as any);
			const currentClanId = selectCurrentClanId(store.getState() as any);
			dispatch(appActions.setLoadingMainMobile(false));
			if (currentChannelId) {
				dispatch(
					messagesActions.fetchMessages({
						channelId: currentChannelId,
						noCache: true,
						isFetchingLatestMessages: true,
						isClearMessage: true,
						clanId: currentClanId
					})
				);
			}
			return null;
		} catch (error) {
			/* empty */
		}
	}, [dispatch]);

	const handleAppStateChange = useCallback(
		async (state: string) => {
			const store = getStore();
			const isFromFCM = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
			// Note: if is DM
			const currentDirectId = selectDmGroupCurrentId(store.getState());
			const isFromFcmMobile = selectIsFromFCMMobile(store.getState());
			if (state === 'active') {
				await activeAgainLoaderBackground();
			}
			if (state === 'active' && !currentDirectId) {
				handleReconnect('Initial reconnect attempt timeout');
				if (isFromFCM?.toString() === 'true' || isFromFcmMobile) {
					/* empty */
				} else {
					await messageLoaderBackground();
				}
			}
		},
		[activeAgainLoaderBackground, handleReconnect, messageLoaderBackground]
	);

	const logAppStarted = async () => {
		try {
			await setAnalyticsCollectionEnabled(analytics, true);
			await logEvent(analytics, 'app_started_NEW', {
				platform: Platform.OS
			});
		} catch (error) {
			console.error('Failed to log app started event:');
		}
	};

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChangeListener);
		logAppStarted();
		return () => {
			appStateSubscription.remove();
		};
	}, []);

	const handleAppStateChangeListener = useCallback((nextAppState: typeof AppState.currentState) => {
		if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
			handleAppStateChange(nextAppState);
		}

		appStateRef.current = nextAppState;
	}, []);

	const getSessionCacheKey = async () => {
		const defaultConfig = {
			host: process.env.NX_CHAT_APP_API_HOST as string,
			port: process.env.NX_CHAT_APP_API_PORT as string
		};

		try {
			const storedConfig = await load(STORAGE_SESSION_KEY);
			if (!storedConfig) return defaultConfig;

			const parsedConfig = JSON.parse(storedConfig);
			const isCustomHost = parsedConfig.host && parsedConfig.port && parsedConfig.host !== process.env.NX_CHAT_APP_API_GW_HOST;

			if (isCustomHost) {
				return parsedConfig;
			}

			return defaultConfig;
		} catch (e) {
			return defaultConfig;
		}
	};

	const authLoader = useCallback(async () => {
		const configSession = await getSessionCacheKey();
		if (configSession && clientRef?.current) {
			clientRef.current.setBasePath(configSession.host as string, configSession.port as string, process.env.NX_CHAT_APP_API_SECURE === 'true');
		}

		let retries = MAX_RETRIES_SESSION;
		while (retries > 0) {
			try {
				const response = await dispatch(authActions.refreshSession());
				if ((response as unknown as IWithError).error) {
					retries -= 1;
					if (retries === 0) {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED);
						return;
					}
					await sleep(1000 * (MAX_RETRIES_SESSION - retries));
					continue;
				}
				const profileResponse = await dispatch(accountActions.getUserProfile());
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				const { id = '', username = '' } = profileResponse?.payload?.user || {};
				if (id) save(STORAGE_MY_USER_ID, id?.toString());
				await loadFRMConfig(username);
				// fetch DM list for map badge un-read DM
				await dispatch(directActions.fetchDirectMessage({ noCache: true }));
				if ((profileResponse as unknown as IWithError).error) {
					retries -= 1;
					if (retries === 0) {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED);
						return;
					}
					await sleep(1000 * (MAX_RETRIES_SESSION - retries));
					continue;
				}
				break; // Exit the loop if no error
			} catch (error) {
				retries -= 1;
				if (retries === 0) {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED);
					return;
				}
				await sleep(1000 * (MAX_RETRIES_SESSION - retries));
			}
		}
	}, [dispatch]);

	const loadFRMConfig = async (username: string) => {
		try {
			if (!username) {
				return;
			}
			const fcmtoken = await handleFCMToken();
			const store = getStore();
			const session = selectSession(store.getState());
			const voipToken = Platform.OS === 'ios' ? await getVoIPToken() : '';
			if (fcmtoken) {
				dispatch(
					fcmActions.registFcmDeviceToken({
						session: session as Session,
						tokenId: fcmtoken,
						deviceId: username,
						platform: Platform.OS,
						voipToken
					})
				);
			}
		} catch (error) {
			console.error('Error loading FCM config:', error);
		}
	};

	const mainLoader = useCallback(async () => {
		try {
			const promises = [];
			// await dispatch(waitForSocketConnection());
			promises.push(dispatch(listUsersByUserActions.fetchListUsersByUser({ noCache: true })));
			promises.push(dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true })));
			promises.push(dispatch(friendsActions.fetchListFriends({ noCache: true })));
			promises.push(dispatch(clansActions.joinClan({ clanId: '0' })));
			promises.push(dispatch(directActions.fetchDirectMessage({ noCache: true })));
			promises.push(dispatch(emojiSuggestionActions.fetchEmoji({ noCache: true })));
			promises.push(dispatch(settingClanStickerActions.fetchStickerByUserId({ noCache: true })));
			promises.push(dispatch(gifsActions.fetchGifCategories()));
			promises.push(dispatch(gifsActions.fetchGifCategoryFeatured()));
			promises.push(dispatch(userStatusActions.getUserStatus({})));
			await Promise.allSettled(promises);
			return null;
		} catch (error) {
			console.log('error mainLoader', error);
			dispatch(appActions.setLoadingMainMobile(false));
		}
	}, [dispatch]);

	const mainLoaderTimeout = useCallback(
		async ({ isFromFCM = false }) => {
			try {
				const store = getStore();
				const currentClanId = selectCurrentClanId(store.getState() as any);
				dispatch(appActions.setLoadingMainMobile(false));
				const currentClanIdCached = await load(STORAGE_CLAN_ID);
				const clanId = currentClanId?.toString() !== '0' ? currentClanId : currentClanIdCached;
				const promises = [];
				if (!isFromFCM && clanId) {
					save(STORAGE_CLAN_ID, clanId);
					promises.push(dispatch(clansActions.joinClan({ clanId })));
					promises.push(dispatch(clansActions.changeCurrentClan({ clanId })));
				}
				promises.push(dispatch(clansActions.fetchClans({ noCache: true })));
				const results = await Promise.all(promises);
				if (!isFromFCM && !clanId) {
					const clanResp = results.find((result) => result.type === 'clans/fetchClans/fulfilled');
					if (clanResp?.payload || clanResp?.payload?.clans) {
						await setCurrentClanLoader(clanResp?.payload?.clans || clanResp?.payload, clanId, false);
					}
				}
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				return null;
			} catch (error) {
				console.log('error mainLoader', error);
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[dispatch]
	);

	return null;
};

export default RootListener;
