import { isEmpty } from '@mezon/mobile-components';
import { appActions, DMCallActions, selectCurrentUserId, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import type { WebrtcSignalingFwd } from 'mezon-js';
import { safeJSONParse, WebrtcSignalingType } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { AppState, Modal, NativeModules, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { DirectMessageCallMain } from '../../screens/messages/DirectMessageCall';

const CallingNativeIOS = () => {
	const userId = useSelector(selectCurrentUserId);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const dispatch = useAppDispatch();
	const appStateRef = useRef(AppState.currentState);
	const [paramsCalling, setParamsCalling] = React.useState<any>(null);
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
	const getDataCall = useCallback(
		async (ignoreCheckOffer = false) => {
			try {
				const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
				if (latestSignalingEntry?.signalingData?.data_type === WebrtcSignalingType.WEBRTC_SDP_OFFER && !ignoreCheckOffer) return;
				const data = await getDataCallStorage();
				if (isEmpty(data)) return;
				const dataObj = safeJSONParse(data?.offer || '{}');
				if (dataObj?.isGroupCall) {
					return;
				}
				if (data?.offer !== 'CANCEL_CALL' && !!data?.offer && !dataObj?.isGroupCall) {
					dispatch(appActions.setLoadingMainMobile(true));
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

					const params = {
						receiverId: data?.callerId,
						receiverAvatar: data?.callerAvatar,
						receiverName: data?.callerName,
						directMessageId: data?.channelId,
						isAnswerCall: true
					};
					setParamsCalling(params);
					await clearUpStorageCalling();
					const VoIPManager = NativeModules?.VoIPManager;
					await VoIPManager.endCurrentCallKeep();
					dispatch(appActions.setLoadingMainMobile(false));
				} else {
					await clearUpStorageCalling();
				}
			} catch (error) {
				console.error('Failed to retrieve data', error);
				dispatch(appActions.setLoadingMainMobile(false));
			}
		},
		[dispatch, signalingData, userId]
	);

	const clearUpStorageCalling = async () => {
		const VoIPManager = NativeModules?.VoIPManager;
		if (VoIPManager) {
			await VoIPManager.clearStoredNotificationData();
		} else {
			console.error('VoIPManager is not available');
		}
	};
	const handleAppStateChangeListener = useCallback(
		(nextAppState: typeof AppState.currentState) => {
			if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active' && Platform.OS === 'ios') {
				getDataCall(true);
			}

			appStateRef.current = nextAppState;
		},
		[getDataCall]
	);

	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
			handleAppStateChangeListener(nextAppState);
		});
		return () => {
			appStateSubscription && appStateSubscription.remove();
		};
	}, [handleAppStateChangeListener]);

	useEffect(() => {
		getDataCall();
	}, [getDataCall]);

	if (!paramsCalling) return null;
	return (
		<Modal visible={true} animationType="slide" transparent={false} supportedOrientations={['portrait', 'landscape']}>
			<DirectMessageCallMain route={{ params: paramsCalling }} onCloseModal={() => setParamsCalling(null)} />
		</Modal>
	);
};

export default memo(CallingNativeIOS, () => true);
