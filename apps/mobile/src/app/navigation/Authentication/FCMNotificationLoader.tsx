import { ChatContext } from '@mezon/core';
import { ActionEmitEvent, save, STORAGE_IS_DISABLE_LOAD_BACKGROUND } from '@mezon/mobile-components';
import { appActions, getStore, getStoreAsync, selectCurrentChannelId, selectDmGroupCurrentId } from '@mezon/store-mobile';
import notifee, { EventType } from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import type { ChannelMessage } from 'mezon-js';
import { safeJSONParse } from 'mezon-js';
import moment from 'moment/moment';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter, Platform } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import NotificationPreferences from '../../utils/NotificationPreferences';
import { checkNotificationPermission, processNotification } from '../../utils/pushNotificationHelpers';

const messaging = getMessaging(getApp());

export const FCMNotificationLoader = ({ notifyInit }: { notifyInit: any }) => {
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const { onchannelmessage } = useContext(ChatContext);
	const appStateRef = useRef(AppState.currentState);

	const checkPermission = async () => {
		await checkNotificationPermission();
	};

	const mapMessageNotificationToSlice = (notificationDataPushedParse: any) => {
		try {
			if (notificationDataPushedParse?.length > 0) {
				for (const data of notificationDataPushedParse) {
					const extraMessage = data?.message;
					if (extraMessage) {
						const message = safeJSONParse(extraMessage);
						if (message && typeof message === 'object' && message?.channelId) {
							const createTimeSeconds = message?.createTimeSeconds;
							const updateTimeSeconds = message?.updateTimeSeconds;

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

							const messageId = message?.messageId || message?.id;
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
								createTime: createTime,
								updateTime: updateTime
							};
							onchannelmessage(messageData as ChannelMessage);
						} else {
							console.warn('onNotificationOpenedApp: Invalid message structure or missing channelId');
						}
					}
				}
			}
		} catch (e) {
			console.error('log  => error mapMessageNotificationToSlice', e);
		}
	};

	const setupNotificationListeners = async (navigation, isTabletLandscape = false) => {
		try {
			if (notifyInit) {
				if (notifyInit?.data && Platform.OS === 'ios') {
					mapMessageNotificationToSlice([notifyInit?.data]);
				}
				const store = await getStoreAsync();
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
				store.dispatch(appActions.setIsFromFCMMobile(true));
				await processNotification({
					notification: notifyInit,
					navigation,
					time: 1,
					isTabletLandscape
				});
			}

			onNotificationOpenedApp(messaging, async (remoteMessage) => {
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
				if (
					Platform.OS === 'android' &&
					type === EventType.ACTION_PRESS &&
					(detail.pressAction?.id === 'reject' || detail.pressAction?.id === 'accept')
				) {
					notifee.stopForegroundService();
					notifee.cancelNotification('incoming-call', 'incoming-call');
					notifee.cancelDisplayedNotification('incoming-call', 'incoming-call');
				}
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
				if (
					Platform.OS === 'android' &&
					type === EventType.ACTION_PRESS &&
					(detail.pressAction?.id === 'reject' || detail.pressAction?.id === 'accept')
				) {
					notifee.stopForegroundService();
					notifee.cancelNotification('incoming-call', 'incoming-call');
					notifee.cancelDisplayedNotification('incoming-call', 'incoming-call');
				}
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

	const startupFCMRunning = async (navigation: any, isTabletLandscape: boolean) => {
		await setupNotificationListeners(navigation, isTabletLandscape);
	};

	const handleNotificationOpenedApp = async (notifyInit?: any) => {
		try {
			const channelId = notifyInit?.data?.channel;
			const store = getStore();
			const state = store.getState();
			const currentChannelId = selectCurrentChannelId(state);
			const currentDirectId = selectDmGroupCurrentId(state);
			const channelIdJoined = channelId || currentDirectId || currentChannelId;

			if (!channelIdJoined) return;
			if (Platform.OS === 'android') {
				const notificationDataPushed = await NotificationPreferences.getValue('notificationDataPushed');
				const notificationDataPushedParse = safeJSONParse(notificationDataPushed || '[]');
				const notificationDataMain = notificationDataPushedParse?.filter((item) => item?.channel === channelIdJoined);
				mapMessageNotificationToSlice(notificationDataMain?.length ? notificationDataMain.slice(0, 10) : []);
				await NotificationPreferences.clearValue('notificationDataPushed');
			} else {
				const notificationsDisplay = await notifee.getDisplayedNotifications();
				const notificationDataPushedParse = notificationsDisplay?.map?.((item) => {
					return item?.notification?.data;
				});
				const notificationDataMain = notificationDataPushedParse?.filter((item) => item?.channel === channelIdJoined);
				mapMessageNotificationToSlice(notificationDataMain?.length ? notificationDataMain.slice(0, 10) : []);
			}
			DeviceEventEmitter.emit(ActionEmitEvent.ON_REMOVE_NOTIFY_BY_CHANNEL_ID, { channelId: channelIdJoined });
		} catch (error) {
			console.error('Error processing notifications:', error);
		}
	};

	const handleAppStateChangeListener = useCallback((nextAppState: typeof AppState.currentState) => {
		if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
			handleNotificationOpenedApp();
		}

		appStateRef.current = nextAppState;
	}, []);

	useEffect(() => {
		startupFCMRunning(navigation, isTabletLandscape);
	}, [isTabletLandscape, navigation]);

	useEffect(() => {
		checkPermission();
		handleNotificationOpenedApp(notifyInit);
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChangeListener);
		// To clear Intents
		return () => {
			appStateSubscription.remove();
		};
	}, [notifyInit]);

	return null;
};
