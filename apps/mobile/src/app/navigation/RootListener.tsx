/* eslint-disable no-console */
import {
	accountActions,
	acitvitiesActions,
	appActions,
	authActions,
	channelsActions,
	clansActions,
	directActions,
	emojiSuggestionActions,
	fcmActions,
	friendsActions,
	listChannelsByUserActions,
	listUsersByUserActions,
	messagesActions,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectIsFromFCMMobile,
	selectIsLogin,
	settingClanStickerActions,
	useAppDispatch,
	userStatusActions,
	voiceActions
} from '@mezon/store-mobile';
import React, { useCallback, useContext, useEffect } from 'react';
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
import useTabletLandscape from '../hooks/useTabletLandscape';
import { handleFCMToken, setupCallKeep, setupNotificationListeners } from '../utils/pushNotificationHelpers';

const RootListener = () => {
	const isLoggedIn = useSelector(selectIsLogin);
	const currentClanId = useSelector(selectCurrentClanId);
	const currentChannelId = useSelector(selectCurrentChannelId);
	const isFromFcmMobile = useSelector(selectIsFromFCMMobile);
	const isTabletLandscape = useTabletLandscape();
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();

	useEffect(() => {
		if (Platform.OS === 'ios') {
			setupCallKeep();
		}
		setupNotificationListeners(navigation, isTabletLandscape);
	}, [navigation, isTabletLandscape]);

	useEffect(() => {
		if (isLoggedIn) {
			authLoader();
			requestIdleCallback(() => {
				setTimeout(() => {
					Promise.all([initAppLoading(), mainLoader()]).catch((error) => {
						console.error('Error in tasks:', error);
					});
				}, 100);
			});
		}
	}, [isLoggedIn]);

	const refreshMessageInitApp = useCallback(async () => {
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
			// dispatch(
			// 	channelsActions.fetchChannels({
			// 		clanId: currentClanId
			// 	})
			// );
		}
	}, [currentChannelId, currentClanId, dispatch]);

	const initAppLoading = async () => {
		const isDisableLoad = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
		const isFromFCM = isDisableLoad?.toString() === 'true';
		await mainLoaderTimeout({ isFromFCM });
		if (!isFromFCM) {
			await sleep(1000);
			refreshMessageInitApp();
		}
	};

	const messageLoaderBackground = useCallback(async () => {
		try {
			if (!currentChannelId) {
				return null;
			}
			handleReconnect('Initial reconnect attempt');
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
						channelType: ChannelType.CHANNEL_TYPE_GMEET_VOICE
					})
				)
			];
			await Promise.all(promise);
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
			return null;
		} catch (error) {
			DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
		}
	}, [currentClanId, handleReconnect]);

	const handleAppStateChange = useCallback(
		async (state: string) => {
			const isFromFCM = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
			// Note: if currentClanId === 0 is current DM
			if (state === 'active' && currentClanId !== '0') {
				DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: false });
				if (isFromFCM?.toString() === 'true' || isFromFcmMobile) {
					DeviceEventEmitter.emit(ActionEmitEvent.SHOW_SKELETON_CHANNEL_MESSAGE, { isShow: true });
				} else {
					await messageLoaderBackground();
				}
			}
		},
		[currentClanId, isFromFcmMobile, messageLoaderBackground]
	);

	useEffect(() => {
		// Trigger when app is in background back to active
		let timeout: string | number | NodeJS.Timeout;
		const appStateSubscription = AppState.addEventListener('change', (state) => {
			if (isLoggedIn)
				timeout = setTimeout(async () => {
					await handleAppStateChange(state);
				}, 200);
		});
		return () => {
			appStateSubscription.remove();
			timeout && clearTimeout(timeout);
		};
	}, [isFromFcmMobile, isLoggedIn, currentClanId, handleAppStateChange]);

	useEffect(() => {
		if (currentClanId && currentClanId?.toString() !== '0') {
			dispatch(channelsActions.fetchListFavoriteChannel({ clanId: currentClanId }));
		}
	}, [currentClanId, dispatch]);

	const authLoader = useCallback(async () => {
		try {
			const response = await dispatch(authActions.refreshSession());
			if ((response as unknown as IWithError).error) {
				console.log('Session expired');
				return;
			}
			const profileResponse = await dispatch(accountActions.getUserProfile());
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const { id = '', username = '' } = profileResponse?.payload?.user || {};
			if (id) save(STORAGE_MY_USER_ID, id?.toString());
			await loadFRMConfig(username);
			if ((profileResponse as unknown as IWithError).error) {
				console.log('Session expired');
				return;
			}
		} catch (error) {
			console.log('error authLoader', error);
		}
	}, [dispatch]);

	const loadFRMConfig = async (userName: string) => {
		try {
			if (!userName) {
				return;
			}
			const [fcmtoken, appInfo] = await Promise.all([handleFCMToken(), getAppInfo()]);
			if (fcmtoken) {
				const { app_platform: platform } = appInfo;
				dispatch(fcmActions.registFcmDeviceToken({ tokenId: fcmtoken, deviceId: userName, platform }));
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
		[currentClanId, dispatch]
	);

	return <View />;
};

export default RootListener;
