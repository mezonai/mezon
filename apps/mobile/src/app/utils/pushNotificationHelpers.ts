import {
	ActionEmitEvent,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	getUpdateOrAddClanChannelCache,
	load,
	save
} from '@mezon/mobile-components';
import { appActions, channelsActions, clansActions, directActions, getStoreAsync, messagesActions, topicsActions } from '@mezon/store-mobile';
import notifee, { EventType } from '@notifee/react-native';
import { AndroidVisibility } from '@notifee/react-native/src/types/NotificationAndroid';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { safeJSONParse } from 'mezon-js';
import { Alert, DeviceEventEmitter, Linking, PermissionsAndroid, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { PERMISSIONS, RESULTS, requestMultiple } from 'react-native-permissions';
import VoipPushNotification from 'react-native-voip-push-notification';
import { APP_SCREEN } from '../navigation/ScreenTypes';
import { clanAndChannelIdLinkRegex, clanDirectMessageLinkRegex } from './helpers';

export const checkNotificationPermission = async () => {
	if (Platform.OS === 'ios') await notifee.requestPermission();

	if (Platform.OS === 'android' && Platform.Version >= 33) {
		await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
	} else {
		const authorizationStatus = await messaging().hasPermission();

		if (authorizationStatus === messaging.AuthorizationStatus.NOT_DETERMINED) {
			// Permission has not been requested yet
			await requestNotificationPermission();
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
	const topicId = notification?.data?.topicId;
	if (link) {
		const linkMatch = link.match(clanAndChannelIdLinkRegex);

		// IF is notification to channel
		if (linkMatch) {
			const clanId = linkMatch?.[1];
			const channelId = linkMatch?.[2];
			store.dispatch(
				messagesActions.fetchMessages({ clanId: clanId, channelId, isFetchingLatestMessages: true, isClearMessage: true, noCache: true })
			);
			if (navigation) {
				navigation.navigate(APP_SCREEN.HOME_DEFAULT as never);
			}
			store.dispatch(directActions.setDmGroupCurrentId(''));
			if (clanId && channelId) {
				const clanIdCache = load(STORAGE_CLAN_ID);
				if (clanIdCache !== clanId || time) {
					const joinAndChangeClan = async (store: any, clanId: string) => {
						await Promise.all([
							store.dispatch(clansActions.joinClan({ clanId: clanId })),
							store.dispatch(clansActions.changeCurrentClan({ clanId: clanId, noCache: true }))
						]);
					};
					await joinAndChangeClan(store, clanId);
				}
				store.dispatch(
					channelsActions.joinChannel({
						clanId: clanId ?? '',
						channelId: channelId,
						noFetchMembers: false,
						isClearMessage: true,
						noCache: true
					})
				);
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
				save(STORAGE_CLAN_ID, clanId);
			}
			store.dispatch(appActions.setLoadingMainMobile(false));
			if (topicId && topicId !== '0' && !!topicId) {
				await handleOpenTopicDiscustion(store, topicId, channelId, navigation);
			}
			setTimeout(() => {
				store.dispatch(appActions.setIsFromFCMMobile(false));
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
			}, 4000);
		} else {
			const linkDirectMessageMatch = link.match(clanDirectMessageLinkRegex);

			// IS message DM
			if (linkDirectMessageMatch) {
				const messageId = linkDirectMessageMatch[1];
				store.dispatch(
					messagesActions.fetchMessages({
						clanId: '0',
						channelId: messageId,
						noCache: true,
						isFetchingLatestMessages: true,
						isClearMessage: true
					})
				);
				if (navigation) {
					navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: messageId });
				}
				store.dispatch(appActions.setLoadingMainMobile(false));
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

const handleOpenTopicDiscustion = async (store: any, topicId: string, channelId: string, navigation: any) => {
	const promises = [];
	promises.push(store.dispatch(topicsActions.setCurrentTopicInitMessage(null)));
	promises.push(store.dispatch(topicsActions.setCurrentTopicId(topicId || '')));
	promises.push(store.dispatch(topicsActions.setIsShowCreateTopic(true)));

	await Promise.all(promises);

	navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
		screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
	});
};

const processNotification = async ({ notification, navigation, time = 0 }) => {
	const store = await getStoreAsync();
	save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
	store.dispatch(appActions.setLoadingMainMobile(true));
	store.dispatch(appActions.setIsFromFCMMobile(true));
	if (time) {
		// DeviceEventEmitter.emit(ActionEmitEvent.ON_DISMISS_UI_FROM_FCM, true);
		setTimeout(() => {
			navigateToNotification(store, notification, navigation, time);
		}, time);
		// setTimeout(() => {
		// 	DeviceEventEmitter.emit(ActionEmitEvent.ON_DISMISS_UI_FROM_FCM, false);
		// }, 3000);
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
						time: 1
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
					navigation,
					time: 1
				});
				break;
		}
	});
};

export const setupCallKeep = async () => {
	const granted = await requestMultiple([PERMISSIONS.ANDROID.READ_PHONE_NUMBERS]);
	if (granted[PERMISSIONS.ANDROID.READ_PHONE_NUMBERS] !== RESULTS.GRANTED && Platform.OS === 'android') return false;
	try {
		const options = {
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
		};
		await RNCallKeep.setup(options);
		if (Platform.OS === 'android') {
			RNCallKeep.registerPhoneAccount(options);
			RNCallKeep.registerAndroidEvents();
			RNCallKeep.setAvailable(true);
		}
		return true;
	} catch (error) {
		console.error('initializeCallKeep error:', (error as Error)?.message);
	}
};

const listRNCallKeep = async (bodyData: any) => {
	try {
		RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
			for (let i = 0; i < 10; i++) {
				RNCallKeep.backToForeground();
			}
			setTimeout(() => {
				RNCallKeep.endCall(callUUID);
				DeviceEventEmitter.emit(ActionEmitEvent.GO_TO_CALL_SCREEN, { payload: bodyData });
			}, 2000);
		});
		RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
			RNCallKeep.endCall(callUUID);
		});
	} catch (error) {
		/* empty */
	}
};
export const setupIncomingCall = async (body: string) => {
	try {
		const bodyData = safeJSONParse(body || '{}');
		if (bodyData?.offer === 'CANCEL_CALL') {
			const callID = '6cb67209-4ef9-48c0-a8dc-2cec6cd6261d';
			RNCallKeep.endCall(callID);
			return;
		}
		if (Platform.OS === 'ios') {
			const options = {
				playSound: true,
				vibration: true,
				sound: 'ringing',
				vibrationPattern: [0, 500, 1000],
				timeout: 30000
			};
			const callID = '6cb67209-4ef9-48c0-a8dc-2cec6cd6261d';
			RNCallKeep.displayIncomingCall(callID, callID, `${bodyData?.callerName} is calling you`, 'number', true, options);
			await listRNCallKeep(bodyData);
		}
	} catch (error) {
		console.error('log  => setupIncomingCall', error);
		/* empty */
	}
};
