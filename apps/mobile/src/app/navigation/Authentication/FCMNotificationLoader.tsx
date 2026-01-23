import { ActionEmitEvent, save, STORAGE_IS_DISABLE_LOAD_BACKGROUND } from '@mezon/mobile-components';
import { appActions, getStore, getStoreAsync, selectCurrentChannelId, selectDmGroupCurrentId } from '@mezon/store-mobile';
import notifee, { EventType } from '@notifee/react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter, Platform } from 'react-native';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { checkNotificationPermission, processNotification } from '../../utils/pushNotificationHelpers';

const messaging = getMessaging(getApp());

export const FCMNotificationLoader = ({ notifyInit }: { notifyInit: any }) => {
	const navigation = useNavigation<any>();
	const isTabletLandscape = useTabletLandscape();
	const appStateRef = useRef(AppState.currentState);

	const checkPermission = async () => {
		await checkNotificationPermission();
	};

	const setupNotificationListeners = async (navigation, isTabletLandscape = false) => {
		try {
			if (notifyInit) {
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
