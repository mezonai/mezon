import { ActionEmitEvent, isEmpty } from '@mezon/mobile-components';
import { appActions, selectCurrentUserId, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { sleep, WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { AppState, DeviceEventEmitter, NativeModules, Platform, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSendSignaling } from '../CallingGroupModal';
import CallingModal from '../CallingModal';

const CallingModalWrapper = () => {
	const userId = useSelector(selectCurrentUserId);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const dispatch = useAppDispatch();
	const appStateRef = useRef(AppState.currentState);
	const { sendSignalingToParticipants } = useSendSignaling();

	const handleAppStateChangeListener = useCallback((nextAppState: typeof AppState.currentState) => {
		if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active' && Platform.OS === 'ios') {
			getDataCall();
		}

		appStateRef.current = nextAppState;
	}, []);

	useEffect(() => {
		const appStateSubscription =
			Platform.OS === 'android'
				? null
				: AppState.addEventListener('change', (nextAppState) => {
						handleAppStateChangeListener(nextAppState);
					});
		return () => {
			appStateSubscription && appStateSubscription.remove();
		};
	}, [handleAppStateChangeListener]);

	useEffect(() => {
		if (Platform.OS === 'ios') {
			getDataCall();
		}
	}, [signalingData]);

	const getDataCallStorage = async () => {
		const VoIPManager = NativeModules?.VoIPManager;
		if (!VoIPManager) {
			console.error('VoIPManager is not available');
			return {};
		}
		const storedData = await VoIPManager.getStoredNotificationData();
		if (!storedData) return {};

		return storedData;
	};
	const getDataCall = async () => {
		try {
			const data = await getDataCallStorage();
			if (isEmpty(data)) return;
			const dataObj = safeJSONParse(data?.offer || '{}');
			if (dataObj?.isGroupCall) {
				await handleJoinCallGroup(dataObj);
				await clearUpStorageCalling();
				return;
			}
		} catch (error) {
			console.error('Failed to retrieve data', error);
		}
	};

	const clearUpStorageCalling = async () => {
		const VoIPManager = NativeModules?.VoIPManager;
		if (VoIPManager) {
			await VoIPManager.clearStoredNotificationData();
		} else {
			console.error('VoIPManager is not available');
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

	if (!signalingData?.length || appStateRef.current !== 'active') {
		return <View />;
	}

	return <CallingModal />;
};

export default memo(CallingModalWrapper, () => true);
