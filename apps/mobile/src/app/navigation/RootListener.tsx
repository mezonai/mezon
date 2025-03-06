/* eslint-disable no-console */
import {
	accountActions,
	acitvitiesActions,
	appActions,
	authActions,
	clansActions,
	directActions,
	emojiSuggestionActions,
	fcmActions,
	friendsActions,
	getStore,
	listChannelsByUserActions,
	listUsersByUserActions,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDmGroupCurrentId,
	selectHasInternetMobile,
	selectIsFromFCMMobile,
	selectIsLogin,
	settingClanStickerActions,
	useAppDispatch,
	userStatusActions,
	voiceActions
} from '@mezon/store-mobile';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
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
	getAppInfo,
	load,
	save,
	setCurrentClanLoader
} from '@mezon/mobile-components';
import notifee from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { AppState, DeviceEventEmitter, Platform, View } from 'react-native';
import { handleFCMToken, setupCallKeep, setupNotificationListeners } from '../utils/pushNotificationHelpers';

const RootListener = () => {
	const isLoggedIn = useSelector(selectIsLogin);
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const hasInternet = useSelector(selectHasInternetMobile);
	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		if (Platform.OS === 'ios') {
			setupCallKeep();
		}
		setupNotificationListeners(navigation);
	}, [navigation]);

	useEffect(() => {
		if (isLoggedIn && hasInternet) {
			authLoader();
		}
	}, [isLoggedIn, hasInternet]);

	useEffect(() => {
		if (isLoggedIn) {
			requestIdleCallback(() => {
				setTimeout(() => {
					Promise.all([initAppLoading(), mainLoader()]).catch((error) => {
						console.error('Error in tasks:', error);
					});
				}, 1000);
			});
		}
	}, [isLoggedIn]);

	const initAppLoading = async () => {
		const isDisableLoad = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
		const isFromFCM = isDisableLoad?.toString() === 'true';
		await mainLoaderTimeout({ isFromFCM });
		// if (!isFromFCM) {
		// 	await sleep(1000);
		// 	refreshMessageInitApp();
		// }
	};

	const messageLoaderBackground = useCallback(async () => {
		try {
			const store = getStore();
			const currentChannelId = selectCurrentChannelId(store.getState() as any);
			const currentClanId = selectCurrentClanId(store.getState() as any);
			handleReconnect('Initial reconnect attempt');
			if (!currentChannelId) {
				return null;
			}
			dispatch(appActions.setLoadingMainMobile(false));
			await notifee.cancelAllNotifications();
			const promise = [
				dispatch(
					messagesActions.fetchMessages({
						channelId: currentChannelId,
						noCache: true,
						isFetchingLatestMessages: true,
						isClearMessage: true,
						clanId: currentClanId
					})
				),
				dispatch(
					voiceActions.fetchVoiceChannelMembers({
						clanId: currentClanId ?? '',
						channelId: '',
						channelType: ChannelType.CHANNEL_TYPE_GMEET_VOICE || ChannelType.CHANNEL_TYPE_MEZON_VOICE
					})
				)
			];
			await Promise.all(promise);
			return null;
		} catch (error) {
			/* empty */
		}
	}, [dispatch, handleReconnect]);

	const handleAppStateChange = useCallback(
		async (state: string) => {
			const store = getStore();
			const isFromFCM = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
			// Note: if is DM
			const currentDirectId = selectDmGroupCurrentId(store.getState());
			const isFromFcmMobile = selectIsFromFCMMobile(store.getState());
			if (state === 'active' && !currentDirectId) {
				if (isFromFCM?.toString() === 'true' || isFromFcmMobile) {
					/* empty */
				} else {
					await messageLoaderBackground();
				}
			}
		},
		[messageLoaderBackground]
	);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChangeListener);
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

	const authLoader = useCallback(async () => {
		let retries = 3;
		while (retries > 0) {
			try {
				const response = await dispatch(authActions.refreshSession());
				if ((response as unknown as IWithError).error) {
					retries -= 1;
					if (retries === 0) {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED);
						console.log('Session expired after 3 retries');
						return;
					}
					console.log(`Session expired, retrying... (${3 - retries}/3)`);
					await sleep(1000);
					continue;
				}
				const profileResponse = await dispatch(accountActions.getUserProfile());
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				const { id = '', username = '' } = profileResponse?.payload?.user || {};
				if (id) save(STORAGE_MY_USER_ID, id?.toString());
				await loadFRMConfig(username);
				if ((profileResponse as unknown as IWithError).error) {
					retries -= 1;
					if (retries === 0) {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED);
						console.log('Session expired after 3 retries');
						return;
					}
					console.log(`Session expired, retrying... (${3 - retries}/3)`);
					await sleep(1000);
					continue;
				}
				break; // Exit the loop if no error
			} catch (error) {
				retries -= 1;
				if (retries === 0) {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED);
					console.log('Session expired after 3 retries');
					return;
				}
				console.log(`Error in authLoader, retrying... (${3 - retries}/3)`, error);
				await sleep(1000);
			}
		}
	}, [dispatch]);

	const loadFRMConfig = async (username: string) => {
		try {
			if (!username) {
				return;
			}
			const [fcmtoken, appInfo] = await Promise.all([handleFCMToken(), getAppInfo()]);
			if (fcmtoken) {
				const { app_platform: platform } = appInfo;
				dispatch(fcmActions.registFcmDeviceToken({ tokenId: fcmtoken, deviceId: username, platform }));
			}
		} catch (error) {
			console.error('Error loading FCM config:', error);
		}
	};

	const mainLoader = useCallback(async () => {
		try {
			const promises = [];
			promises.push(dispatch(listUsersByUserActions.fetchListUsersByUser({})));
			promises.push(dispatch(friendsActions.fetchListFriends({})));
			promises.push(dispatch(clansActions.joinClan({ clanId: '0' })));
			promises.push(dispatch(directActions.fetchDirectMessage({ noCache: true })));
			promises.push(dispatch(emojiSuggestionActions.fetchEmoji({})));
			promises.push(dispatch(settingClanStickerActions.fetchStickerByUserId({})));
			promises.push(dispatch(listChannelsByUserActions.fetchListChannelsByUser({})));
			promises.push(dispatch(userStatusActions.getUserStatus()));
			promises.push(dispatch(acitvitiesActions.listActivities()));
			await Promise.all(promises);
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
				promises.push(dispatch(clansActions.fetchClans()));
				const results = await Promise.all(promises);
				if (!isFromFCM && !clanId) {
					const clanResp = results.find((result) => result.type === 'clans/fetchClans/fulfilled');
					if (clanResp) {
						await setCurrentClanLoader(clanResp.payload, clanId, false);
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

	return <View />;
};

export default RootListener;
