import { ActionEmitEvent, isEmpty } from '@mezon/mobile-components';
import { DMCallActions, appActions, selectCurrentUserId, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { WEBRTC_SIGNALING_TYPES, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { WebrtcSignalingFwd, WebrtcSignalingType, safeJSONParse } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter, NativeModules, Platform, View } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import NotificationPreferences from '../../utils/NotificationPreferences';
import { useSendSignaling } from '../CallingGroupModal';
import CallingModal from '../CallingModal';

const CallingModalWrapper = () => {
	const userId = useSelector(selectCurrentUserId);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const dispatch = useAppDispatch();
	const appStateRef = useRef(AppState.currentState);
	const navigation = useNavigation<any>();
	const { sendSignalingToParticipants } = useSendSignaling();

	const handleAppStateChangeListener = useCallback((nextAppState: typeof AppState.currentState) => {
		if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
			getDataCall();
		}

		appStateRef.current = nextAppState;
	}, []);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
			handleAppStateChangeListener(nextAppState);
		});
		return () => {
			appStateSubscription && appStateSubscription.remove();
		};
	}, [handleAppStateChangeListener]);

	useEffect(() => {
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		if (latestSignalingEntry?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER) {
			// RNNotificationCall.declineCall('6cb67209-4ef9-48c0-a8dc-2cec6cd6261d');
		} else {
			getDataCall();
		}
	}, [signalingData]);

	const getDataCallStorage = async () => {
		if (Platform.OS === 'android') {
			const notificationData = await NotificationPreferences.getValue('notificationDataCalling');
			if (!notificationData) return {};

			const notificationDataParse = safeJSONParse(notificationData || '{}');
			return safeJSONParse(notificationDataParse?.offer || '{}');
		} else {
			const VoIPManager = NativeModules?.VoIPManager;
			if (!VoIPManager) {
				console.error('VoIPManager is not available');
				return {};
			}
			const storedData = await VoIPManager.getStoredNotificationData();
			if (!storedData) return {};

			return storedData;
		}
	};
	const getDataCall = async () => {
		try {
			if (Platform.OS === 'ios') {
				RNCallKeep.endAllCalls();
			}
			const data = await getDataCallStorage();
			if (isEmpty(data)) return;
			const dataObj = safeJSONParse(data?.offer || '{}');
			if (dataObj?.isGroupCall) {
				await handleJoinCallGroup(dataObj);
				await clearUpStorageCalling();
				return;
			}
			if (data?.offer !== 'CANCEL_CALL' && !!data?.offer && !dataObj?.isGroupCall) {
				if (Platform.OS === 'ios') {
					dispatch(appActions.setLoadingMainMobile(true));
				}
				const signalingData = {
					channel_id: data?.channelId,
					receiver_id: userId,
					json_data: data?.offer,
					data_type: WebrtcSignalingType.WEBRTC_SDP_OFFER,
					caller_id: data?.callerId
				};
				dispatch(
					DMCallActions.addOrUpdate({
						calleeId: userId,
						signalingData: signalingData as WebrtcSignalingFwd,
						id: data?.callerId,
						callerId: data?.callerId
					})
				);

				if (Platform.OS === 'ios') {
					await sleep(100);
					dispatch(appActions.setLoadingMainMobile(false));
					navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
						screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
						params: {
							receiverId: data?.callerId,
							receiverAvatar: data?.callerAvatar,
							directMessageId: data?.channelId,
							isAnswerCall: true
						}
					});
					await clearUpStorageCalling();
					const VoIPManager = NativeModules?.VoIPManager;
					await VoIPManager.endCurrentCallKeep();
				}
			} else {
				await clearUpStorageCalling();
			}
		} catch (error) {
			console.error('Failed to retrieve data', error);
		}
	};

	const clearUpStorageCalling = async () => {
		if (Platform.OS === 'android') {
			await NotificationPreferences.clearValue('notificationDataCalling');
		} else {
			const VoIPManager = NativeModules?.VoIPManager;
			if (VoIPManager) {
				await VoIPManager.clearStoredNotificationData();
			} else {
				console.error('VoIPManager is not available');
			}
		}
	};

	const handleJoinCallGroup = async (dataCall: any) => {
		if (dataCall?.groupId) {
			if (!dataCall?.meetingCode) return;
			dispatch(appActions.setLoadingMainMobile(true));
			const data = {
				channelId: dataCall.groupId || '',
				roomName: dataCall?.meetingCode,
				clanId: '',
				isGroupCall: true
			};
			await sleep(3000);
			dispatch(appActions.setLoadingMainMobile(false));
			DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, data);
			const joinAction = {
				participant_id: userId,
				participant_name: '',
				participant_avatar: '',
				timestamp: Date.now()
			};
			sendSignalingToParticipants(
				[dataCall?.callerId],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_PARTICIPANT_JOINED,
				joinAction,
				dataCall?.channel_id || '',
				userId || ''
			);
		}
	};

	if (!signalingData?.length) {
		return <View />;
	}

	return <CallingModal />;
};

export default memo(CallingModalWrapper, () => true);
