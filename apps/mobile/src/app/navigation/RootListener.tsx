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
	getStore,
	getStoreAsync,
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
	load,
	save,
	setCurrentClanLoader
} from '@mezon/mobile-components';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import { ChannelMessage, ChannelType, Session, safeJSONParse } from 'mezon-js';
import moment from 'moment';
import { AppState, DeviceEventEmitter, Platform, View } from 'react-native';
import useTabletLandscape from '../hooks/useTabletLandscape';
import NotificationPreferences from '../utils/NotificationPreferences';
import { getVoIPToken, handleFCMToken, processNotification, setupCallKeep } from '../utils/pushNotificationHelpers';

const MAX_RETRIES_SESSION = 5;
const RootListener = () => {
	const isLoggedIn = useSelector(selectIsLogin);
	const isTabletLandscape = useTabletLandscape();
	const { handleReconnect } = useContext(ChatContext);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const hasInternet = useSelector(selectHasInternetMobile);
	const appStateRef = useRef(AppState.currentState);
	const { onchannelmessage } = useContext(ChatContext);

	useEffect(() => {
		startupRunning(navigation, isTabletLandscape);
	}, [isTabletLandscape, navigation]);

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
				}, 500);
			});
		}
	}, [isLoggedIn]);

	const setupNotificationListeners = async (navigation, isTabletLandscape = false) => {
		try {
			messaging()
				.getInitialNotification()
				.then(async (remoteMessage) => {
					if (remoteMessage?.data && Platform.OS === 'ios') {
						mapMessageNotificationToSlice([remoteMessage?.data]);
					}
					notifee
						.getInitialNotification()
						.then(async (resp) => {
							if (resp) {
								const store = await getStoreAsync();
								save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
								store.dispatch(appActions.setIsFromFCMMobile(true));
								if (resp) {
									await processNotification({
										notification: { ...resp?.notification, data: resp?.notification?.data },
										navigation,
										time: 1,
										isTabletLandscape
									});
								}
							}
						})
						.catch((err) => {
							console.error('*** err getInitialNotification', err);
						});
					if (remoteMessage) {
						const store = await getStoreAsync();
						save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
						store.dispatch(appActions.setIsFromFCMMobile(true));
						if (remoteMessage?.notification?.title) {
							await processNotification({
								notification: { ...remoteMessage?.notification, data: remoteMessage?.data },
								navigation,
								time: 1,
								isTabletLandscape
							});
						}
					}
				});

			messaging().onNotificationOpenedApp(async (remoteMessage) => {
				if (remoteMessage?.data && Platform.OS === 'ios') {
					mapMessageNotificationToSlice([remoteMessage?.data]);
				}
				await processNotification({
					notification: { ...remoteMessage?.notification, data: remoteMessage?.data },
					navigation,
					time: 0,
					isTabletLandscape
				});
			});

			notifee.onBackgroundEvent(async ({ type, detail }) => {
				// const { notification, pressAction, input } = detail;
				if (type === EventType.PRESS && detail) {
					await processNotification({
						notification: detail.notification,
						navigation,
						time: 1,
						isTabletLandscape
					});
				}
			});

			return notifee.onForegroundEvent(({ type, detail }) => {
				switch (type) {
					case EventType.DISMISSED:
						break;
					case EventType.PRESS:
						processNotification({
							notification: detail.notification,
							navigation,
							time: 1,
							isTabletLandscape
						});
						break;
				}
			});
		} catch (error) {
			console.error('Error setting up notification listeners:', error);
		}
	};

	const startupRunning = async (navigation: any, isTabletLandscape: boolean) => {
		await setupNotificationListeners(navigation, isTabletLandscape);
		if (Platform.OS === 'ios') {
			await setupCallKeep();
		}
	};

	const initAppLoading = async () => {
		const isDisableLoad = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
		const isFromFCM = isDisableLoad?.toString() === 'true';
		await mainLoaderTimeout({ isFromFCM });
	};

	const onNotificationOpenedApp = async () => {
		try {
			if (Platform.OS === 'android') {
				const notificationDataPushed = await NotificationPreferences.getValue('notificationDataPushed');
				const notificationDataPushedParse = safeJSONParse(notificationDataPushed || '[]');
				mapMessageNotificationToSlice(notificationDataPushedParse ? notificationDataPushedParse.slice(0, 30) : []);
				await NotificationPreferences.clearValue('notificationDataPushed');
			} else {
				const notificationsDisplay = await notifee.getDisplayedNotifications();
				const notificationDataPushedParse = notificationsDisplay?.map?.((item) => {
					return item?.notification?.data;
				});
				mapMessageNotificationToSlice(notificationDataPushedParse ? notificationDataPushedParse.slice(0, 30) : []);
			}
			await notifee.cancelAllNotifications();
		} catch (error) {
			await notifee.cancelAllNotifications();
			console.error('Error processing notifications:', error);
		}
	};

	const mapMessageNotificationToSlice = (notificationDataPushedParse: any) => {
		if (notificationDataPushedParse.length > 0) {
			for (const data of notificationDataPushedParse) {
				const extraMessage = data?.message;
				if (extraMessage) {
					const message = safeJSONParse(extraMessage);
					if (message && typeof message === 'object' && message?.channel_id) {
						const createTimeSeconds = message?.create_time_seconds;
						const updateTimeSeconds = message?.update_time_seconds;

						const createTime = createTimeSeconds
							? moment.unix(createTimeSeconds).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
							: new Date().toISOString();
						const updateTime = updateTimeSeconds
							? moment.unix(updateTimeSeconds).utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
							: new Date().toISOString();

						let codeValue = 0;
						if (message?.code) {
							if (typeof message.code === 'number') {
								codeValue = message.code;
							} else if (typeof message.code === 'object' && message.code?.value !== undefined) {
								codeValue = message.code.value;
							}
						}

						const messageId = message?.message_id || message?.id;
						if (!messageId) {
							console.warn('onNotificationOpenedApp: Message missing id');
							continue;
						}

						const messageData = {
							...message,
							code: codeValue,
							id: messageId,
							content: safeJSONParse(message?.content || '{}'),
							attachments: safeJSONParse(message?.attachments || '[]'),
							mentions: safeJSONParse(message?.mentions || '[]'),
							references: safeJSONParse(message?.references || '[]'),
							reactions: safeJSONParse(message?.reactions || '[]'),
							create_time: createTime,
							update_time: updateTime
						};
						onchannelmessage(messageData as ChannelMessage);
					} else {
						console.warn('onNotificationOpenedApp: Invalid message structure or missing channel_id');
					}
				}
			}
		}
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
					dispatch(channelsActions.fetchChannels({ clanId: currentClanId, noCache: true, isMobile: true })),
					dispatch(directActions.fetchDirectMessage({ noCache: true }))
				];
				await Promise.allSettled(promise);
			}
			await onNotificationOpenedApp();
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
			handleReconnect('Initial reconnect attempt timeout');
			const isFromFCM = await load(STORAGE_IS_DISABLE_LOAD_BACKGROUND);
			// Note: if is DM
			const currentDirectId = selectDmGroupCurrentId(store.getState());
			const isFromFcmMobile = selectIsFromFCMMobile(store.getState());
			if (state === 'active') {
				await activeAgainLoaderBackground();
			}
			if (state === 'active' && !currentDirectId) {
				if (isFromFCM?.toString() === 'true' || isFromFcmMobile) {
					/* empty */
				} else {
					await messageLoaderBackground();
				}
			}
		},
		[activeAgainLoaderBackground, handleReconnect, messageLoaderBackground]
	);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChangeListener);
		onNotificationOpenedApp();
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
				handleReconnect('Auth Loader');
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
			promises.push(dispatch(listUsersByUserActions.fetchListUsersByUser({ noCache: true })));
			promises.push(dispatch(friendsActions.fetchListFriends({ noCache: true })));
			promises.push(dispatch(clansActions.joinClan({ clanId: '0' })));
			promises.push(dispatch(directActions.fetchDirectMessage({ noCache: true })));
			promises.push(dispatch(emojiSuggestionActions.fetchEmoji({ noCache: true })));
			promises.push(dispatch(settingClanStickerActions.fetchStickerByUserId({ noCache: true })));
			promises.push(dispatch(listChannelsByUserActions.fetchListChannelsByUser({ noCache: true })));
			promises.push(dispatch(gifsActions.fetchGifCategories()));
			promises.push(dispatch(gifsActions.fetchGifCategoryFeatured()));
			promises.push(dispatch(userStatusActions.getUserStatus()));
			promises.push(dispatch(acitvitiesActions.listActivities()));
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
