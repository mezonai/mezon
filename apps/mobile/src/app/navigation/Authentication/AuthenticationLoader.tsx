import { useAuth } from '@mezon/core';
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
	selectCurrentChannel,
	selectCurrentClan,
	selectCurrentLanguage,
	selectDmGroupCurrentId,
	selectLoadingMainMobile,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { TypeMessage } from '@mezon/utils';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import { WebrtcSignalingFwd, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Keyboard, Linking, Platform, StatusBar } from 'react-native';
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
	const { userProfile } = useAuth();
	const currentClan = useSelector(selectCurrentClan);
	const mezon = useMezon();
	const isTabletLandscape = useTabletLandscape();
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const isLoadingMain = useSelector(selectLoadingMainMobile);
	const dispatch = useDispatch();
	const [fileShared, setFileShared] = useState<any>();
	const currentDmGroupIdRef = useRef(currentDmGroupId);
	const currentChannelRef = useRef(currentClan);

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
						channelId: channelId,
						clanId: clanId,
						code: code,
						subpath: subpath
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
					username: username,
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

				if (isShowNotification(currentChannelRef.current?.id, currentDmGroupIdRef.current, remoteMessage)) {
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
				if (messageCode === TypeMessage.MessageBuzz) {
					playBuzzSound();
					handleBuzz(remoteMessage);
				}
			} catch (e) {
				console.error('log  => e', e);
			}
		});

		// To clear Intents
		return unsubscribe;
	};

	const playBuzzSound = () => {
		Sound.setCategory('Playback');
		const sound = new Sound('buzz.mp3', Sound.MAIN_BUNDLE, (error) => {
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
			dispatch(directActions.setBuzzStateDirect({ channelId: channelId, buzzState: { isReset: true, senderId: '', timestamp } }));
		}
	};

	const loadFileSharing = () => {
		try {
			ReceiveSharingIntent.getReceivedFiles(
				(files: any) => {
					setFileShared(files);
				},
				(error: any) => {
					/* empty */
				},
				'mezon.mobile.sharing'
			);
		} catch (error) {
			/* empty */
		}
	};

	const onCloseFileShare = useCallback(() => {
		setFileShared(undefined);
		navigation.goBack();
	}, []);

	return (
		<>
			<LoadingModal isVisible={isLoadingMain} />
			<ExpiredSessionModal />
			{!!fileShared && !isLoadingMain && <Sharing data={fileShared} onClose={onCloseFileShare} />}
		</>
	);
};
