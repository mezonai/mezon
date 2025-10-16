import {
	ActionEmitEvent,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_MY_USER_ID,
	load,
	remove
} from '@mezon/mobile-components';
import {
	DMCallActions,
	appActions,
	channelsActions,
	directActions,
	getStoreAsync,
	messagesActions,
	selectAllAccount,
	selectCurrentChannel,
	selectCurrentClan,
	selectCurrentLanguage,
	selectCurrentTopicId,
	selectDmGroupCurrentId,
	selectLoadingMainMobile,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { TypeMessage } from '@mezon/utils';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import type { WebrtcSignalingFwd } from 'mezon-js';
import { WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, AppStateStatus, DeviceEventEmitter, Keyboard, Linking, Platform, StatusBar } from 'react-native';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import Sound from 'react-native-sound';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import ExpiredSessionModal from '../../components/ExpiredSessionModal/ExpiredSessionModal';
import LoadingModal from '../../components/LoadingModal/LoadingModal';
import { useCheckUpdatedVersion } from '../../hooks/useCheckUpdatedVersion';
import useTabletLandscape from '../../hooks/useTabletLandscape';
import { DirectMessageCallMain } from '../../screens/messages/DirectMessageCall';
import { Sharing } from '../../screens/settings/Sharing';
import { clanAndChannelIdLinkRegex, clanDirectMessageLinkRegex, getQueryParam } from '../../utils/helpers';
import { isShowNotification, navigateToNotification } from '../../utils/pushNotificationHelpers';
import { APP_SCREEN } from '../ScreenTypes';

const messaging = getMessaging(getApp());
export const AuthenticationLoader = () => {
	const navigation = useNavigation<any>();
	const userProfile = useSelector(selectAllAccount);
	const currentClan = useSelector(selectCurrentClan);
	const mezon = useMezon();
	const isTabletLandscape = useTabletLandscape();
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const isLoadingMain = useSelector(selectLoadingMainMobile);
	const dispatch = useDispatch();
	const currentDmGroupIdRef = useRef(currentDmGroupId);
	const currentChannelRef = useRef(currentClan);
	const currentTopicRef = useRef(currentTopicId);
	const appStateRef = useRef<AppStateStatus>(AppState.currentState);

	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			appStateRef.current = nextAppState;
		});

		return () => {
			subscription.remove();
		};
	}, []);

	const currentLanguage = useAppSelector(selectCurrentLanguage);
	const { i18n } = useTranslation();

	useCheckUpdatedVersion();

	useEffect(() => {
		const eventDeeplink = DeviceEventEmitter.addListener(ActionEmitEvent.ON_NAVIGATION_DEEPLINK, (path) => onNavigationDeeplink(path));
		const initializeApp = async () => {
			try {
				setTimeout(() => {
					loadFileSharing();
					initFirebaseMessaging();
				}, 100);
				await remove(STORAGE_CHANNEL_CURRENT_CACHE);
				await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
			} catch (error) {
				console.error('Error in initialization:', error);
			}
		};

		initializeApp();
		return () => {
			eventDeeplink.remove();
		};
	}, []);

	useEffect(() => {
		const getUrl = async () => {
			try {
				const url = await Linking.getInitialURL();
				if (url) {
					await onNavigationDeeplink(url);
				}
			} catch (error) {
				console.error('Error getting initial URL:', error);
			}
		};
		getUrl();
	}, []);

	const extractChannelParams = (url: string) => {
		const regex = /channel-app\/(\d+)\/(\d+)(?:\?[^#]*)?/;
		const baseMatch = url.match(regex);
		if (!baseMatch) return null;

		const [, id1, id2] = baseMatch;

		const codeMatch = url.match(/[?&]code=([^&]+)/);
		const subpathMatch = url.match(/[?&]subpath=([^&]+)/);

		return {
			channelId: id1,
			clanId: id2,
			code: codeMatch ? codeMatch[1] : null,
			subpath: subpathMatch ? subpathMatch[1] : null
		};
	};

	const onNavigationDeeplink = async (path: string) => {
		if (path?.includes?.('channel-app/')) {
			const parts = extractChannelParams(path);
			if (parts) {
				const channelId = parts.channelId;
				const clanId = parts.clanId;
				const code = parts.code;
				const subpath = parts.subpath;
				if (clanId && channelId) {
					navigation.navigate(APP_SCREEN.CHANNEL_APP, {
						channelId,
						clanId,
						code,
						subpath
					});
				}
			}
		} else if (path?.includes?.('/invite/')) {
			const inviteMatch = path.match(/invite\/(\d+)/);
			const inviteId = inviteMatch?.[1];
			if (inviteId) {
				navigation.navigate(APP_SCREEN.INVITE_CLAN, {
					code: inviteId
				});
			}
		} else if (path?.includes?.('/chat/')) {
			const chatMatch = path.match(/(?:^|\/)chat\/([^/?#]+)/);
			const username = chatMatch?.[1];
			if (username) {
				const dataParam = getQueryParam(path, 'data');
				navigation.navigate(APP_SCREEN.PROFILE_DETAIL, {
					username,
					data: dataParam || undefined
				});
			}
		}
	};

	useEffect(() => {
		if (i18n.language !== currentLanguage) {
			i18n.changeLanguage(currentLanguage);
		}
	}, [currentLanguage, i18n]);

	useEffect(() => {
		currentDmGroupIdRef.current = currentDmGroupId;
	}, [currentDmGroupId]);

	useEffect(() => {
		currentChannelRef.current = currentChannel;
	}, [currentChannel]);

	useEffect(() => {
		currentTopicRef.current = currentTopicId;
	}, [currentTopicId]);

	useEffect(() => {
		let timer;
		const callListener = DeviceEventEmitter.addListener(ActionEmitEvent.GO_TO_CALL_SCREEN, async ({ payload, isDecline = false }) => {
			if (isDecline) {
				const myUserId = load(STORAGE_MY_USER_ID);
				await mezon.socketRef.current?.forwardWebrtcSignaling(
					payload?.callerId,
					WebrtcSignalingType.WEBRTC_SDP_QUIT,
					'{}',
					payload?.channelId,
					myUserId
				);
				return;
			}
			dispatch(appActions.setLoadingMainMobile(true));
			dispatch(DMCallActions.setIsInCall(true));
			const signalingData = {
				channel_id: payload?.channelId,
				json_data: payload?.offer,
				data_type: WebrtcSignalingType.WEBRTC_SDP_OFFER,
				caller_id: payload?.callerId
			};
			dispatch(
				DMCallActions.addOrUpdate({
					calleeId: userProfile?.user?.id,
					signalingData: signalingData as WebrtcSignalingFwd,
					id: payload?.callerId,
					callerId: payload?.callerId
				})
			);
			timer = setTimeout(() => {
				dispatch(appActions.setLoadingMainMobile(false));
				const params = {
					receiverId: payload?.callerId,
					receiverAvatar: payload?.callerAvatar,
					receiverName: payload?.callerName,
					directMessageId: payload?.channelId,
					isAnswerCall: true
				};
				const data = {
					children: <DirectMessageCallMain route={{ params }} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
			}, 1000);
		});

		return () => {
			timer && clearTimeout(timer);
			callListener.remove();
		};
	}, [dispatch, navigation, userProfile?.user?.id]);

	const getTopRoute = useCallback(() => {
		try {
			const navigationState = navigation?.getState?.();
			const routes = navigationState?.routes || [];
			const activeScreenIndex = routes[navigationState?.index]?.state?.index || 0;
			const activeState = routes[navigationState?.index]?.state || {};
			const currentRoute = activeState?.routes[activeScreenIndex]?.params?.screen || activeState?.routes[activeScreenIndex]?.name || '';

			return currentRoute;
		} catch (error) {
			console.warn('Error getting top route:', error);
			return '';
		}
	}, [navigation]);

	const initFirebaseMessaging = () => {
		const unsubscribe = onMessage(messaging, (remoteMessage) => {
			try {
				const message = remoteMessage?.data?.message;
				const messageData = safeJSONParse(message as string);

				let messageCode = 0;
				if (messageData?.code) {
					if (typeof messageData.code === 'number') {
						messageCode = messageData.code;
					} else if (typeof messageData.code === 'object' && messageData.code?.value !== undefined) {
						messageCode = messageData.code.value;
					}
				}

				const topRoute = getTopRoute();

				// Determine current view state for suppression decision
				const isViewingChannel = topRoute === APP_SCREEN.HOME_DEFAULT || topRoute === APP_SCREEN.MESSAGES.CHAT_STREAMING;
				const isViewingDirectMessage = topRoute === APP_SCREEN.MESSAGES.MESSAGE_DETAIL || topRoute === APP_SCREEN.MESSAGES.HOME;

				if (
					isShowNotification(
						currentChannelRef.current?.id,
						currentDmGroupIdRef.current,
						remoteMessage,
						{
							isViewingChannel,
							isViewingDirectMessage
						},
						currentTopicRef.current
					)
				) {
					// Case: FCM start call
					const title = remoteMessage?.notification?.title || remoteMessage?.data?.title;
					const body: any = remoteMessage?.notification?.body || remoteMessage?.data?.body;
					if (
						title === 'Incoming call' ||
						(body && ['video call', 'audio call', 'Untitled message'].some((text) => body?.includes?.(text))) ||
						!body ||
						!title ||
						body?.includes?.('"Untitled message"')
					) {
						return;
					}
					Toast.show({
						type: 'notification',
						topOffset: Platform.OS === 'ios' ? undefined : StatusBar.currentHeight + 10,
						props: {
							title,
							body
						},
						swipeable: true,
						visibilityTime: 5000,
						onPress: async () => {
							Toast.hide();
							const store = await getStoreAsync();
							store.dispatch(directActions.setDmGroupCurrentId(''));
							store.dispatch(messagesActions.setIdMessageToJump(null));
							store.dispatch(appActions.setIsFromFCMMobile(true));
							DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, {
								isShow: false
							});
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
							requestAnimationFrame(async () => {
								Keyboard.dismiss();
								await navigateToNotification(store, remoteMessage, navigation, isTabletLandscape);
							});
						}
					});
				}
				//Payload from FCM need messageType and sound
				if (messageCode === TypeMessage.MessageBuzz || messageCode === TypeMessage.SendToken) {
					const isAppActive = appStateRef.current === 'active';
					if (isAppActive) {
						playCustomSoundNotify(messageCode === TypeMessage.MessageBuzz ? 'buzz' : 'bank');
					}

					if (messageCode === TypeMessage.MessageBuzz) handleBuzz(remoteMessage);
				}
			} catch (e) {
				console.error('log  => e', e);
			}
		});

		// To clear Intents
		return unsubscribe;
	};

	const playCustomSoundNotify = (name: string) => {
		Sound.setCategory('Playback');
		const soundName = name + (Platform.OS === 'android' ? '.mp3' : '.wav');
		const sound = new Sound(soundName, Sound.MAIN_BUNDLE, (error) => {
			if (error) {
				console.error('failed to load the sound', error);
				return;
			}
			sound.play((success) => {
				if (!success) {
					console.error('Sound playback failed');
				}
			});
		});
	};

	const handleBuzz = (notification) => {
		const link = notification?.data?.link;
		if (!link) return;
		const linkMatch = link.match(clanAndChannelIdLinkRegex);
		const timestamp = Math.round(Date.now() / 1000);
		if (linkMatch) {
			const channelId = linkMatch?.[2];
			dispatch(
				channelsActions.setBuzzState({
					clanId: channelId as string,
					channelId,
					buzzState: null
				})
			);
		} else {
			const linkDirectMessageMatch = link.match(clanDirectMessageLinkRegex);
			const channelId = linkDirectMessageMatch[1];
			dispatch(directActions.setBuzzStateDirect({ channelId, buzzState: { isReset: true, senderId: '', timestamp } }));
		}
	};

	const loadFileSharing = () => {
		try {
			ReceiveSharingIntent.getReceivedFiles(
				(files: any) => {
					try {
						console.warn('log => files getReceivedFiles: ', files);
						// Timeout to wait modal ready if the app was opened from sharing
						setTimeout(() => {
							const data = {
								children: <Sharing data={files} />
							};
							DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
						}, 500);
					} catch (error) {
						console.error('log => error OPEN ON_TRIGGER_MODAL: ', error);
					}
				},
				(error: any) => {
					console.error('log => error ReceiveSharingIntent: ', error);
					/* empty */
				},
				'mezon.mobile.sharing'
			);
		} catch (error) {
			/* empty */
		}
	};

	return (
		<>
			<LoadingModal isVisible={isLoadingMain} />
			<ExpiredSessionModal />
		</>
	);
};
