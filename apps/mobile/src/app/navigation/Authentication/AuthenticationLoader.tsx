import { useAuth } from '@mezon/core';
import {
	ActionEmitEvent,
	getAppInfo,
	remove,
	STORAGE_CHANNEL_CURRENT_CACHE,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	STORAGE_KEY_TEMPORARY_ATTACHMENT,
	STORAGE_KEY_TEMPORARY_INPUT_MESSAGES
} from '@mezon/mobile-components';
import {
	appActions,
	authActions,
	channelsActions,
	clansActions,
	directActions,
	DMCallActions,
	getStoreAsync,
	messagesActions,
	selectCurrentChannel,
	selectCurrentClan,
	selectDmGroupCurrentId,
	selectLoadingMainMobile
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
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
import MezonConfirm from '../../componentUI/MezonConfirm';
import { useCheckUpdatedVersion } from '../../hooks/useCheckUpdatedVersion';
import { Sharing } from '../../screens/settings/Sharing';
import { clanAndChannelIdLinkRegex, clanDirectMessageLinkRegex } from '../../utils/helpers';
import { checkNotificationPermission, isShowNotification, navigateToNotification } from '../../utils/pushNotificationHelpers';
import { APP_SCREEN } from '../ScreenTypes';

export const AuthenticationLoader = () => {
	const navigation = useNavigation<any>();
	const { userProfile } = useAuth();
	const currentClan = useSelector(selectCurrentClan);
	const mezon = useMezon();
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDmGroupId = useSelector(selectDmGroupCurrentId);
	const isLoadingMain = useSelector(selectLoadingMainMobile);
	const dispatch = useDispatch();
	const [fileShared, setFileShared] = useState<any>();
	const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
	const currentDmGroupIdRef = useRef(currentDmGroupId);
	const currentChannelRef = useRef(currentClan);
	useCheckUpdatedVersion();

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
				await mezon.socketRef.current?.forwardWebrtcSignaling(
					payload?.callerId,
					WebrtcSignalingType.WEBRTC_SDP_QUIT,
					'',
					payload?.channelId,
					''
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
				navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
					screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
					params: {
						receiverId: payload?.callerId,
						receiverAvatar: payload?.callerAvatar,
						directMessageId: payload?.channelId,
						isAnswerCall: true
					}
				});
			}, 1000);
		});

		return () => {
			timer && clearTimeout(timer);
			callListener.remove();
		};
	}, [dispatch, navigation, userProfile?.user?.id]);

	useEffect(() => {
		const listener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_SHOW_POPUP_SESSION_EXPIRED, () => {
			setIsSessionExpired(true);
		});

		return () => {
			listener.remove();
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
						store.dispatch(directActions.setDmGroupCurrentId(''));
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
				handleBuzz(remoteMessage);
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

	const logout = useCallback(async () => {
		const store = await getStoreAsync();
		store.dispatch(channelsActions.removeAll());
		store.dispatch(messagesActions.removeAll());
		store.dispatch(clansActions.setCurrentClanId(''));
		store.dispatch(clansActions.removeAll());
		store.dispatch(clansActions.refreshStatus());

		await remove(STORAGE_DATA_CLAN_CHANNEL_CACHE);
		await remove(STORAGE_CHANNEL_CURRENT_CACHE);
		await remove(STORAGE_KEY_TEMPORARY_INPUT_MESSAGES);
		await remove(STORAGE_KEY_TEMPORARY_ATTACHMENT);
		const [appInfo] = await Promise.all([getAppInfo()]);
		const { app_platform: platform } = appInfo;
		store.dispatch(authActions.logOut({ device_id: userProfile?.user?.username, platform: platform }));
		setIsSessionExpired(false);
	}, []);

	const cancelConfirm = useCallback(async () => {
		setIsSessionExpired(false);
	}, []);

	return (
		<>
			<LoadingModal isVisible={isLoadingMain} />
			<MezonConfirm
				visible={isSessionExpired}
				onConfirm={logout}
				onCancel={cancelConfirm}
				title={'Session Expired or Network Error'}
				confirmText={'Login Again'}
				content={'Your session has expired. Please log in again to continue.'}
				hasBackdrop={true}
			/>
			{!!fileShared && !isLoadingMain && <Sharing data={fileShared} onClose={onCloseFileShare} />}
		</>
	);
};
