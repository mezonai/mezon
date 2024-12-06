import { useAuth } from '@mezon/core';
import { ActionEmitEvent, getAppInfo } from '@mezon/mobile-components';
import {
	DMCallActions,
	appActions,
	fcmActions,
	getStoreAsync,
	selectCurrentChannel,
	selectCurrentClan,
	selectDmGroupCurrentId,
	selectLoadingMainMobile
} from '@mezon/store-mobile';
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import { WebrtcSignalingFwd, WebrtcSignalingType } from 'mezon-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import Sound from 'react-native-sound';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import LoadingModal from '../../components/LoadingModal/LoadingModal';
import { useCheckUpdatedVersion } from '../../hooks/useCheckUpdatedVersion';
import { Sharing } from '../../screens/settings/Sharing';
import {
	checkNotificationPermission,
	handleFCMToken,
	isShowNotification,
	navigateToNotification,
	setupCallKeep,
	setupNotificationListeners
} from '../../utils/pushNotificationHelpers';
import { APP_SCREEN } from '../ScreenTypes';

export const AuthenticationLoader = () => {
	const navigation = useNavigation<any>();
	const { userProfile } = useAuth();
	const currentClan = useSelector(selectCurrentClan);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const isLoadingMain = useSelector(selectLoadingMainMobile);
	const dispatch = useDispatch();
	const [fileShared, setFileShared] = useState<any>();
	const currentDmGroupIdRef = useRef(currentDmGroupId);
	const currentChannelRef = useRef(currentClan);
	useCheckUpdatedVersion();

	const loadFRMConfig = useCallback(async () => {
		try {
			const [fcmtoken, appInfo] = await Promise.all([handleFCMToken(), getAppInfo()]);
			if (fcmtoken) {
				const { app_platform: platform } = appInfo;
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				dispatch(fcmActions.registFcmDeviceToken({ tokenId: fcmtoken, deviceId: userProfile?.user?.username, platform }));
			}
		} catch (error) {
			console.error('Error loading FCM config:', error);
		}
	}, [dispatch, userProfile?.user?.username]);

	useEffect(() => {
		if (userProfile?.user?.username) loadFRMConfig();
	}, [loadFRMConfig, userProfile?.user?.username]);

	useEffect(() => {
		setupCallKeep();
		setupNotificationListeners(navigation);
	}, [navigation]);

	useEffect(() => {
		currentDmGroupIdRef.current = currentDmGroupId;
	}, [currentDmGroupId]);

	useEffect(() => {
		currentChannelRef.current = currentChannel;
	}, [currentChannel]);

	useEffect(() => {
		let timer;
		const callListener = DeviceEventEmitter.addListener(ActionEmitEvent.GO_TO_CALL_SCREEN, ({ payload }) => {
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
				navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
					screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
					params: {
						receiverId: payload?.callerId,
						receiverAvatar: payload?.callerAvatar,
						directMessageId: payload?.channelId,
						isAnswerCall: true
					}
				});
			}, 2000);
		});

		return () => {
			timer && clearTimeout(timer);
			callListener.remove();
		};
	}, [dispatch, navigation, userProfile?.user?.id]);

	useEffect(() => {
		checkNotificationPermission();

		const unsubscribe = messaging().onMessage((remoteMessage) => {
			if (isShowNotification(currentChannelRef.current?.id, currentDmGroupIdRef.current, remoteMessage)) {
				// Case: FCM start call
				const title = remoteMessage?.notification?.title;
				const body = remoteMessage?.notification?.body;
				if (
					title === 'Incoming call' ||
					(body && ['started a video call', 'started a audio call', 'Untitled message'].some((text) => body?.includes?.(text)))
				) {
					return;
				}
				Toast.show({
					type: 'notification',
					topOffset: Platform.OS === 'ios' ? undefined : 10,
					props: remoteMessage.notification,
					swipeable: true,
					visibilityTime: 5000,
					onPress: async () => {
						Toast.hide();
						const store = await getStoreAsync();
						store.dispatch(appActions.setLoadingMainMobile(true));
						store.dispatch(appActions.setIsFromFCMMobile(true));
						requestAnimationFrame(async () => {
							await navigateToNotification(store, remoteMessage, navigation);
						});
					}
				});
			}
			//Payload from FCM need messageType and sound
			if (remoteMessage?.notification?.body === 'Buzz!!') {
				playBuzzSound();
			}
		});
		// To get All Received Urls
		loadFileSharing();

		// To clear Intents
		return () => {
			unsubscribe();
		};
	}, []);

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

	const onCloseFileShare = () => {
		setFileShared(undefined);
		navigation.goBack();
	};

	return (
		<>
			<LoadingModal isVisible={isLoadingMain} />
			{!!fileShared && !isLoadingMain && <Sharing data={fileShared} onClose={onCloseFileShare} />}
		</>
	);
};
