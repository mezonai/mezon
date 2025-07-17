import { ChatContext } from '@mezon/core';
import { STORAGE_IS_DISABLE_LOAD_BACKGROUND, save } from '@mezon/mobile-components';
import { appActions, getStoreAsync } from '@mezon/store-mobile';
import notifee, { EventType } from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import { ChannelMessage, safeJSONParse } from 'mezon-js';
import moment from 'moment/moment';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import NotificationPreferences from '../../utils/NotificationPreferences';
import { checkNotificationPermission, processNotification, setupCallKeep } from '../../utils/pushNotificationHelpers';

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

	const startupFCMRunning = async (navigation: any, isTabletLandscape: boolean) => {
		await setupNotificationListeners(navigation, isTabletLandscape);
		if (Platform.OS === 'ios') {
			await setupCallKeep();
		}
	};
	const deleteAllChannelGroupsNotifee = async () => {
		try {
			const channelGroups = await notifee.getChannelGroups(); // Fetch all channel groups
			for (const group of channelGroups) {
				await notifee.deleteChannel(group.id);
				await notifee.deleteChannelGroup(group.id);
			}
		} catch (error) {
			console.error('Error deleting channel groups:', error);
		}
	};

	const handleNotificationOpenedApp = async () => {
		try {
			if (Platform.OS === 'android') {
				await deleteAllChannelGroupsNotifee();
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
			await notifee.cancelDisplayedNotifications();
		} catch (error) {
			await deleteAllChannelGroupsNotifee();
			await notifee.cancelAllNotifications();
			await notifee.cancelDisplayedNotifications();
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
		handleNotificationOpenedApp();
		const appStateSubscription = AppState.addEventListener('change', handleAppStateChangeListener);
		// To clear Intents
		return () => {
			appStateSubscription.remove();
		};
	}, []);

	return <></>;
};
