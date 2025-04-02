import { load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { appActions, DMCallActions, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { safeJSONParse, WebrtcSignalingFwd, WebrtcSignalingType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, NativeModules, Platform, View } from 'react-native';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import CallingModal from '../CallingModal';
const { SharedPreferences } = NativeModules;

const CallingModalWrapper = () => {
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const appStateRef = useRef(AppState.currentState);

	const handleAppStateChangeListener = useCallback(
		(nextAppState: typeof AppState.currentState) => {
			if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
				const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
				if (latestSignalingEntry?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER) {
					getDataCall();
				}
			}

			appStateRef.current = nextAppState;
		},
		[signalingData]
	);

	useEffect(() => {
		const appStateSubscription = Platform.OS === 'android' ? AppState.addEventListener('change', handleAppStateChangeListener) : undefined;
		return () => {
			appStateSubscription && appStateSubscription.remove();
		};
	}, [handleAppStateChangeListener]);

	useEffect(() => {
		if (Platform.OS === 'android') {
			const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
			if (latestSignalingEntry?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER) {
				// RNNotificationCall.declineCall('6cb67209-4ef9-48c0-a8dc-2cec6cd6261d');
			} else {
				getDataCall();
			}
		}
	}, [signalingData]);

	const getDataCall = async () => {
		try {
			const notificationData = await SharedPreferences.getItem('notificationDataCalling');
			if (!notificationData) return;

			const notificationDataParse = safeJSONParse(notificationData || '{}');
			const data = safeJSONParse(notificationDataParse?.offer || '{}');
			if (data?.offer !== 'CANCEL_CALL' && !!data?.offer) {
				dispatch(appActions.setLoadingMainMobile(true));
				dispatch(DMCallActions.setIsInCall(true));
				const payload = safeJSONParse(notificationDataParse?.offer || '{}');
				const signalingData = {
					channel_id: payload?.channelId,
					json_data: payload?.offer,
					data_type: WebrtcSignalingType.WEBRTC_SDP_OFFER,
					caller_id: payload?.callerId
				};
				dispatch(
					DMCallActions.addOrUpdate({
						calleeId: userId,
						signalingData: signalingData as WebrtcSignalingFwd,
						id: payload?.callerId,
						callerId: payload?.callerId
					})
				);
				await sleep(500);
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
				await SharedPreferences.removeItem('notificationDataCalling');
			}
		} catch (error) {
			console.error('Failed to retrieve data', error);
		}
	};

	if (!signalingData?.length || signalingData?.[signalingData?.length - 1]?.signalingData?.data_type !== WebrtcSignalingType.WEBRTC_SDP_OFFER) {
		return <View />;
	}

	return <CallingModal />;
};

export default memo(CallingModalWrapper, () => true);
