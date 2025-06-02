import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	load,
	save,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	STORAGE_MY_USER_ID
} from '@mezon/mobile-components';
import { appActions, channelsActions, clansActions, directActions, getStoreAsync, topicsActions, usersClanActions } from '@mezon/store-mobile';
import notifee, { EventType } from '@notifee/react-native';
import {
	AndroidBadgeIconType,
	AndroidCategory,
	AndroidImportance,
	AndroidVisibility,
	NotificationAndroid
} from '@notifee/react-native/src/types/NotificationAndroid';
import { NotificationIOS } from '@notifee/react-native/src/types/NotificationIOS';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { safeJSONParse } from 'mezon-js';
import { Alert, DeviceEventEmitter, Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { PERMISSIONS, requestMultiple, RESULTS } from 'react-native-permissions';
import { APP_SCREEN } from '../navigation/ScreenTypes';
import { clanAndChannelIdLinkRegex, clanDirectMessageLinkRegex } from './helpers';

// Type definitions
interface VoIPManagerType {
	registerForVoIPPushes(): Promise<string>;
	getVoIPToken(): Promise<string>;
	reportIncomingCall(callId: string, callerName: string, callerNumber: string, hasVideo: boolean): Promise<string>;
	endCall(callId: string): Promise<string>;
}

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

const getConfigDisplayNotificationAndroid = async (data: { [key: string]: string | object }) => {
	const defaultConfig: NotificationAndroid = {
		visibility: AndroidVisibility.PUBLIC,
		channelId: 'default',
		smallIcon: 'ic_notification',
		color: '#000000',
		sound: 'default',
		largeIcon: data?.image,
		smallIconLevel: 10,
		importance: AndroidImportance.HIGH,
		showTimestamp: true,
		badgeIconType: AndroidBadgeIconType.LARGE,
		pressAction: {
			id: 'default',
			launchActivity: 'com.mezon.mobile.MainActivity'
		}
	};

	if (!data?.channel) {
		return defaultConfig;
	}

	const channelGroup = await getOrCreateChannelGroup(data.channel as string);
	const channelId = await createNotificationChannel(data.channel as string, channelGroup?.groupId);

	return {
		...defaultConfig,
		channelId,
		tag: channelId,
		sortKey: channelId,
		category: AndroidCategory.MESSAGE,
		groupId: channelGroup?.groupId,
		groupSummary: channelGroup?.isGroupSummary
	};
};

const getOrCreateChannelGroup = async (channelId: string): Promise<any> => {
	let groupId = '';
	const group = await notifee.getChannelGroup(channelId);
	const notifications = await notifee.getDisplayedNotifications();
	const existInNotification = notifications?.some?.((item) => item?.notification?.android?.groupId === channelId);
	if (group) {
		groupId = group?.id;
	}
	groupId = await notifee.createChannelGroup({
		id: channelId,
		name: channelId
	});

	return {
		groupId,
		isGroupSummary: group === null || !existInNotification
	};
};

const createNotificationChannel = async (channelId: string, groupId: string): Promise<string> => {
	return await notifee.createChannel({
		id: channelId,
		name: channelId,
		groupId,
		importance: AndroidImportance.HIGH,
		sound: 'default',
		visibility: AndroidVisibility.PUBLIC
	});
};

const getConfigDisplayNotificationIOS = async (data: { [key: string]: string | object }) => {
	const defaultConfig: NotificationIOS = {
		critical: true,
		criticalVolume: 1.0,
		sound: 'default',
		foregroundPresentationOptions: {
			badge: true,
			banner: true,
			list: true,
			sound: true
		}
	};

	return {
		...defaultConfig,
		threadId: (data?.channel as string) || undefined
	};
};

export const createLocalNotification = async (title: string, body: string, data: { [key: string]: string | object }) => {
	try {
		const myUserId = load(STORAGE_MY_USER_ID);
		if (['video call', 'audio call', 'Untitled message'].some((text) => body?.includes?.(text)) || myUserId === data?.sender) return;
		const configDisplayNotificationAndroid: NotificationAndroid =
			Platform.OS === 'android' ? await getConfigDisplayNotificationAndroid(data) : {};
		const configDisplayNotificationIOS: NotificationIOS = Platform.OS === 'ios' ? await getConfigDisplayNotificationIOS(data) : {};
		await notifee.displayNotification({
			title: title || '',
			body: body,
			subtitle: (data?.subtitle as string) || '',
			data: data,
			android: configDisplayNotificationAndroid,
			ios: configDisplayNotificationIOS
		});
	} catch (err) {
		console.error('log  => err', err);
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
	// Todo: update later
	// if (Platform.OS === 'ios') VoipPushNotification.registerVoipToken();

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
	if (!remoteMessage?.data) {
		return false;
	}

	const link = remoteMessage?.data?.link as string;
	const directMessageId = link?.match?.(clanDirectMessageLinkRegex)?.[1] || '';
	const channelMessageId = link?.match?.(clanAndChannelIdLinkRegex)?.[2] || '';

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

export const navigateToNotification = async (store: any, notification: any, navigation: any, isTabletLandscape = false, time?: number) => {
	const link = notification?.data?.link;
	const topicId = notification?.data?.topic;
	if (link) {
		const linkMatch = link.match(clanAndChannelIdLinkRegex);

		// IF is notification to channel
		if (linkMatch) {
			const clanId = linkMatch?.[1];
			const channelId = linkMatch?.[2];
			if (navigation) {
				navigation.navigate(APP_SCREEN.HOME_DEFAULT as never);
			}
			store.dispatch(directActions.setDmGroupCurrentId(''));
			if (clanId && channelId) {
				store.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId }));
				const clanIdCache = load(STORAGE_CLAN_ID);
				if (clanIdCache !== clanId || time) {
					const joinAndChangeClan = async (store: any, clanId: string) => {
						await Promise.all([
							store.dispatch(clansActions.joinClan({ clanId: clanId })),
							store.dispatch(clansActions.changeCurrentClan({ clanId: clanId, noCache: true })),
							store.dispatch(usersClanActions.fetchUsersClan({ clanId: clanId }))
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
				if (navigation) {
					if (isTabletLandscape) {
						await store.dispatch(directActions.setDmGroupCurrentId(messageId));
						navigation.navigate(APP_SCREEN.MESSAGES.HOME);
					} else {
						navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: messageId });
					}
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

	if (navigation) {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
	}
};

const processNotification = async ({ notification, navigation, time = 0, isTabletLandscape = false }) => {
	const store = await getStoreAsync();
	save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
	store.dispatch(appActions.setLoadingMainMobile(true));
	store.dispatch(appActions.setIsFromFCMMobile(true));
	if (time) {
		setTimeout(() => {
			navigateToNotification(store, notification, navigation, isTabletLandscape, time);
		}, time);
	} else {
		navigateToNotification(store, notification, navigation, isTabletLandscape);
	}
};

export const setupNotificationListeners = async (navigation, isTabletLandscape = false) => {
	messaging()
		.getInitialNotification()
		.then(async (remoteMessage) => {
			notifee
				.getInitialNotification()
				.then(async (resp) => {
					if (resp) {
						const store = await getStoreAsync();
						save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
						store.dispatch(appActions.setIsFromFCMMobile(true));
						if (resp) {
							processNotification({
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
					processNotification({
						notification: { ...remoteMessage?.notification, data: remoteMessage?.data },
						navigation,
						time: 1,
						isTabletLandscape
					});
				}
			}
		});

	messaging().onNotificationOpenedApp(async (remoteMessage) => {
		processNotification({
			notification: { ...remoteMessage?.notification, data: remoteMessage?.data },
			navigation,
			time: 0,
			isTabletLandscape
		});
	});

	notifee.onBackgroundEvent(async ({ type, detail }) => {
		// const { notification, pressAction, input } = detail;
		if (type === EventType.PRESS && detail) {
			processNotification({
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
		return true;
	} catch (error) {
		console.error('initializeCallKeep error:', (error as Error)?.message);
	}
};

export const getVoIPToken = async () => {
	try {
		const VoIPManager = NativeModules?.VoIPManager as VoIPManagerType;
		await VoIPManager.registerForVoIPPushes();
		return await VoIPManager.getVoIPToken();
	} catch (e) {
		return '';
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
			const callID = '0731961b-415b-44f3-a960-dd94ef3372fc';
			RNCallKeep.endCall(callID);
			return;
		}
		// if (Platform.OS === 'ios') {
		// 	const options = {
		// 		playSound: true,
		// 		vibration: true,
		// 		sound: 'ringing',
		// 		vibrationPattern: [0, 500, 1000],
		// 		timeout: 30000
		// 	};
		// 	const callID = '6cb67209-4ef9-48c0-a8dc-2cec6cd6261d';
		// 	RNCallKeep.displayIncomingCall(callID, callID, `${bodyData?.callerName} is calling you`, 'number', true, options);
		// 	await listRNCallKeep(bodyData);
		// }
	} catch (error) {
		console.error('log  => setupIncomingCall', error);
		/* empty */
	}
};
