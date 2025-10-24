import {
	ActionEmitEvent,
	getUpdateOrAddClanChannelCache,
	load,
	save,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_IS_DISABLE_LOAD_BACKGROUND,
	STORAGE_MY_USER_ID,
	STORAGE_OFFER_HAVE_CALL_CACHE
} from '@mezon/mobile-components';
import { appActions, channelsActions, clansActions, directActions, getFirstMessageOfTopic, getStoreAsync, topicsActions } from '@mezon/store-mobile';
import i18n from '@mezon/translations';
import { sleep } from '@mezon/utils';
import notifee, { AndroidLaunchActivityFlag, AuthorizationStatus as NotifeeAuthorizationStatus } from '@notifee/react-native';
import type { NotificationAndroid } from '@notifee/react-native/src/types/NotificationAndroid';
import {
	AndroidBadgeIconType,
	AndroidCategory,
	AndroidGroupAlertBehavior,
	AndroidImportance,
	AndroidStyle,
	AndroidVisibility
} from '@notifee/react-native/src/types/NotificationAndroid';
import { getApp } from '@react-native-firebase/app';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { AuthorizationStatus, getMessaging, getToken, hasPermission, requestPermission } from '@react-native-firebase/messaging';
import { CommonActions } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import React from 'react';
import { DeviceEventEmitter, Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import MezonConfirm from '../componentUI/MezonConfirm';
import { APP_SCREEN } from '../navigation/ScreenTypes';
import { InboxType } from '../screens/Notifications';
import { clanAndChannelIdLinkRegex, clanDirectMessageLinkRegex } from './helpers';
const messaging = getMessaging(getApp());

// Type definitions and validation helpers
interface VoIPManagerType {
	registerForVoIPPushes(): Promise<string>;
	getVoIPToken(): Promise<string>;
	reportIncomingCall(callId: string, callerName: string, callerNumber: string, hasVideo: boolean): Promise<string>;
	endCall(callId: string): Promise<string>;
}

const isNotificationAlreadyDisplayed = async (data: Record<string, any>): Promise<boolean> => {
	try {
		const displayedNotifications = await notifee.getDisplayedNotifications();
		if (displayedNotifications?.length === 0) {
			return false;
		}
		return displayedNotifications?.some?.((notification) => {
			return JSON.stringify(notification.notification?.data?.message) == JSON.stringify(data?.message);
		});
	} catch (error) {
		console.error('Error checking displayed notifications:', error);
		return false;
	}
};

// Safe validation helpers
const isValidString = (value: unknown): value is string => {
	return typeof value === 'string' && value.trim().length > 0;
};

const isValidObject = (value: unknown): value is Record<string, unknown> => {
	return value !== null && typeof value === 'object';
};

const validateNotificationData = (data: Record<string, unknown> | undefined): data is Record<string, string | object> => {
	return isValidObject(data) && Object.keys(data).length > 0;
};

const safeGetChannelFromData = (data: Record<string, unknown>): string | null => {
	const channel = data?.channel;
	return isValidString(channel) ? channel : null;
};

export const checkNotificationPermission = async () => {
	try {
		if (Platform.OS === 'ios') await notifee.requestPermission();

		if (Platform.OS === 'android' && Platform.Version >= 33) {
			await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
		} else {
			const authorizationStatus = await hasPermission(messaging);

			if (authorizationStatus === AuthorizationStatus.NOT_DETERMINED) {
				await requestNotificationPermission();
			}
		}
	} catch (error) {
		console.error('Error checking notification permission:', error);
	}
};

// Check notification permission cross-platform with optional ensure-request.
// - By default (ensureRequest = false): check-only, no system prompt.
// - If ensureRequest = true: will prompt when applicable (iOS NOT_DETERMINED, Android 13+ runtime permission not yet granted).
export const getNotificationPermission = async (ensureRequest = false): Promise<boolean> => {
	try {
		if (Platform.OS === 'ios') {
			const settings = await notifee.getNotificationSettings();
			let status = settings.authorizationStatus;

			if (ensureRequest && status === NotifeeAuthorizationStatus.NOT_DETERMINED) {
				const req = await notifee.requestPermission();
				status = req.authorizationStatus;
			}

			return status === NotifeeAuthorizationStatus.AUTHORIZED || status === NotifeeAuthorizationStatus.PROVISIONAL;
		}

		// Android
		const notifSettings = await notifee.getNotificationSettings();
		const enabledInSystemSettings = notifSettings.authorizationStatus === NotifeeAuthorizationStatus.AUTHORIZED;

		const androidApiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
		if (androidApiLevel >= 33) {
			const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
			let granted = await PermissionsAndroid.check(permission);
			if (ensureRequest && !granted) {
				const res = await PermissionsAndroid.request(permission);
				granted = res === PermissionsAndroid.RESULTS.GRANTED;
			}
			return granted && enabledInSystemSettings;
		}

		// Android < 13: no runtime permission; rely on system app notification toggle
		return enabledInSystemSettings;
	} catch (error) {
		console.error('getNotificationPermission error:', error);
		return false;
	}
};

const requestNotificationPermission = async () => {
	try {
		await requestPermission(messaging, {
			alert: true,
			sound: true,
			badge: true
		});
	} catch (error) {
		const t = i18n.t;
		const data = {
			children: React.createElement(MezonConfirm, {
				title: t('common:permissionNotification.notificationTitle'),
				content: t('common:permissionNotification.notificationError'),
				confirmText: t('common:openSettings'),
				onConfirm: () => {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
					openAppSettings();
				}
			})
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}
};

const openAppSettings = () => {
	try {
		if (Platform.OS === 'ios') {
			Linking.openURL('app-settings:');
		} else {
			Linking.openSettings();
		}
	} catch (error) {
		console.error('Error opening app settings:', error);
	}
};

const getConfigDisplayNotificationAndroid = async (data: Record<string, string | object>): Promise<NotificationAndroid> => {
	const defaultConfig: NotificationAndroid = {
		channelId: `${data?.sound !== 'default' ? `${data?.sound}_` : ''}default`,
		smallIcon: 'ic_notification',
		color: '#7029c1',
		sound: (data?.sound as string) || 'default',
		smallIconLevel: 10,
		importance: AndroidImportance.HIGH,
		showTimestamp: true,
		badgeIconType: AndroidBadgeIconType.LARGE,
		actions: [],
		pressAction: {
			id: 'default',
			launchActivity: 'com.mezon.mobile.MainActivity'
		}
	};

	if (isValidString(data?.image) && data?.image) {
		defaultConfig.largeIcon = data.image as string;
	}

	const channel = safeGetChannelFromData(data);
	if (!channel) {
		return defaultConfig;
	}

	try {
		const groupId = await getOrCreateChannelGroup(channel);
		const channelId = await createNotificationChannel(
			channel + (data?.sound !== 'default' ? `_${data?.sound}` : ''),
			groupId || '',
			(data?.sound as string) || 'default'
		);
		const now = Date.now();

		return {
			...defaultConfig,
			channelId,
			tag: channelId,
			category: AndroidCategory.MESSAGE,
			groupId,
			groupSummary: false,
			groupAlertBehavior: AndroidGroupAlertBehavior.ALL,
			sortKey: String(Number.MAX_SAFE_INTEGER - now),
			timestamp: now
		};
	} catch (error) {
		console.error('Error configuring Android notification:', error);
		return defaultConfig;
	}
};

const getOrCreateChannelGroup = async (channelId: string): Promise<string> => {
	try {
		if (!isValidString(channelId)) return null;

		let groupId = '';
		const group = await notifee.getChannelGroup(channelId);

		if (group?.id) {
			groupId = group.id;
		} else {
			groupId = await notifee.createChannelGroup({
				id: channelId,
				name: channelId
			});
		}

		return groupId;
	} catch (error) {
		console.error('Error creating channel group:', error);
		return '';
	}
};

const createNotificationChannel = async (channelId: string, groupId: string, sound: string): Promise<string> => {
	try {
		if (!isValidString(channelId) || !isValidString(groupId)) {
			throw new Error('Invalid channel or group ID');
		}

		return await notifee.createChannel({
			id: channelId,
			name: channelId,
			groupId,
			importance: AndroidImportance.HIGH,
			sound: sound ? sound : 'default'
		});
	} catch (error) {
		console.error('Error creating notification channel:', error);
		return channelId;
	}
};

export const createLocalNotification = async (title: string, body: string, data: Record<string, string | object>) => {
	try {
		// Input validation
		if (!isValidString(title) || !isValidString(body)) {
			console.error('Invalid notification title or body');
			return;
		}

		if (!validateNotificationData(data)) {
			console.error('Invalid notification data');
			return;
		}

		const myUserId = load(STORAGE_MY_USER_ID);
		const excludedMessages = ['video call', 'audio call', 'Untitled message'];

		// Skip if it's a call message or from the current user
		if (excludedMessages.some((text) => body.includes(text)) || myUserId === data?.sender) {
			return;
		}

		const configDisplayNotificationAndroid: NotificationAndroid =
			Platform.OS === 'android' ? await getConfigDisplayNotificationAndroid(data) : {};
		const timestamp = Date.now();
		const notificationId = `${data?.sender || 'unknown'}_${timestamp}`;
		const isAlreadyDisplayed = await isNotificationAlreadyDisplayed(data);
		if (isAlreadyDisplayed) {
			return;
		}

		const isBuzzSound = data?.sound === 'buzz' || configDisplayNotificationAndroid?.sound === 'buzz';

		let displayTitle = title.trim();
		let displayBody = body.trim();

		if (isBuzzSound) {
			displayTitle = `<b>${displayTitle}</b>`;
			displayBody = `<b>${displayBody}</b>`;
		}

		await notifee.displayNotification({
			id: notificationId,
			title: displayTitle,
			body: displayBody,
			subtitle: isValidString(data?.subtitle) ? (data.subtitle as string) : '',
			data: { ...data, notificationTimestamp: timestamp },
			android: {
				...configDisplayNotificationAndroid,
				...(isBuzzSound && {
					color: '#FF0000',
					colorized: true
				}),
				actions: []
			},
			ios: {}
		});

		// Create or update summary notification for Android
		if (Platform.OS === 'android' && configDisplayNotificationAndroid.groupId) {
			const displayedNotifications = await notifee.getDisplayedNotifications();
			const groupNotifications = displayedNotifications.filter(
				(n) => n.notification.android?.groupId === configDisplayNotificationAndroid.groupId
			);

			if (groupNotifications.length > 1) {
				const sortedNotifications = groupNotifications.sort((a, b) => {
					const timestampA = a.notification.android?.timestamp || 0;
					const timestampB = b.notification.android?.timestamp || 0;
					return timestampB - timestampA;
				});

				await notifee.displayNotification({
					id: `summary_${configDisplayNotificationAndroid.groupId}`,
					title: 'New Messages',
					body: `${groupNotifications.length} new messages`,
					data,
					android: {
						...configDisplayNotificationAndroid,
						groupSummary: true,
						groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
						timestamp: Math.max(...groupNotifications.map((n) => n.notification.android?.timestamp || 0)),
						sortKey: String(Number.MAX_SAFE_INTEGER - Date.now()),
						actions: [],
						style: {
							type: AndroidStyle.MESSAGING,
							person: {
								name: title,
								icon: (configDisplayNotificationAndroid?.largeIcon || '') as string
							},
							group: true,
							messages: sortedNotifications.map((n) => ({
								text: n.notification.body || '',
								timestamp: n.notification.android?.timestamp || Date.now(),
								person: {
									name: (n?.notification?.data?.title || '') as string,
									icon: n.notification?.data?.image as string
								}
							}))
						}
					}
				});
			}
		}
	} catch (err) {
		console.error('Error creating local notification:', err);
	}
};

export const handleFCMToken = async (): Promise<string | undefined> => {
	try {
		const authStatus = await requestPermission(messaging, {
			alert: true,
			sound: true,
			badge: true
		});

		const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;

		if (enabled) {
			const fcmtoken = await getToken(messaging);
			if (isValidString(fcmtoken)) {
				return fcmtoken;
			}
		}
	} catch (error) {
		console.error('Error handling FCM token:', error);
	}
	return undefined;
};

export const isShowNotification = (
	currentChannelId: string | undefined,
	currentDmId: string | undefined,
	remoteMessage: FirebaseMessagingTypes.RemoteMessage,
	options?: { isViewingChannel?: boolean; isViewingDirectMessage?: boolean },
	currentTopicId?: string | undefined,
	isVoiceFullScreen?: boolean
): boolean => {
	try {
		if (!validateNotificationData(remoteMessage?.data)) {
			return false;
		}

		const link = remoteMessage.data?.link;
		if (!isValidString(link)) {
			return false;
		}

		if (isVoiceFullScreen) {
			return true;
		}

		const directMessageMatch = link.match(clanDirectMessageLinkRegex);
		const channelMessageMatch = link.match(clanAndChannelIdLinkRegex);

		const directMessageId = directMessageMatch?.[1] || '';
		const channelMessageId = channelMessageMatch?.[2] || '';
		const topicMessageId = remoteMessage.data?.topic || '';

		const areOnChannel = currentChannelId === channelMessageId;
		const areOnDirectMessage = currentDmId === directMessageId;
		const isOntopicDiscussion = topicMessageId && topicMessageId !== '0';
		const areOncurrentTopic = currentTopicId && currentTopicId === topicMessageId;
		const isViewingChannel = !!options?.isViewingChannel;
		const isViewingDirectMessage = !!options?.isViewingDirectMessage;
		const isViewingtopicDiscussion = !!currentTopicId;

		if (!isViewingChannel && isViewingtopicDiscussion && areOnChannel && isOntopicDiscussion && areOncurrentTopic) return false;

		// If currently viewing DM but notification is for a channel the user has open in background
		if (areOnChannel && currentDmId) return true;

		// Suppress only when user is actively on the same destination screen
		if (channelMessageId && areOnChannel && isViewingChannel && !isOntopicDiscussion) return false;
		if (directMessageId && areOnDirectMessage && isViewingDirectMessage) return false;

		return true;
	} catch (error) {
		console.error('Error checking notification visibility:', error);
		return false;
	}
};

export const navigateToNotification = async (store: any, notification: any, navigation: any, isTabletLandscape = false, time?: number) => {
	const link = notification?.data?.link;
	const topicId = notification?.data?.topic;
	const isDirectDM = !!notification?.data?.channel && link?.includes('direct/friends');
	if (link && !isDirectDM) {
		const linkMatch = link.match(clanAndChannelIdLinkRegex);

		// IF is notification to channel
		if (linkMatch) {
			const clanId = linkMatch?.[1];
			const channelId = linkMatch?.[2];
			if (channelId !== '0' && !!channelId) {
				store.dispatch(directActions.setDmGroupCurrentId(''));
				store.dispatch(channelsActions.setCurrentChannelId({ clanId, channelId }));
				store.dispatch(
					channelsActions.joinChannel({
						clanId: clanId ?? '',
						channelId,
						noFetchMembers: false,
						isClearMessage: true,
						noCache: true,
						isDisableJump: true
					})
				);
			}
			if (navigation) {
				if (isTabletLandscape) {
					navigation.navigate(APP_SCREEN.HOME as never);
				} else {
					navigation.navigate(APP_SCREEN.BOTTOM_BAR as never);
					if (channelId !== '0' && !!channelId) {
						navigation.navigate(APP_SCREEN.HOME_DEFAULT as never);
					}
				}
			}
			if (clanId) {
				store.dispatch(clansActions.joinClan({ clanId }));
				store.dispatch(clansActions.setCurrentClanId(clanId as string));
				save(STORAGE_CLAN_ID, clanId);
			}
			if (clanId && channelId !== '0' && !!channelId) {
				const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
				save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
			}
			if (topicId && topicId !== '0' && !!topicId) {
				await handleOpenTopicDiscustion(store, topicId, channelId, navigation);
			}
			setTimeout(() => {
				if (clanId) {
					store.dispatch(clansActions.changeCurrentClan({ clanId, noCache: true }));
				}
				if (channelId !== '0' && !!channelId) {
					DeviceEventEmitter.emit(ActionEmitEvent.SCROLL_TO_ACTIVE_CHANNEL, channelId);
				}
				store.dispatch(appActions.setIsFromFCMMobile(false));
				save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
			}, 2000);
		} else {
			const linkDirectMessageMatch = link.match(clanDirectMessageLinkRegex);

			// IS message DM
			if (linkDirectMessageMatch) {
				const messageId = linkDirectMessageMatch[1];
				if (navigation) {
					await store.dispatch(directActions.setDmGroupCurrentId(messageId));
					if (isTabletLandscape) {
						navigation.navigate(APP_SCREEN.MESSAGES.HOME);
					} else {
						navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: messageId });
					}
				}
				setTimeout(() => {
					store.dispatch(appActions.setIsFromFCMMobile(false));
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				}, 4000);
			} else {
				setTimeout(() => {
					store.dispatch(appActions.setIsFromFCMMobile(false));
					save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
				}, 4000);
			}
		}
	} else if (isDirectDM) {
		const channelDMId = notification?.data?.channel;
		if (navigation && channelDMId !== '0' && !!channelDMId) {
			await store.dispatch(directActions.setDmGroupCurrentId(channelDMId));
			if (isTabletLandscape) {
				navigation.navigate(APP_SCREEN.MESSAGES.HOME);
			} else {
				navigation.navigate(APP_SCREEN.MESSAGES.MESSAGE_DETAIL, { directMessageId: channelDMId });
			}
		} else if (channelDMId === '0' && navigation) {
			navigation.navigate(APP_SCREEN.NOTIFICATION.HOME, {
				initialTab: InboxType.MESSAGES,
				version: notification?.sentTime
			});
			try {
				navigation.dispatch(
					CommonActions.reset({
						index: 1,
						routes: [
							{
								name: APP_SCREEN.NOTIFICATION.HOME,
								params: {
									initialTab: InboxType.MESSAGES,
									version: notification?.sentTime
								}
							},
							{
								name: APP_SCREEN.NOTIFICATION.HOME,
								params: {
									initialTab: InboxType.MESSAGES,
									version: notification?.sentTime
								}
							}
						]
					})
				);
			} catch (e) {
				console.error('log => e navigation: ', e);
			}
		}
		setTimeout(() => {
			store.dispatch(appActions.setIsFromFCMMobile(false));
			save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
		}, 4000);
	} else {
		setTimeout(() => {
			store.dispatch(appActions.setIsFromFCMMobile(false));
			save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, false);
		}, 4000);
	}
};

const handleOpenTopicDiscustion = async (store: any, topicId: string, channelId: string, navigation: any) => {
	const promises = [];
	await sleep(100);
	promises.push(store.dispatch(topicsActions.setCurrentTopicInitMessage(null)));
	promises.push(store.dispatch(topicsActions.setCurrentTopicId(topicId || '')));
	promises.push(store.dispatch(topicsActions.setIsShowCreateTopic(true)));
	promises.push(store.dispatch(getFirstMessageOfTopic(topicId || '')));

	await Promise.all(promises);

	if (navigation) {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
	}
};

export const processNotification = async ({ notification, navigation, time = 0, isTabletLandscape = false }) => {
	const store = await getStoreAsync();
	save(STORAGE_IS_DISABLE_LOAD_BACKGROUND, true);
	store.dispatch(appActions.setIsFromFCMMobile(true));
	if (time) {
		setTimeout(() => {
			navigateToNotification(store, notification, navigation, isTabletLandscape, time);
		}, time);
	} else {
		navigateToNotification(store, notification, navigation, isTabletLandscape);
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

export const displayNativeCalling = async (data: any, appInBackground = false) => {
	const notificationId = 'incoming-call';
	try {
		const dataObj = safeJSONParse(data?.offer || '{}');
		if (dataObj?.offer === 'CANCEL_CALL') {
			await notifee.cancelNotification(notificationId, notificationId);
			return;
		}

		const cancelCallsCacheStr = load(STORAGE_OFFER_HAVE_CALL_CACHE) || '[]';
		const cancelCallsCache = safeJSONParse(cancelCallsCacheStr) || [];

		if (!dataObj?.callerName || cancelCallsCache?.includes?.(JSON.stringify(dataObj?.offer))) {
			return;
		}
		cancelCallsCache.push(JSON.stringify(dataObj?.offer));
		if (cancelCallsCache.length > 20) {
			cancelCallsCache.splice(0, 10);
		}
		save(STORAGE_OFFER_HAVE_CALL_CACHE, JSON.stringify(cancelCallsCache));

		const channel = await notifee.createChannel({
			id: 'calls',
			name: 'Incoming Calls',
			importance: AndroidImportance.HIGH,
			visibility: AndroidVisibility.PUBLIC,
			sound: appInBackground ? undefined : 'ringing',
			vibration: !appInBackground,
			bypassDnd: true
		});
		await notifee.displayNotification({
			id: notificationId,
			title: 'Incoming call',
			body: `${dataObj?.callerName || 'Unknown'} is calling...`,
			android: {
				channelId: channel,
				category: AndroidCategory.CALL,
				visibility: AndroidVisibility.PUBLIC,
				importance: AndroidImportance.HIGH,
				smallIcon: 'ic_notification',
				sound: appInBackground ? undefined : 'ringing',
				tag: notificationId,
				largeIcon: `${dataObj?.callerAvatar || dataObj?.groupAvatar || process.env.NX_LOGO_MEZON}`,
				timestamp: Date.now(),
				showTimestamp: true,
				ongoing: true,
				autoCancel: true,
				timeoutAfter: 30000,
				loopSound: !appInBackground,
				groupSummary: false,
				groupAlertBehavior: AndroidGroupAlertBehavior.ALL,
				vibrationPattern: appInBackground ? undefined : [300, 500, 300, 500],
				lightUpScreen: true,
				color: '#7029c1',
				pressAction: {
					id: 'default',
					launchActivity: 'com.mezon.mobile.CallActivity',
					launchActivityFlags: [
						AndroidLaunchActivityFlag.SINGLE_TOP,
						AndroidLaunchActivityFlag.NEW_TASK,
						AndroidLaunchActivityFlag.CLEAR_TOP
					],
					mainComponent: 'ComingCallApp'
				},
				actions: [
					{
						title: 'Accept',
						pressAction: {
							id: 'accept',
							launchActivity: 'com.mezon.mobile.CallActivity',
							launchActivityFlags: [
								AndroidLaunchActivityFlag.SINGLE_TOP,
								AndroidLaunchActivityFlag.NEW_TASK,
								AndroidLaunchActivityFlag.CLEAR_TASK,
								AndroidLaunchActivityFlag.TASK_ON_HOME
							],
							mainComponent: 'ComingCallApp'
						},
						icon: 'ic_answer'
					},
					{
						title: 'Decline',
						pressAction: {
							id: 'reject',
							launchActivity: appInBackground ? 'com.mezon.mobile.MainActivity' : 'com.mezon.mobile.CallActivity',
							launchActivityFlags: appInBackground
								? []
								: [
										AndroidLaunchActivityFlag.SINGLE_TOP,
										AndroidLaunchActivityFlag.NEW_TASK,
										AndroidLaunchActivityFlag.CLEAR_TASK,
										AndroidLaunchActivityFlag.TASK_ON_HOME
									],
							mainComponent: 'ComingCallApp'
						},
						icon: 'ic_decline'
					}
				],
				fullScreenAction: {
					id: `incoming_call_fullscreen`,
					launchActivity: 'com.mezon.mobile.CallActivity',
					launchActivityFlags: [
						AndroidLaunchActivityFlag.SINGLE_TOP,
						AndroidLaunchActivityFlag.NEW_TASK,
						AndroidLaunchActivityFlag.CLEAR_TASK,
						AndroidLaunchActivityFlag.TASK_ON_HOME
					],
					mainComponent: 'ComingCallApp'
				}
			}
		});
	} catch (error) {
		console.error('Error displaying call notification:', error);
	}
};
