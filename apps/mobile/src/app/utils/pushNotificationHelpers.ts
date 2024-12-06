import {
	ActionEmitEvent,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	getUpdateOrAddClanChannelCache,
	load,
	save,
	setDefaultChannelLoader
} from '@mezon/mobile-components';
import { appActions, channelsActions, clansActions, directActions, getStoreAsync } from '@mezon/store-mobile';
import notifee, { EventType } from '@notifee/react-native';
import { AndroidVisibility } from '@notifee/react-native/src/types/NotificationAndroid';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { DrawerActions } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import { Alert, DeviceEventEmitter, Linking, PermissionsAndroid, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { PERMISSIONS, RESULTS, requestMultiple } from 'react-native-permissions';
import uuid from 'react-native-uuid';
import VoipPushNotification from 'react-native-voip-push-notification';
import { APP_SCREEN } from '../navigation/ScreenTypes';
import { clanAndChannelIdLinkRegex, clanDirectMessageLinkRegex } from './helpers';

export const checkNotificationPermission = async () => {
	if (Platform.OS === 'ios') await notifee.requestPermission();

	if (Platform.OS === 'android' && Platform.Version >= 33) {
		const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
		if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
			Alert.alert('Notification Permission', 'Notifications are disabled. Please enable them in settings.', [
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'OK',
					onPress: () => {
						openAppSettings();
					}
				}
			]);
		}
	} else {
		const authorizationStatus = await messaging().hasPermission();

		if (authorizationStatus === messaging.AuthorizationStatus.NOT_DETERMINED) {
			// Permission has not been requested yet
			await requestNotificationPermission();
		} else if (authorizationStatus === messaging.AuthorizationStatus.DENIED) {
			// Permission has been denied
			Alert.alert('Notification Permission', 'Notifications are disabled. Please enable them in settings.', [
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'OK',
					onPress: () => {
						openAppSettings();
					}
				}
			]);
		} else if (
			authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
			authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL
		) {
			// Permission is granted
		}
	}
};

const requestNotificationPermission = async () => {
	try {
		await messaging().requestPermission({
			alert: true,
			sound: true,
			badge: true
		});
		// Alert.alert('Notification Permission', 'Notifications have been enabled.');
	} catch (error) {
		Alert.alert('Notification Permission', 'Notification permission denied.', [
			{
				text: 'Cancel',
				style: 'cancel'
			},
			{
				text: 'OK',
				onPress: () => {
					openAppSettings();
				}
			}
		]);
	}
};

const openAppSettings = () => {
	if (Platform.OS === 'ios') {
		Linking.openURL('app-settings:');
	} else {
		Linking.openSettings();
	}
};
export const createLocalNotification = async (title: string, body: string, data: { [key: string]: string | object }) => {
	try {
		const channelId = await notifee.createChannel({
			id: 'default',
			name: 'mezon'
		});
		await notifee.displayNotification({
			title: title || '',
			body: body,
			data: data,
			android: {
				visibility: AndroidVisibility.PUBLIC,
				channelId: 'mezon-mobile',
				smallIcon: 'ic_notification',
				color: '#000000',
				sound: 'default',
				pressAction: {
					id: 'default'
				}
			},
			ios: {
				critical: true,
				criticalVolume: 1.0,
				sound: 'default',
				foregroundPresentationOptions: {
					badge: true,
					banner: true,
					list: true,
					sound: true
				}
			}
		});
	} catch (err) {
		/* empty */
	}
};

export const handleFCMToken = async () => {
	const authStatus = await messaging().requestPermission({
		alert: true,
		sound: true,
		badge: true
	});

	const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || messaging.AuthorizationStatus.PROVISIONAL;
	if (Platform.OS === 'ios') VoipPushNotification.registerVoipToken();

	if (enabled) {
		const fcmtoken = await messaging().getToken();
		if (fcmtoken) {
			try {
				return fcmtoken;
			} catch (error) {
				/* empty */
			}
		}
	}
};

export const isShowNotification = (currentChannelId, currentDmId, remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
	if (!remoteMessage?.notification?.title) {
		return false;
	}

	const link = remoteMessage?.data?.link as string;
	const directMessageId = link.match(clanDirectMessageLinkRegex)?.[1] || '';
	const channelMessageId = link.match(clanAndChannelIdLinkRegex)?.[2] || '';

	const areOnChannel = currentChannelId === channelMessageId;
	const areOnDirectMessage = currentDmId === directMessageId;

	if (areOnChannel && currentDmId) {
		return true;
	}

	if ((channelMessageId && areOnChannel) || (directMessageId && areOnDirectMessage)) {
		return false;
	}

	return true;
};

export const navigateToNotification = async (store: any, notification: any, navigation: any, time?: number) => {
	const link = notification?.data?.link;
	if (link) {
		const linkMatch = link.match(clanAndChannelIdLinkRegex);

		// IF is notification to channel
		if (linkMatch) {
			if (navigation) {
				navigation.navigate(APP_SCREEN.HOME as never);
				navigation.dispatch(DrawerActions.closeDrawer());
			}
			const clanId = linkMatch?.[1];
			const channelId = linkMatch?.[2];
			const respChannel = await store.dispatch(channelsActions.fetchChannels({ clanId: clanId, noCache: true }));
			const isExistChannel = respChannel?.payload?.find?.((channel: { channel_id: string }) => channel.channel_id === channelId);
			store.dispatch(appActions.setLoadingMainMobile(false));
			if (isExistChannel) {
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			}
			save(STORAGE_CLAN_ID, clanId);
			const joinAndChangeClan = async (store: any, clanId: string) => {
				await Promise.all([
					store.dispatch(clansActions.joinClan({ clanId: clanId })),
					store.dispatch(clansActions.changeCurrentClan({ clanId: clanId, noCache: true })),
					isExistChannel
						? store.dispatch(
								channelsActions.joinChannel({
									clanId: clanId ?? '',
									channelId: channelId,
									noFetchMembers: false,
									isClearMessage: true
								})
							)
						: Promise.resolve()
				]);
			};
			await joinAndChangeClan(store, clanId);
			if (!isExistChannel) {
				await setDefaultChannelLoader(respChannel.payload, clanId);
			}
			setTimeout(() => {
				store.dispatch(appActions.setIsFromFCMMobile(false));
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
			}, 4000);
		} else {
			const linkDirectMessageMatch = link.match(clanDirectMessageLinkRegex);

			// IS message DM
			if (linkDirectMessageMatch) {
				await store.dispatch(directActions.fetchDirectMessage({ noCache: true }));
				const messageId = linkDirectMessageMatch[1];
				const clanIdCache = load(STORAGE_CLAN_ID);
				store.dispatch(clansActions.joinClan({ clanId: '0' }));
				if (navigation) {
					navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
						screen: APP_SCREEN.MESSAGES.MESSAGE_DETAIL,
						params: { directMessageId: messageId }
					});
				}
				store.dispatch(appActions.setLoadingMainMobile(false));
				// force from killed app call in background apply for back fetch channels
				if (time && Number(clanIdCache || 0) !== 0) {
					const joinChangeFetchAndSetLoader = async (store: any, clanIdCache: string) => {
						const [respCurrentClan, respChannel] = await Promise.all([
							store.dispatch(clansActions.changeCurrentClan({ clanId: clanIdCache, noCache: true })),
							store.dispatch(channelsActions.fetchChannels({ clanId: clanIdCache, noCache: true }))
						]);

						await setDefaultChannelLoader(respChannel.payload, clanIdCache);
					};
					await joinChangeFetchAndSetLoader(store, clanIdCache);
				}
				setTimeout(() => {
					store.dispatch(appActions.setIsFromFCMMobile(false));
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				}, 4000);
			} else {
				store.dispatch(appActions.setLoadingMainMobile(false));
				setTimeout(() => {
					store.dispatch(appActions.setIsFromFCMMobile(false));
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				}, 4000);
			}
		}
	} else {
		store.dispatch(appActions.setLoadingMainMobile(false));
		setTimeout(() => {
			store.dispatch(appActions.setIsFromFCMMobile(false));
			save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
		}, 4000);
	}
};

const processNotification = async ({ notification, navigation, time = 0 }) => {
	const store = await getStoreAsync();
	save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
	store.dispatch(appActions.setLoadingMainMobile(true));
	store.dispatch(appActions.setIsFromFCMMobile(true));
	if (time) {
		setTimeout(() => {
			navigateToNotification(store, notification, navigation, time);
		}, time);
	} else {
		navigateToNotification(store, notification, navigation);
	}
};

export const setupNotificationListeners = async (navigation) => {
	// await notifee.createChannel({
	// 	id: 'default',
	// 	name: 'mezon',
	// 	importance: AndroidImportance.HIGH,
	// 	vibration: true,
	// 	vibrationPattern: [300, 500]
	// });

	messaging()
		.getInitialNotification()
		.then(async (remoteMessage) => {
			if (remoteMessage) {
				const store = await getStoreAsync();
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
				store.dispatch(appActions.setIsFromFCMMobile(true));
				if (remoteMessage?.notification?.title) {
					processNotification({
						notification: { ...remoteMessage?.notification, data: remoteMessage?.data },
						navigation,
						time: 600
					});
				}
			}
		});

	messaging().onNotificationOpenedApp(async (remoteMessage) => {
		processNotification({
			notification: { ...remoteMessage?.notification, data: remoteMessage?.data },
			navigation,
			time: 0
		});
	});

	// messaging().setBackgroundMessageHandler(async (remoteMessage) => {});

	return notifee.onForegroundEvent(({ type, detail }) => {
		switch (type) {
			case EventType.DISMISSED:
				break;
			case EventType.PRESS:
				processNotification({
					notification: detail.notification,
					navigation
				});
				break;
		}
	});
};

export const setupCallKeep = async () => {
	const granted = await requestMultiple([PERMISSIONS.ANDROID.READ_PHONE_NUMBERS]);
	if (granted[PERMISSIONS.ANDROID.READ_PHONE_NUMBERS] !== RESULTS.GRANTED && Platform.OS === 'android') return false;
	try {
		await RNCallKeep.setup({
			ios: {
				appName: 'Mezon',
				supportsVideo: false,
				maximumCallGroups: '1',
				maximumCallsPerCallGroup: '1',
				includesCallsInRecents: false,
				ringtoneSound: 'ringing'
			},
			android: {
				alertTitle: 'Permissions required',
				alertDescription: 'Mezon needs to access your phone accounts to receive calls from mezon',
				cancelButton: 'Cancel',
				okButton: 'ok',
				selfManaged: true,
				additionalPermissions: [PERMISSIONS.ANDROID.WRITE_CALL_LOG],
				foregroundService: {
					channelId: 'com.mezon.mobile',
					channelName: 'Incoming Call',
					notificationTitle: 'Incoming Call',
					notificationIcon: 'ic_notification'
				}
			}
		});
		return true;
	} catch (error) {
		console.error('initializeCallKeep error:', (error as Error)?.message);
	}
};

const showRNNotificationCall = async (bodyData: any) => {
	try {
		const granted = await requestMultiple([PERMISSIONS.ANDROID.READ_PHONE_NUMBERS]);
		if (granted[PERMISSIONS.ANDROID.READ_PHONE_NUMBERS] !== RESULTS.GRANTED) return;
		const answerOption = {
			channelId: 'com.mezon.mobile',
			channelName: 'Incoming Call',
			notificationIcon: 'ic_notification',
			notificationTitle: 'Incoming Call',
			notificationBody: `${bodyData?.callerName} is calling you`,
			answerText: 'Answer',
			declineText: 'Decline',
			isVideo: false,
			displayCallReachabilityTimeout: 30000,
			notificationColor: 'colorAccent',
			notificationSound: 'ringing',
			payload: {
				offer: bodyData?.offer,
				callerId: bodyData?.callerId,
				callerAvatar: bodyData?.callerAvatar,
				callerName: bodyData?.callerName
			}
		};
		RNNotificationCall.displayNotification(uuid.v4(), bodyData?.callerAvatar, 30000, answerOption);
		RNNotificationCall.addEventListener('endCall', (data: any) => {
			const { callUUID = '' } = data || {};
			RNCallKeep.endCall(callUUID);
			RNNotificationCall.declineCall(callUUID);
		});
		RNNotificationCall.addEventListener('answer', (data: any) => {
			RNNotificationCall.backToApp();
			RNNotificationCall.hideNotification();
			const { callUUID = '', payload = {} } = data || {};
			RNCallKeep.endCall(callUUID);
			setTimeout(() => {
				DeviceEventEmitter.emit(ActionEmitEvent.GO_TO_CALL_SCREEN, { payload: safeJSONParse(payload || '{}') });
			}, 3000);
		});
	} catch (error) {
		/* empty */
	}
};

const listRNCallKeep = async (bodyData: any) => {
	try {
		RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
			RNCallKeep.backToForeground();
			RNCallKeep.endCall(callUUID);
			setTimeout(() => {
				DeviceEventEmitter.emit(ActionEmitEvent.GO_TO_CALL_SCREEN, { payload: bodyData });
			}, 3000);
			RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
				RNCallKeep.endCall(callUUID);
			});
		});
	} catch (error) {
		/* empty */
	}
};
export const setupIncomingCall = async (body: string) => {
	try {
		const bodyData = safeJSONParse(body || '{}');
		const statusSetup = await setupCallKeep();
		if (!statusSetup) return;

		if (Platform.OS === 'android') {
			await showRNNotificationCall(bodyData);
		} else {
			await listRNCallKeep(bodyData);
		}
		RNCallKeep.displayIncomingCall(uuid.v4(), uuid.v4(), `${bodyData?.callerName} is calling you`, 'number', false, null);
	} catch (error) {
		console.error('log  => setupIncomingCall', error);
		/* empty */
	}
};
